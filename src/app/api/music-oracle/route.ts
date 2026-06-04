/**
 * POST /api/music-oracle
 * 根据用户问题生成命运之歌 + 签文
 * 
 * Body:
 *   question: string  (必填，1-50字)
 *   birthYear?: number (可选，1920-2010)
 *   refresh?: boolean  (可选)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getRedis } from '@/lib/cache/redis';
import { getEnvVar } from '@/lib/utils/api-wrapper';
import { getTodayTiangan, getWuxingMusicProfile } from '@/lib/music-oracle/wuxing-music-map';
import { MUSIC_ORACLE_SYSTEM_PROMPT } from '@/lib/music-oracle/prompts';
import { PrismaClient } from '@prisma/client';
import { AI_BASE_URL, PRIMARY_MODEL } from '@/lib/ai/models';

const DEEPSEEK_BASE_URL = AI_BASE_URL;
const DEEPSEEK_MODEL = PRIMARY_MODEL;

/* ─── 天干按年份(简化) ─── */
const TIANGAN_LIST = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const WUXING_MAP: Record<string, string> = {
  甲: '木', 乙: '木', 丙: '火', 丁: '火',
  戊: '土', 己: '土', 庚: '金', 辛: '金', 壬: '水', 癸: '水',
};

function getYearTiangan(year: number): string {
  return TIANGAN_LIST[(year - 4) % 10];
}

function getWuxingRelation(a: string, b: string): string {
  const sheng: Record<string, string> = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' };
  const ke: Record<string, string> = { 木: '土', 火: '金', 土: '水', 金: '木', 水: '火' };
  if (sheng[a] === b) return `${a}生${b}，相生`;
  if (sheng[b] === a) return `${b}生${a}，相生`;
  if (ke[a] === b) return `${a}克${b}，相克`;
  if (ke[b] === a) return `${b}克${a}，相克`;
  if (a === b) return `同为${a}，比和`;
  return `${a}与${b}`;
}

function getTodayDateStr(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

const SSE_HEADERS = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache',
  Connection: 'keep-alive',
} as const;

function buildStream(meta: unknown, narrative: string) {
  const encoder = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ meta })}\n\n`));

      const chunkSize = 4;
      for (let i = 0; i < narrative.length; i += chunkSize) {
        const piece = narrative.slice(i, i + chunkSize);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: piece })}\n\n`));
        await new Promise((r) => setTimeout(r, 18));
      }

      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      controller.close();
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { question, birthYear, refresh } = body;

    // 参数校验
    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: '请输入你想问命运的问题', code: 'INVALID_INPUT' },
        { status: 400 }
      );
    }
    if (question.trim().length > 50) {
      return NextResponse.json(
        { success: false, error: '问题不能超过50字', code: 'INVALID_INPUT' },
        { status: 400 }
      );
    }
    if (birthYear !== undefined && birthYear !== null) {
      const yr = Number(birthYear);
      if (isNaN(yr) || yr < 1920 || yr > 2010) {
        return NextResponse.json(
          { success: false, error: '出生年份需在1920-2010之间', code: 'INVALID_INPUT' },
          { status: 400 }
        );
      }
    }

    // 限流检查（游客/登录用户 3次/日，VIP 不限）
    const redis = getRedis();
    const dateStr = getTodayDateStr();
    // 简单用 IP 做游客标识
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() 
      || request.headers.get('x-real-ip') 
      || 'unknown';
    const rateLimitKey = `music-oracle:rate:${clientIp}:${dateStr}`;

    if (redis) {
      try {
        const count = await redis.get(rateLimitKey);
        const used = typeof count === 'number' ? count : (typeof count === 'string' ? parseInt(count, 10) : 0);
        if (used >= 3) {
          return NextResponse.json(
            { success: false, error: '今日求签次数已用完（3次/天），VIP 用户不限次数', code: 'RATE_LIMIT' },
            { status: 429 }
          );
        }
      } catch (err) {
        console.warn('[music-oracle] 限流检查失败:', err);
      }
    }

    // 获取命理信息
    const todayInfo = getTodayTiangan();
    const todayProfile = getWuxingMusicProfile(todayInfo.tiangan);

    let userWuxing = '未知';
    let wuxingRelation = '';
    if (birthYear) {
      const yearTg = getYearTiangan(Number(birthYear));
      userWuxing = WUXING_MAP[yearTg] || '未知';
      wuxingRelation = getWuxingRelation(todayProfile.wuxing, userWuxing);
    }

    // 构建 Prompt
    const userPrompt = `用户问题：${question.trim()}
今日干支：${todayInfo.ganzhi}（${todayInfo.description}）
今日情绪方向：${todayProfile.emotion}（${todayProfile.musicStyles.join('、')}）
用户日主五行：${userWuxing}${wuxingRelation ? `\n五行关系：${wuxingRelation}` : ''}

请为这位用户选择一首"命运之歌"，并写签文解读。
返回单个 JSON 对象（不是数组）：
{
  "song_name": "歌名",
  "artist": "歌手",
  "lyrics_quote": "一句代表性歌词（15-30字）",
  "oracle_text": "签文正文（150-200字，分3段）",
  "music_tags": ["标签1", "标签2"],
  "wuxing_note": "今日五行简析（20字内）"
}
仅返回 JSON，不要其他文字。`;

    // 调用 AI
    const apiKey = getEnvVar('DEEPSEEK_API_KEY');
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: '服务配置异常', code: 'INTERNAL_ERROR' },
        { status: 500 }
      );
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const aiRes = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        max_tokens: 800,
        temperature: 0.85,
        enable_thinking: false,
        messages: [
          { role: 'system', content: MUSIC_ORACLE_SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    clearTimeout(timeoutId);

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error(`[music-oracle] AI API error ${aiRes.status}: ${errText}`);
      return NextResponse.json(
        { success: false, error: '求签失败，请稍后重试', code: 'AI_ERROR' },
        { status: 500 }
      );
    }

    const aiData = await aiRes.json();
    const rawContent = aiData?.choices?.[0]?.message?.content;

    if (!rawContent) {
      return NextResponse.json(
        { success: false, error: '求签失败，请稍后重试', code: 'AI_ERROR' },
        { status: 500 }
      );
    }

    // 解析 JSON
    let parsed: any;
    try {
      let jsonStr = rawContent.trim();
      const codeBlock = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (codeBlock) jsonStr = codeBlock[1].trim();
      // 尝试解析对象或数组
      const objMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (objMatch) jsonStr = objMatch[0];
      parsed = JSON.parse(jsonStr);
      // 如果是数组取第一个
      if (Array.isArray(parsed)) parsed = parsed[0];
    } catch {
      console.error('[music-oracle] JSON 解析失败:', rawContent.substring(0, 200));
      return NextResponse.json(
        { success: false, error: '解析结果失败，请重试', code: 'AI_ERROR' },
        { status: 500 }
      );
    }

    // 更新限流计数
    if (redis) {
      try {
        const midnight = new Date();
        midnight.setHours(24, 0, 0, 0);
        const ttl = Math.floor((midnight.getTime() - Date.now()) / 1000);
        await redis.incr(rateLimitKey);
        await redis.expire(rateLimitKey, ttl);
      } catch (err) {
        console.warn('[music-oracle] 限流计数更新失败:', err);
      }
    }

    // 保存到数据库
    let recordId: string | undefined;
    try {
      const prisma = new PrismaClient();
      const record = await prisma.musicOracleRecord.create({
        data: {
          question: question.trim(),
          birthYear: birthYear ? Number(birthYear) : null,
          ganzhi: todayInfo.ganzhi,
          wuxing: todayProfile.wuxing,
          userWuxing: birthYear ? userWuxing : null,
          songName: String(parsed.song_name || '').replace(/[《》]/g, ''),
          artist: String(parsed.artist || ''),
          lyricsQuote: String(parsed.lyrics_quote || ''),
          oracleText: String(parsed.oracle_text || ''),
          musicTags: Array.isArray(parsed.music_tags) ? parsed.music_tags : [],
          wuxingNote: String(parsed.wuxing_note || ''),
          sessionId: clientIp,
        },
      });
      recordId = record.id;
      await prisma.$disconnect();
    } catch (dbErr) {
      console.warn('[music-oracle] 数据库保存失败（不影响返回）:', dbErr);
    }

    const songName = String(parsed.song_name || '').replace(/[《》]/g, '');
    const artist = String(parsed.artist || '');
    const lyricsQuote = String(parsed.lyrics_quote || '');
    const oracleText = String(parsed.oracle_text || '');
    const musicTags = Array.isArray(parsed.music_tags) ? parsed.music_tags.map(String) : [];
    const wuxingNote = String(parsed.wuxing_note || '');

    const meta = {
      success: true,
      data: {
        songName,
        artist,
        lyricsQuote,
        musicTags,
        wuxingNote,
        todayGanzhi: todayInfo.ganzhi,
        wuxing: todayProfile.wuxing,
        recordId,
      },
    };

    return new Response(buildStream(meta, oracleText), { headers: SSE_HEADERS });
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return NextResponse.json(
        { success: false, error: '求签超时，请稍后重试', code: 'AI_ERROR' },
        { status: 500 }
      );
    }
    console.error('[music-oracle] 未知错误:', err);
    return NextResponse.json(
      { success: false, error: '服务异常，请稍后重试', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

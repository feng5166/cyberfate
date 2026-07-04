/**
 * 音乐运势签 AI 生成逻辑
 * 调用 DeepSeek API（经 ModelVerse 中转）生成歌曲推荐 + 签文
 */

import { MUSIC_ORACLE_SYSTEM_PROMPT, buildDailyMusicPrompt } from './prompts';
import { getTodayTiangan, getWuxingMusicProfile } from './wuxing-music-map';
import { PRIMARY_MODEL } from '../ai/models';
import { getPrimaryProvider } from '../ai/provider';

export interface DailyMusicItem {
  songName: string;
  artist: string;
  lyricsQuote: string;
  oracleText: string;
  oracleSummary: string;
  musicTags: string[];
  wuxingNote: string;
}

export interface DailyMusicResult {
  main: DailyMusicItem;
  alternates: DailyMusicItem[];
  ganzhi: string;
  wuxing: string;
  date: string;
}

/**
 * 调用 DeepSeek API 生成今日音乐运势
 * 返回 null 表示失败（不抛异常）
 */
export async function generateDailyMusic(): Promise<DailyMusicResult | null> {
  try {
    console.log('[MusicOracle] 开始生成今日音乐运势...');
    const todayInfo = getTodayTiangan();
    console.log('[MusicOracle] 今日天干:', todayInfo.tiangan, '干支:', todayInfo.ganzhi);
    const profile = getWuxingMusicProfile(todayInfo.tiangan);
    console.log('[MusicOracle] 五行:', profile.wuxing, '情绪:', profile.emotion);

    const userPrompt = buildDailyMusicPrompt({
      ganzhi: todayInfo.ganzhi,
      wuxingDescription: todayInfo.description,
      emotionDirection: `${profile.emotion}（${profile.musicStyles.join('、')}）`,
    });

    console.log('[MusicOracle] 调用 AI API...');
    const rawResponse = await callDeepSeekAPI(MUSIC_ORACLE_SYSTEM_PROMPT, userPrompt);
    if (!rawResponse) {
      console.error('[MusicOracle] AI API 返回空');
      return null;
    }
    console.log('[MusicOracle] AI 响应长度:', rawResponse.length);

    const items = parseAIResponse(rawResponse);
    if (!items || items.length === 0) {
      console.error('[MusicOracle] JSON 解析失败或无结果');
      return null;
    }
    console.log('[MusicOracle] 解析成功，歌曲数:', items.length);

    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    return {
      main: items[0],
      alternates: items.slice(1),
      ganzhi: todayInfo.ganzhi,
      wuxing: profile.wuxing,
      date: dateStr,
    };
  } catch (err) {
    console.error('[MusicOracle] generateDailyMusic 失败:', err);
    return null;
  }
}

/**
 * 调用 DeepSeek API（与项目其他模块一致，使用 ModelVerse 中转）
 */
const DEEPSEEK_MODEL = PRIMARY_MODEL;

async function callDeepSeekAPI(systemPrompt: string, userPrompt: string): Promise<string | null> {
  const provider = await getPrimaryProvider();

  if (!provider) {
    console.error('[MusicOracle] DEEPSEEK_API_KEY 未配置');
    return null;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 50000);

  try {
    const response = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${provider.apiKey}`,
      },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        max_tokens: 2000,
        temperature: 0.85,
        enable_thinking: false,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[MusicOracle] DeepSeek API error ${response.status}: ${errText}`);
      return null;
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    return content || null;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      console.error('[MusicOracle] DeepSeek API 超时 (50s)');
    } else {
      console.error('[MusicOracle] DeepSeek API 调用失败:', err.message);
    }
    return null;
  }
}

/**
 * 解析 AI 响应 JSON
 */
function parseAIResponse(raw: string): DailyMusicItem[] | null {
  try {
    // 提取 JSON 部分（可能被包裹在 markdown code blocks 中）
    let jsonStr = raw.trim();
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }
    // 也尝试直接找数组
    const arrayMatch = jsonStr.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      jsonStr = arrayMatch[0];
    }

    const parsed = JSON.parse(jsonStr);
    if (!Array.isArray(parsed) || parsed.length === 0) return null;

    return parsed.map((item: any) => ({
      songName: String(item.song_name || '').replace(/[《》]/g, ''),
      artist: String(item.artist || ''),
      lyricsQuote: String(item.lyrics_quote || ''),
      oracleText: String(item.oracle_text || ''),
      oracleSummary: String(item.oracle_summary || ''),
      musicTags: Array.isArray(item.music_tags) ? item.music_tags.map(String) : [],
      wuxingNote: String(item.wuxing_note || ''),
    }));
  } catch (err) {
    console.error('[MusicOracle] JSON 解析失败:', err, '\n原始响应:', raw.substring(0, 200));
    return null;
  }
}

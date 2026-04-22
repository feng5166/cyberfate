/**
 * 五行 → 情绪 → 歌曲风格映射
 * PRD 12.6.2 节
 */

export interface WuxingMusicProfile {
  wuxing: string;           // 五行：木/火/土/金/水
  emotion: string;          // 情绪色彩
  musicStyles: string[];    // 推荐音乐风格
  mood: string;             // 代表情绪
  gradientFrom: string;     // Tailwind 渐变起始色
  gradientTo: string;       // Tailwind 渐变结束色
  icon: string;             // Emoji 图标
}

const WUXING_MAP: Record<string, WuxingMusicProfile> = {
  木: {
    wuxing: '木',
    emotion: '生发·希望',
    musicStyles: ['民谣', '轻摇滚', '清新流行'],
    mood: '充满生命力、向上、新开始',
    gradientFrom: 'from-emerald-50',
    gradientTo: 'to-green-100',
    icon: '🌿',
  },
  火: {
    wuxing: '火',
    emotion: '热烈·激昂',
    musicStyles: ['摇滚', '电音', '励志流行'],
    mood: '热情、行动力、突破',
    gradientFrom: 'from-orange-50',
    gradientTo: 'to-red-100',
    icon: '🔥',
  },
  土: {
    wuxing: '土',
    emotion: '稳重·沉淀',
    musicStyles: ['古风', '古典融合', '抒情慢歌'],
    mood: '内敛、包容、厚重',
    gradientFrom: 'from-yellow-50',
    gradientTo: 'to-amber-100',
    icon: '🏔',
  },
  金: {
    wuxing: '金',
    emotion: '清冽·锋芒',
    musicStyles: ['爵士', '电子', '简洁流行'],
    mood: '理性、清醒、决断',
    gradientFrom: 'from-gray-50',
    gradientTo: 'to-slate-100',
    icon: '✨',
  },
  水: {
    wuxing: '水',
    emotion: '深邃·流动',
    musicStyles: ['抒情', 'R&B', '梦幻氛围'],
    mood: '感性、内省、思念',
    gradientFrom: 'from-blue-50',
    gradientTo: 'to-indigo-100',
    icon: '💧',
  },
};

/** 天干 → 五行 映射 */
const TIANGAN_TO_WUXING: Record<string, string> = {
  甲: '木', 乙: '木',
  丙: '火', 丁: '火',
  戊: '土', 己: '土',
  庚: '金', 辛: '金',
  壬: '水', 癸: '水',
};

/**
 * 根据天干获取五行音乐画像
 */
export function getWuxingMusicProfile(tiangan: string): WuxingMusicProfile {
  const wuxing = TIANGAN_TO_WUXING[tiangan] || '木';
  return WUXING_MAP[wuxing] || WUXING_MAP['木'];
}

/**
 * 直接根据五行获取音乐画像
 */
export function getWuxingProfileByElement(wuxing: string): WuxingMusicProfile {
  return WUXING_MAP[wuxing] || WUXING_MAP['木'];
}

/**
 * 获取今日天干（使用 lunar-javascript）
 */
export function getTodayTiangan(): { tiangan: string; ganzhi: string; wuxing: string; description: string } {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { Solar } = require('lunar-javascript');
  const today = new Date();
  const solar = Solar.fromYmd(today.getFullYear(), today.getMonth() + 1, today.getDate());
  const lunar = solar.getLunar();
  const eightChar = lunar.getEightChar();
  const dayGan = eightChar.getDayGan();   // 天干：甲/乙/丙/丁...
  const dayZhi = eightChar.getDayZhi();   // 地支：子/丑/寅/卯...
  const ganzhi = `${dayGan}${dayZhi}`;
  const wuxing = TIANGAN_TO_WUXING[dayGan] || '木';

  const descriptions: Record<string, string> = {
    木: '木主仁，代表生长、向上的力量',
    火: '火主礼，代表热情、行动的力量',
    土: '土主信，代表稳重、包容的力量',
    金: '金主义，代表清明、决断的力量',
    水: '水主智，代表智慧、内省的力量',
  };

  return {
    tiangan: dayGan,
    ganzhi,
    wuxing,
    description: `${dayGan}${wuxing}当令，${descriptions[wuxing] || ''}`,
  };
}

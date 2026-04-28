export const mockDailyFortune = {
  date: "2026-04-28",
  score: 8.2,
  level: "旺",
  summary: "今天财气旺，留意微信红包 🧧",
  dimensions: [
    { name: "事业", score: 8.5 },
    { name: "财运", score: 9.0 },
    { name: "爱情", score: 6.0 },
    { name: "健康", score: 7.5 },
    { name: "人际", score: 8.0 },
  ],
  suitable: ["签约", "告白", "出行", "理财"],
  avoid: ["冲动消费", "熬夜", "口角"],
  luckyTime: "14:00 - 15:00",
  luckyDirection: "西南方",
  aiAdvice: [
    "今天的财气藏在主动里。",
    "一个你犹豫的合作，可以推进。",
    "傍晚 18 点之前要做完决定。",
  ],
  streakDays: 12,
};

export const mockWeeklyTips = [
  "周三宜签约，周五桃花日",
  "财运周中走高，留意 14:00",
  "周末适合反思，别赶进度",
];

// 节气 map（月-日 → 节气名）
export const solarTerms: Record<string, string> = {
  "1-5": "小寒",
  "1-20": "大寒",
  "2-4": "立春",
  "2-19": "雨水",
  "3-6": "惊蛰",
  "3-21": "春分",
  "4-5": "清明",
  "4-20": "谷雨",
  "5-6": "立夏",
  "5-21": "小满",
  "6-6": "芒种",
  "6-21": "夏至",
  "7-7": "小暑",
  "7-23": "大暑",
  "8-7": "立秋",
  "8-23": "处暑",
  "9-8": "白露",
  "9-23": "秋分",
  "10-8": "寒露",
  "10-23": "霜降",
  "11-7": "立冬",
  "11-22": "小雪",
  "12-7": "大雪",
  "12-22": "冬至",
};

// 找当前日期最近的上一个节气
export function getCurrentSolarTerm(date: Date = new Date()): string {
  const month = date.getMonth() + 1;
  const day = date.getDate();

  // 所有节气按时间顺序排列
  const allTerms: Array<{ month: number; day: number; name: string }> = [
    { month: 1, day: 5, name: "小寒" },
    { month: 1, day: 20, name: "大寒" },
    { month: 2, day: 4, name: "立春" },
    { month: 2, day: 19, name: "雨水" },
    { month: 3, day: 6, name: "惊蛰" },
    { month: 3, day: 21, name: "春分" },
    { month: 4, day: 5, name: "清明" },
    { month: 4, day: 20, name: "谷雨" },
    { month: 5, day: 6, name: "立夏" },
    { month: 5, day: 21, name: "小满" },
    { month: 6, day: 6, name: "芒种" },
    { month: 6, day: 21, name: "夏至" },
    { month: 7, day: 7, name: "小暑" },
    { month: 7, day: 23, name: "大暑" },
    { month: 8, day: 7, name: "立秋" },
    { month: 8, day: 23, name: "处暑" },
    { month: 9, day: 8, name: "白露" },
    { month: 9, day: 23, name: "秋分" },
    { month: 10, day: 8, name: "寒露" },
    { month: 10, day: 23, name: "霜降" },
    { month: 11, day: 7, name: "立冬" },
    { month: 11, day: 22, name: "小雪" },
    { month: 12, day: 7, name: "大雪" },
    { month: 12, day: 22, name: "冬至" },
  ];

  let latest = allTerms[allTerms.length - 1].name;
  for (const term of allTerms) {
    if (term.month < month || (term.month === month && term.day <= day)) {
      latest = term.name;
    }
  }
  return latest;
}

export const mockBaziChart = {
  pillars: [
    { position: "年柱", heavenlyStem: "甲", earthlyBranch: "子" },
    { position: "月柱", heavenlyStem: "丙", earthlyBranch: "寅" },
    { position: "日柱", heavenlyStem: "戊", earthlyBranch: "午" },
    { position: "时柱", heavenlyStem: "癸", earthlyBranch: "亥" },
  ],
  dayMaster: "戊土",
  zodiac: "鼠",
  naYin: "海中金",
  fiveElements: [
    { name: "木", value: 3, color: "#6B8E5A" },
    { name: "火", value: 4, color: "#C0392B" },
    { name: "土", value: 5, color: "#C9A86C" },
    { name: "金", value: 2, color: "#BDB7A4" },
    { name: "水", value: 3, color: "#4A6FA5" },
  ],
};

export const mockSquarePosts = [
  {
    avatar: "🦐",
    name: "火象命主",
    content: "今天和老板提了加薪，他答应了。AI 建议真的准。",
    likes: 28,
    comments: 5,
  },
  {
    avatar: "🌙",
    name: "水象命主",
    content: "今天的吉时我去告白了，他答应了 🌸",
    likes: 102,
    comments: 18,
  },
];

export const mockLeaderboard = [
  { name: "张同学", days: 88 },
  { name: "李老师", days: 45 },
  { name: "王朋友", days: 31 },
];

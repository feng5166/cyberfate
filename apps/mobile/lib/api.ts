import { mockDailyFortune } from "./mockData";
import type { BaziResult, BaziPillar, FiveElement, FortuneResult } from "./types";

const API_BASE = "https://www.cyberfate.me/api";

const STEMS = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
const BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
const ZODIAC = ["鼠", "牛", "虎", "兔", "龙", "蛇", "马", "羊", "猴", "鸡", "狗", "猪"];

// Five element for each stem index (0-9)
const STEM_ELEMENT = ["木", "木", "火", "火", "土", "土", "金", "金", "水", "水"];
// Five element for each branch index (0-11)
const BRANCH_ELEMENT = ["水", "土", "木", "木", "土", "火", "火", "土", "金", "金", "土", "水"];

const ELEMENT_COLOR: Record<string, string> = {
  木: "#4CAF50",
  火: "#F44336",
  土: "#FF9800",
  金: "#FFC107",
  水: "#2196F3",
};

// 纳音 for the 30 pairs in the 60-year sexagenary cycle
const NA_YIN = [
  "海中金", "炉中火", "大林木", "路旁土", "剑锋金",
  "山头火", "涧下水", "城头土", "白蜡金", "杨柳木",
  "泉中水", "屋上土", "霹雳火", "松柏木", "长流水",
  "砂中金", "山下火", "平地木", "壁上土", "金箔金",
  "覆灯火", "天河水", "大驿土", "钗钏金", "桑柘木",
  "大溪水", "沙中土", "天上火", "石榴木", "大海水",
];

export function generateLocalBazi(params: {
  birthDate: string;
  birthHour: number;
  gender: "male" | "female";
  name: string;
}): BaziResult {
  const [yearStr, monthStr, dayStr] = params.birthDate.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);
  const hour = params.birthHour;

  // Year pillar: stem=(year-4)%10, branch=(year-4)%12
  const yearStemIdx = ((year - 4) % 10 + 10) % 10;
  const yearBranchIdx = ((year - 4) % 12 + 12) % 12;

  // Month pillar: branch maps Jan(1)→丑(1) … Dec(12)→子(0)
  // Stem start per year-stem group (甲己→丙, 乙庚→戊, 丙辛→庚, 丁壬→壬, 戊癸→甲)
  const yearStemGroup = yearStemIdx % 5;
  const monthStemIdx = (yearStemGroup * 2 + month + 1) % 10;
  const monthBranchIdx = month % 12;

  // Day pillar: hash from date components
  const dayRawIdx = (year * 400 + month * 31 + day * 11) % 60;
  const dayStemIdx = dayRawIdx % 10;
  const dayBranchIdx = dayRawIdx % 12;

  // Hour pillar: 子(0)=23-1h, 丑(1)=1-3h, …
  const hourBranchIdx = Math.floor((hour + 1) / 2) % 12;
  const dayStemGroup = dayStemIdx % 5;
  const hourStemIdx = (dayStemGroup * 2 + hourBranchIdx) % 10;

  const pillars: BaziPillar[] = [
    { position: "年柱", heavenlyStem: STEMS[yearStemIdx], earthlyBranch: BRANCHES[yearBranchIdx] },
    { position: "月柱", heavenlyStem: STEMS[monthStemIdx], earthlyBranch: BRANCHES[monthBranchIdx] },
    { position: "日柱", heavenlyStem: STEMS[dayStemIdx], earthlyBranch: BRANCHES[dayBranchIdx] },
    { position: "时柱", heavenlyStem: STEMS[hourStemIdx], earthlyBranch: BRANCHES[hourBranchIdx] },
  ];

  const dayMaster = STEMS[dayStemIdx];
  const zodiac = ZODIAC[yearBranchIdx];

  // NaYin: based on year's position in the 60-cycle
  const yearSexIdx = ((year - 4) % 60 + 60) % 60;
  const naYin = NA_YIN[Math.floor(yearSexIdx / 2)];

  // Count 五行 across all 8 characters (4 stems + 4 branches)
  const elementCount: Record<string, number> = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
  for (const idx of [yearStemIdx, monthStemIdx, dayStemIdx, hourStemIdx]) {
    elementCount[STEM_ELEMENT[idx]]++;
  }
  for (const idx of [yearBranchIdx, monthBranchIdx, dayBranchIdx, hourBranchIdx]) {
    elementCount[BRANCH_ELEMENT[idx]]++;
  }

  const fiveElements: FiveElement[] = Object.entries(elementCount).map(([name, count]) => ({
    name,
    value: Math.round((count / 8) * 100),
    color: ELEMENT_COLOR[name],
  }));

  return { pillars, dayMaster, zodiac, naYin, fiveElements };
}

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!res.ok) throw new Error(`API Error: ${res.status}`);
  return res.json();
}

export async function postBazi(params: {
  birthDate: string;
  birthHour: number;
  gender: "male" | "female";
  name: string;
}): Promise<BaziResult> {
  try {
    return await fetchAPI<BaziResult>("/bazi", {
      method: "POST",
      body: JSON.stringify(params),
    });
  } catch {
    return generateLocalBazi(params);
  }
}

export async function getDailyFortune(_date: string): Promise<FortuneResult> {
  // TODO: return fetchAPI(`/fortune/daily?date=${_date}`);
  return mockDailyFortune;
}

export async function checkIn() {
  // TODO: return fetchAPI("/user/checkin", { method: "POST" });
  return { success: true, consecutiveDays: 13 };
}

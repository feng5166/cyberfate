export interface BaziPillar {
  position: string;
  heavenlyStem: string;
  earthlyBranch: string;
}

export interface FiveElement {
  name: string;
  value: number;
  color: string;
}

export interface MingGeInfo {
  pattern: string;
  useful: string;
  avoid: string;
}

export interface BaziResult {
  pillars: BaziPillar[];
  dayMaster: string;
  zodiac: string;
  naYin: string;
  fiveElements: FiveElement[];
  mingGe?: MingGeInfo;
  aiAnalysis?: string;
  dimensions?: FortuneDimension[];
}

export interface UserProfile {
  name?: string;
  gender: 'male' | 'female';
  birthDate: string;
  birthHour: number;
}

export interface FortuneDimension {
  name: string;
  score: number;
}

export interface FortuneResult {
  date: string;
  score: number;
  level: string;
  summary: string;
  dimensions: FortuneDimension[];
  suitable: string[];
  avoid: string[];
  luckyTime: string;
  luckyDirection: string;
  aiAdvice: string[];
}

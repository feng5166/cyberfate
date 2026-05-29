declare module 'lunar-javascript' {
  export class Solar {
    static fromYmd(year: number, month: number, day: number): Solar;
    getLunar(): Lunar;
  }

  export class Lunar {
    getMonth(): number;
    getDay(): number;
    getEightChar(): EightChar;
    getMonthInChinese(): string;
    getDayInChinese(): string;
    getYearInChinese(): string;
  }

  export class EightChar {
    getYearGan(): string;
    getYearZhi(): string;
    getMonthGan(): string;
    getMonthZhi(): string;
    getDayGan(): string;
    getDayZhi(): string;
    getTimeGan(): string;
    getTimeZhi(): string;
    getYun(gender: number, sect?: number): Yun;
  }

  export interface Yun {
    getGender(): number;
    getStartYear(): number;
    getStartMonth(): number;
    getStartDay(): number;
    getStartHour(): number;
    isForward(): boolean;
    getLunar(): Lunar;
    getStartSolar(): Solar;
    getDaYun(n?: number): DaYun[];
  }

  export interface DaYun {
    getStartYear(): number;
    getEndYear(): number;
    getStartAge(): number;
    getEndAge(): number;
    getIndex(): number;
    getLunar(): Lunar;
    getGanZhi(): string;
    getLiuNian(n?: number): LiuNian[];
  }

  export interface LiuNian {
    getYear(): number;
    getAge(): number;
    getIndex(): number;
    getLunar(): Lunar;
    getGanZhi(): string;
    getLiuYue(): LiuYue[];
  }

  export interface LiuYue {
    getIndex(): number;
    getMonthInChinese(): string;
    getGanZhi(): string;
  }
}

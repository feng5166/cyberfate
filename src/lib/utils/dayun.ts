const TIANGAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const DIZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

export const STARTING_AGE = 3;
export const DAYUN_SPAN = 10;

export function getAge(birthDate: string): number {
  const [y, m, d] = birthDate.split('-').map(Number);
  if (!y || !m || !d) return 0;
  const now = new Date();
  let age = now.getFullYear() - y;
  if (now.getMonth() + 1 < m || (now.getMonth() + 1 === m && now.getDate() < d)) {
    age--;
  }
  return Math.max(0, age);
}

export function getBirthYear(birthDate: string): number {
  return parseInt(birthDate.split('-')[0]) || new Date().getFullYear() - 30;
}

export function getGanZhi(year: number): { stem: string; branch: string; full: string } {
  const stem = TIANGAN[(year - 4) % 10];
  const branch = DIZHI[(year - 4) % 12];
  return { stem, branch, full: `${stem}${branch}` };
}

export function getCurrentDayunIndex(currentAge: number): number {
  if (currentAge < STARTING_AGE) return 0;
  return Math.floor((currentAge - STARTING_AGE) / DAYUN_SPAN);
}

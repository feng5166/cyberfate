const STORAGE_KEY = 'cyberfate_user_birth';

export interface UserBirthInfo {
  birthDate: string;
  birthHour: string; // "-1" to "11"
  savedAt: string;
}

export function saveBirthInfo(info: Pick<UserBirthInfo, 'birthDate' | 'birthHour'>): void {
  try {
    const data: UserBirthInfo = { ...info, savedAt: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save birth info:', e);
  }
}

export function loadBirthInfo(): UserBirthInfo | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;
    return JSON.parse(saved) as UserBirthInfo;
  } catch (e) {
    console.error('Failed to load birth info:', e);
    return null;
  }
}

export function clearBirthInfo(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error('Failed to clear birth info:', e);
  }
}

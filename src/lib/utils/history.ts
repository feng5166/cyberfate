import type { BaziHistoryRecord } from '@/lib/bazi/types';

const BAZI_HISTORY_STORAGE_KEY = 'cyberfate_bazi_history';
const LEGACY_STORAGE_KEYS = ['cyberfate_bazi_history_v1'];
const MAX_GUEST_RECORDS = 3;

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `bazi_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function isValidRecord(record: unknown): record is BaziHistoryRecord {
  if (!record || typeof record !== 'object') return false;
  const candidate = record as Partial<BaziHistoryRecord>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.birthDate === 'string' &&
    typeof candidate.birthHour === 'string' &&
    typeof candidate.aiSummary === 'string' &&
    typeof candidate.aiAnalysis === 'string' &&
    typeof candidate.dayMaster === 'string' &&
    typeof candidate.createdAt === 'string' &&
    !!candidate.pillars &&
    !!candidate.wuxing
  );
}

function persistRecords(records: BaziHistoryRecord[]): void {
  if (!isBrowser()) return;
  localStorage.setItem(BAZI_HISTORY_STORAGE_KEY, JSON.stringify(records));
}

function readRecordsByKey(key: string): BaziHistoryRecord[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidRecord);
  } catch {
    return [];
  }
}

function normalizeRecords(records: BaziHistoryRecord[]): BaziHistoryRecord[] {
  return records
    .filter(isValidRecord)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function loadRecords(): BaziHistoryRecord[] {
  if (!isBrowser()) return [];

  try {
    const current = readRecordsByKey(BAZI_HISTORY_STORAGE_KEY);
    if (current.length) {
      return normalizeRecords(current);
    }

    for (const key of LEGACY_STORAGE_KEYS) {
      const legacy = readRecordsByKey(key);
      if (!legacy.length) continue;
      const normalized = normalizeRecords(legacy);
      persistRecords(normalized);
      localStorage.removeItem(key);
      return normalized;
    }

    return [];
  } catch (error) {
    console.error('Failed to load bazi history records:', error);
    return [];
  }
}

export function saveRecord(
  record: Omit<BaziHistoryRecord, 'id' | 'createdAt'> & Partial<Pick<BaziHistoryRecord, 'id' | 'createdAt'>>
): BaziHistoryRecord | null {
  if (!isBrowser()) return null;

  try {
    const existing = loadRecords();
    const now = new Date().toISOString();
    const normalized: BaziHistoryRecord = {
      ...record,
      id: record.id ?? generateId(),
      createdAt: record.createdAt ?? now,
      name: record.name || '缘主',
      gender: record.gender || 'unknown',
      birthPlace: record.birthPlace || '',
      source: 'bazi',
    };

    const withoutCurrent = existing.filter(item => item.id !== normalized.id);
    const next = [normalized, ...withoutCurrent].slice(0, MAX_GUEST_RECORDS);
    persistRecords(next);
    return normalized;
  } catch (error) {
    console.error('Failed to save bazi history record:', error);
    return null;
  }
}

export function updateRecord(id: string, patch: Partial<BaziHistoryRecord>): BaziHistoryRecord | null {
  if (!isBrowser() || !id) return null;

  try {
    const existing = loadRecords();
    const target = existing.find(item => item.id === id);
    if (!target) return null;

    const updated: BaziHistoryRecord = {
      ...target,
      ...patch,
      id: target.id,
      createdAt: target.createdAt,
    };

    const next = [updated, ...existing.filter(item => item.id !== id)];
    persistRecords(next);
    return updated;
  } catch (error) {
    console.error('Failed to update bazi history record:', error);
    return null;
  }
}

export function deleteRecord(id: string): boolean {
  if (!isBrowser() || !id) return false;

  try {
    const existing = loadRecords();
    const next = existing.filter(item => item.id !== id);
    persistRecords(next);
    return next.length !== existing.length;
  } catch (error) {
    console.error('Failed to delete bazi history record:', error);
    return false;
  }
}

export function getRecordById(id: string): BaziHistoryRecord | null {
  if (!id) return null;
  return loadRecords().find(record => record.id === id) ?? null;
}

export function clearRecords(): boolean {
  if (!isBrowser()) return false;
  try {
    localStorage.removeItem(BAZI_HISTORY_STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Failed to clear bazi history records:', error);
    return false;
  }
}

import { mockDailyFortune, mockBaziChart } from "./mockData";

const API_BASE = "https://www.cyberfate.me/api";

export async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });
  if (!res.ok) throw new Error(`API Error: ${res.status}`);
  return res.json();
}

export async function getDailyFortune(_date: string) {
  // TODO: return fetchAPI(`/fortune/daily?date=${_date}`);
  return mockDailyFortune;
}

export async function getBaziChart(_birthDate: string, _birthTime: string) {
  // TODO: return fetchAPI(`/bazi/chart?date=${_birthDate}&time=${_birthTime}`);
  return mockBaziChart;
}

export async function checkIn() {
  // TODO: return fetchAPI("/user/checkin", { method: "POST" });
  return { success: true, consecutiveDays: 13 };
}

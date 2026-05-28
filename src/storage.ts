import type { DailyLog, PeriodRecord } from "./types";

const PERIOD_KEY = "flux.periodRecords.v1";
const DAILY_KEY = "flux.dailyLogs.v1";

export function loadPeriodRecords(): PeriodRecord[] {
  return readJson<PeriodRecord[]>(PERIOD_KEY, []);
}

export function savePeriodRecords(records: PeriodRecord[]) {
  localStorage.setItem(PERIOD_KEY, JSON.stringify(records));
}

export function loadDailyLogs(): DailyLog[] {
  return readJson<DailyLog[]>(DAILY_KEY, []);
}

export function saveDailyLogs(logs: DailyLog[]) {
  localStorage.setItem(DAILY_KEY, JSON.stringify(logs));
}

export function exportData(records: PeriodRecord[], logs: DailyLog[]) {
  return JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), records, logs }, null, 2);
}

export function parseImportData(raw: string): { records: PeriodRecord[]; logs: DailyLog[] } {
  const data = JSON.parse(raw) as { records?: PeriodRecord[]; logs?: DailyLog[]; periodRecords?: PeriodRecord[]; dailyLogs?: DailyLog[] };
  const records = data.records ?? data.periodRecords;
  const logs = data.logs ?? data.dailyLogs;

  if (!Array.isArray(records) || !Array.isArray(logs)) {
    throw new Error("导入文件格式不正确");
  }

  return { records, logs };
}

export function clearFluxData() {
  localStorage.removeItem(PERIOD_KEY);
  localStorage.removeItem(DAILY_KEY);
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

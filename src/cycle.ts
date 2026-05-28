import { addDays, daysInclusive, diffDays, isBetween, todayIso } from "./dateUtils";
import type { CyclePrediction, DailyLog, PeriodRecord, PhaseName } from "./types";

export function createId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function emptyBodyLog() {
  return {
    discharge: [],
    intimacy: [],
    appetite: [],
    caffeine: [],
    head: [],
    skin: [],
    breast: [],
    digestion: [],
    bowelMovement: [],
    waistAbdomen: [],
    medication: [],
    vitamins: [],
    supplements: [],
    note: "",
  };
}

export function emptyDailyLog(date: string): DailyLog {
  return {
    date,
    body: emptyBodyLog(),
    mood: { moods: [], stressLevel: 3, note: "" },
    exercise: { exercised: false, types: [], intensity: "", durationMinutes: 0, feeling: "", note: "" },
    note: "",
    updatedAt: new Date().toISOString(),
  };
}

export function sortedPeriods(records: PeriodRecord[]) {
  return [...records].sort((a, b) => a.startDate.localeCompare(b.startDate));
}

export function getCyclePrediction(records: PeriodRecord[], date = todayIso()): CyclePrediction {
  const sorted = sortedPeriods(records);
  if (sorted.length === 0) {
    return basePrediction([], null, null, null, "数据较少");
  }

  const latest = sorted[sorted.length - 1];
  const allCycleLengths = getCycleLengths(sorted).slice(-6);
  const personalizedCycleLengths = getPersonalizedCycleLengths(sorted);
  const canUsePersonalized = sorted.length >= 3 && personalizedCycleLengths.length >= 2;
  const averageCycleLength = canUsePersonalized ? roundAverage(personalizedCycleLengths) : 28;
  const periodLengths = sorted.slice(-6).map((record) => daysInclusive(record.startDate, record.endDate));
  const averagePeriodLength = periodLengths.length > 0 ? roundAverage(periodLengths) : 5;
  const latestCycleLength = allCycleLengths.at(-1) ?? null;
  const variability = personalizedCycleLengths.length > 1 ? Math.round(stdDev(personalizedCycleLengths) * 10) / 10 : null;
  const personalizedCandidate = buildCandidate(latest.startDate, averageCycleLength, averagePeriodLength);
  const personalizedValidation = canUsePersonalized
    ? validateCandidate({ candidate: personalizedCandidate, records: sorted, latest, mode: "personalized" })
    : {
        valid: false,
        ovulationWindowStatus: "insufficient-data" as const,
        ovulationWindowMessage: "数据较少，以下为默认 28 天周期参考估算",
      };
  const fallbackCandidate = buildCandidate(latest.startDate, 28, averagePeriodLength);
  const fallbackValidation = validateCandidate({ candidate: fallbackCandidate, records: sorted, latest, mode: "fallback" });
  const usePersonalized = personalizedValidation.valid;
  const useFallback = !usePersonalized && fallbackValidation.valid;
  const candidate = usePersonalized ? personalizedCandidate : fallbackCandidate;
  const predictionMode = usePersonalized ? "personalized" : useFallback ? "fallback" : "unavailable";
  const ovulationDate = usePersonalized || useFallback ? candidate.ovulationDate : null;
  const ovulationWindowStart = usePersonalized || useFallback ? candidate.ovulationWindowStart : null;
  const ovulationWindowEnd = usePersonalized || useFallback ? candidate.ovulationWindowEnd : null;
  const ovulationWindowStatus = usePersonalized
    ? "valid"
    : useFallback
      ? "valid"
      : fallbackValidation.ovulationWindowStatus;
  const ovulationWindowMessage = usePersonalized
    ? ""
    : useFallback
      ? "数据较少，以下为默认 28 天周期参考估算"
      : fallbackValidation.ovulationWindowMessage;
  const nextPeriodStart = candidate.nextPeriodStart;
  const nextPeriodEnd = candidate.nextPeriodEnd;
  const currentDay = latest.startDate <= date ? diffDays(latest.startDate, date) + 1 : null;
  const daysUntilNextPeriod = diffDays(date, nextPeriodStart);
  const confidence = predictionMode === "fallback" ? "数据较少" : variability !== null && variability <= 3 ? "较高" : "中等";

  return {
    currentDay,
    currentPhase: getPhaseForDate(date, records, nextPeriodStart, nextPeriodEnd, ovulationDate, ovulationWindowStart, ovulationWindowEnd),
    daysUntilNextPeriod,
    nextPeriodStart,
    nextPeriodEnd,
    ovulationDate,
    ovulationWindowStart,
    ovulationWindowEnd,
    predictionMode,
    ovulationWindowStatus,
    ovulationWindowMessage,
    averageCycleLength,
    averagePeriodLength,
    latestCycleLength,
    variability,
    confidence,
    cycleLengths: canUsePersonalized ? personalizedCycleLengths : allCycleLengths,
  };
}

export function getCycleLengths(records: PeriodRecord[]) {
  const sorted = sortedPeriods(records);
  const lengths: number[] = [];
  for (let index = 1; index < sorted.length; index += 1) {
    lengths.push(diffDays(sorted[index - 1].startDate, sorted[index].startDate));
  }
  return lengths.filter((length) => length > 0 && length < 80);
}

export function getPhaseForDate(
  date: string,
  records: PeriodRecord[],
  nextPeriodStart?: string | null,
  nextPeriodEnd?: string | null,
  ovulationDate?: string | null,
  ovulationWindowStart?: string | null,
  ovulationWindowEnd?: string | null,
): PhaseName {
  if (records.some((record) => isBetween(date, record.startDate, record.endDate))) return "月经期";
  if (nextPeriodStart && nextPeriodEnd && isBetween(date, nextPeriodStart, nextPeriodEnd)) return "月经期";
  if (ovulationDate && date === ovulationDate) return "排卵日";

  const latestPeriod = [...sortedPeriods(records)].reverse().find((record) => record.endDate < date);
  if (!latestPeriod || !nextPeriodStart || !ovulationDate) return "未知";
  if (date > latestPeriod.endDate && date < ovulationDate) return "卵泡期";
  if (date > ovulationDate && date < nextPeriodStart) return "黄体期";
  return "未知";
}

export function hasBodyLog(log: DailyLog) {
  return Object.entries(log.body).some(([key, value]) => key !== "note" && Array.isArray(value) && value.length > 0) || !!log.body.note;
}

export function hasMoodLog(log: DailyLog) {
  return log.mood.moods.length > 0 || !!log.mood.note;
}

export function hasExerciseLog(log: DailyLog) {
  return log.exercise.exercised || log.exercise.types.length > 0 || !!log.exercise.note;
}

export function getTopSymptoms(logs: DailyLog[]) {
  const counts = new Map<string, number>();
  logs.forEach((log) => {
    Object.entries(log.body).forEach(([key, value]) => {
      if (key === "note" || !Array.isArray(value)) return;
      value.filter((item) => item !== "无" && item !== "正常").forEach((item) => counts.set(item, (counts.get(item) ?? 0) + 1));
    });
  });
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
}

export function getPhaseStats(logs: DailyLog[], periods: PeriodRecord[]) {
  const prediction = getCyclePrediction(periods);
  const stats = new Map<PhaseName, Map<string, number>>();
  logs.forEach((log) => {
    const phase = getPhaseForDate(
      log.date,
      periods,
      prediction.nextPeriodStart,
      prediction.nextPeriodEnd,
      prediction.ovulationDate,
      prediction.ovulationWindowStart,
      prediction.ovulationWindowEnd,
    );
    if (phase === "未知") return;
    const phaseMap = stats.get(phase) ?? new Map<string, number>();
    [...log.mood.moods, ...log.body.head, ...log.body.waistAbdomen, ...log.body.skin]
      .filter((item) => item !== "正常" && item !== "无")
      .forEach((item) => phaseMap.set(item, (phaseMap.get(item) ?? 0) + 1));
    stats.set(phase, phaseMap);
  });

  return [...stats.entries()].map(([phase, values]) => ({
    phase,
    items: [...values.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4),
  }));
}

function basePrediction(
  cycleLengths: number[],
  averageCycleLength: number | null,
  averagePeriodLength: number | null,
  latestCycleLength: number | null,
  confidence: CyclePrediction["confidence"],
): CyclePrediction {
  return {
    currentDay: null,
    currentPhase: "未知",
    daysUntilNextPeriod: null,
    nextPeriodStart: null,
    nextPeriodEnd: null,
    ovulationDate: null,
    ovulationWindowStart: null,
    ovulationWindowEnd: null,
    predictionMode: "unavailable",
    ovulationWindowStatus: "unavailable",
    ovulationWindowMessage: "当前记录不足或周期预测不稳定，暂不可靠估算排卵窗口",
    averageCycleLength,
    averagePeriodLength,
    latestCycleLength,
    variability: null,
    confidence,
    cycleLengths,
  };
}

function getPersonalizedCycleLengths(records: PeriodRecord[]) {
  return getCycleLengths(records.slice(-6)).filter((length) => length >= 21 && length <= 35);
}

function buildCandidate(periodStart: string, cycleLength: number, periodLength: number) {
  const nextPeriodStart = addDays(periodStart, cycleLength);
  const nextPeriodEnd = addDays(nextPeriodStart, periodLength - 1);
  const ovulationDate = addDays(nextPeriodStart, -14);
  const ovulationWindowStart = addDays(ovulationDate, -5);
  const ovulationWindowEnd = addDays(ovulationDate, 1);
  return { nextPeriodStart, nextPeriodEnd, ovulationDate, ovulationWindowStart, ovulationWindowEnd };
}

function validateCandidate({
  candidate,
  records,
  latest,
  mode,
}: {
  candidate: ReturnType<typeof buildCandidate>;
  records: PeriodRecord[];
  latest: PeriodRecord;
  mode: "personalized" | "fallback";
}): Pick<CyclePrediction, "ovulationWindowStatus" | "ovulationWindowMessage"> & { valid: boolean } {
  if (diffDays(latest.startDate, candidate.nextPeriodStart) < 21) {
    return {
      valid: false,
      ovulationWindowStatus: mode === "fallback" ? "unavailable" : "unstable-cycle",
      ovulationWindowMessage: mode === "fallback" ? "数据异常，暂不显示排卵窗口" : "周期波动较大，以下为默认 28 天周期参考估算",
    };
  }

  if (candidate.ovulationDate <= latest.endDate || candidate.ovulationWindowStart <= latest.endDate) {
    return {
      valid: false,
      ovulationWindowStatus: mode === "fallback" ? "unavailable" : "overlaps-period",
      ovulationWindowMessage:
        mode === "fallback" ? "数据异常，暂不显示排卵窗口" : "预测排卵窗口与已记录月经期重叠，以下为默认 28 天周期参考估算",
    };
  }

  const overlapsRecordedPeriod = records.some((record) =>
    rangesOverlap(candidate.ovulationWindowStart, candidate.ovulationWindowEnd, record.startDate, record.endDate),
  );
  if (overlapsRecordedPeriod) {
    return {
      valid: false,
      ovulationWindowStatus: mode === "fallback" ? "unavailable" : "overlaps-period",
      ovulationWindowMessage:
        mode === "fallback" ? "数据异常，暂不显示排卵窗口" : "预测排卵窗口与已记录月经期重叠，以下为默认 28 天周期参考估算",
    };
  }

  return {
    valid: true,
    ovulationWindowStatus: "valid",
    ovulationWindowMessage: "",
  };
}

function rangesOverlap(startA: string, endA: string, startB: string, endB: string) {
  return startA <= endB && startB <= endA;
}

function roundAverage(values: number[]) {
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function stdDev(values: number[]) {
  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance = values.reduce((sum, value) => sum + (value - average) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

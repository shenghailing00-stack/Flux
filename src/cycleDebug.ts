import { getCyclePrediction, getPhaseForDate } from "./cycle";
import type { PeriodRecord } from "./types";

function record(startDate: string, endDate: string): PeriodRecord {
  return {
    id: `${startDate}-${endDate}`,
    startDate,
    endDate,
    flow: "中",
    painLevel: 2,
    note: "",
  };
}

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

export function runCyclePredictionDebugChecks() {
  const normal = getCyclePrediction(
    [record("2026-03-09", "2026-03-14"), record("2026-04-06", "2026-04-11"), record("2026-05-04", "2026-05-09")],
    "2026-05-12",
  );
  assert(normal.nextPeriodStart === "2026-06-01", "正常 28 天周期：下次月经应为 2026-06-01");
  assert(normal.ovulationDate === "2026-05-18", "正常 28 天周期：排卵日应为 2026-05-18");
  assert(normal.ovulationWindowStart === "2026-05-13", "正常 28 天周期：排卵窗口开始应为 2026-05-13");
  assert(normal.ovulationWindowEnd === "2026-05-19", "正常 28 天周期：排卵窗口结束应为 2026-05-19");

  const recordedPeriodWins = getPhaseForDate(
    "2026-05-18",
    [record("2026-05-13", "2026-05-18")],
    "2026-06-01",
    "2026-06-06",
    "2026-05-18",
    "2026-05-13",
    "2026-05-19",
  );
  assert(recordedPeriodWins === "月经期", "已记录月经期应优先于排卵日");

  const insufficient = getCyclePrediction([record("2026-05-04", "2026-05-09")], "2026-05-12");
  assert(insufficient.predictionMode === "fallback", "历史记录少于 3 条时应使用 fallback");
  assert(insufficient.ovulationDate === "2026-05-18", "fallback 应显示默认 28 天周期排卵日");
  assert(insufficient.ovulationWindowStart === "2026-05-13" && insufficient.ovulationWindowEnd === "2026-05-19", "fallback 应显示默认排卵窗口");

  const tooShort = getCyclePrediction(
    [record("2026-04-05", "2026-04-09"), record("2026-04-24", "2026-04-28"), record("2026-05-13", "2026-05-18")],
    "2026-05-14",
  );
  assert(tooShort.predictionMode === "fallback", "平均周期小于 21 天时应切换 fallback");
  assert(tooShort.nextPeriodStart === "2026-06-10", "最近一次月经 5月13日 且 fallback 时，下次月经应为 6月10日");
  assert(tooShort.ovulationDate === "2026-05-27", "最近一次月经 5月13日 且 fallback 时，排卵日应为 5月27日");
  assert(tooShort.ovulationWindowStart === "2026-05-22" && tooShort.ovulationWindowEnd === "2026-05-28", "fallback 排卵窗口应为 5月22日-5月28日");

  const overlapping = getCyclePrediction(
    [record("2026-03-09", "2026-03-14"), record("2026-04-06", "2026-04-11"), record("2026-05-04", "2026-05-18")],
    "2026-05-12",
  );
  assert(overlapping.predictionMode === "unavailable", "fallback 仍与已记录经期冲突时不显示排卵窗口");
  assert(overlapping.ovulationDate === null && overlapping.ovulationWindowStart === null, "fallback 仍冲突时排卵日和排卵窗口应为空");

  return true;
}

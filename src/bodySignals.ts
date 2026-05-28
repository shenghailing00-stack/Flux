import { diffDays } from "./dateUtils";
import { getCyclePrediction, getPhaseForDate } from "./cycle";
import type { DailyLog, PeriodRecord, PhaseName } from "./types";

export type SignalSuggestedPhase = "月经期" | "卵泡期" | "预测排卵窗口" | "黄体期" | "不确定";
export type SignalConsistency = "一致" | "部分一致" | "不一致" | "数据不足";
export type ConfidenceAdjustment = "提高" | "不变" | "降低";

export interface BodySignalAnalysis {
  suggestedPhase: SignalSuggestedPhase;
  consistency: SignalConsistency;
  confidenceAdjustment: ConfidenceAdjustment;
  reasons: string[];
  message: string;
}

const DISCLAIMER_SUFFIX = "仅供个人记录参考，不用于医学诊断、避孕或治疗决策。";

export function analyzeBodySignals(dailyLogs: DailyLog[], predictedPhase: PhaseName, targetDate: string): BodySignalAnalysis {
  const recentLogs = dailyLogs
    .filter((log) => {
      const distance = diffDays(log.date, targetDate);
      return distance >= 0 && distance <= 4;
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  if (recentLogs.length < 2) {
    return {
      suggestedPhase: "不确定",
      consistency: "数据不足",
      confidenceAdjustment: "不变",
      reasons: ["最近 5 天内可参考的身体记录少于 2 条。"],
      message: `身体信号记录还不够，暂不辅助调整预测可信度。${DISCLAIMER_SUFFIX}`,
    };
  }

  const scores = {
    "月经期": 0,
    "卵泡期": 0,
    "预测排卵窗口": 0,
    "黄体期": 0,
  };
  const reasons: string[] = [];

  recentLogs.forEach((log) => {
    if (log.body.discharge.some((item) => item === "透明拉丝" || item === "较多")) {
      scores["预测排卵窗口"] += 2;
      reasons.push("近期白带记录包含透明拉丝或较多，可能接近预测排卵窗口。");
    }

    const lutealSignals = [
      ...log.body.breast.filter((item) => ["胀痛", "刺痛", "变敏感"].includes(item)),
      ...log.body.appetite.filter((item) => ["增加", "想吃甜食", "想吃辣"].includes(item)),
      ...log.body.skin.filter((item) => ["长痘", "出油"].includes(item)),
      ...log.mood.moods.filter((item) => ["低落", "易怒", "焦虑", "烦躁"].includes(item)),
      ...log.body.digestion.filter((item) => item === "腹胀"),
      ...(log.body.bowelMovement ?? []).filter((item) => item === "便秘"),
    ];
    if (lutealSignals.length > 0) {
      scores["黄体期"] += lutealSignals.length;
      reasons.push(`近期出现 ${unique(lutealSignals).join("、")}，更符合黄体期或经前相关信号。`);
    }

    const menstrualSignals = [
      ...log.body.waistAbdomen.filter((item) => ["腹痛", "腰酸", "下腹坠胀"].includes(item)),
      ...log.mood.moods.filter((item) => item === "疲惫"),
      ...log.body.head.filter((item) => item === "乏力"),
    ];
    if (menstrualSignals.length > 0) {
      scores["月经期"] += menstrualSignals.length;
      reasons.push(`近期记录到 ${unique(menstrualSignals).join("、")}，可作为月经期相关身体信号参考。`);
    }

    const calmSignals = [
      ...log.body.discharge.filter((item) => ["无", "少量"].includes(item)),
      ...log.mood.moods.filter((item) => ["平静", "开心"].includes(item)),
    ];
    const painSignals = [...log.body.waistAbdomen, ...log.body.breast, ...log.body.head].filter((item) => !["正常", "无"].includes(item));
    if (calmSignals.length > 0 && painSignals.length === 0) {
      scores["卵泡期"] += 0.5;
    }
  });

  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]) as Array<[SignalSuggestedPhase, number]>;
  const [suggestedPhase, topScore] = ranked[0];
  const normalizedPredicted = predictedPhase === "排卵日" ? "预测排卵窗口" : predictedPhase;

  if (topScore <= 0) {
    return {
      suggestedPhase: "不确定",
      consistency: "部分一致",
      confidenceAdjustment: "不变",
      reasons: ["最近记录没有明显指向某一周期阶段的身体信号。"],
      message: `身体信号暂不明显，日期预测仍作为主要参考。${DISCLAIMER_SUFFIX}`,
    };
  }

  const consistency: SignalConsistency =
    normalizedPredicted === suggestedPhase ? "一致" : topScore < 2 ? "部分一致" : "部分一致";
  const confidenceAdjustment: ConfidenceAdjustment = consistency === "一致" ? "提高" : suggestedPhase === "月经期" ? "不变" : "不变";
  const message =
    consistency === "一致"
      ? `身体信号与日期预测较一致，可略微提高参考可信度。${DISCLAIMER_SUFFIX}`
      : `身体信号可能更接近${suggestedPhase}，但不替代日期预测。${DISCLAIMER_SUFFIX}`;

  return {
    suggestedPhase,
    consistency,
    confidenceAdjustment,
    reasons: unique(reasons).slice(0, 4),
    message,
  };
}

export function getBodySignalPhaseStats(logs: DailyLog[], periods: PeriodRecord[]) {
  const phaseMaps = new Map<SignalSuggestedPhase, Map<string, number>>();

  logs.forEach((log) => {
    const prediction = getCyclePrediction(periods, log.date);
    const phase = getPhaseForDate(
      log.date,
      periods,
      prediction.nextPeriodStart,
      prediction.nextPeriodEnd,
      prediction.ovulationDate,
      prediction.ovulationWindowStart,
      prediction.ovulationWindowEnd,
    );
    const normalizedPhase = phase === "排卵日" ? "预测排卵窗口" : phase;
    if (!["月经期", "卵泡期", "预测排卵窗口", "黄体期"].includes(normalizedPhase)) return;

    const phaseMap = phaseMaps.get(normalizedPhase as SignalSuggestedPhase) ?? new Map<string, number>();
    extractPredictiveSignals(log).forEach((signal) => phaseMap.set(signal, (phaseMap.get(signal) ?? 0) + 1));
    phaseMaps.set(normalizedPhase as SignalSuggestedPhase, phaseMap);
  });

  return [...phaseMaps.entries()].map(([phase, values]) => ({
    phase,
    items: [...values.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5),
  }));
}

function extractPredictiveSignals(log: DailyLog) {
  return [
    ...log.body.discharge.filter((item) => ["透明拉丝", "较多", "少量"].includes(item)),
    ...log.body.breast.filter((item) => ["胀痛", "刺痛", "变敏感"].includes(item)),
    ...log.body.appetite.filter((item) => ["增加", "想吃甜食", "想吃辣"].includes(item)),
    ...log.body.skin.filter((item) => ["长痘", "出油"].includes(item)),
    ...log.mood.moods.filter((item) => ["低落", "易怒", "焦虑", "烦躁", "平静", "疲惫"].includes(item)),
    ...log.body.digestion.filter((item) => ["腹胀", "胃痛", "恶心", "反酸"].includes(item)),
    ...(log.body.bowelMovement ?? []).filter((item) => ["腹泻", "便秘", "排便顺畅"].includes(item)),
    ...log.body.waistAbdomen.filter((item) => ["腹痛", "腰酸", "下腹坠胀"].includes(item)),
    ...log.body.head.filter((item) => item === "乏力"),
  ].filter((item) => item !== "正常" && item !== "无");
}

function unique(items: string[]) {
  return [...new Set(items)];
}

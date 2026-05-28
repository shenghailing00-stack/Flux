export type FlowLevel = "少" | "中" | "多";

export interface PeriodRecord {
  id: string;
  startDate: string;
  endDate: string;
  flow: FlowLevel;
  painLevel: number;
  note: string;
}

export interface BodyLog {
  discharge: string[];
  intimacy: string[];
  appetite: string[];
  caffeine: string[];
  head: string[];
  skin: string[];
  breast: string[];
  digestion: string[];
  bowelMovement?: string[];
  waistAbdomen: string[];
  medication: string[];
  vitamins?: string[];
  supplements?: string[];
  note: string;
}

export interface MoodLog {
  moods: string[];
  stressLevel: number;
  note: string;
}

export interface ExerciseLog {
  exercised: boolean;
  types: string[];
  intensity: "轻度" | "中等" | "高强度" | "";
  durationMinutes: number;
  feeling: "舒服" | "一般" | "不适" | "";
  note: string;
}

export interface DailyLog {
  date: string;
  body: BodyLog;
  mood: MoodLog;
  exercise: ExerciseLog;
  note: string;
  updatedAt: string;
}

export type PhaseName = "月经期" | "卵泡期" | "预测排卵窗口" | "排卵日" | "黄体期" | "未知";

export interface CyclePrediction {
  currentDay: number | null;
  currentPhase: PhaseName;
  daysUntilNextPeriod: number | null;
  nextPeriodStart: string | null;
  nextPeriodEnd: string | null;
  ovulationDate: string | null;
  ovulationWindowStart: string | null;
  ovulationWindowEnd: string | null;
  predictionMode: "personalized" | "fallback" | "unavailable";
  ovulationWindowStatus: "valid" | "insufficient-data" | "unstable-cycle" | "overlaps-period" | "unavailable";
  ovulationWindowMessage: string;
  averageCycleLength: number | null;
  averagePeriodLength: number | null;
  latestCycleLength: number | null;
  variability: number | null;
  confidence: "数据较少" | "中等" | "较高";
  cycleLengths: number[];
}

export type ViewName = "today" | "calendar" | "settings";

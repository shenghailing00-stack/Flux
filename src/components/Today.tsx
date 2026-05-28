import { DISCLAIMER } from "../constants";
import { analyzeBodySignals } from "../bodySignals";
import { emptyDailyLog, getCyclePrediction } from "../cycle";
import { diffDays, todayIso } from "../dateUtils";
import type { DailyLog, PeriodRecord } from "../types";
import { BodySignalCard } from "./BodySignalCard";
import { CycleCard } from "./CycleCard";
import { LogCards } from "./LogCards";
import { PeriodEditor } from "./PeriodEditor";

interface TodayProps {
  periodRecords: PeriodRecord[];
  dailyLogs: DailyLog[];
  logsByDate: Map<string, DailyLog>;
  onSaveLog: (log: DailyLog) => void;
  onSavePeriods: (records: PeriodRecord[]) => void;
}

export function Today({ periodRecords, dailyLogs, logsByDate, onSaveLog, onSavePeriods }: TodayProps) {
  const today = todayIso();
  const prediction = getCyclePrediction(periodRecords, today);
  const todayLog = logsByDate.get(today) ?? emptyDailyLog(today);
  const recentLogs = dailyLogs.filter((log) => {
    const distance = diffDays(log.date, today);
    return distance >= 0 && distance <= 4;
  });
  const signalAnalysis = analyzeBodySignals(dailyLogs, prediction.currentPhase, today);

  return (
    <div className="space-y-4">
      <CycleCard prediction={prediction} />
      <PeriodEditor records={periodRecords} onSave={onSavePeriods} />
      {periodRecords.length < 3 && (
        <div className="rounded-lg border border-roseSoft bg-roseSoft/45 px-4 py-3 text-sm leading-relaxed text-ink">
          当前记录不足 3 次，预测数据较少。{DISCLAIMER}
        </div>
      )}
      <BodySignalCard analysis={signalAnalysis} recentLogCount={recentLogs.length} />
      <LogCards log={todayLog} onChange={onSaveLog} />
    </div>
  );
}

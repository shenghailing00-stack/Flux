import { useEffect, useMemo, useState } from "react";
import { getBodySignalPhaseStats } from "../bodySignals";
import { DISCLAIMER, WEEKDAYS } from "../constants";
import { formatZhDate, getMonthDays, isDateInRange, monthKey, toIso } from "../dateUtils";
import {
  getCyclePrediction,
  getPhaseStats,
  getPhaseForDate,
  getTopSymptoms,
} from "../cycle";
import type { DailyLog, PeriodRecord } from "../types";
import { DayEditor } from "./DayEditor";

interface CalendarAnalysisProps {
  periodRecords: PeriodRecord[];
  dailyLogs: DailyLog[];
  logsByDate: Map<string, DailyLog>;
  onSaveLog: (log: DailyLog) => void;
  onSavePeriods: (records: PeriodRecord[]) => void;
}

export function CalendarAnalysis({
  periodRecords,
  dailyLogs,
  logsByDate,
  onSaveLog,
  onSavePeriods,
}: CalendarAnalysisProps) {
  const [month, setMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const prediction = useMemo(() => getCyclePrediction(periodRecords), [periodRecords]);
  const days = useMemo(() => getMonthDays(month), [month]);
  const topSymptoms = useMemo(() => getTopSymptoms(dailyLogs), [dailyLogs]);
  const phaseStats = useMemo(() => getPhaseStats(dailyLogs, periodRecords), [dailyLogs, periodRecords]);
  const bodySignalPhaseStats = useMemo(() => getBodySignalPhaseStats(dailyLogs, periodRecords), [dailyLogs, periodRecords]);
  const hasRecordedPeriodInCurrentMonth = useMemo(
    () =>
      days.some((date) => {
        const iso = toIso(date);
        return date.getMonth() === month.getMonth() && periodRecords.some((record) => isDateInRange(iso, record.startDate, record.endDate));
      }),
    [days, month, periodRecords],
  );

  useEffect(() => {
    if (periodRecords.length > 0 && !hasRecordedPeriodInCurrentMonth) {
      console.warn("Flux: periodRecords exists, but no recorded period is visible in the current calendar month.", {
        month: monthKey(month),
        periodRecords,
      });
    }
  }, [hasRecordedPeriodInCurrentMonth, month, periodRecords]);

  function shiftMonth(offset: number) {
    setMonth(new Date(month.getFullYear(), month.getMonth() + offset, 1));
  }

  return (
    <div className="space-y-4">
      <section className="card p-4">
        <div className="flex items-center justify-between gap-3">
          <button type="button" onClick={() => shiftMonth(-1)} className="rounded-full border border-warm bg-paper px-3 py-2 text-sm">
            上月
          </button>
          <h2 className="text-lg font-semibold text-ink">{monthKey(month)}</h2>
          <button type="button" onClick={() => shiftMonth(1)} className="rounded-full border border-warm bg-paper px-3 py-2 text-sm">
            下月
          </button>
        </div>

        <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted">
          {WEEKDAYS.map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>
        <div className="mt-2 grid grid-cols-7 gap-1">
          {days.map((date) => {
            const iso = toIso(date);
            const isCurrentMonth = date.getMonth() === month.getMonth();
            const inRecordedPeriod = periodRecords.some((record) => isDateInRange(iso, record.startDate, record.endDate));
            const inPredictedPeriod = Boolean(
              prediction.nextPeriodStart &&
                prediction.averagePeriodLength &&
                prediction.nextPeriodEnd &&
                isDateInRange(iso, prediction.nextPeriodStart, prediction.nextPeriodEnd),
            );
            const isOvulationDay = prediction.ovulationDate === iso;
            const isFallbackWindow = prediction.predictionMode === "fallback";
            const inOvulationWindow = Boolean(
              prediction.ovulationWindowStart &&
                prediction.ovulationWindowEnd &&
                isDateInRange(iso, prediction.ovulationWindowStart, prediction.ovulationWindowEnd),
            );
            const phase = getPhaseForDate(
              iso,
              periodRecords,
              prediction.nextPeriodStart,
              prediction.nextPeriodEnd,
              prediction.ovulationDate,
              prediction.ovulationWindowStart,
              prediction.ovulationWindowEnd,
            );
            const phaseClass = getCalendarPhaseClass({
              inRecordedPeriod,
              inPredictedPeriod,
              inOvulationWindow,
              isOvulationDay,
              isFallbackWindow,
              phase,
            });

            return (
              <button
                key={iso}
                type="button"
                onClick={() => setSelectedDate(iso)}
                className={`min-h-20 rounded-lg border p-1 text-left transition ${
                  isCurrentMonth ? "border-warm/70 bg-white/45" : "border-transparent bg-white/20 text-muted"
                } ${phaseClass}`}
              >
                <span className={`text-sm font-semibold ${isOvulationDay ? "rounded-full bg-sage px-1.5 py-0.5 text-white shadow-sm" : ""}`}>
                  {date.getDate()}
                </span>
                {isOvulationDay && <span className="mt-1 inline-flex rounded-full bg-white/80 px-1.5 py-0.5 text-[10px] font-semibold text-ink">排卵日</span>}
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted">
          <Legend color="bg-[#E6B8B5]" label="已记录月经期" />
          <Legend color="bg-[#F0D7D5]" border label="预测月经期" />
          <Legend color="bg-sageSoft" label="卵泡期" />
          <Legend color="bg-sage" label="预计排卵日" />
          <Legend color="bg-[#DDD1C5]" label="黄体期" />
          <Legend border label="参考/预测排卵窗口" />
        </div>
        {periodRecords.length > 0 && !hasRecordedPeriodInCurrentMonth && (
          <p className="mt-4 rounded-lg border border-warm bg-white/55 px-3 py-2 text-xs leading-relaxed text-muted">
            已检测到本地有 {periodRecords.length} 条月经记录，但当前月份没有日期落入已记录经期。请切换月份，或检查记录的开始/结束日期。
          </p>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="card p-4">
          <h2 className="text-lg font-semibold text-ink">周期分析</h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Metric label="平均周期长度" value={prediction.averageCycleLength ? `${prediction.averageCycleLength} 天` : "暂无"} />
            <Metric label="平均经期长度" value={prediction.averagePeriodLength ? `${prediction.averagePeriodLength} 天` : "暂无"} />
            <Metric label="最近一次周期" value={prediction.latestCycleLength ? `${prediction.latestCycleLength} 天` : "暂无"} />
            <Metric label="周期波动" value={prediction.variability !== null ? `${prediction.variability} 天` : "暂无"} />
            <Metric label="预测可信度" value={prediction.confidence} />
            <Metric label="下次月经" value={formatZhDate(prediction.nextPeriodStart)} />
          </div>
          <p className="mt-4 rounded-lg bg-blueSoft/70 px-3 py-2 text-xs text-muted">{DISCLAIMER}</p>
        </div>

        <div className="card p-4">
          <h2 className="text-lg font-semibold text-ink">近 6 次周期长度趋势</h2>
          <div className="mt-4 flex h-36 items-end gap-2">
            {prediction.cycleLengths.length === 0 && <p className="text-sm text-muted">记录两次以上月经后显示趋势。</p>}
            {prediction.cycleLengths.map((length, index) => (
              <div key={`${length}-${index}`} className="flex flex-1 flex-col items-center gap-2">
                <div className="w-full rounded-t-md bg-sage" style={{ height: `${Math.max(18, Math.min(120, length * 3))}px` }} />
                <span className="text-xs text-muted">{length}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="card p-4">
          <h2 className="text-lg font-semibold text-ink">常见身体症状 Top 5</h2>
          <List items={topSymptoms} empty="记录身体状态后显示统计。" />
        </div>
        <div className="card p-4">
          <h2 className="text-lg font-semibold text-ink">不同阶段常见状态</h2>
          <div className="mt-3 space-y-3">
            {phaseStats.length === 0 && <p className="text-sm text-muted">积累更多记录后显示阶段统计。</p>}
            {phaseStats.map((group) => (
              <div key={group.phase} className="rounded-lg border border-warm bg-white/40 p-3">
                <p className="text-sm font-semibold text-ink">{group.phase}</p>
                <List items={group.items} empty="暂无状态" compact />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="card p-4">
        <h2 className="text-lg font-semibold text-ink">身体信号与周期阶段</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted">
          仅统计可能与周期阶段有关的身体信号，不包含性行为/自慰、咖啡因、药物、运动记录。
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {bodySignalPhaseStats.length === 0 && <p className="text-sm text-muted">积累更多每日记录后显示身体信号分布。</p>}
          {bodySignalPhaseStats.map((group) => (
            <div key={group.phase} className="rounded-lg border border-warm bg-white/40 p-3">
              <p className="text-sm font-semibold text-ink">{group.phase}</p>
              <List items={group.items} empty="暂无明显身体信号" compact />
            </div>
          ))}
        </div>
        <p className="mt-4 rounded-lg bg-blueSoft/70 px-3 py-2 text-xs leading-relaxed text-muted">{DISCLAIMER}</p>
      </section>

      {selectedDate && (
        <DayEditor
          date={selectedDate}
          log={logsByDate.get(selectedDate)}
          periodRecords={periodRecords}
          onClose={() => setSelectedDate(null)}
          onSaveLog={onSaveLog}
          onSavePeriods={onSavePeriods}
        />
      )}
    </div>
  );
}

function getCalendarPhaseClass({
  inRecordedPeriod,
  inPredictedPeriod,
  inOvulationWindow,
  isOvulationDay,
  isFallbackWindow,
  phase,
}: {
  inRecordedPeriod: boolean;
  inPredictedPeriod: boolean;
  inOvulationWindow: boolean;
  isOvulationDay: boolean;
  isFallbackWindow: boolean;
  phase: string;
}) {
  const windowClass = inOvulationWindow
    ? isFallbackWindow
      ? " border-2 border-dashed border-sage/80"
      : " border-2 border-dashed border-blue/70"
    : "";
  if (inRecordedPeriod) return "border-rose bg-[#DFAAA7] text-ink shadow-sm";
  if (inPredictedPeriod) return `border-2 border-dashed border-rose bg-[#F0D7D5]/80`;
  if (isOvulationDay) return `bg-sageSoft/95 ring-2 ring-sage/80 shadow-sm${windowClass}`;
  if (phase === "卵泡期") return `border-sage/70 bg-sageSoft/70${windowClass}`;
  if (phase === "黄体期") return `border-taupe/70 bg-[#DDD1C5]/70${windowClass}`;
  return "";
}

function Legend({ label, color, border, ring }: { label: string; color?: string; border?: boolean; ring?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className={`h-3 w-3 rounded-full ${color ?? "bg-transparent"} ${border ? "border border-dashed border-rose" : ""} ${ring ? "ring-1 ring-blue" : ""}`} />
      {label}
    </span>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-warm bg-white/45 p-3">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 text-base font-semibold text-ink">{value}</p>
    </div>
  );
}

function List({ items, empty, compact = false }: { items: Array<[string, number]>; empty: string; compact?: boolean }) {
  if (items.length === 0) return <p className="mt-3 text-sm text-muted">{empty}</p>;
  return (
    <ul className={`space-y-2 ${compact ? "mt-2" : "mt-4"}`}>
      {items.map(([name, count]) => (
        <li key={name} className="flex items-center justify-between rounded-lg bg-white/45 px-3 py-2 text-sm">
          <span>{name}</span>
          <span className="text-muted">{count} 次</span>
        </li>
      ))}
    </ul>
  );
}

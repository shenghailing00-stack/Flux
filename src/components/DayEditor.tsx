import { useMemo, useState } from "react";
import { createId, emptyDailyLog, getCyclePrediction, getPhaseForDate } from "../cycle";
import type { DailyLog, FlowLevel, PeriodRecord } from "../types";
import { LogCards } from "./LogCards";

interface DayEditorProps {
  date: string;
  log?: DailyLog;
  periodRecords: PeriodRecord[];
  onClose: () => void;
  onSaveLog: (log: DailyLog) => void;
  onSavePeriods: (records: PeriodRecord[]) => void;
}

function createPeriodDraft(date: string, currentPeriod?: PeriodRecord): PeriodRecord {
  return (
    currentPeriod ?? {
      id: createId(),
      startDate: date,
      endDate: date,
      flow: "中",
      painLevel: 2,
      note: "",
    }
  );
}

export function DayEditor({ date, log, periodRecords, onClose, onSaveLog, onSavePeriods }: DayEditorProps) {
  const currentPeriod = useMemo(
    () => periodRecords.find((record) => date >= record.startDate && date <= record.endDate),
    [date, periodRecords],
  );
  const prediction = useMemo(() => getCyclePrediction(periodRecords, date), [date, periodRecords]);
  const phase = getPhaseForDate(
    date,
    periodRecords,
    prediction.nextPeriodStart,
    prediction.nextPeriodEnd,
    prediction.ovulationDate,
    prediction.ovulationWindowStart,
    prediction.ovulationWindowEnd,
  );
  const [draftLog, setDraftLog] = useState<DailyLog>(log ?? emptyDailyLog(date));
  const [isPeriodPanelOpen, setIsPeriodPanelOpen] = useState(false);
  const [draftPeriod, setDraftPeriod] = useState<PeriodRecord>(() => createPeriodDraft(date, currentPeriod));

  function saveDailyLog() {
    onSaveLog(draftLog);
    onClose();
  }

  function recordAsPeriodStart() {
    setDraftPeriod({ ...createPeriodDraft(date, currentPeriod), startDate: date, endDate: currentPeriod?.endDate ?? date });
    setIsPeriodPanelOpen(true);
  }

  function recordAsPeriodEnd() {
    setDraftPeriod({ ...createPeriodDraft(date, currentPeriod), startDate: currentPeriod?.startDate ?? date, endDate: date });
    setIsPeriodPanelOpen(true);
  }

  function editPeriodRecord() {
    setDraftPeriod(createPeriodDraft(date, currentPeriod));
    setIsPeriodPanelOpen(true);
  }

  function savePeriodRecord() {
    const nextRecord = {
      ...draftPeriod,
      endDate: draftPeriod.endDate < draftPeriod.startDate ? draftPeriod.startDate : draftPeriod.endDate,
    };
    onSavePeriods(
      [...periodRecords.filter((record) => record.id !== nextRecord.id), nextRecord].sort((a, b) =>
        a.startDate.localeCompare(b.startDate),
      ),
    );
    setIsPeriodPanelOpen(false);
  }

  return (
    <div className="fixed inset-0 z-20 overflow-y-auto bg-ink/25 px-4 py-6 backdrop-blur-sm">
      <div className="mx-auto max-w-4xl rounded-lg bg-shell p-4 shadow-soft">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-muted">当天记录</p>
            <h2 className="text-xl font-semibold text-ink">{date}</h2>
            <p className="mt-1 text-sm text-muted">当天周期状态：{phase === "未知" ? "普通日期" : phase}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full border border-warm bg-paper px-4 py-2 text-sm">
            关闭
          </button>
        </div>

        <div className="mt-4">
          <LogCards log={draftLog} onChange={setDraftLog} />
        </div>

        <section className="mt-4 rounded-lg border border-warm/80 bg-paper/80 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-base font-semibold text-ink">月经记录管理</h3>
              <p className="mt-1 text-sm text-muted">只有点击这里的按钮并保存，才会新增或修改月经期。</p>
            </div>
            <button
              type="button"
              onClick={() => setIsPeriodPanelOpen((value) => !value)}
              className="rounded-lg border border-warm bg-white/60 px-4 py-2 text-sm font-medium"
            >
              {isPeriodPanelOpen ? "收起" : "打开管理"}
            </button>
          </div>

          {isPeriodPanelOpen && (
            <div className="mt-4 space-y-4">
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={recordAsPeriodStart} className="rounded-lg bg-roseSoft px-3 py-2 text-sm font-medium text-ink">
                  记录为月经开始
                </button>
                <button type="button" onClick={recordAsPeriodEnd} className="rounded-lg bg-roseSoft px-3 py-2 text-sm font-medium text-ink">
                  记录为月经结束
                </button>
                <button type="button" onClick={editPeriodRecord} className="rounded-lg border border-warm bg-white/60 px-3 py-2 text-sm font-medium">
                  编辑月经记录
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1 text-sm">
                  <span className="font-medium">开始日期</span>
                  <input
                    type="date"
                    value={draftPeriod.startDate}
                    onChange={(event) => setDraftPeriod({ ...draftPeriod, startDate: event.target.value })}
                    className="w-full rounded-lg border border-warm bg-white/70 px-3 py-2 outline-none focus:border-blue"
                  />
                </label>
                <label className="space-y-1 text-sm">
                  <span className="font-medium">结束日期</span>
                  <input
                    type="date"
                    value={draftPeriod.endDate}
                    onChange={(event) => setDraftPeriod({ ...draftPeriod, endDate: event.target.value })}
                    className="w-full rounded-lg border border-warm bg-white/70 px-3 py-2 outline-none focus:border-blue"
                  />
                </label>
                <label className="space-y-1 text-sm">
                  <span className="font-medium">经量</span>
                  <select
                    value={draftPeriod.flow}
                    onChange={(event) => setDraftPeriod({ ...draftPeriod, flow: event.target.value as FlowLevel })}
                    className="w-full rounded-lg border border-warm bg-white/70 px-3 py-2 outline-none focus:border-blue"
                  >
                    <option>少</option>
                    <option>中</option>
                    <option>多</option>
                  </select>
                </label>
                <label className="space-y-1 text-sm">
                  <span className="font-medium">痛经程度 {draftPeriod.painLevel}</span>
                  <input
                    type="range"
                    min={1}
                    max={5}
                    value={draftPeriod.painLevel}
                    onChange={(event) => setDraftPeriod({ ...draftPeriod, painLevel: Number(event.target.value) })}
                    className="w-full accent-[#CFA3A0]"
                  />
                </label>
              </div>
              <textarea
                value={draftPeriod.note}
                onChange={(event) => setDraftPeriod({ ...draftPeriod, note: event.target.value })}
                rows={2}
                placeholder="月经备注"
                className="w-full resize-none rounded-lg border border-warm bg-white/70 px-3 py-2 text-sm outline-none focus:border-blue"
              />
              <button type="button" onClick={savePeriodRecord} className="rounded-lg bg-sage px-4 py-2 text-sm font-semibold text-white">
                保存月经记录
              </button>
            </div>
          )}
        </section>

        <div className="sticky bottom-0 mt-4 flex justify-end gap-2 bg-shell/90 py-3 backdrop-blur">
          <button type="button" onClick={onClose} className="rounded-lg border border-warm bg-paper px-4 py-2 text-sm">
            取消
          </button>
          <button type="button" onClick={saveDailyLog} className="rounded-lg bg-sage px-4 py-2 text-sm font-semibold text-white">
            保存当天记录
          </button>
        </div>
      </div>
    </div>
  );
}

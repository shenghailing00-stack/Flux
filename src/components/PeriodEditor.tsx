import { useState } from "react";
import { createId } from "../cycle";
import { todayIso } from "../dateUtils";
import type { FlowLevel, PeriodRecord } from "../types";
import { TextArea } from "./Fields";

interface PeriodEditorProps {
  records: PeriodRecord[];
  onSave: (records: PeriodRecord[]) => void;
}

const flowLevels: FlowLevel[] = ["少", "中", "多"];

function createDraft(): PeriodRecord {
  return {
    id: createId(),
    startDate: todayIso(),
    endDate: todayIso(),
    flow: "中",
    painLevel: 2,
    note: "",
  };
}

export function PeriodEditor({ records, onSave }: PeriodEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState<PeriodRecord>(() => createDraft());
  const latest = [...records].sort((a, b) => b.startDate.localeCompare(a.startDate))[0];

  function openNewRecord() {
    setDraft(createDraft());
    setIsOpen(true);
  }

  function save() {
    const nextRecord = {
      ...draft,
      endDate: draft.endDate < draft.startDate ? draft.startDate : draft.endDate,
    };
    onSave([...records, nextRecord].sort((a, b) => a.startDate.localeCompare(b.startDate)));
    setIsOpen(false);
  }

  return (
    <section className="card p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-ink">月经记录</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted">
            {latest ? `最近一次：${latest.startDate} 至 ${latest.endDate}` : "还没有记录月经开始和结束日期。"}
          </p>
        </div>
        <button
          type="button"
          onClick={openNewRecord}
          className="min-h-12 rounded-lg bg-rose px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#C69491]"
        >
          新增月经记录
        </button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-30 overflow-y-auto bg-ink/25 px-4 py-6 backdrop-blur-sm">
          <div className="mx-auto max-w-lg rounded-lg border border-white/70 bg-shell p-4 shadow-soft">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-muted">记录本次月经</p>
                <h3 className="text-xl font-semibold text-ink">开始、结束与感受</h3>
              </div>
              <button type="button" onClick={() => setIsOpen(false)} className="rounded-full border border-warm bg-paper px-4 py-2 text-sm">
                关闭
              </button>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="space-y-1 text-sm">
                <span className="font-medium">开始日期</span>
                <input
                  type="date"
                  value={draft.startDate}
                  onChange={(event) => setDraft({ ...draft, startDate: event.target.value })}
                  className="w-full rounded-lg border border-warm bg-white/75 px-3 py-2 outline-none focus:border-blue"
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="font-medium">结束日期</span>
                <input
                  type="date"
                  value={draft.endDate}
                  onChange={(event) => setDraft({ ...draft, endDate: event.target.value })}
                  className="w-full rounded-lg border border-warm bg-white/75 px-3 py-2 outline-none focus:border-blue"
                />
              </label>
            </div>

            <fieldset className="mt-4 space-y-2">
              <legend className="text-sm font-medium text-ink">经量</legend>
              <div className="grid grid-cols-3 gap-2">
                {flowLevels.map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setDraft({ ...draft, flow: level })}
                    className={`rounded-lg border px-3 py-2 text-sm transition ${
                      draft.flow === level ? "border-rose bg-roseSoft text-ink" : "border-warm bg-paper text-muted"
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </fieldset>

            <label className="mt-4 block space-y-2 text-sm font-medium">
              痛经程度 {draft.painLevel}
              <input
                type="range"
                min={1}
                max={5}
                value={draft.painLevel}
                onChange={(event) => setDraft({ ...draft, painLevel: Number(event.target.value) })}
                className="w-full accent-[#CFA3A0]"
              />
            </label>

            <div className="mt-4">
              <TextArea label="备注（可选）" value={draft.note} onChange={(note) => setDraft({ ...draft, note })} rows={2} />
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setIsOpen(false)} className="rounded-lg border border-warm bg-paper px-4 py-2 text-sm">
                取消
              </button>
              <button type="button" onClick={save} className="rounded-lg bg-sage px-4 py-2 text-sm font-semibold text-white">
                保存记录
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

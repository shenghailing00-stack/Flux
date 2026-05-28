import { useRef, useState } from "react";
import { clearFluxData, exportData, parseImportData } from "../storage";
import type { DailyLog, PeriodRecord } from "../types";

interface SettingsProps {
  periodRecords: PeriodRecord[];
  dailyLogs: DailyLog[];
  onImportData: (records: PeriodRecord[], logs: DailyLog[]) => void;
  onResetData: () => void;
}

export function Settings({ periodRecords, dailyLogs, onImportData, onResetData }: SettingsProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [message, setMessage] = useState("");

  function downloadExport() {
    const blob = new Blob([exportData(periodRecords, dailyLogs)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `flux-export-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setMessage("数据已导出。");
  }

  async function importFile(file: File | undefined) {
    if (!file) return;
    try {
      const raw = await file.text();
      const { records, logs } = parseImportData(raw);
      onImportData(records, logs);
      setMessage("数据已导入，并保存到本地。");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch {
      setMessage("导入失败，请确认选择的是 Flux 导出的 JSON 文件。");
    }
  }

  function reset() {
    if (!window.confirm("确定清空本地记录吗？此操作不会删除任何服务器数据，因为 Flux 不上传数据。")) return;
    clearFluxData();
    onResetData();
    setMessage("本地数据已清空。");
  }

  async function refreshAppCache() {
    try {
      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.update()));
      }

      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
      }

      setMessage("应用缓存已刷新。若页面仍异常，请关闭后重新打开 Flux。");
    } catch {
      setMessage("无法自动刷新缓存。若页面异常，请清除浏览器缓存后重新打开 Flux。");
    }
  }

  return (
    <div className="space-y-4">
      <section className="card p-5">
        <h2 className="text-lg font-semibold text-ink">隐私与数据</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Flux 不需要登录，也不接入后端。月经记录和每日记录只保存在此浏览器的 localStorage 中，后续可以迁移到 IndexedDB。
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-warm bg-white/45 p-3">
            <p className="text-xs text-muted">月经记录</p>
            <p className="text-2xl font-semibold text-ink">{periodRecords.length}</p>
          </div>
          <div className="rounded-lg border border-warm bg-white/45 p-3">
            <p className="text-xs text-muted">每日记录</p>
            <p className="text-2xl font-semibold text-ink">{dailyLogs.length}</p>
          </div>
        </div>
      </section>

      <section className="card p-5">
        <h2 className="text-lg font-semibold text-ink">本地备份</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">导出或导入 JSON 备份。导入后会覆盖当前本地记录。</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={downloadExport} className="rounded-lg bg-sage px-4 py-2 text-sm font-semibold text-white">
            导出数据
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-lg border border-sage bg-sageSoft px-4 py-2 text-sm font-semibold text-ink"
          >
            导入数据
          </button>
          <button type="button" onClick={reset} className="rounded-lg border border-rose bg-roseSoft px-4 py-2 text-sm font-semibold text-ink">
            清空数据
          </button>
          <button
            type="button"
            onClick={() => void refreshAppCache()}
            className="rounded-lg border border-blue bg-blueSoft px-4 py-2 text-sm font-semibold text-ink"
          >
            刷新应用缓存 / 检查更新
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={(event) => void importFile(event.target.files?.[0])}
            className="hidden"
          />
        </div>
        {message && <p className="mt-3 rounded-lg bg-white/45 px-3 py-2 text-sm text-muted">{message}</p>}
      </section>

      <section className="rounded-lg border border-blueSoft bg-blueSoft/60 p-4 text-sm leading-relaxed text-muted">
        仅供个人记录参考，不用于医学诊断、避孕或治疗决策。
      </section>
    </div>
  );
}

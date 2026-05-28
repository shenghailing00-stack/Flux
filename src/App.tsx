import { useMemo, useState } from "react";
import { CalendarAnalysis } from "./components/CalendarAnalysis";
import { Header } from "./components/Header";
import { Settings } from "./components/Settings";
import { Today } from "./components/Today";
import { loadDailyLogs, loadPeriodRecords, saveDailyLogs, savePeriodRecords } from "./storage";
import type { DailyLog, PeriodRecord, ViewName } from "./types";

export default function App() {
  const [view, setView] = useState<ViewName>("today");
  const [periodRecords, setPeriodRecords] = useState<PeriodRecord[]>(() => loadPeriodRecords());
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>(() => loadDailyLogs());

  const logsByDate = useMemo(() => new Map(dailyLogs.map((log) => [log.date, log])), [dailyLogs]);

  function updatePeriods(nextRecords: PeriodRecord[]) {
    setPeriodRecords(nextRecords);
    savePeriodRecords(nextRecords);
  }

  function upsertDailyLog(log: DailyLog) {
    const nextLogs = [...dailyLogs.filter((item) => item.date !== log.date), log].sort((a, b) => a.date.localeCompare(b.date));
    setDailyLogs(nextLogs);
    saveDailyLogs(nextLogs);
  }

  function resetAllData() {
    setPeriodRecords([]);
    setDailyLogs([]);
  }

  function importAllData(records: PeriodRecord[], logs: DailyLog[]) {
    const nextRecords = [...records].sort((a, b) => a.startDate.localeCompare(b.startDate));
    const nextLogs = [...logs].sort((a, b) => a.date.localeCompare(b.date));
    setPeriodRecords(nextRecords);
    setDailyLogs(nextLogs);
    savePeriodRecords(nextRecords);
    saveDailyLogs(nextLogs);
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 pb-24 pt-5 sm:px-6 lg:pb-8">
      <Header activeView={view} onChangeView={setView} />
      <main className="mt-5 flex-1">
        {view === "today" && (
          <Today
            periodRecords={periodRecords}
            dailyLogs={dailyLogs}
            logsByDate={logsByDate}
            onSaveLog={upsertDailyLog}
            onSavePeriods={updatePeriods}
          />
        )}
        {view === "calendar" && (
          <CalendarAnalysis
            periodRecords={periodRecords}
            dailyLogs={dailyLogs}
            logsByDate={logsByDate}
            onSaveLog={upsertDailyLog}
            onSavePeriods={updatePeriods}
          />
        )}
        {view === "settings" && (
          <Settings periodRecords={periodRecords} dailyLogs={dailyLogs} onImportData={importAllData} onResetData={resetAllData} />
        )}
      </main>
    </div>
  );
}

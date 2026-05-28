import { DISCLAIMER } from "../constants";
import type { BodySignalAnalysis } from "../bodySignals";

interface BodySignalCardProps {
  analysis: BodySignalAnalysis;
  recentLogCount: number;
}

export function BodySignalCard({ analysis, recentLogCount }: BodySignalCardProps) {
  return (
    <section className="card p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-ink">身体信号参考</h2>
          <p className="mt-1 text-sm text-muted">最近 {recentLogCount} 条记录，仅作为日期预测的辅助参考。</p>
        </div>
        <span className="rounded-full border border-sage/50 bg-sageSoft/75 px-3 py-1 text-sm font-medium text-ink">
          {analysis.consistency}
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <MiniMetric label="身体信号倾向" value={analysis.suggestedPhase} />
        <MiniMetric label="预测可信度变化" value={analysis.confidenceAdjustment} />
        <MiniMetric label="参考一致性" value={analysis.consistency} />
      </div>

      <div className="mt-4 rounded-lg border border-warm/70 bg-white/40 p-3">
        <p className="text-sm leading-relaxed text-ink">{analysis.message}</p>
        {analysis.reasons.length > 0 && (
          <ul className="mt-3 space-y-1 text-sm text-muted">
            {analysis.reasons.map((reason) => (
              <li key={reason}>· {reason}</li>
            ))}
          </ul>
        )}
      </div>
      <p className="mt-3 text-xs leading-relaxed text-muted">{DISCLAIMER}</p>
    </section>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-warm/70 bg-white/45 p-3">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 text-base font-semibold text-ink">{value}</p>
    </div>
  );
}

import { DISCLAIMER } from "../constants";
import { formatZhDate } from "../dateUtils";
import type { CyclePrediction } from "../types";

interface CycleCardProps {
  prediction: CyclePrediction;
}

const segmentClass = {
  "月经期": "bg-rose",
  "卵泡期": "bg-sage",
  "预测排卵窗口": "bg-blue",
  "排卵日": "bg-blue",
  "黄体期": "bg-taupe",
  "未知": "bg-warm",
};

export function CycleCard({ prediction }: CycleCardProps) {
  const dayText = prediction.currentDay ? `第 ${prediction.currentDay} 天` : "待记录";
  const distanceText =
    prediction.daysUntilNextPeriod === null
      ? "暂无预测"
      : prediction.daysUntilNextPeriod >= 0
        ? `${prediction.daysUntilNextPeriod} 天`
        : `已过 ${Math.abs(prediction.daysUntilNextPeriod)} 天`;

  const confidenceText =
    prediction.predictionMode === "fallback" ? "数据较少，以下为默认 28 天周期参考估算" : prediction.confidence;

  return (
    <section className="card overflow-hidden p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-muted">今天的周期</p>
          <h2 className="mt-1 text-4xl font-semibold tracking-normal text-ink sm:text-5xl">{dayText}</h2>
          <p className="mt-3 inline-flex rounded-full border border-sage/40 bg-sageSoft/80 px-3 py-1 text-sm font-medium text-ink">
            当前阶段：{prediction.currentPhase}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:min-w-72">
          <Metric label="距下次月经" value={distanceText} />
          <Metric label="预测可信度" value={confidenceText} />
          <Metric label="预计开始" value={formatZhDate(prediction.nextPeriodStart)} />
          <Metric label="预计排卵日" value={prediction.ovulationDate ? formatZhDate(prediction.ovulationDate) : "暂不显示"} />
          <Metric
            wide
            label="预测排卵窗口"
            value={
              prediction.ovulationWindowStart && prediction.ovulationWindowEnd
                ? `${formatZhDate(prediction.ovulationWindowStart)} - ${formatZhDate(prediction.ovulationWindowEnd)}`
                : prediction.ovulationWindowMessage || "数据异常，暂不显示排卵窗口"
            }
          />
        </div>
      </div>

      {prediction.ovulationWindowMessage && (
        <p className="mt-4 rounded-lg border border-blueSoft bg-blueSoft/55 px-3 py-2 text-xs leading-relaxed text-muted">
          {prediction.ovulationWindowMessage}
        </p>
      )}

      <div className="mt-6 space-y-3">
        <div className="flex h-3 overflow-hidden rounded-full bg-warm/50">
          <div className="bg-rose/85" style={{ width: "18%" }} />
          <div className="bg-sage/85" style={{ width: "32%" }} />
          <div className="bg-blue/85" style={{ width: "18%" }} />
          <div className="bg-taupe/85" style={{ width: "32%" }} />
        </div>
        <div className="grid grid-cols-4 gap-2 text-xs text-muted">
          {(["月经期", "卵泡期", "预测排卵窗口", "黄体期"] as const).map((phase) => (
            <span key={phase} className="flex items-center gap-1">
              <span className={`h-2 w-2 rounded-full ${segmentClass[phase]}`} />
              {phase}
            </span>
          ))}
        </div>
      </div>
      <p className="mt-5 rounded-lg border border-blueSoft bg-blueSoft/55 px-3 py-2 text-xs leading-relaxed text-muted">{DISCLAIMER}</p>
    </section>
  );
}

function Metric({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={`rounded-lg border border-warm/60 bg-white/40 p-3 ${wide ? "col-span-2" : ""}`}>
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 text-base font-semibold text-ink">{value}</p>
    </div>
  );
}

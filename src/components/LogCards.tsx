import { BODY_OPTIONS, EXERCISE_TYPES, MOOD_OPTIONS } from "../constants";
import type { DailyLog } from "../types";
import { ChipGroup, Rating, TextArea } from "./Fields";

interface LogCardsProps {
  log: DailyLog;
  onChange: (log: DailyLog) => void;
}

export function LogCards({ log, onChange }: LogCardsProps) {
  const update = (next: DailyLog) => onChange({ ...next, updatedAt: new Date().toISOString() });

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <section className="card space-y-4 p-4 lg:col-span-1">
        <div>
          <h2 className="text-lg font-semibold text-ink">身体状态</h2>
          <p className="mt-1 text-xs text-muted">选择今天明显出现的状态即可。</p>
        </div>
        <ChipGroup label="白带情况" options={BODY_OPTIONS.discharge} value={log.body.discharge} onChange={(value) => update({ ...log, body: { ...log.body, discharge: value } })} />
        <ChipGroup label="性行为/自慰" options={BODY_OPTIONS.intimacy} value={log.body.intimacy} onChange={(value) => update({ ...log, body: { ...log.body, intimacy: value } })} />
        <ChipGroup label="食欲情况" options={BODY_OPTIONS.appetite} value={log.body.appetite} onChange={(value) => update({ ...log, body: { ...log.body, appetite: value } })} />
        <ChipGroup label="咖啡因摄入" options={BODY_OPTIONS.caffeine} value={log.body.caffeine} onChange={(value) => update({ ...log, body: { ...log.body, caffeine: value } })} />
        <ChipGroup label="头部状态" options={BODY_OPTIONS.head} value={log.body.head} onChange={(value) => update({ ...log, body: { ...log.body, head: value } })} />
        <ChipGroup label="皮肤状态" options={BODY_OPTIONS.skin} value={log.body.skin} onChange={(value) => update({ ...log, body: { ...log.body, skin: value } })} />
        <ChipGroup label="乳房状态" options={BODY_OPTIONS.breast} value={log.body.breast} onChange={(value) => update({ ...log, body: { ...log.body, breast: value } })} />
        <ChipGroup label="肠胃情况" options={BODY_OPTIONS.digestion} value={log.body.digestion} onChange={(value) => update({ ...log, body: { ...log.body, digestion: value } })} />
        <ChipGroup label="排便情况" options={BODY_OPTIONS.bowelMovement} value={log.body.bowelMovement ?? []} onChange={(value) => update({ ...log, body: { ...log.body, bowelMovement: value } })} />
        <ChipGroup label="腰腹状态" options={BODY_OPTIONS.waistAbdomen} value={log.body.waistAbdomen} onChange={(value) => update({ ...log, body: { ...log.body, waistAbdomen: value } })} />
        <ChipGroup label="药物/保健品" options={BODY_OPTIONS.medication} value={log.body.medication} onChange={(value) => update({ ...log, body: { ...log.body, medication: value } })} />
        <div className="rounded-lg border border-warm/70 bg-white/35 p-3">
          <p className="mb-3 text-sm font-medium text-ink">维生素与保健品</p>
          <div className="space-y-4">
            <ChipGroup label="维生素" options={BODY_OPTIONS.vitamins} value={log.body.vitamins ?? []} onChange={(value) => update({ ...log, body: { ...log.body, vitamins: value } })} />
            <ChipGroup label="保健品" options={BODY_OPTIONS.supplements} value={log.body.supplements ?? []} onChange={(value) => update({ ...log, body: { ...log.body, supplements: value } })} />
          </div>
        </div>
        <TextArea label="备注（可选）" value={log.body.note} onChange={(value) => update({ ...log, body: { ...log.body, note: value } })} />
      </section>

      <section className="card space-y-4 p-4">
        <div>
          <h2 className="text-lg font-semibold text-ink">今日心情</h2>
          <p className="mt-1 text-xs text-muted">用标签记录大概感受，再标一下压力程度。</p>
        </div>
        <ChipGroup label="心情" options={MOOD_OPTIONS} value={log.mood.moods} onChange={(value) => update({ ...log, mood: { ...log.mood, moods: value } })} />
        <Rating label="压力程度" value={log.mood.stressLevel} onChange={(value) => update({ ...log, mood: { ...log.mood, stressLevel: value } })} />
        <TextArea label="备注（可选）" value={log.mood.note} onChange={(value) => update({ ...log, mood: { ...log.mood, note: value } })} />
      </section>

      <section className="card space-y-4 p-4">
        <div>
          <h2 className="text-lg font-semibold text-ink">运动情况</h2>
          <p className="mt-1 text-xs text-muted">记录是否运动、类型和运动后的感受。</p>
        </div>
        <label className="flex items-center justify-between gap-3 rounded-lg border border-warm bg-white/45 px-3 py-3 text-sm font-medium">
          是否运动
          <input
            type="checkbox"
            checked={log.exercise.exercised}
            onChange={(event) => update({ ...log, exercise: { ...log.exercise, exercised: event.target.checked } })}
            className="h-5 w-5 accent-[#A7B8A4]"
          />
        </label>
        <ChipGroup label="运动类型" options={EXERCISE_TYPES} value={log.exercise.types} onChange={(value) => update({ ...log, exercise: { ...log.exercise, types: value } })} />
        <label className="block space-y-2 text-sm font-medium">
          运动强度
          <select
            value={log.exercise.intensity}
            onChange={(event) => update({ ...log, exercise: { ...log.exercise, intensity: event.target.value as DailyLog["exercise"]["intensity"] } })}
            className="w-full rounded-lg border border-warm bg-white/70 px-3 py-2 outline-none focus:border-blue"
          >
            <option value="">未选择</option>
            <option>轻度</option>
            <option>中等</option>
            <option>高强度</option>
          </select>
        </label>
        <label className="block space-y-2 text-sm font-medium">
          运动时长
          <input
            type="number"
            min={0}
            value={log.exercise.durationMinutes}
            onChange={(event) => update({ ...log, exercise: { ...log.exercise, durationMinutes: Number(event.target.value) } })}
            className="w-full rounded-lg border border-warm bg-white/70 px-3 py-2 outline-none focus:border-blue"
          />
        </label>
        <label className="block space-y-2 text-sm font-medium">
          运动后感受
          <select
            value={log.exercise.feeling}
            onChange={(event) => update({ ...log, exercise: { ...log.exercise, feeling: event.target.value as DailyLog["exercise"]["feeling"] } })}
            className="w-full rounded-lg border border-warm bg-white/70 px-3 py-2 outline-none focus:border-blue"
          >
            <option value="">未选择</option>
            <option>舒服</option>
            <option>一般</option>
            <option>不适</option>
          </select>
        </label>
        <TextArea label="备注（可选）" value={log.exercise.note} onChange={(value) => update({ ...log, exercise: { ...log.exercise, note: value } })} />
      </section>
    </div>
  );
}

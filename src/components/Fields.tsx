interface ChipGroupProps {
  label: string;
  options: string[];
  value: string[];
  onChange: (value: string[]) => void;
}

export function ChipGroup({ label, options, value, onChange }: ChipGroupProps) {
  function toggle(option: string) {
    onChange(value.includes(option) ? value.filter((item) => item !== option) : [...value, option]);
  }

  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium text-ink">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => toggle(option)}
            className={`chip ${value.includes(option) ? "chip-active" : ""}`}
          >
            {option}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

interface RatingProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
}

export function Rating({ label, value, onChange }: RatingProps) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-medium text-ink">{label}</span>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onChange(item)}
            className={`h-10 w-10 rounded-full border text-sm transition ${
              value >= item ? "border-rose bg-roseSoft text-ink" : "border-warm bg-paper text-muted"
            }`}
          >
            {item}
          </button>
        ))}
      </div>
    </label>
  );
}

interface TextAreaProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
}

export function TextArea({ label, value, onChange, rows = 2 }: TextAreaProps) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-ink">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        className="w-full resize-none rounded-lg border border-warm bg-white/70 px-3 py-2 text-sm text-ink outline-none focus:border-blue"
      />
    </label>
  );
}

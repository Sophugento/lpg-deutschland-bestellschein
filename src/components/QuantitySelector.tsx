"use client";

interface Props {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}

export default function QuantitySelector({ value, onChange, min = 0, max = 99 }: Props) {
  return (
    <div className="flex items-center gap-2">
      <button
        className="w-8 h-8 flex items-center justify-center rounded-full border text-sm font-semibold transition-colors"
        style={{
          borderColor: value <= min ? "#ded5d1" : "#d598aa",
          color: value <= min ? "#ded5d1" : "#d598aa",
        }}
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label="Diminuer"
      >
        −
      </button>
      <span className="w-6 text-center text-sm font-semibold tabular-nums">{value}</span>
      <button
        className="w-8 h-8 flex items-center justify-center rounded-full border text-sm font-semibold transition-colors"
        style={{
          borderColor: value >= max ? "#ded5d1" : "#d598aa",
          color: value >= max ? "#ded5d1" : "#d598aa",
        }}
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label="Augmenter"
      >
        +
      </button>
    </div>
  );
}

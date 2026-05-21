"use client";

interface Props {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
}

export default function QuantitySelector({ value, onChange, min = 0, max = 99, disabled = false }: Props) {
  const disabledColor = "#ded5d1";
  return (
    <div className="flex items-center gap-2" style={disabled ? { opacity: 0.4, pointerEvents: "none" } : {}}>
      <button
        className="w-8 h-8 flex items-center justify-center rounded-full border text-sm font-semibold transition-colors"
        style={{
          borderColor: disabled || value <= min ? disabledColor : "#d598aa",
          color: disabled || value <= min ? disabledColor : "#d598aa",
        }}
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={disabled || value <= min}
        aria-label="Diminuer"
      >
        −
      </button>
      <span className="w-6 text-center text-sm font-semibold tabular-nums">{value}</span>
      <button
        className="w-8 h-8 flex items-center justify-center rounded-full border text-sm font-semibold transition-colors"
        style={{
          borderColor: disabled || value >= max ? disabledColor : "#d598aa",
          color: disabled || value >= max ? disabledColor : "#d598aa",
        }}
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={disabled || value >= max}
        aria-label="Augmenter"
      >
        +
      </button>
    </div>
  );
}

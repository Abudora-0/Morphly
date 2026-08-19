type Option<T> = { value: T; label: string };

type OptionToggleProps<T> = {
  label: string;
  options: [Option<T>, Option<T>];
  value: T;
  onChange: (value: T) => void;
};

export function OptionToggle<T>({ label, options, value, onChange }: OptionToggleProps<T>) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <span className="font-mono text-[11px] uppercase tracking-wider text-ink-soft">{label}</span>
      <div className="flex border border-line">
        {options.map((opt, i) => {
          const active = opt.value === value;
          return (
            <button
              key={i}
              type="button"
              onClick={() => onChange(opt.value)}
              className={[
                "px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider transition duration-150 active:scale-[0.97]",
                active ? "bg-ink text-paper" : "bg-paper text-ink hover:bg-line/20",
                i === 0 ? "border-r border-line" : "",
              ].join(" ")}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

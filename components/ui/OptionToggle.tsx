type Option<T> = { value: T; label: string };

type OptionToggleProps<T> = {
  label: string;
  options: [Option<T>, Option<T>];
  value: T;
  onChange: (value: T) => void;
};

export function OptionToggle<T>({ label, options, value, onChange }: OptionToggleProps<T>) {
  const activeIndex = options.findIndex((o) => o.value === value);

  return (
    <div className="group flex items-center justify-between gap-3 py-1.5">
      <span className="font-mono text-[11px] uppercase tracking-wider text-ink-soft transition-colors duration-150 group-hover:text-ink">
        {label}
      </span>
      {/* Equal-width columns, so the travelling indicator below can be a plain
          50% block that lands exactly on either option regardless of label
          length ("Letter" vs "A4"). */}
      <div className="relative grid grid-cols-2 border border-line">
        {/* One travelling block behind the labels, so switching reads as the
            selection moving rather than two independent backgrounds. */}
        <span
          aria-hidden
          className="absolute inset-y-0 left-0 w-1/2 bg-ink transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{ transform: `translateX(${activeIndex * 100}%)` }}
        />
        {options.map((opt, i) => {
          const active = i === activeIndex;
          return (
            <button
              key={i}
              type="button"
              onClick={() => onChange(opt.value)}
              aria-pressed={active}
              className={[
                "relative z-10 px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider transition-colors duration-200 active:scale-[0.97]",
                active ? "text-paper" : "text-ink hover:text-ink-soft",
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

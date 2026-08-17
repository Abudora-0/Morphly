type FormatTabProps = {
  label: string;
  extension: string;
  accent: string;
  active: boolean;
  disabled?: boolean;
  onSelect: () => void;
};

export function FormatTab({ label, extension, accent, active, disabled, onSelect }: FormatTabProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className={[
        "group relative flex-1 border border-line px-3 py-2.5 text-left transition duration-150",
        active ? "bg-ink text-paper" : "bg-paper text-ink hover:bg-line/20",
        disabled ? "cursor-not-allowed opacity-40 hover:bg-paper" : "cursor-pointer active:scale-[0.98]",
      ].join(" ")}
      style={{ borderTopColor: accent, borderTopWidth: 3 }}
    >
      <span className="block font-mono text-[11px] uppercase tracking-wider opacity-60">
        .{extension}
      </span>
      <span className="block text-sm font-medium">{label}</span>
      {disabled && (
        <span className="absolute right-2 top-2 font-mono text-[9px] uppercase tracking-wider">
          Soon
        </span>
      )}
    </button>
  );
}

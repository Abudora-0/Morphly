type Direction = "right" | "down" | "out";

type ArrowProps = {
  direction?: Direction;
  className?: string;
};

// Drawn rather than typed: a real glyph inherits the body font's arrow,
// which is inconsistent across families and cannot be animated on its own.
// These share the UI's 1.5px hairline weight and shift on group hover
// (see .arrow-shift-* in globals.css).
const PATHS: Record<Direction, string> = {
  right: "M2 8h12M9.5 3.5 14 8l-4.5 4.5",
  down: "M8 2v12M3.5 9.5 8 14l4.5-4.5",
  out: "M4 12 12 4M5.5 4H12v6.5",
};

const SHIFT_CLASS: Record<Direction, string> = {
  right: "arrow-shift arrow-shift-right",
  down: "arrow-shift arrow-shift-down",
  out: "arrow-shift arrow-shift-out",
};

export function Arrow({ direction = "right", className }: ArrowProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="square"
      aria-hidden
      className={[SHIFT_CLASS[direction], "shrink-0", className].filter(Boolean).join(" ")}
    >
      <path d={PATHS[direction]} />
    </svg>
  );
}

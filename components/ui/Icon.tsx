type IconName = "sparkle" | "check" | "close" | "file";

type IconProps = {
  name: IconName;
  className?: string;
};

// Drawn at the same 1.5px hairline weight as Arrow.tsx, on a 16px grid.
// Deliberately geometric rather than emoji: an emoji renders in whatever
// colour and style the platform font decides, which breaks the flat
// two-colour surface the rest of the UI holds to.
const PATHS: Record<IconName, string> = {
  // Four-point star, the "auto/assisted" mark, drawn as straight tapers.
  sparkle: "M8 1.5 9.6 6.4 14.5 8 9.6 9.6 8 14.5 6.4 9.6 1.5 8 6.4 6.4Z",
  check: "M3 8.5 6.5 12 13 4.5",
  close: "m4 4 8 8M12 4l-8 8",
  file: "M4 2h5l3 3v9H4zM9 2v3h3",
};

export function Icon({ name, className }: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden
      className={["shrink-0", className].filter(Boolean).join(" ")}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}

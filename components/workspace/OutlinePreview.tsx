import type { MorphlyDocument } from "@/lib/parser/schema";
import { plainText } from "@/lib/parser/schema";

type OutlinePreviewProps = {
  doc: MorphlyDocument;
  isEmpty: boolean;
};

const BLOCK_LABEL: Record<string, string> = {
  paragraph: "¶",
  list: "•",
  table: "▦",
  quote: "❝",
  code: "</>",
  divider: "---",
  image: "🖼",
};

export function OutlinePreview({ doc, isEmpty }: OutlinePreviewProps) {
  if (isEmpty) {
    return (
      <div className="px-4 py-6">
        <p className="mb-5 text-sm text-ink-soft">
          The structural outline of your document will appear here as you type.
        </p>
        <div aria-hidden className="space-y-2.5 opacity-25">
          <div className="h-2 w-2/3 bg-line" />
          <div className="ml-3 h-2 w-2/5 bg-line" />
          <div className="ml-3 h-2 w-1/2 bg-line" />
          <div className="h-2 w-5/6 bg-line" />
          <div className="ml-3 h-2 w-1/3 bg-line" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3">
      {doc.title && (
        <p className="mb-2 truncate font-mono text-xs font-medium uppercase tracking-wider text-ink">
          {doc.title}
        </p>
      )}
      <ul className="space-y-1">
        {doc.blocks.map((block, i) => {
          if (block.type === "heading") {
            return (
              <li
                key={i}
                className="truncate font-mono text-xs text-ink"
                style={{ paddingLeft: (block.level - 1) * 12 }}
              >
                {"H" + block.level} {plainText(block.spans) || "(untitled heading)"}
              </li>
            );
          }

          const summary =
            block.type === "table"
              ? `table · ${block.rows.length} rows`
              : block.type === "list"
                ? `${block.ordered ? "ordered" : "bullet"} list · ${block.items.length} items`
                : block.type === "code"
                  ? `code${block.language ? " · " + block.language : ""}`
                  : block.type === "image"
                    ? `image${block.alt ? " · " + block.alt : ""}`
                    : block.type;

          return (
            <li key={i} className="flex items-center gap-2 truncate pl-3 font-mono text-xs text-ink-soft">
              <span aria-hidden>{BLOCK_LABEL[block.type] ?? "·"}</span>
              <span className="truncate">{summary}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

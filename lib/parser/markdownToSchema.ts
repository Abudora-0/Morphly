import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import type { Root, RootContent, PhrasingContent } from "mdast";
import type { Block, InlineMark, InlineSpan, MorphlyDocument } from "./schema";

const processor = unified().use(remarkParse).use(remarkGfm);

export function markdownToSchema(source: string): MorphlyDocument {
  const tree = processor.parse(source) as Root;
  const blocks: Block[] = [];
  let title: string | undefined;

  for (const node of tree.children) {
    const block = convertBlock(node);
    if (!block) continue;

    // The first top-level H1 becomes the document title rather than a
    // repeated heading block, matching how a pasted "# Title" is meant to read.
    if (!title && block.type === "heading" && block.level === 1 && blocks.length === 0) {
      title = plain(block.spans);
      continue;
    }

    blocks.push(block);
  }

  return { title, blocks };
}

function convertBlock(node: RootContent): Block | null {
  switch (node.type) {
    case "heading":
      return {
        type: "heading",
        level: (Math.min(node.depth, 4) as 1 | 2 | 3 | 4),
        spans: convertInline(node.children),
      };

    case "paragraph":
      return { type: "paragraph", spans: convertInline(node.children) };

    case "blockquote": {
      const spans = node.children.flatMap((child) =>
        child.type === "paragraph" ? convertInline(child.children) : [],
      );
      return { type: "quote", spans };
    }

    case "list":
      return {
        type: "list",
        ordered: Boolean(node.ordered),
        items: node.children.map((item) =>
          item.children.flatMap((child) =>
            child.type === "paragraph" ? convertInline(child.children) : [],
          ),
        ),
      };

    case "table": {
      const [headerRow, ...bodyRows] = node.children;
      const headers = headerRow?.children.map((cell) => plain(convertInline(cell.children))) ?? [];
      const rows = bodyRows.map((row) =>
        row.children.map((cell) => plain(convertInline(cell.children))),
      );
      return { type: "table", headers, rows };
    }

    case "code":
      return { type: "code", text: node.value, language: node.lang ?? undefined };

    case "thematicBreak":
      return { type: "divider" };

    default:
      return null;
  }
}

function convertInline(nodes: PhrasingContent[], marks: InlineMark[] = []): InlineSpan[] {
  return nodes.flatMap((node): InlineSpan[] => {
    switch (node.type) {
      case "text":
        return [{ text: node.value, marks }];
      case "strong":
        return convertInline(node.children, [...marks, "bold"]);
      case "emphasis":
        return convertInline(node.children, [...marks, "italic"]);
      case "delete":
        return convertInline(node.children, [...marks, "strike"]);
      case "inlineCode":
        return [{ text: node.value, marks: [...marks, "code"] }];
      case "link":
        return convertInline(node.children, marks).map((span) => ({
          ...span,
          href: node.url,
        }));
      case "break":
        return [{ text: "\n", marks }];
      default:
        return [];
    }
  });
}

function plain(spans: InlineSpan[]): string {
  return spans.map((s) => s.text).join("");
}

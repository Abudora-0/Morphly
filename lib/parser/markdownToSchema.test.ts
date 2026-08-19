import { describe, expect, it } from "vitest";
import { markdownToSchema } from "./markdownToSchema";
import { plainText } from "./schema";

describe("markdownToSchema", () => {
  it("promotes a leading H1 to the document title instead of a heading block", () => {
    const doc = markdownToSchema("# Title\n\nBody paragraph.");
    expect(doc.title).toBe("Title");
    expect(doc.blocks).toHaveLength(1);
    expect(doc.blocks[0].type).toBe("paragraph");
  });

  it("leaves the document title undefined when there is no leading H1", () => {
    const doc = markdownToSchema("Just a paragraph, no heading.");
    expect(doc.title).toBeUndefined();
    expect(doc.blocks).toHaveLength(1);
  });

  it("does not treat a later H1 as the title", () => {
    const doc = markdownToSchema("Intro paragraph.\n\n# Not a title\n");
    expect(doc.title).toBeUndefined();
    expect(doc.blocks.map((b) => b.type)).toEqual(["paragraph", "heading"]);
  });

  it("parses headings with their level", () => {
    const doc = markdownToSchema("## Section\n\n#### Deep");
    expect(doc.blocks).toEqual([
      expect.objectContaining({ type: "heading", level: 2 }),
      expect.objectContaining({ type: "heading", level: 4 }),
    ]);
  });

  it("parses inline marks: bold, italic, strike, code, links", () => {
    const doc = markdownToSchema("**bold** *italic* ~~strike~~ `code` [link](https://x.test)");
    const spans = (doc.blocks[0] as { type: "paragraph"; spans: import("./schema").InlineSpan[] }).spans;

    expect(spans.some((s) => s.text === "bold" && s.marks.includes("bold"))).toBe(true);
    expect(spans.some((s) => s.text === "italic" && s.marks.includes("italic"))).toBe(true);
    expect(spans.some((s) => s.text === "strike" && s.marks.includes("strike"))).toBe(true);
    expect(spans.some((s) => s.text === "code" && s.marks.includes("code"))).toBe(true);
    expect(spans.some((s) => s.text === "link" && s.href === "https://x.test")).toBe(true);
  });

  it("parses bullet and ordered lists", () => {
    const doc = markdownToSchema("- one\n- two\n\n1. first\n2. second");
    expect(doc.blocks[0]).toMatchObject({ type: "list", ordered: false });
    expect(doc.blocks[1]).toMatchObject({ type: "list", ordered: true });
    const bulletItems = (doc.blocks[0] as { type: "list"; items: import("./schema").InlineSpan[][] }).items;
    expect(bulletItems.map(plainText)).toEqual(["one", "two"]);
  });

  it("parses GFM tables into headers/rows", () => {
    const doc = markdownToSchema("| A | B |\n| --- | --- |\n| 1 | 2 |\n| 3 | 4 |");
    expect(doc.blocks[0]).toEqual({
      type: "table",
      headers: ["A", "B"],
      rows: [
        ["1", "2"],
        ["3", "4"],
      ],
    });
  });

  it("parses blockquotes, code blocks, and thematic breaks", () => {
    const doc = markdownToSchema("> quoted text\n\n```js\nconst x = 1;\n```\n\n---");
    expect(doc.blocks[0].type).toBe("quote");
    expect(doc.blocks[1]).toMatchObject({ type: "code", language: "js" });
    expect(doc.blocks[2]).toEqual({ type: "divider" });
  });

  it("parses a standalone image line into a dedicated image block", () => {
    const doc = markdownToSchema("![a cat](https://example.com/cat.png)");
    expect(doc.blocks).toEqual([{ type: "image", url: "https://example.com/cat.png", alt: "a cat" }]);
  });

  it("drops an image referenced inline alongside other text, keeping the paragraph", () => {
    const doc = markdownToSchema("See ![alt](https://example.com/x.png) for details.");
    expect(doc.blocks[0].type).toBe("paragraph");
    const spans = (doc.blocks[0] as { type: "paragraph"; spans: import("./schema").InlineSpan[] }).spans;
    expect(plainText(spans)).toBe("See  for details.");
  });

  it("handles empty input without throwing", () => {
    const doc = markdownToSchema("");
    expect(doc.title).toBeUndefined();
    expect(doc.blocks).toEqual([]);
  });
});

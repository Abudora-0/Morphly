import PptxGenJS from "pptxgenjs";
import type { Block, MorphlyDocument } from "@/lib/parser/schema";
import { plainText } from "@/lib/parser/schema";
import type { PptxOptions } from "@/lib/exportFormat";
import { DEFAULT_EXPORT_OPTIONS } from "@/lib/exportFormat";

// Layout constants anchored near the top of the slide, valid regardless of
// slide height — both supported layouts share the same 10in width.
const MARGIN_X = 0.5;
const CONTENT_W = 9;
const TITLE_Y = 0.35;
const TITLE_H = 0.7;
const RULE_Y = 1.12;
const CONTENT_Y = 1.3;
const BOTTOM_MARGIN = 0.4;
const GAP = 0.12;
const TITLE_SLIDE_BOX_H = 1.4;

const ACCENT = "C8410C"; // PowerPoint orange, used only as a title underline
const INK = "141414";
const INK_SOFT = "55534D";
const HEADER_FILL = "EDE9E2";
const CODE_FILL = "F3F3F1";

const SLIDE_LAYOUTS = {
  "16:9": { name: "LAYOUT_16x9", height: 5.625 },
  "4:3": { name: "LAYOUT_4x3", height: 7.5 },
} as const;

export async function generatePptx(
  doc: MorphlyDocument,
  options: PptxOptions = DEFAULT_EXPORT_OPTIONS.pptx,
): Promise<Buffer> {
  const layout = SLIDE_LAYOUTS[options.slideSize];
  const contentBottom = layout.height - BOTTOM_MARGIN;

  const pptx = new PptxGenJS();
  pptx.author = "Morphly";
  pptx.title = doc.title || "Morphly Export";
  pptx.layout = layout.name;

  const builder = new SlideBuilder(pptx, contentBottom);

  if (doc.title && options.titleSlide) {
    builder.addTitleSlide(doc.title, layout.height);
  }

  let lastHeading = doc.title ?? "";
  let tableCount = 0;
  let imageCount = 0;

  for (const block of doc.blocks) {
    if (block.type === "heading" && block.level <= 2) {
      lastHeading = plainText(block.spans);
      builder.startContentSlide();
      continue;
    }

    if (block.type === "table") {
      tableCount += 1;
      builder.addTableSlide(lastHeading || `Table ${tableCount}`, block.headers, block.rows);
      continue;
    }

    if (block.type === "image") {
      imageCount += 1;
      builder.addImageSlide(lastHeading || `Image ${imageCount}`, block);
      continue;
    }

    if (block.type === "divider") {
      builder.breakSlide();
      continue;
    }

    builder.addBlock(block, lastHeading);
  }

  const result = await pptx.write({ outputType: "nodebuffer" });
  return result as Buffer;
}

class SlideBuilder {
  private pptx: PptxGenJS;
  private contentBottom: number;
  private slide: PptxGenJS.Slide | null = null;
  private y: number;
  private pendingBreak = false;

  constructor(pptx: PptxGenJS, contentBottom: number) {
    this.pptx = pptx;
    this.contentBottom = contentBottom;
    this.y = CONTENT_Y;
  }

  addTitleSlide(title: string, slideHeight: number) {
    const slide = this.pptx.addSlide();
    slide.addText(title, {
      x: MARGIN_X,
      y: slideHeight / 2 - TITLE_SLIDE_BOX_H / 2,
      w: CONTENT_W,
      h: TITLE_SLIDE_BOX_H,
      align: "center",
      valign: "middle",
      fontSize: 36,
      bold: true,
      color: INK,
    });
  }

  /**
   * A new heading always starts a fresh slide, but the slide itself is
   * created lazily by ensureRoom(): if the heading turns out to have no
   * directly-flowed content (e.g. it's immediately followed by a table,
   * which gets its own dedicated slide), no empty title-only slide is left behind.
   */
  startContentSlide() {
    this.slide = null;
    this.pendingBreak = false;
    this.y = CONTENT_Y;
  }

  addTableSlide(title: string, headers: string[], rows: string[][]) {
    const slide = this.pptx.addSlide();
    slide.addText(title, {
      x: MARGIN_X,
      y: TITLE_Y,
      w: CONTENT_W,
      h: TITLE_H,
      fontSize: 26,
      bold: true,
      color: INK,
    });
    slide.addShape(this.pptx.ShapeType.rect, {
      x: MARGIN_X,
      y: RULE_Y,
      w: CONTENT_W,
      h: 0.03,
      fill: { color: ACCENT },
      line: { color: ACCENT },
    });

    const headerRow: PptxGenJS.TableRow = headers.map((text) => ({
      text,
      options: { bold: true, fill: { color: HEADER_FILL }, color: INK, fontSize: 12 },
    }));
    const bodyRows: PptxGenJS.TableRow[] = rows.map((row) =>
      row.map((text) => ({ text, options: { fontSize: 11, color: INK } })),
    );

    slide.addTable([headerRow, ...bodyRows], {
      x: MARGIN_X,
      y: CONTENT_Y,
      w: CONTENT_W,
      h: this.contentBottom - CONTENT_Y,
      autoPage: true,
      autoPageCharWeight: 0.2,
      border: { type: "solid", color: "D8D5CC", pt: 0.75 },
    });

    // The next non-heading block should not append to a table slide.
    this.slide = null;
    this.pendingBreak = false;
  }

  addImageSlide(title: string, block: Extract<Block, { type: "image" }>) {
    const slide = this.pptx.addSlide();
    slide.addText(title, {
      x: MARGIN_X,
      y: TITLE_Y,
      w: CONTENT_W,
      h: TITLE_H,
      fontSize: 26,
      bold: true,
      color: INK,
    });
    slide.addShape(this.pptx.ShapeType.rect, {
      x: MARGIN_X,
      y: RULE_Y,
      w: CONTENT_W,
      h: 0.03,
      fill: { color: ACCENT },
      line: { color: ACCENT },
    });

    const availW = CONTENT_W;
    const availH = this.contentBottom - CONTENT_Y;

    if (!block.resolved) {
      slide.addText(`[Image unavailable: ${block.alt || block.url}]`, {
        x: MARGIN_X,
        y: CONTENT_Y,
        w: availW,
        h: availH,
        align: "center",
        valign: "middle",
        italic: true,
        color: INK_SOFT,
        fontSize: 14,
      });
    } else {
      const { data, format, width, height } = block.resolved;
      const scale = Math.min(1, availW / width, availH / height);
      const w = width * scale;
      const h = height * scale;
      const mime = format === "jpg" ? "jpeg" : format;

      slide.addImage({
        data: `data:image/${mime};base64,${data.toString("base64")}`,
        x: MARGIN_X + (availW - w) / 2,
        y: CONTENT_Y + (availH - h) / 2,
        w,
        h,
        altText: block.alt || undefined,
      });
    }

    // The next non-heading block should not append to an image slide.
    this.slide = null;
    this.pendingBreak = false;
  }

  breakSlide() {
    this.pendingBreak = true;
  }

  addBlock(block: Block, headingContext: string) {
    if (block.type === "heading") {
      // level 3/4: rendered inline as a sub-heading rather than a new slide
      this.ensureRoom(0.4, headingContext);
      this.slide!.addText(plainText(block.spans), {
        x: MARGIN_X,
        y: this.y,
        w: CONTENT_W,
        h: 0.35,
        fontSize: 16,
        bold: true,
        color: INK,
      });
      this.y += 0.4 + GAP;
      return;
    }

    if (block.type === "paragraph") {
      const text = plainText(block.spans);
      const height = estimateTextHeight(text, 14);
      this.ensureRoom(height, headingContext);
      this.slide!.addText(text, {
        x: MARGIN_X,
        y: this.y,
        w: CONTENT_W,
        h: height,
        fontSize: 14,
        color: INK,
        valign: "top",
      });
      this.y += height + GAP;
      return;
    }

    if (block.type === "list") {
      // Rendered item-by-item (rather than as one atomic text box) so a long
      // list flows across "(cont.)" slides instead of overflowing a single one.
      const ITEM_H = 0.3;
      let index = 0;
      while (index < block.items.length) {
        this.ensureRoom(ITEM_H, headingContext);
        const roomLeft = Math.max(ITEM_H, this.contentBottom - this.y);
        const chunkSize = Math.max(1, Math.min(block.items.length - index, Math.floor(roomLeft / ITEM_H)));
        const chunk = block.items.slice(index, index + chunkSize);

        const texts: PptxGenJS.TextProps[] = chunk.map((item, i) => ({
          text: plainText(item),
          options: {
            bullet: block.ordered ? { type: "number", numberStartAt: index + i + 1 } : true,
            breakLine: i < chunk.length - 1,
          },
        }));
        const chunkHeight = ITEM_H * chunk.length;

        this.slide!.addText(texts, {
          x: MARGIN_X,
          y: this.y,
          w: CONTENT_W,
          h: chunkHeight,
          fontSize: 14,
          color: INK,
          valign: "top",
        });
        this.y += chunkHeight + GAP;
        index += chunkSize;
      }
      return;
    }

    if (block.type === "quote") {
      const text = plainText(block.spans);
      const height = estimateTextHeight(text, 14);
      this.ensureRoom(height, headingContext);
      this.slide!.addText(text, {
        x: MARGIN_X + 0.2,
        y: this.y,
        w: CONTENT_W - 0.2,
        h: height,
        fontSize: 14,
        italic: true,
        color: INK_SOFT,
        valign: "top",
      });
      this.y += height + GAP;
      return;
    }

    if (block.type === "code") {
      const lines = block.text.split("\n");
      const height = Math.max(0.3, 0.22 * lines.length);
      this.ensureRoom(height, headingContext);
      this.slide!.addText(block.text, {
        x: MARGIN_X,
        y: this.y,
        w: CONTENT_W,
        h: height,
        fontSize: 11,
        fontFace: "Consolas",
        color: INK,
        fill: { color: CODE_FILL },
        valign: "top",
      });
      this.y += height + GAP;
    }
  }

  private renderTitleBar(title: string) {
    this.slide!.addText(title, {
      x: MARGIN_X,
      y: TITLE_Y,
      w: CONTENT_W,
      h: TITLE_H,
      fontSize: 26,
      bold: true,
      color: INK,
    });
    this.slide!.addShape(this.pptx.ShapeType.rect, {
      x: MARGIN_X,
      y: RULE_Y,
      w: CONTENT_W,
      h: 0.03,
      fill: { color: ACCENT },
      line: { color: ACCENT },
    });
  }

  private ensureRoom(height: number, headingContext: string) {
    const isOverflow = Boolean(this.slide) && !this.pendingBreak && this.y + height > this.contentBottom;
    const needsNewSlide = !this.slide || this.pendingBreak || isOverflow;
    if (!needsNewSlide) return;

    const title = isOverflow && headingContext ? `${headingContext} (cont.)` : headingContext;

    this.slide = this.pptx.addSlide();
    this.pendingBreak = false;
    this.y = CONTENT_Y;

    if (title) this.renderTitleBar(title);
  }
}

function estimateTextHeight(text: string, fontSize: number): number {
  const charsPerLine = 95;
  const lines = Math.max(1, Math.ceil(text.length / charsPerLine));
  return Math.max(0.3, lines * (fontSize / 72) * 1.7);
}

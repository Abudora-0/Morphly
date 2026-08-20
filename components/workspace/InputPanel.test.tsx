import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InputPanel } from "@/components/workspace/InputPanel";
import { MAX_TEXT_LENGTH } from "@/lib/limits";

type Overrides = Partial<React.ComponentProps<typeof InputPanel>>;

function renderPanel(overrides: Overrides = {}) {
  const props = {
    value: "",
    onChange: vi.fn(),
    smartFormatEnabled: true,
    onSmartFormat: vi.fn(),
    isSmartFormatting: false,
    smartFormatError: null,
    onDismissSmartFormatError: vi.fn(),
    canUndoSmartFormat: false,
    onUndoSmartFormat: vi.fn(),
    ...overrides,
  } satisfies React.ComponentProps<typeof InputPanel>;

  return { ...render(<InputPanel {...props} />), props };
}

function capacityBar(): HTMLElement {
  const el = document.querySelector<HTMLElement>("div[aria-hidden] > div");
  if (!el) throw new Error("capacity bar not found");
  return el;
}

function dropFile(file: File) {
  const panel = screen.getByRole("textbox").parentElement;
  if (!panel) throw new Error("panel not found");
  fireEvent.drop(panel, { dataTransfer: { types: ["Files"], files: [file] } });
}

describe("InputPanel", () => {
  describe("smart format visibility", () => {
    it("offers Smart Format when it is enabled", () => {
      renderPanel({ value: "hello", smartFormatEnabled: true });
      expect(screen.queryByRole("button", { name: /smart format/i })).not.toBeNull();
    });

    it("hides Smart Format entirely when no Ollama is reachable", () => {
      renderPanel({ value: "hello", smartFormatEnabled: false });
      expect(screen.queryByRole("button", { name: /smart format/i })).toBeNull();
      expect(screen.queryByText(/local ollama/i)).toBeNull();
    });
  });

  describe("capacity meter", () => {
    it("stays empty with no input", () => {
      renderPanel({ value: "" });
      expect(capacityBar().style.transform).toBe("scaleX(0)");
    });

    it("tracks how much of the cap is used", () => {
      renderPanel({ value: "x".repeat(MAX_TEXT_LENGTH / 2) });
      expect(capacityBar().style.transform).toBe("scaleX(0.5)");
    });

    it("caps at full rather than overflowing once past the limit", () => {
      renderPanel({ value: "x".repeat(MAX_TEXT_LENGTH + 500) });
      expect(capacityBar().style.transform).toBe("scaleX(1)");
    });

    it("says so, and blocks Smart Format, when the text is too long", () => {
      renderPanel({ value: "x".repeat(MAX_TEXT_LENGTH + 1) });

      expect(screen.getByText(/too long/i)).not.toBeNull();
      expect(screen.getByRole("button", { name: /smart format/i })).toHaveProperty("disabled", true);
    });
  });

  describe("clear", () => {
    it("is disabled when there is nothing to clear", () => {
      renderPanel({ value: "" });
      expect(screen.getByRole("button", { name: "Clear" })).toHaveProperty("disabled", true);
    });

    it("empties the text", async () => {
      const { props } = renderPanel({ value: "some text" });
      await userEvent.click(screen.getByRole("button", { name: "Clear" }));
      expect(props.onChange).toHaveBeenCalledExactlyOnceWith("");
    });
  });

  describe("file drop", () => {
    it("loads the contents of a dropped markdown file", async () => {
      const { props } = renderPanel();
      dropFile(new File(["# Dropped\n\nBody."], "notes.md", { type: "text/markdown" }));

      await vi.waitFor(() => {
        expect(props.onChange).toHaveBeenCalledExactlyOnceWith("# Dropped\n\nBody.");
      });
    });

    it("refuses a file that is not text, without discarding what is already typed", async () => {
      const { props } = renderPanel({ value: "existing work" });
      dropFile(new File(["%PDF-1.4"], "report.pdf", { type: "application/pdf" }));

      expect(await screen.findByText(/report\.pdf is not a \.md or \.txt file/i)).not.toBeNull();
      expect(props.onChange).not.toHaveBeenCalled();
    });

    it("lets the rejection message be dismissed", async () => {
      renderPanel();
      dropFile(new File(["%PDF"], "report.pdf", { type: "application/pdf" }));
      await screen.findByText(/is not a \.md or \.txt file/i);

      await userEvent.click(screen.getByRole("button", { name: /dismiss/i }));

      expect(screen.queryByText(/is not a \.md or \.txt file/i)).toBeNull();
    });

    it("shows the drop target while a file is dragged over", () => {
      renderPanel();
      const panel = screen.getByRole("textbox").parentElement!;

      fireEvent.dragEnter(panel, { dataTransfer: { types: ["Files"], files: [] } });
      expect(screen.getByText(/drop to load/i)).not.toBeNull();

      fireEvent.dragLeave(panel, { dataTransfer: { types: ["Files"], files: [] } });
      expect(screen.queryByText(/drop to load/i)).toBeNull();
    });

    it("ignores a dragged text selection, which is not a file", () => {
      renderPanel();
      const panel = screen.getByRole("textbox").parentElement!;

      fireEvent.dragEnter(panel, { dataTransfer: { types: ["text/plain"], files: [] } });

      expect(screen.queryByText(/drop to load/i)).toBeNull();
    });
  });

  describe("smart format errors", () => {
    it("surfaces the failure and can dismiss it", async () => {
      const { props } = renderPanel({ smartFormatError: "Can't reach Ollama." });

      expect(screen.getByText("Can't reach Ollama.")).not.toBeNull();
      await userEvent.click(screen.getByRole("button", { name: /dismiss/i }));

      expect(props.onDismissSmartFormatError).toHaveBeenCalledOnce();
    });
  });
});

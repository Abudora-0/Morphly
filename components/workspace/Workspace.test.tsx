import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Workspace } from "@/components/workspace/Workspace";
import { EXPORT_PREFERENCES_KEY } from "@/lib/exportPreferences";

const SAMPLE = "# Q3 Summary\n\nRevenue grew.\n\n## Highlights\n- One\n- Two";

let fetchMock: ReturnType<typeof vi.fn>;
let anchorClicks: { download: string }[];

function okResponse(filename = "q3-summary.docx") {
  return {
    ok: true,
    status: 200,
    blob: async () => new Blob(["file-bytes"]),
    headers: { get: () => `attachment; filename="${filename}"` },
  };
}

function errorResponse(error: string, status = 500) {
  return { ok: false, status, json: async () => ({ error }) };
}

beforeEach(() => {
  anchorClicks = [];
  fetchMock = vi.fn(async () => okResponse());
  vi.stubGlobal("fetch", fetchMock);

  URL.createObjectURL = vi.fn(() => "blob:mock");
  URL.revokeObjectURL = vi.fn();

  // jsdom would otherwise try to navigate to the blob URL and warn.
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
    anchorClicks.push({ download: this.download });
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function renderWorkspace(smartFormatEnabled = true) {
  return render(<Workspace smartFormatEnabled={smartFormatEnabled} />);
}

function exportButton() {
  return screen.getByRole("button", { name: /export \.|downloaded|converting/i });
}

async function type(user: ReturnType<typeof userEvent.setup>, text: string) {
  await user.click(screen.getByRole("textbox"));
  await user.paste(text);
}

describe("Workspace", () => {
  describe("parsing and export gating", () => {
    it("refuses to export nothing", () => {
      renderWorkspace();
      expect(exportButton()).toHaveProperty("disabled", true);
    });

    it("summarises the structure it found and enables export", async () => {
      const user = userEvent.setup();
      renderWorkspace();
      await type(user, SAMPLE);

      expect(screen.getByText("3 blocks")).not.toBeNull();
      expect(screen.getByText(/H2 Highlights/)).not.toBeNull();
      expect(screen.getByText(/bullet list · 2 items/)).not.toBeNull();
      expect(exportButton()).toHaveProperty("disabled", false);
    });
  });

  describe("format selection", () => {
    it("switches the export target and shows that format's own options", async () => {
      const user = userEvent.setup();
      renderWorkspace();

      expect(screen.getByText("Page Size")).not.toBeNull();

      await user.click(screen.getByRole("button", { name: /PowerPoint/ }));

      expect(exportButton().textContent).toContain("Export .pptx");
      expect(screen.getByText("Slide Size")).not.toBeNull();
      expect(screen.queryByText("Page Size")).toBeNull();
    });

    it("sends the selected format and its options to the API", async () => {
      const user = userEvent.setup();
      renderWorkspace();
      await type(user, SAMPLE);

      await user.click(screen.getByRole("button", { name: /Excel/ }));
      await user.click(exportButton());

      await vi.waitFor(() => expect(fetchMock).toHaveBeenCalled());
      const [url, init] = fetchMock.mock.calls.at(-1)!;
      expect(url).toBe("/api/convert");
      expect(JSON.parse(init.body)).toMatchObject({
        format: "xlsx",
        options: { includeOverview: true, freezeHeader: true },
      });
    });
  });

  describe("exporting", () => {
    it("downloads the file the server names", async () => {
      const user = userEvent.setup();
      renderWorkspace();
      await type(user, SAMPLE);

      await user.click(exportButton());

      await vi.waitFor(() => expect(anchorClicks).toEqual([{ download: "q3-summary.docx" }]));
    });

    it("confirms on the button, since a silent download gives no other feedback", async () => {
      const user = userEvent.setup();
      renderWorkspace();
      await type(user, SAMPLE);

      await user.click(exportButton());

      expect(await screen.findByRole("button", { name: /downloaded/i })).not.toBeNull();
    });

    it("exports on Ctrl+Enter from anywhere in the workspace", async () => {
      const user = userEvent.setup();
      renderWorkspace();
      await type(user, SAMPLE);

      await user.keyboard("{Control>}{Enter}{/Control}");

      await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
    });

    it("ignores Ctrl+Enter when there is nothing to export", async () => {
      const user = userEvent.setup();
      renderWorkspace();

      await user.keyboard("{Control>}{Enter}{/Control}");

      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("surfaces a failure from the server and lets it be dismissed", async () => {
      fetchMock.mockResolvedValueOnce(errorResponse("Conversion blew up."));
      const user = userEvent.setup();
      renderWorkspace();
      await type(user, SAMPLE);

      await user.click(exportButton());

      expect(await screen.findByText("Conversion blew up.")).not.toBeNull();
      await user.click(screen.getByRole("button", { name: /dismiss error/i }));
      expect(screen.queryByText("Conversion blew up.")).toBeNull();
    });

    it("does not leave the button stuck after a failure", async () => {
      fetchMock.mockResolvedValueOnce(errorResponse("nope"));
      const user = userEvent.setup();
      renderWorkspace();
      await type(user, SAMPLE);

      await user.click(exportButton());

      await vi.waitFor(() => expect(exportButton()).toHaveProperty("disabled", false));
    });
  });

  describe("smart format availability", () => {
    it("offers it when an Ollama instance is reachable", () => {
      renderWorkspace(true);
      expect(screen.queryByRole("button", { name: /smart format/i })).not.toBeNull();
    });

    it("hides it otherwise, rather than offering a button that always fails", () => {
      renderWorkspace(false);
      expect(screen.queryByRole("button", { name: /smart format/i })).toBeNull();
    });
  });

  describe("remembering preferences", () => {
    it("stores the chosen format and options", async () => {
      const user = userEvent.setup();
      renderWorkspace();

      await user.click(screen.getByRole("button", { name: /PowerPoint/ }));
      await user.click(within(screen.getByText("Slide Size").parentElement!).getByRole("button", { name: "4:3" }));

      await vi.waitFor(() => {
        const stored = JSON.parse(window.localStorage.getItem(EXPORT_PREFERENCES_KEY)!);
        expect(stored).toMatchObject({ format: "pptx", options: { pptx: { slideSize: "4:3" } } });
      });
    });

    it("restores them on the next visit", async () => {
      window.localStorage.setItem(
        EXPORT_PREFERENCES_KEY,
        JSON.stringify({
          format: "pptx",
          options: {
            docx: { pageSize: "a4", titlePage: true },
            xlsx: { includeOverview: false, freezeHeader: false },
            pptx: { slideSize: "4:3", titleSlide: false },
          },
        }),
      );

      renderWorkspace();

      expect(await screen.findByRole("button", { name: /export \.pptx/i })).not.toBeNull();
      const slideSize = within(screen.getByText("Slide Size").parentElement!);
      expect(slideSize.getByRole("button", { name: "4:3" }).getAttribute("aria-pressed")).toBe("true");
    });

    it("falls back to defaults when the stored record is corrupt", async () => {
      window.localStorage.setItem(EXPORT_PREFERENCES_KEY, "{not json");

      renderWorkspace();

      expect(await screen.findByRole("button", { name: /export \.docx/i })).not.toBeNull();
    });

    it("keeps the valid parts of a partially stale record", async () => {
      // An older build might have written only some of these fields.
      window.localStorage.setItem(
        EXPORT_PREFERENCES_KEY,
        JSON.stringify({ format: "nonsense", options: { docx: { pageSize: "a4" } } }),
      );

      renderWorkspace();

      // Bad format falls back to the default, valid page size survives.
      expect(await screen.findByRole("button", { name: /export \.docx/i })).not.toBeNull();
      const pageSize = within(screen.getByText("Page Size").parentElement!);
      expect(pageSize.getByRole("button", { name: "A4" }).getAttribute("aria-pressed")).toBe("true");
    });

    it("never writes defaults over a stored record, not even momentarily", async () => {
      const stored = JSON.stringify({
        format: "xlsx",
        options: {
          docx: { pageSize: "a4", titlePage: true },
          xlsx: { includeOverview: false, freezeHeader: false },
          pptx: { slideSize: "4:3", titleSlide: false },
        },
      });
      window.localStorage.setItem(EXPORT_PREFERENCES_KEY, stored);

      // Asserting on the final value alone would not catch this: the mount
      // pass can write defaults and a later render repair them, leaving the
      // end state correct but the record briefly clobbered. Watch every write.
      const writes: string[] = [];
      const setItem = vi
        .spyOn(Storage.prototype, "setItem")
        .mockImplementation(function (this: Storage, key: string, value: string) {
          if (key === EXPORT_PREFERENCES_KEY) writes.push(value);
        });

      renderWorkspace();
      await screen.findByRole("button", { name: /export \.xlsx/i });
      setItem.mockRestore();

      expect(writes.every((w) => JSON.parse(w).format === "xlsx")).toBe(true);
    });
  });
});

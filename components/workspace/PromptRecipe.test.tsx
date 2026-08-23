import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PromptRecipe } from "@/components/workspace/PromptRecipe";
import { PROMPT_RECIPES } from "@/lib/promptRecipes";

/**
 * Must be called *after* userEvent.setup(), which installs its own
 * navigator.clipboard stub and would otherwise replace this one.
 */
function stubClipboard(writeText: () => Promise<void>) {
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText: vi.fn(writeText) },
    configurable: true,
  });
  return navigator.clipboard.writeText as ReturnType<typeof vi.fn>;
}

async function open(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: /prompt recipe/i }));
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("PromptRecipe", () => {
  it("stays collapsed until asked for, so it does not crowd the panel", () => {
    render(<PromptRecipe format="docx" />);

    expect(screen.getByRole("button", { name: /prompt recipe/i }).getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByRole("button", { name: /copy prompt/i })).toBeNull();
  });

  it("shows the prompt for the selected format", async () => {
    const user = userEvent.setup();
    render(<PromptRecipe format="xlsx" />);
    await open(user);

    expect(screen.getByText(PROMPT_RECIPES.xlsx.summary)).not.toBeNull();
    expect(screen.getByText(/becomes the sheet name/)).not.toBeNull();
  });

  it("follows the format when it changes, rather than showing stale advice", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<PromptRecipe format="docx" />);
    await open(user);
    expect(screen.getByText(PROMPT_RECIPES.docx.summary)).not.toBeNull();

    rerender(<PromptRecipe format="pptx" />);

    expect(screen.getByText(PROMPT_RECIPES.pptx.summary)).not.toBeNull();
    expect(screen.queryByText(PROMPT_RECIPES.docx.summary)).toBeNull();
  });

  it("copies the whole prompt and confirms it", async () => {
    const user = userEvent.setup();
    const writeText = stubClipboard(async () => {});
    render(<PromptRecipe format="docx" />);
    await open(user);

    await user.click(screen.getByRole("button", { name: /copy prompt/i }));

    expect(writeText).toHaveBeenCalledExactlyOnceWith(PROMPT_RECIPES.docx.prompt);
    expect(await screen.findByRole("button", { name: /copied/i })).not.toBeNull();
  });

  it("selects the prompt when the clipboard is refused, so the button still does something", async () => {
    const user = userEvent.setup();
    stubClipboard(async () => {
      throw new Error("NotAllowedError");
    });
    render(<PromptRecipe format="docx" />);
    await open(user);

    await user.click(screen.getByRole("button", { name: /copy prompt/i }));

    // Not reported as copied, because it was not.
    expect(screen.queryByRole("button", { name: /copied/i })).toBeNull();
    expect(window.getSelection()?.toString()).toBe(PROMPT_RECIPES.docx.prompt);
  });
});

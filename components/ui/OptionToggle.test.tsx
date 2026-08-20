import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OptionToggle } from "@/components/ui/OptionToggle";

const OPTIONS: [{ value: "letter"; label: string }, { value: "a4"; label: string }] = [
  { value: "letter", label: "Letter" },
  { value: "a4", label: "A4" },
];

function indicator(): HTMLElement {
  const el = document.querySelector<HTMLElement>("span[aria-hidden]");
  if (!el) throw new Error("indicator not found");
  return el;
}

describe("OptionToggle", () => {
  it("marks only the active option as pressed", () => {
    render(<OptionToggle label="Page Size" options={OPTIONS} value="letter" onChange={() => {}} />);

    expect(screen.getByRole("button", { name: "Letter" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: "A4" }).getAttribute("aria-pressed")).toBe("false");
  });

  it("reports the value of whichever option is clicked", async () => {
    const onChange = vi.fn();
    render(<OptionToggle label="Page Size" options={OPTIONS} value="letter" onChange={onChange} />);

    await userEvent.click(screen.getByRole("button", { name: "A4" }));

    expect(onChange).toHaveBeenCalledExactlyOnceWith("a4");
  });

  it("parks the indicator over the active option", () => {
    const { rerender } = render(
      <OptionToggle label="Page Size" options={OPTIONS} value="letter" onChange={() => {}} />,
    );
    expect(indicator().style.transform).toBe("translateX(0%)");

    rerender(<OptionToggle label="Page Size" options={OPTIONS} value="a4" onChange={() => {}} />);
    expect(indicator().style.transform).toBe("translateX(100%)");
  });

  it("keeps the option buttons in equal-width columns, which the indicator's fixed 50% assumes", () => {
    render(<OptionToggle label="Page Size" options={OPTIONS} value="letter" onChange={() => {}} />);

    // Labels differ in length ("Letter" vs "A4"), so without an equal-width
    // grid a 50% indicator would land off-centre on one of them.
    expect(indicator().parentElement?.className).toContain("grid-cols-2");
  });
});

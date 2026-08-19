import { OptionToggle } from "@/components/ui/OptionToggle";
import type { ExportFormat, ExportOptions } from "@/lib/exportFormat";

type FormatOptionsProps = {
  format: ExportFormat;
  options: ExportOptions;
  onChange: <F extends ExportFormat>(format: F, partial: Partial<ExportOptions[F]>) => void;
};

export function FormatOptions({ format, options, onChange }: FormatOptionsProps) {
  if (format === "docx") {
    const o = options.docx;
    return (
      <>
        <OptionToggle<"letter" | "a4">
          label="Page Size"
          value={o.pageSize}
          onChange={(pageSize) => onChange("docx", { pageSize })}
          options={[
            { value: "letter", label: "Letter" },
            { value: "a4", label: "A4" },
          ]}
        />
        <OptionToggle<boolean>
          label="Title Page"
          value={o.titlePage}
          onChange={(titlePage) => onChange("docx", { titlePage })}
          options={[
            { value: false, label: "Inline" },
            { value: true, label: "Separate" },
          ]}
        />
      </>
    );
  }

  if (format === "xlsx") {
    const o = options.xlsx;
    return (
      <>
        <OptionToggle<boolean>
          label="Overview Sheet"
          value={o.includeOverview}
          onChange={(includeOverview) => onChange("xlsx", { includeOverview })}
          options={[
            { value: true, label: "On" },
            { value: false, label: "Off" },
          ]}
        />
        <OptionToggle<boolean>
          label="Freeze Header"
          value={o.freezeHeader}
          onChange={(freezeHeader) => onChange("xlsx", { freezeHeader })}
          options={[
            { value: true, label: "On" },
            { value: false, label: "Off" },
          ]}
        />
      </>
    );
  }

  const o = options.pptx;
  return (
    <>
      <OptionToggle<"16:9" | "4:3">
        label="Slide Size"
        value={o.slideSize}
        onChange={(slideSize) => onChange("pptx", { slideSize })}
        options={[
          { value: "16:9", label: "16:9" },
          { value: "4:3", label: "4:3" },
        ]}
      />
      <OptionToggle<boolean>
        label="Title Slide"
        value={o.titleSlide}
        onChange={(titleSlide) => onChange("pptx", { titleSlide })}
        options={[
          { value: true, label: "On" },
          { value: false, label: "Off" },
        ]}
      />
    </>
  );
}

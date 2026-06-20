import { PageHeader } from "@/components/page-header";
import { SectionPlaceholder } from "@/components/section-placeholder";

export default function ExportsPage() {
  return (
    <>
      <PageHeader
        title="Exports"
        description="Presentation-ready data exports."
      />
      <SectionPlaceholder note="Custom exports (Phase 6) — pick a dataset, filters, and columns, then export to CSV, XLSX, or a branded PDF report." />
    </>
  );
}

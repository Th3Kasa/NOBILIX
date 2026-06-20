import { PageHeader } from "@/components/page-header";
import { SectionPlaceholder } from "@/components/section-placeholder";

export default function AnalyticsPage() {
  return (
    <>
      <PageHeader
        title="Analytics"
        description="Player distributions and engagement trends."
      />
      <SectionPlaceholder note="Analytics dashboards (Phase 5) — country, level, and character distributions, growth, and engagement proxies." />
    </>
  );
}

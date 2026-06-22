import { PageHeader } from "@/components/page-header";
import { SectionPlaceholder } from "@/components/section-placeholder";

export default function PurchasesPage() {
  return (
    <>
      <PageHeader
        title="Purchases"
        description="What's selling — top and bottom performers."
      />
      <SectionPlaceholder note="Purchase analytics (Phase 5) — most/least bought products, revenue, conversion, ARPU, and repeat buyers. Data source confirmed during Phase 0 discovery (Firestore / GA4 / store consoles)." />
    </>
  );
}

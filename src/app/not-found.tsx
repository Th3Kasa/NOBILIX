import { NobilixFooter } from "@/components/public/nobilix-footer";
import { NobilixHeader } from "@/components/public/nobilix-header";
import { NotFoundContent } from "@/components/public/not-found-content";

export default function RootNotFound() {
  return (
    <div className="public-shell">
      <NobilixHeader />
      <main id="main-content" tabIndex={-1}>
        <NotFoundContent />
      </main>
      <NobilixFooter />
    </div>
  );
}

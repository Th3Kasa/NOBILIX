import { NobilixFooter } from "@/components/public/nobilix-footer";
import { NobilixHeader } from "@/components/public/nobilix-header";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="public-shell">
      <NobilixHeader />
      <main id="main-content" tabIndex={-1}>
        {children}
      </main>
      <NobilixFooter />
    </div>
  );
}

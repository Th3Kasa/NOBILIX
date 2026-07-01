import { MobileNavigation, type MobileNavigationItem } from "@/components/nav/mobile-navigation";

export function ConsoleMobileNav({
  scopeLabel,
  items,
}: {
  scopeLabel: string;
  items: readonly MobileNavigationItem[];
}) {
  return (
    <div className="flex min-h-11 items-center gap-3 md:hidden">
      <MobileNavigation items={items} label={`${scopeLabel} navigation`} />
      <span className="font-mono text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Nobilix / {scopeLabel}
      </span>
    </div>
  );
}

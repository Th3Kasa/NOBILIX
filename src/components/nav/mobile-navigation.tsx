"use client";

import * as React from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MobileNavigationItem {
  href: string;
  label: string;
  description?: string;
  active?: boolean;
}

export interface MobileNavigationProps {
  items: readonly MobileNavigationItem[];
  label?: string;
  className?: string;
  triggerClassName?: string;
}

const focusableSelector =
  'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function MobileNavigation({
  items,
  label = "Primary navigation",
  className,
  triggerClassName,
}: MobileNavigationProps) {
  const [open, setOpen] = React.useState(false);
  const shouldReduceMotion = useReducedMotion();
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const titleId = React.useId();

  React.useEffect(() => {
    if (!open) return;

    const panel = panelRef.current;
    const triggerElement = triggerRef.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    panel?.querySelector<HTMLElement>(focusableSelector)?.focus();
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        return;
      }

      if (event.key !== "Tab" || !panel) return;
      const focusable = Array.from(
        panel.querySelectorAll<HTMLElement>(focusableSelector),
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
      (previouslyFocused ?? triggerElement)?.focus();
    };
  }, [open]);

  return (
    <div className={cn("md:hidden", className)}>
      <button
        ref={triggerRef}
        type="button"
        aria-label="Open navigation"
        aria-expanded={open}
        aria-controls={titleId}
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex size-11 items-center justify-center rounded-md border border-border text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:translate-y-px",
          triggerClassName,
        )}
      >
        <Menu className="size-5" aria-hidden="true" />
      </button>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-[var(--z-navigation)]">
            <motion.button
              type="button"
              aria-label="Close navigation"
              className="absolute inset-0 size-full bg-black/70"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              ref={panelRef}
              id={titleId}
              role="dialog"
              aria-modal="true"
              aria-labelledby={`${titleId}-title`}
              className="absolute inset-y-0 right-0 flex w-[min(88vw,24rem)] flex-col border-l border-border bg-background p-5 shadow-2xl"
              initial={{
                opacity: 0,
                x: shouldReduceMotion ? 0 : "100%",
              }}
              animate={{ opacity: 1, x: 0 }}
              exit={{
                opacity: 0,
                x: shouldReduceMotion ? 0 : "100%",
              }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
            >
              <div className="flex min-h-11 items-center justify-between gap-4">
                <h2 id={`${titleId}-title`} className="text-base font-semibold">
                  Navigation
                </h2>
                <button
                  type="button"
                  aria-label="Close navigation"
                  onClick={() => setOpen(false)}
                  className="inline-flex size-11 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <X className="size-5" aria-hidden="true" />
                </button>
              </div>

              <nav aria-label={label} className="mt-6 flex flex-col gap-2">
                {items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={item.active ? "page" : undefined}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex min-h-11 flex-col justify-center rounded-md px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      item.active
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground hover:bg-accent",
                    )}
                  >
                    <span className="font-medium">{item.label}</span>
                    {item.description && (
                      <span className="text-xs text-muted-foreground">
                        {item.description}
                      </span>
                    )}
                  </Link>
                ))}
              </nav>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

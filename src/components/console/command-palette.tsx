"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, LayoutGrid } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { MODULE_META } from "@/components/nav/project-sidebar";
import { getProject } from "@/config/projects";
import { cn } from "@/lib/utils";

/** Dispatched by the topbar's ⌘K button; the palette listens for it so the
 *  two can stay decoupled (no shared parent state needed). */
const OPEN_EVENT = "console:open-command-palette";

export function openCommandPalette() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(OPEN_EVENT));
  }
}

interface Command {
  id: string;
  label: string;
  group: "Navigate" | "Actions";
  href: string;
  /** Server route sets Content-Disposition: attachment — a plain navigation
   *  triggers the download without leaving the page. */
  download?: boolean;
}

function buildCommands(): Command[] {
  const project = getProject("trapman");
  const navigate: Command[] = [
    { id: "nav-projects", label: "All projects", group: "Navigate", href: "/console" },
    ...project.consoleModules.map((mod) => {
      const meta = MODULE_META[mod];
      const href = mod === "overview" ? "/console/trapman" : `/console/trapman/${mod}`;
      return {
        id: `nav-${mod}`,
        label: meta?.label ?? mod,
        group: "Navigate" as const,
        href,
      };
    }),
  ];

  // Real, already-wired shortcuts — not invented destinations.
  const actions: Command[] = [
    {
      id: "action-compose",
      label: "Compose push notification",
      group: "Actions",
      href: "/console/trapman/messaging",
    },
    {
      id: "action-export-users",
      label: "Export players (CSV)",
      group: "Actions",
      href: "/api/console-exports/users",
      download: true,
    },
    {
      id: "action-export-leaderboard",
      label: "Export leaderboard (CSV)",
      group: "Actions",
      href: "/api/console-exports/leaderboard",
      download: true,
    },
  ];

  return [...navigate, ...actions];
}

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [activeIndex, setActiveIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listboxId = React.useId();

  const commands = React.useMemo(() => buildCommands(), []);
  const filtered = React.useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return commands;
    return commands.filter((c) => c.label.toLowerCase().includes(needle));
  }, [commands, query]);

  const close = React.useCallback(() => {
    setOpen(false);
    setQuery("");
    setActiveIndex(0);
  }, []);

  const runCommand = React.useCallback(
    (command: Command | undefined) => {
      if (!command) return;
      close();
      if (command.download) {
        window.location.href = command.href;
      } else {
        router.push(command.href);
      }
    },
    [close, router],
  );

  // Global Ctrl/Cmd+K, from anywhere in the console, plus the topbar button
  // dispatching the same open event.
  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
      }
    }
    function onOpenEvent() {
      setOpen(true);
    }
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener(OPEN_EVENT, onOpenEvent);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener(OPEN_EVENT, onOpenEvent);
    };
  }, []);

  function onQueryChange(value: string) {
    setQuery(value);
    setActiveIndex(0);
  }

  React.useEffect(() => {
    if (open) {
      // Modal already autofocuses the first focusable element (this input).
      const id = requestAnimationFrame(() => inputRef.current?.focus());
      return () => cancelAnimationFrame(id);
    }
  }, [open]);

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      runCommand(filtered[activeIndex]);
    }
  }

  const groups: { name: Command["group"]; items: Command[] }[] = (
    [
      { name: "Navigate", items: filtered.filter((c) => c.group === "Navigate") },
      { name: "Actions", items: filtered.filter((c) => c.group === "Actions") },
    ] as const
  ).filter((g) => g.items.length > 0);

  return (
    <Modal open={open} onClose={close} title="Command palette" className="max-w-lg">
      <div className="space-y-3">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-controls={listboxId}
            aria-activedescendant={
              filtered[activeIndex] ? `${listboxId}-${filtered[activeIndex].id}` : undefined
            }
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Jump to a section or run an action…"
            className="h-11 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <ul
          id={listboxId}
          role="listbox"
          aria-label="Commands"
          className="max-h-80 space-y-3 overflow-y-auto"
        >
          {groups.length === 0 && (
            <li className="px-2 py-6 text-center text-sm text-muted-foreground">
              No matching commands.
            </li>
          )}
          {groups.map((group) => (
            <li key={group.name}>
              <p className="px-2 pb-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                {group.name}
              </p>
              <ul role="presentation" className="space-y-0.5">
                {group.items.map((command) => {
                  const index = filtered.indexOf(command);
                  const active = index === activeIndex;
                  return (
                    <li
                      key={command.id}
                      id={`${listboxId}-${command.id}`}
                      role="option"
                      aria-selected={active}
                    >
                      <button
                        type="button"
                        onMouseEnter={() => setActiveIndex(index)}
                        onClick={() => runCommand(command)}
                        className={cn(
                          "flex min-h-11 w-full items-center gap-2 rounded-md px-2 text-left text-sm transition-colors",
                          active
                            ? "bg-primary/15 text-primary"
                            : "text-foreground hover:bg-accent",
                        )}
                      >
                        <LayoutGrid className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                        {command.label}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ul>
      </div>
    </Modal>
  );
}

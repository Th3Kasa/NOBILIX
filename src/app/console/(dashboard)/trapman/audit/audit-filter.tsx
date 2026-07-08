"use client";

import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function AuditFilter({
  defaultAction,
  defaultActor,
  actionOptions,
}: {
  defaultAction?: string;
  defaultActor?: string;
  actionOptions: string[];
}) {
  const router = useRouter();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const p = new URLSearchParams();
    const action = String(fd.get("action") ?? "").trim();
    const actor = String(fd.get("actor") ?? "").trim();
    if (action) p.set("action", action);
    if (actor) p.set("actor", actor);
    router.push(`/console/trapman/audit${p.toString() ? `?${p}` : ""}`);
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center"
    >
      <div>
        <Label htmlFor="audit-filter-action" className="sr-only">
          Action type
        </Label>
        <select
          id="audit-filter-action"
          name="action"
          defaultValue={defaultAction ?? ""}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm sm:w-56"
        >
          <option value="">All actions</option>
          {actionOptions.map((action) => (
            <option key={action} value={action}>
              {action}
            </option>
          ))}
        </select>
      </div>
      <div className="flex-1">
        <Label htmlFor="audit-filter-actor" className="sr-only">
          Actor email
        </Label>
        <Input
          id="audit-filter-actor"
          name="actor"
          defaultValue={defaultActor}
          placeholder="Filter by admin email…"
          className="sm:max-w-xs"
        />
      </div>
      <Button type="submit">Filter</Button>
    </form>
  );
}

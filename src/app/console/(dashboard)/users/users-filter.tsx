"use client";

import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function UsersFilter({
  defaultQ,
  defaultCountry,
  defaultGuest,
}: {
  defaultQ?: string;
  defaultCountry?: string;
  defaultGuest?: string;
}) {
  const router = useRouter();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const p = new URLSearchParams();
    const q = String(fd.get("q") ?? "").trim();
    const country = String(fd.get("country") ?? "").trim();
    const guest = String(fd.get("guest") ?? "all");
    if (q) p.set("q", q);
    if (country) p.set("country", country);
    if (guest && guest !== "all") p.set("guest", guest);
    router.push(`/console/users${p.toString() ? `?${p}` : ""}`);
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-2 sm:flex-row sm:items-center"
    >
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          name="q"
          defaultValue={defaultQ}
          placeholder="Search by name prefix or exact email…"
          className="pl-9"
        />
      </div>
      <Input
        name="country"
        defaultValue={defaultCountry}
        placeholder="Country (e.g. US)"
        maxLength={2}
        className="sm:w-40 uppercase"
      />
      <select
        name="guest"
        defaultValue={defaultGuest}
        className="h-9 rounded-md border border-input bg-background px-3 text-sm sm:w-40"
      >
        <option value="all">All players</option>
        <option value="registered">Registered</option>
        <option value="guest">Guests</option>
      </select>
      <Button type="submit">Search</Button>
    </form>
  );
}

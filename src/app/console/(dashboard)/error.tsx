"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Error boundaries must be Client Components (Next.js file convention).
// Wraps page.tsx and nested layouts under (dashboard) — the sidebar/topbar
// in (dashboard)/layout.tsx stay mounted since error.tsx never replaces a
// layout in its own segment, only what's below it.
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Card
      role="alert"
      className="console-empty-state border-[var(--console-action-border)] bg-[var(--console-action-tint)]"
    >
      <CardContent className="relative flex flex-col items-start gap-4 p-6 text-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <AlertTriangle
            className="mt-0.5 size-4 shrink-0 text-[var(--console-action)]"
            aria-hidden="true"
          />
          <div>
            <p className="font-medium text-[var(--console-action)]">
              Something went wrong loading this page
            </p>
            <p className="text-muted-foreground">
              {error.digest
                ? `An unexpected error occurred (ref: ${error.digest}).`
                : "An unexpected error occurred."}{" "}
              Try again, or come back later if it persists.
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={() => reset()} className="shrink-0">
          Try again
        </Button>
      </CardContent>
    </Card>
  );
}

"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

// dnd-kit only downloads when someone actually opens the panel.
const CustomizeOverviewPanel = dynamic(
  () => import("./customize-overview-panel"),
  {
    ssr: false,
    loading: () => (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Loading your layout…
      </p>
    ),
  },
);

export function CustomizeOverview({
  order,
  hidden,
}: {
  order: string[];
  hidden: string[];
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="shrink-0"
        onClick={() => setOpen(true)}
      >
        <SlidersHorizontal aria-hidden="true" />
        Customize
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Customize your overview"
        description="Choose what you see and drag to reorder. Only your view changes — other admins keep their own layout."
        className="max-w-lg"
      >
        <CustomizeOverviewPanel
          initialOrder={order}
          initialHidden={hidden}
          onClose={() => setOpen(false)}
        />
      </Modal>
    </>
  );
}

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { getOverviewWidget } from "./overview-widgets";
import {
  saveOverviewPrefs,
  resetOverviewPrefsAction,
} from "./overview-prefs-actions";

function SortableRow({
  id,
  visible,
  onVisibleChange,
}: {
  id: string;
  visible: boolean;
  onVisibleChange: (visible: boolean) => void;
}) {
  const widget = getOverviewWidget(id);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  if (!widget) return null;

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex items-center gap-2 rounded-md border border-border bg-card px-2 py-1.5",
        isDragging && "z-10 border-primary shadow-lg",
        !visible && "opacity-60",
      )}
    >
      <button
        type="button"
        className="inline-flex size-8 shrink-0 cursor-grab touch-none items-center justify-center rounded text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing"
        aria-label={`Reorder ${widget.name}`}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" aria-hidden="true" />
      </button>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm">{widget.name}</p>
      </div>
      <Badge variant="secondary" className="hidden shrink-0 sm:inline-flex">
        {widget.section}
      </Badge>
      <Switch
        checked={visible}
        onCheckedChange={onVisibleChange}
        aria-label={`Show ${widget.name}`}
      />
    </li>
  );
}

export default function CustomizeOverviewPanel({
  initialOrder,
  initialHidden,
  onClose,
}: {
  initialOrder: string[];
  initialHidden: string[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [order, setOrder] = React.useState(initialOrder);
  const [hidden, setHidden] = React.useState(() => new Set(initialHidden));
  const [saving, setSaving] = React.useState(false);
  const [resetting, setResetting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setOrder((current) => {
      const from = current.indexOf(String(active.id));
      const to = current.indexOf(String(over.id));
      if (from < 0 || to < 0) return current;
      return arrayMove(current, from, to);
    });
  }

  function setVisible(id: string, visible: boolean) {
    setHidden((current) => {
      const next = new Set(current);
      if (visible) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    const result = await saveOverviewPrefs({
      order,
      hidden: [...hidden],
    });
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onClose();
    router.refresh();
  }

  async function handleReset() {
    setResetting(true);
    setError(null);
    const result = await resetOverviewPrefsAction();
    setResetting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onClose();
    router.refresh();
  }

  return (
    <div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={order} strategy={verticalListSortingStrategy}>
          <ul className="max-h-[50vh] space-y-1.5 overflow-y-auto pr-1">
            {order.map((id) => (
              <SortableRow
                key={id}
                id={id}
                visible={!hidden.has(id)}
                onVisibleChange={(visible) => setVisible(id, visible)}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>

      {error && (
        <p className="mt-3 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <div className="mt-4 flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleReset}
          loading={resetting}
          loadingLabel="Resetting layout"
        >
          Reset to default
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={handleSave}
          loading={saving}
          loadingLabel="Saving layout"
        >
          Save layout
        </Button>
      </div>
    </div>
  );
}

import { Card, CardContent } from "@/components/ui/card";
import { Hammer } from "lucide-react";

export function SectionPlaceholder({ note }: { note: string }) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <div className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <Hammer className="size-5" />
        </div>
        <p className="max-w-md text-sm text-muted-foreground">{note}</p>
      </CardContent>
    </Card>
  );
}

import { ShieldCheck } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EnrollForm } from "./enroll-form";

export default function EnrollPage() {
  return (
    <Card className="border-border/60 shadow-xl backdrop-blur">
      <CardHeader className="items-center text-center">
        <div className="mb-2 flex size-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <ShieldCheck className="size-6" />
        </div>
        <CardTitle className="text-xl">Set up two-factor authentication</CardTitle>
        <CardDescription>
          Required before you can access the console
        </CardDescription>
      </CardHeader>
      <CardContent>
        <EnrollForm />
      </CardContent>
    </Card>
  );
}

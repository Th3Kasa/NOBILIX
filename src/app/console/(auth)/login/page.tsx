import { ShieldCheck } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <Card className="console-auth-card border-border/60 shadow-xl backdrop-blur">
      <CardHeader className="items-center text-center">
        <div className="mb-2 flex size-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <ShieldCheck className="size-6" />
        </div>
        <p className="eyebrow">Nobilix operations console</p>
        <CardTitle className="text-xl">Secure admin sign-in</CardTitle>
        <CardDescription>
          Company console access for TrapMan operations, review, and support.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm />
      </CardContent>
    </Card>
  );
}

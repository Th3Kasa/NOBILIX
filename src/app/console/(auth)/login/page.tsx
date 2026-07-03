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
    <Card className="console-auth-card console-hairline-glow border-border/60 shadow-xl backdrop-blur">
      <CardHeader className="items-center text-center">
        <div className="mb-2 flex size-12 items-center justify-center rounded-xl border border-[var(--console-violet-border)] bg-primary/15 text-primary shadow-[0_0_24px_-6px_var(--neon-violet)]">
          <ShieldCheck className="size-6" />
        </div>
        <p className="eyebrow">Nobilix operations console</p>
        <CardTitle className="console-telemetry text-xl">Secure admin sign-in</CardTitle>
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

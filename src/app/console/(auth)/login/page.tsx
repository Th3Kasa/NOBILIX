import { ShieldCheck } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getWebAuthnConfig } from "@/lib/webauthn";
import { LoginForm } from "./login-form";
import { PasskeyLoginButton } from "./passkey-login-button";

export default function LoginPage() {
  // Hidden entirely when the deployment has no relying-party config —
  // never a half-working button.
  const passkeysEnabled = getWebAuthnConfig() !== null;
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
      <CardContent className="space-y-4">
        <LoginForm />
        {passkeysEnabled && <PasskeyLoginButton />}
      </CardContent>
    </Card>
  );
}

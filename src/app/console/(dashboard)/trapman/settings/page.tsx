import { auth } from "@/auth";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { listPasskeysForAdmin } from "@/lib/passkeys";
import { getWebAuthnConfig } from "@/lib/webauthn";
import { ChangePasswordForm } from "./change-password-form";
import { PasskeysCard, type PasskeyListItem } from "./passkeys-card";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await auth();
  const user = session?.user;

  const passkeysEnabled = getWebAuthnConfig() !== null;
  let passkeys: PasskeyListItem[] = [];
  if (passkeysEnabled && user?.id) {
    passkeys = (await listPasskeysForAdmin(user.id).catch(() => [])).map(
      (pk) => ({
        credentialId: pk.credentialId,
        name: pk.name,
        createdAt: pk.createdAt,
        lastUsedAt: pk.lastUsedAt,
        backedUp: pk.backedUp,
      }),
    );
  }

  return (
    <>
      <PageHeader
        title="Account settings"
        description="Manage your sign-in credentials."
      />

      <div className="grid max-w-2xl gap-4">
        <Card className="console-glass">
          <CardHeader>
            <CardTitle>Your account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Name</span>
              <span className="font-medium">{user?.name ?? "—"}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium">{user?.email ?? "—"}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Role</span>
              <Badge variant="secondary" className="font-mono uppercase tracking-wide">
                {user?.role ?? "—"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="console-glass">
          <CardHeader>
            <CardTitle>Passkeys</CardTitle>
          </CardHeader>
          <CardContent>
            <PasskeysCard passkeys={passkeys} enabled={passkeysEnabled} />
          </CardContent>
        </Card>

        <Card className="console-glass">
          <CardHeader>
            <CardTitle>Change password</CardTitle>
          </CardHeader>
          <CardContent>
            <ChangePasswordForm />
          </CardContent>
        </Card>
      </div>
    </>
  );
}

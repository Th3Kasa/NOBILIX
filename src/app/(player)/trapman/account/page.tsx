import { requirePlayerSession } from "@/lib/player-session";
import { getPlayerAccountSnapshot } from "@/lib/player-account";
import { ProgressionPanel } from "@/components/trapman/account/progression-panel";
import { PurchaseHistory } from "@/components/trapman/account/purchase-history";
import { AccountActions } from "@/components/trapman/account/account-actions";

export default async function PlayerAccountPage() {
  const session = await requirePlayerSession();
  const snapshot = await getPlayerAccountSnapshot(session.uid);

  return (
    <div className="player-dashboard">
      <div className="player-dashboard-header">
        <p className="trapman-kicker">Player dashboard</p>
        <h1 className="player-dashboard-title">
          {snapshot.username ? `${snapshot.username}'s Account` : "My Account"}
        </h1>
        <div className="player-dashboard-identity">
          {snapshot.email && (
            <p className="player-email">{snapshot.email}</p>
          )}
          {snapshot.country && (
            <p className="player-country">{snapshot.country}</p>
          )}
        </div>
      </div>

      <div className="player-dashboard-grid">
        <ProgressionPanel snapshot={snapshot} />
        <PurchaseHistory purchases={snapshot.purchases} />
        <AccountActions />
      </div>
    </div>
  );
}

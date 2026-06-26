import type { PlayerPurchase } from "@/types/player-account";

interface PurchaseHistoryProps {
  purchases: PlayerPurchase[];
}

export function PurchaseHistory({ purchases }: PurchaseHistoryProps) {
  return (
    <section className="player-purchase-history" aria-labelledby="purchases-heading">
      <h2 id="purchases-heading">Purchase History</h2>

      {purchases.length === 0 ? (
        <div className="player-no-purchases player-empty-state">
          <p>No purchases on record for this account.</p>
          <span>When purchases exist, product IDs and receipt dates appear here.</span>
        </div>
      ) : (
        <ul className="player-purchase-list">
          {purchases.map((purchase) => (
            <li key={purchase.id} className="player-purchase-item">
              <span className="player-purchase-product">{purchase.productId}</span>
              <span className="player-purchase-date">
                {purchase.purchasedAt !== null
                  ? new Date(purchase.purchasedAt).toLocaleDateString("en-AU", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })
                  : "Date not available"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

# TrapMan game change: save the App Store receipt for iPhone purchases

**For:** whoever maintains the TrapMan Unity project.
**Why:** every iPhone purchase is saved to Firestore with `"receipt": ""`. With no receipt,
the NOBILIX console can't match a single iPhone purchase to Apple's records. That means it
can't tell a real sale from a sandbox/TestFlight test or a refund. Android purchases already
carry Google's receipt and are checked automatically.

## What the game saves today

```json
users/{uid}.purchases.{id} = {
  "productId": "com.cultshotta.trapman.hearts_tier_1",
  "price": 0.99, "currency": "AUD",
  "platform": "IPhonePlayer",
  "receipt": "",            ← empty on iOS
  "timestamp": 1790858022698
}
```

## The change

In the purchase handler (`ProcessPurchase`, or wherever the record above is written), on iOS:

1. Save Unity IAP's receipt instead of `""`: `receipt = args.purchasedProduct.receipt`.
   Unity returns `{"Store":"AppleAppStore","TransactionID":"…","Payload":"…"}`.
2. Also save the transaction id as its own field:
   `transactionId = args.purchasedProduct.transactionID`.

Either is enough. The console already reads both (`src/lib/trapman/purchases.ts`).
Keep every other field exactly as it is. Android doesn't change.

## What happens next

Once new iPhone purchases carry a transaction id, the console can ask Apple about each one
through the App Store Server API, the same way it asks Google about Android purchases. That
needs an **In-App Purchase key** from App Store Connect (Users and Access → Integrations →
In-App Purchase). It's separate from the Sales key the console uses today.

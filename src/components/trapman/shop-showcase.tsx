import Image from "next/image";

const SHOP_ITEMS = [
  "Playable character unlocks",
  "Cosmetic skins and trail effects",
  "Original music track library",
  "Boost power-ups and shields",
] as const;

export function ShopShowcase() {
  return (
    <div className="shop-showcase">
      <div className="shop-showcase__copy">
        <p className="trapman-kicker">Shop and inventory</p>
        <h2>Gear that earns its place.</h2>
        <p>
          Unlock runners, skins, and music tracks through gameplay. Every item
          is a reward for your run — no mandatory purchases, no paywalls on
          progression.
        </p>
        <ul className="shop-feature-list">
          {SHOP_ITEMS.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
      <div className="shop-showcase__stage">
        <Image
          src="/assets/generated/trapman/portal.webp"
          alt="TrapMan neon portal — gateway to the shop and character select"
          width={1200}
          height={1200}
          sizes="(max-width: 900px) 90vw, 40vw"
          className="shop-showcase__portal"
        />
      </div>
    </div>
  );
}

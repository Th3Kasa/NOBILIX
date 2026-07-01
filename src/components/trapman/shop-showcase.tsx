import Image from "next/image";

const SHOP_ITEMS = [
  { label: "Playable character unlocks", accent: "cyan" },
  { label: "Cosmetic skins and trail effects", accent: "magenta" },
  { label: "Original music track library", accent: "yellow" },
  { label: "Boost power-ups and shields", accent: "violet" },
] as const;

export function ShopShowcase() {
  return (
    <div className="shop-grid-section">
      <div className="shop-grid-section__copy">
        <p className="trapman-kicker">Shop and inventory</p>
        <h2>Gear that earns its place.</h2>
        <p>
          Unlock runners, skins, and music tracks through gameplay. Every item
          is a reward for your run — no mandatory purchases, no paywalls on
          progression.
        </p>
      </div>
      <div className="shop-item-grid">
        {SHOP_ITEMS.map(({ label, accent }, index) => (
          <article key={label} className="shop-item-card" data-accent={accent}>
            {index === 0 && (
              <div className="shop-item-card__plate" aria-hidden="true">
                <Image
                  src="/assets/generated/trapman/shop-plate.webp"
                  alt=""
                  width={1536}
                  height={864}
                  sizes="(max-width: 900px) 100vw, 24vw"
                />
              </div>
            )}
            <div className="shop-item-card__glyph" aria-hidden="true" />
            <p className="shop-item-card__label">{label}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

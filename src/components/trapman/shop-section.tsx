import Image from "next/image";
import { Ban, Music, Package, Users } from "lucide-react";
import { PROJECTS } from "@/config/projects";
import { Reveal } from "@/components/motion/reveal";

/**
 * Real captures + verbatim captions from the actual in-game shop screen
 * (public/assets/trapman/screens/shop.png) — no invented items or prices.
 * "Characters" genuinely reads "COMING SOON…" on the current build.
 */
const SHOP_CATEGORIES = [
  {
    accent: "cyan",
    label: "Remove Ads",
    caption: "Enjoy the game without any interruptions!",
    Icon: Ban,
    comingSoon: false,
  },
  {
    accent: "magenta",
    label: "Music",
    caption: "Unlock new music",
    Icon: Music,
    comingSoon: false,
  },
  {
    accent: "yellow",
    label: "Items",
    caption: "Get helpful items to boost your runs!",
    Icon: Package,
    comingSoon: false,
  },
  {
    accent: "violet",
    label: "Characters",
    caption: "Coming soon",
    Icon: Users,
    comingSoon: true,
  },
] as const;

export function ShopSection() {
  const { googlePlay, appStore } = PROJECTS.trapman.storeLinks;

  return (
    <>
      <div className="shop-showcase__stage">
        <Image
          src="/assets/generated/trapman/shop-plate.webp"
          alt=""
          width={1536}
          height={864}
          sizes="100vw"
          className="shop-showcase__atmosphere"
        />
        <div className="shop-glow-orb" aria-hidden="true">
          <span className="shop-glow-orb__ring shop-glow-orb__ring--outer" />
          <span className="shop-glow-orb__ring shop-glow-orb__ring--mid" />
          <span className="shop-glow-orb__ring shop-glow-orb__ring--inner" />
          <span className="shop-glow-orb__core" />
        </div>
        <Image
          src="/assets/trapman/screens/shop.png"
          alt="The TrapMan in-game shop screen, showing Remove Ads, Characters, Music, and Items categories."
          width={945}
          height={2048}
          sizes="(max-width: 820px) 60vw, 20rem"
          className="shop-showcase__screenshot"
        />
      </div>

      <div className="shop-grid-section">
        <div className="shop-grid-section__copy">
          <p className="trapman-kicker">In-game shop</p>
          <h2>Step into the shop.</h2>
          <p>
            The same shop from inside TrapMan, brought to the web: remove ads,
            unlock new music, and pick up items to boost your runs.
            Characters are coming soon.
          </p>
        </div>
        <div className="shop-item-grid">
          {SHOP_CATEGORIES.map(({ accent, label, caption, Icon, comingSoon }, index) => (
            <Reveal key={label} delay={index * 0.06}>
              <div
                className="shop-item-card"
                data-accent={accent}
                data-coming-soon={comingSoon || undefined}
              >
                {comingSoon && (
                  <span className="shop-item-card__badge">Coming soon</span>
                )}
                <span className="shop-item-card__glyph" aria-hidden="true">
                  <Icon size={22} />
                </span>
                <span className="shop-item-card__label">{label}</span>
                <p className="shop-item-card__desc">{caption}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>

      <div className="shop-cta">
        <p>Get the game to visit the shop.</p>
        <div className="tm-store-links" aria-label="Get TrapMan to visit the shop">
          {googlePlay ? (
            <a
              className="tm-store-badge magnetic-hover"
              href={googlePlay}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="tm-store-badge__eyebrow">Get it on</span>
              <span className="tm-store-badge__name">Google Play</span>
            </a>
          ) : (
            <span className="tm-store-badge tm-store-badge--pending">
              <span className="tm-store-badge__eyebrow">Coming soon to</span>
              <span className="tm-store-badge__name">Google Play</span>
            </span>
          )}
          {appStore ? (
            <a
              className="tm-store-badge magnetic-hover"
              href={appStore}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="tm-store-badge__eyebrow">Download on the</span>
              <span className="tm-store-badge__name">App Store</span>
            </a>
          ) : (
            <span className="tm-store-badge tm-store-badge--pending">
              <span className="tm-store-badge__eyebrow">Coming soon to</span>
              <span className="tm-store-badge__name">the App Store</span>
            </span>
          )}
        </div>
      </div>
    </>
  );
}

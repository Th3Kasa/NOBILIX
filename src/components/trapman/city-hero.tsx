import { PROJECTS } from "@/config/projects";
import { CinematicVideo } from "@/components/motion/cinematic-video";
import { ParallaxMedia } from "@/components/motion/parallax-media";
import { ChromeWordmark } from "./chrome-wordmark";
import { CityMotion } from "./city-motion";
import { NeonSkyline } from "./neon-skyline";

export function CityHero() {
  const { googlePlay, appStore } = PROJECTS.trapman.storeLinks;

  return (
    <div className="city-hero" aria-labelledby="trapman-title">
      <CityMotion />
      <ParallaxMedia amount={28} className="city-hero__atmosphere-layer">
        <CinematicVideo
          src="/assets/generated/trapman/city-hero.mp4"
          poster="/assets/generated/trapman/city-hero.webp"
          posterWidth={1536}
          posterHeight={864}
          sizes="100vw"
          priority
          className="city-hero__atmosphere city-hero__atmosphere--desktop"
        />
        <CinematicVideo
          src="/assets/generated/trapman/city-mobile.mp4"
          poster="/assets/generated/trapman/city-mobile.webp"
          posterWidth={864}
          posterHeight={1536}
          sizes="100vw"
          priority
          className="city-hero__atmosphere city-hero__atmosphere--mobile"
        />
      </ParallaxMedia>
      <div className="starfield" data-layer="starfield" aria-hidden="true" />
      <div className="far-skyline" data-layer="far-skyline" aria-hidden="true" />
      <div className="near-skyline" data-layer="near-skyline" aria-hidden="true" />
      <div className="helicopter" data-layer="helicopter" aria-hidden="true">
        <span className="rotor" />
        <span className="searchlight" data-layer="searchlight" />
      </div>

      {/* Game-accurate neon skyline, hand-built in SVG per the owner's
          "recreate, don't screenshot" direction — sits above the generated
          atmosphere plate, behind the wordmark, like the game's home screen. */}
      <NeonSkyline className="tm-hero-skyline" />

      <div className="hero-copy">
        <ChromeWordmark id="trapman-title" />
        <p>
          A neon pixel runner presented as a polished web world: music, score,
          shop, characters, and account support all in one place.
        </p>
        <div className="tm-store-links tm-store-links--primary" aria-label="Get TrapMan">
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

      <div className="runner-stage" aria-hidden="true">
        <div className="runner" data-layer="runner" />
        <div className="scan-platform" data-layer="scan-platform" />
      </div>
    </div>
  );
}

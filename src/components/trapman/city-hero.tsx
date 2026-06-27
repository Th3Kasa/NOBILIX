import Image from "next/image";
import Link from "next/link";
import { CinematicVideo } from "@/components/motion/cinematic-video";
import { CityMotion } from "./city-motion";

export function CityHero() {
  return (
    <div className="city-hero" aria-labelledby="trapman-title">
      <CityMotion />
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
      <div className="starfield" data-layer="starfield" aria-hidden="true" />
      <div className="far-skyline" data-layer="far-skyline" aria-hidden="true" />
      <div className="near-skyline" data-layer="near-skyline" aria-hidden="true" />
      <div className="helicopter" data-layer="helicopter" aria-hidden="true">
        <span className="rotor" />
        <span className="searchlight" data-layer="searchlight" />
      </div>
      <div className="hero-copy">
        <p className="trapman-kicker">02 / Main project</p>
        <Image src="/assets/trapman-logo.png" alt="TrapMan" width={320} height={180} priority />
        <h1 id="trapman-title">Pixel soul. Premium stage.</h1>
        <p>
          A neon pixel runner presented as a polished web world: music, score,
          shop, characters, and account support all in one place.
        </p>
        <div className="hero-cta">
          <Link href="#the-run">Explore the game</Link>
          <Link href="/trapman/account">My account</Link>
        </div>
      </div>
<div className="runner-stage" aria-hidden="true">
        <div className="runner" data-layer="runner" />
        <div className="scan-platform" data-layer="scan-platform" />
      </div>
    </div>
  );
}

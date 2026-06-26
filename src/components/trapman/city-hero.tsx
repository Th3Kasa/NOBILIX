import Image from "next/image";
import Link from "next/link";
import { CityMotion } from "./city-motion";

export function CityHero() {
  return (
    <div className="city-hero" aria-labelledby="trapman-title">
      <CityMotion />
      <Image
        src="/assets/generated/trapman/city-hero.webp"
        alt=""
        width={1536}
        height={864}
        priority
        sizes="100vw"
        className="city-hero__atmosphere city-hero__atmosphere--desktop"
      />
      <Image
        src="/assets/generated/trapman/city-mobile.webp"
        alt=""
        width={864}
        height={1536}
        priority
        sizes="100vw"
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
      <div className="hero-evidence" aria-label="TrapMan character evidence">
        <Image
          src="/assets/trapman/screens/home-lil-golo.png"
          alt="TrapMan home screen showing Lil Golo."
          width={390}
          height={844}
          sizes="(max-width: 700px) 36vw, 11rem"
        />
        <Image
          src="/assets/trapman/screens/home-shotta.png"
          alt="TrapMan home screen showing Shotta."
          width={390}
          height={844}
          sizes="(max-width: 700px) 36vw, 11rem"
        />
      </div>
      <div className="runner-stage" aria-hidden="true">
        <div className="runner" data-layer="runner" />
        <div className="scan-platform" data-layer="scan-platform" />
      </div>
    </div>
  );
}

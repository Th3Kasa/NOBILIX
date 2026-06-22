import Image from "next/image";
import Link from "next/link";
import { CityMotion } from "./city-motion";

export function CityHero() {
  return (
    <section className="city-hero" aria-labelledby="trapman-title">
      <CityMotion />
      <div className="starfield" data-layer="starfield" aria-hidden="true" />
      <div className="far-skyline" data-layer="far-skyline" aria-hidden="true" />
      <div className="near-skyline" data-layer="near-skyline" aria-hidden="true" />
      <div className="helicopter" data-layer="helicopter" aria-hidden="true">
        <span className="rotor" />
        <span className="searchlight" data-layer="searchlight" />
      </div>
      <div className="hero-copy">
        <Image src="/assets/trapman-logo.png" alt="TrapMan" width={260} height={260} priority />
        <h1 id="trapman-title">The city does not wait.</h1>
        <p>Run. Collect. Climb. Own the night.</p>
        <div className="hero-cta">
          <Link href="#the-run">Explore the game</Link>
          <Link href="/trapman/account">My account</Link>
        </div>
      </div>
      <div className="runner-stage" aria-hidden="true">
        <div className="runner" data-layer="runner" />
        <div className="scan-platform" data-layer="scan-platform" />
      </div>
    </section>
  );
}

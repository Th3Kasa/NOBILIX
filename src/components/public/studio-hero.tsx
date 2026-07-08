import Link from "next/link";
import { CinematicVideo } from "@/components/motion/cinematic-video";
import { ParallaxMedia } from "@/components/motion/parallax-media";
import { Reveal } from "@/components/motion/reveal";

export function StudioHero() {
  return (
    <section className="studio-hero grid-mesh-floor" aria-labelledby="company-title">
      <div className="studio-hero__copy">
        <Reveal>
          <p className="studio-brand-badge pixel-type" aria-hidden="true">NOBILIX</p>
          <p className="eyebrow">
            <span className="eyebrow__dot" aria-hidden="true" />
            Independent technology studio · Sydney, AU
          </p>
        </Reveal>
        <Reveal delay={0.08}>
          <h1 id="company-title">
            Built for people.
            <br />
            <em>Powered by possibility.</em>
          </h1>
        </Reveal>
        <Reveal delay={0.16}>
          <p className="studio-hero__lede">
            Nobilix is an independent technology studio in Sydney, building
            products that put people first. Each one gets its own identity,
            its own home, and clear data practices — never hidden behind the
            company name.
          </p>
          <div className="studio-hero__actions" aria-label="Primary actions">
            <Link className="nobilix-button nobilix-button--primary magnetic-hover" href="/#contact">
              Get in touch
            </Link>
          </div>
        </Reveal>
      </div>
      <ParallaxMedia className="studio-hero__media neon-border" amount={24}>
        <CinematicVideo
          src="/assets/generated/nobilix/studio-hero.mp4"
          poster="/assets/generated/nobilix/studio-hero.webp"
          posterWidth={1536}
          posterHeight={864}
          alt="Original pixel-art studio atmosphere: deep indigo planes with neon violet and cyan light seams."
          sizes="(max-width: 768px) 100vw, 52vw"
          priority
        />
        <div className="studio-hero__scanline crt-overlay" aria-hidden="true" />
        <div className="studio-hero__plate" aria-hidden="true">
          <span>Plate 01</span>
          <span>Studio, in progress</span>
        </div>
      </ParallaxMedia>
    </section>
  );
}

import Image from "next/image";
import Link from "next/link";
import { ParallaxMedia } from "@/components/motion/parallax-media";
import { Reveal } from "@/components/motion/reveal";

export function StudioHero() {
  return (
    <section className="studio-hero" aria-labelledby="company-title">
      <div className="studio-hero__copy">
        <Reveal>
          <p className="eyebrow">Nobilix / Independent studio</p>
          <h1 id="company-title">Professional studio. Distinct project worlds.</h1>
          <p className="studio-hero__lede">
            Nobilix is the company brand: neutral, reliable, and ready to hold
            a growing portfolio. TrapMan is the main project right now, with
            more worlds designed to sit beside it later.
          </p>
          <div className="studio-hero__actions" aria-label="Primary actions">
            <Link className="nobilix-button nobilix-button--primary" href="#projects">
              View TrapMan
            </Link>
            <Link className="nobilix-button nobilix-button--secondary" href="/legal">
              Company legal
            </Link>
          </div>
        </Reveal>
      </div>
      <ParallaxMedia className="studio-hero__media" amount={24}>
        <Image
          src="/assets/generated/nobilix/studio-hero.webp"
          alt="Abstract warm studio artwork with black architectural planes and an acid-lime light seam."
          width={1536}
          height={864}
          priority
          sizes="(max-width: 768px) 100vw, 52vw"
        />
        <div className="studio-hero__plate" aria-hidden="true">
          <span>01</span>
          <span>Company brand</span>
        </div>
      </ParallaxMedia>
    </section>
  );
}

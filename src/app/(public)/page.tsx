import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import { ProjectShowcase } from "@/components/public/project-showcase";
import { StudioHero } from "@/components/public/studio-hero";
import { StudioPrinciples } from "@/components/public/studio-principles";

export const metadata: Metadata = {
  title: "Nobilix — Independent digital studio",
  description:
    "Nobilix is a neutral studio brand building distinct digital projects, starting with TrapMan.",
  alternates: { canonical: "/" },
};

export default function NobilixHomePage() {
  return (
    <>
      <StudioHero />
      <StudioPrinciples />
      <ProjectShowcase />
      <section
        id="studio"
        className="nobilix-studio-section"
        aria-labelledby="studio-title"
      >
        <Reveal>
          <p className="eyebrow">
            <span className="eyebrow__dot" aria-hidden="true" />
            01 / Studio
          </p>
          <h2 id="studio-title">
            A quiet company layer for <em>loud project worlds</em>.
          </h2>
          <p>
            Nobilix holds the business, legal, console, and portfolio structure.
            Each project gets its own visual identity, data disclosures, and
            product home — without forcing the studio brand to imitate the game.
          </p>
        </Reveal>
      </section>
      <section
        id="contact"
        className="nobilix-contact-section"
        aria-labelledby="contact-title"
      >
        <Reveal className="nobilix-contact-section__media neon-border" aria-hidden="true">
          <Image
            src="/assets/generated/nobilix/contact-plate.webp"
            alt=""
            width={1536}
            height={864}
            sizes="(max-width: 900px) 100vw, 40vw"
          />
        </Reveal>
        <Reveal delay={0.1} className="nobilix-contact-section__copy">
          <p className="eyebrow">
            <span className="eyebrow__dot" aria-hidden="true" />
            Contact
          </p>
          <h2 id="contact-title">Support, publishing, and studio enquiries.</h2>
          <p>
            Use the console for operations, TrapMan support paths for player
            requests, and the company legal directory for Nobilix notices.
          </p>
          <div className="nobilix-contact-section__actions">
            {/* TODO(copy): confirm label — was "Open console" before the console CTA
                was demoted to footer-only; promoted the support email as the
                primary contact action in its place. */}
            <a
              className="nobilix-button nobilix-button--primary magnetic-hover"
              href="mailto:help.nobilix@outlook.com"
            >
              Email support
            </a>
            <Link className="nobilix-button nobilix-button--secondary magnetic-hover" href="/legal">
              Company legal
            </Link>
          </div>
        </Reveal>
      </section>
    </>
  );
}

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import { ProjectShowcase } from "@/components/public/project-showcase";
import { StudioHero } from "@/components/public/studio-hero";
import { StudioPrinciples } from "@/components/public/studio-principles";

export const metadata: Metadata = {
  title: "Nobilix — Independent technology studio",
  description:
    "Nobilix is an independent technology studio in Sydney, building products around people — starting with TrapMan.",
  alternates: { canonical: "/" },
};

export default function NobilixHomePage() {
  return (
    <>
      <StudioHero />
      <section
        id="studio"
        className="nobilix-studio-section"
        aria-labelledby="studio-title"
      >
        <Reveal>
          <p className="eyebrow">
            <span className="eyebrow__dot" aria-hidden="true" />
            Studio
          </p>
          <h2 id="studio-title">
            A quiet company behind <em>bold products</em>.
          </h2>
          <p>
            Nobilix holds the business, legal, and operational structure. Each
            product gets its own identity, its own data practices, and its own
            home — so the company can stay quiet while the work stands out.
          </p>
        </Reveal>
      </section>
      <StudioPrinciples />
      <ProjectShowcase />
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
            Need help with TrapMan, have a support question, or looking for
            legal information? You&apos;ll find the right link below.
          </p>
          <div className="nobilix-contact-section__actions">
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

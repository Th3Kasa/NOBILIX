import type { Metadata } from "next";
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
      <Reveal>
        <section
          id="studio"
          className="nobilix-studio-section"
          aria-labelledby="studio-title"
        >
          <p className="eyebrow">01 / Studio</p>
          <h2 id="studio-title">A quiet company layer for loud project worlds.</h2>
          <p>
            Nobilix holds the business, legal, console, and portfolio structure.
            Each project gets its own visual identity, data disclosures, and
            product home — without forcing the studio brand to imitate the game.
          </p>
        </section>
      </Reveal>
      <Reveal>
        <section
          id="contact"
          className="nobilix-contact-section"
          aria-labelledby="contact-title"
        >
          <p className="eyebrow">Contact</p>
          <h2 id="contact-title">Support, publishing, and studio enquiries.</h2>
          <p>
            Use the console for operations, TrapMan support paths for player
            requests, and the company legal directory for Nobilix notices.
          </p>
        </section>
      </Reveal>
    </>
  );
}

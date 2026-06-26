import type { Metadata } from "next";
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
        <p className="eyebrow">01 / Company brand</p>
        <h2 id="studio-title">A quiet company layer for loud product worlds.</h2>
        <p>
          Nobilix holds the business, legal, console, and portfolio structure.
          Each project gets its own visual language, data disclosures, and
          product home without forcing the company brand to imitate the game.
        </p>
      </section>
      <section
        id="contact"
        className="nobilix-contact-section"
        aria-labelledby="contact-title"
      >
        <p className="eyebrow">Contact</p>
        <h2 id="contact-title">For support, publishing, and studio enquiries.</h2>
        <p>
          Use the console for operations, TrapMan support paths for player
          requests, and the company legal directory for Nobilix notices.
        </p>
      </section>
    </>
  );
}

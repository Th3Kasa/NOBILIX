import Image from "next/image";
import { Reveal } from "@/components/motion/reveal";

const principles = [
  {
    index: "01",
    label: "Identity",
    title: "Design systems that can hold more than one project.",
    copy:
      "Nobilix stays calm and editorial so each project can express its own culture without confusing the company layer.",
  },
  {
    index: "02",
    label: "Care",
    title: "Legal, support, and account paths stay visible.",
    copy:
      "Company notices and project policies are separated, readable, and reachable from the main navigation.",
  },
  {
    index: "03",
    label: "Motion",
    title: "Animation adds orientation, never friction.",
    copy:
      "Motion is used for reveal, continuity, and atmosphere while respecting reduced-motion preferences.",
  },
];

export function StudioPrinciples() {
  return (
    <section
      id="principles"
      className="studio-principles"
      aria-labelledby="principles-title"
    >
      <Reveal className="section-kicker">
        <p className="eyebrow">Operating principles</p>
        <h2 id="principles-title">
          A studio brand built like <em>infrastructure</em>.
        </h2>
      </Reveal>

      <div className="studio-principles__layout">
        <Reveal delay={0.08} className="studio-principles__plate">
          <Image
            src="/assets/generated/nobilix/principles-plate.webp"
            alt=""
            width={1536}
            height={864}
            sizes="(max-width: 900px) 100vw, 38vw"
          />
          <span className="studio-principles__caption">Studio archive, plate 02</span>
        </Reveal>

        <div className="studio-principles__grid">
          {principles.map((principle, position) => (
            <Reveal
              key={principle.label}
              delay={0.16 + position * 0.08}
              className={`studio-principle studio-principle--${position + 1}`}
            >
              <article>
                <span className="studio-principle__index" aria-hidden="true">
                  {principle.index}
                </span>
                <p>{principle.label}</p>
                <h3>{principle.title}</h3>
                <span className="studio-principle__copy">{principle.copy}</span>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

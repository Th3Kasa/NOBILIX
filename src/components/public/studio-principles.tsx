import { Reveal } from "@/components/motion/reveal";

const principles = [
  {
    label: "Identity",
    title: "Design systems that can hold more than one project.",
    copy:
      "Nobilix stays calm and editorial so each project can express its own culture without confusing the company layer.",
  },
  {
    label: "Care",
    title: "Legal, support, and account paths stay visible.",
    copy:
      "Company notices and project policies are separated, readable, and reachable from the main navigation.",
  },
  {
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
      <div className="section-kicker">
        <p className="eyebrow">Operating principles</p>
        <h2 id="principles-title">A studio brand built like infrastructure.</h2>
      </div>
      <div className="studio-principles__grid">
        {principles.map((principle, index) => (
          <Reveal key={principle.label} delay={index * 0.06}>
            <article className="studio-principle">
              <p>{principle.label}</p>
              <h3>{principle.title}</h3>
              <span>{principle.copy}</span>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

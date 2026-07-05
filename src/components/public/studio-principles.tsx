import Image from "next/image";
import { Reveal } from "@/components/motion/reveal";

const principles = [
  {
    index: "01",
    label: "Identity",
    title: "Every product gets its own voice.",
    copy:
      "Nobilix stays quiet and consistent so each product can speak for itself — never buried under the company brand.",
  },
  {
    index: "02",
    label: "Care",
    title: "Support, legal, and account paths stay in reach.",
    copy:
      "Policies and notices are grouped by product, written in plain language, and always reachable from the main navigation.",
  },
  {
    index: "03",
    label: "Craft",
    title: "Every interaction has a reason.",
    copy:
      "Movement and feedback guide and reassure — never decorate for its own sake — and always respect reduced-motion settings.",
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
        <Reveal delay={0.08} className="studio-principles__plate neon-border">
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
                <span className="studio-principle__index pixel-type" aria-hidden="true">
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

import type React from "react";
import Image from "next/image";

const CHARACTERS = [
  {
    initial: "G",
    accent: "#39e9ff",
    name: "Lil Golo",
    tag: "Speed · Agility",
    description:
      "Fast and fearless. Lil Golo slips through tight corridors at full sprint, collecting coins others can't reach.",
  },
  {
    initial: "S",
    accent: "#f144ff",
    name: "Shotta",
    tag: "Power · Endurance",
    description:
      "Built different. Shotta breaks through barriers the others can't touch, turning every obstacle into a shortcut.",
  },
] as const;

export function CharacterShowcase() {
  return (
    <div className="character-stage">
      <div className="character-stage__plate" aria-hidden="true">
        <Image
          src="/assets/generated/trapman/characters-plate.webp"
          alt=""
          width={1536}
          height={864}
          sizes="(max-width: 900px) 100vw, 68vw"
        />
      </div>
      <div className="character-showcase">
        {CHARACTERS.map(({ initial, accent, name, tag, description }) => (
          <article
            key={name}
            className="character-card"
            style={{ "--char-accent": accent } as React.CSSProperties}
          >
            <div className="character-avatar" aria-hidden="true">
              <span className="character-avatar__letter">{initial}</span>
              <div className="character-avatar__ring" />
            </div>
            <div className="character-info">
              <p className="character-tag">{tag}</p>
              <h3 className="character-name">{name}</h3>
              <p className="character-desc">{description}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

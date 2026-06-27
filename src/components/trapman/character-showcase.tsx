import type React from "react";

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
  );
}

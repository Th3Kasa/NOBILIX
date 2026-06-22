import Image from "next/image";

const CHARACTERS = [
  {
    src: "/assets/trapman/screens/home-lil-golo.png",
    name: "Lil Golo",
    description: "Fast and fearless. Lil Golo hits the streets with style, slipping through tight corridors and never slowing down.",
  },
  {
    src: "/assets/trapman/screens/home-shotta.png",
    name: "Shotta",
    description: "Built different. Shotta brings raw power to every run, breaking through barriers the others can't touch.",
  },
] as const;

export function CharacterShowcase() {
  return (
    <div className="character-showcase">
      {CHARACTERS.map(({ src, name, description }) => (
        <article key={name} className="character-card">
          <div className="character-frame">
            <Image
              src={src}
              alt={`${name} — TrapMan character`}
              width={390}
              height={844}
              sizes="(max-width: 640px) 85vw, (max-width: 1024px) 42vw, 28vw"
              className="character-img"
            />
          </div>
          <div className="character-info">
            <h3 className="character-name">{name}</h3>
            <p className="character-desc">{description}</p>
          </div>
        </article>
      ))}
    </div>
  );
}

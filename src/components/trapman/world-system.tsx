import Image from "next/image";
import { ParallaxMedia } from "@/components/motion/parallax-media";
import { MazeDivider } from "./maze-divider";

const WORLD_CHIPS = [
  { label: "Harbour lane", detail: "Cyan rail grinds" },
  { label: "Underground pub", detail: "Bonus coin vaults" },
  { label: "Opera steps", detail: "Vertical shortcuts" },
] as const;

export function WorldSystem() {
  return (
    <div className="world-plate-section">
      <ParallaxMedia amount={24} className="world-plate" aria-hidden="true">
        <Image
          src="/assets/generated/trapman/world-plate.webp"
          alt=""
          width={1536}
          height={864}
          sizes="100vw"
        />
      </ParallaxMedia>
      <div className="world-plate__copy">
        <p className="trapman-kicker">World system</p>
        <h2>Sydney underground, rebuilt in neon.</h2>
        <p>
          The web world borrows the game&apos;s HUD geometry and grid language, then
          rebuilds Sydney&apos;s harbour, terraces, and underground pubs as original
          stage art for scrolling, scanning, and moving between feature sections.
        </p>
      </div>
      <ul className="world-plate__chips">
        {WORLD_CHIPS.map(({ label, detail }) => (
          <li key={label} className="world-chip">
            <span className="world-chip__label">{label}</span>
            <span className="world-chip__detail">{detail}</span>
          </li>
        ))}
      </ul>
      <MazeDivider className="tm-section-divider tm-section-divider--top" />
    </div>
  );
}

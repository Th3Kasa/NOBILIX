import { Gamepad2, ShoppingBag, Trophy } from "lucide-react";
import { CinematicVideo } from "@/components/motion/cinematic-video";
import { HudChip, PixelHeart } from "./hud-chip";
import { MazeDivider } from "./maze-divider";

const FEATURES = [
  {
    Icon: Gamepad2,
    title: "Run the city",
    body: "Navigate neon corridors, collect coins, and dodge barriers in an endless pixel sprint through Sydney underground.",
  },
  {
    Icon: Trophy,
    title: "Claim the leaderboard",
    body: "Every run is ranked globally. Compete across sessions and see your best scores stack against the world.",
  },
  {
    Icon: ShoppingBag,
    title: "Unlock your runner",
    body: "Earn currency on every run. Spend it on characters, skins, and music tracks. No paywalls on progression.",
  },
] as const;

export function GameplayGallery() {
  return (
    <div className="gameplay-gallery">
      <div className="gameplay-atmosphere" aria-hidden="true">
        <CinematicVideo
          src="/assets/generated/trapman/gameplay-atmosphere.mp4"
          poster="/assets/generated/trapman/gameplay-atmosphere.webp"
          posterWidth={1536}
          posterHeight={864}
        />
      </div>

      {/* HUD chrome framing, recreating the in-game bar language: hexagonal
          neon-bordered stat readouts, pixel hearts, leading-zero score. */}
      <div className="tm-hud-bar" role="img" aria-label="TrapMan in-game HUD: high score 006580, three lives, level 1, score 000060">
        <HudChip label="High score" value="006580" accent="magenta" />
        <div className="tm-hud-bar__lives" aria-hidden="true">
          <PixelHeart />
          <PixelHeart />
          <PixelHeart />
        </div>
        <div className="tm-hud-bar__level pixel-type" aria-hidden="true">
          <span className="tm-hud-bar__level-label">Level</span>
          <span>01</span>
        </div>
        <HudChip label="Score" value="000060" accent="cyan" />
      </div>

      <div className="gameplay-features">
        {FEATURES.map(({ Icon, title, body }) => (
          <div key={title} className="gameplay-feature-card">
            <div className="gameplay-feature-icon" aria-hidden="true">
              <Icon size={28} />
            </div>
            <h3>{title}</h3>
            <p>{body}</p>
          </div>
        ))}
      </div>

      <MazeDivider className="tm-section-divider" />
    </div>
  );
}

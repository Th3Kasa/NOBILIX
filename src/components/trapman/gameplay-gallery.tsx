import Image from "next/image";
import { CinematicVideo } from "@/components/motion/cinematic-video";

const SCREENS = [
  {
    src: "/assets/trapman/screens/gameplay.png",
    alt: "TrapMan gameplay — runner navigating neon city obstacles",
    caption: "Run the neon streets",
  },
  {
    src: "/assets/trapman/screens/shop.png",
    alt: "TrapMan in-game shop showing character skins and power-ups",
    caption: "Gear up in the shop",
  },
  {
    src: "/assets/trapman/screens/leaderboard.png",
    alt: "TrapMan leaderboard displaying top ranked players",
    caption: "Climb the leaderboard",
  },
] as const;

export function GameplayGallery() {
  return (
    <div className="gameplay-gallery">
      {/* Cinematic atmosphere plate — replaces the CSS ::before background-image */}
      <div className="gameplay-atmosphere" aria-hidden="true">
        <CinematicVideo
          src="/assets/generated/trapman/gameplay-atmosphere.mp4"
          poster="/assets/generated/trapman/gameplay-atmosphere.webp"
          posterWidth={1536}
          posterHeight={864}
        />
      </div>
      {SCREENS.map(({ src, alt, caption }) => (
        <figure key={src} className="gameplay-figure">
          <div className="gameplay-frame">
            <Image
              src={src}
              alt={alt}
              width={390}
              height={844}
              sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 30vw"
              className="gameplay-img"
            />
          </div>
          <figcaption>{caption}</figcaption>
        </figure>
      ))}
    </div>
  );
}

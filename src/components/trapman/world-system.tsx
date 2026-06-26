import Image from "next/image";

export function WorldSystem() {
  return (
    <div className="world-system">
      <div className="world-system__copy">
        <p className="trapman-kicker">World system</p>
        <h2>Cyan paths, magenta pressure, starfield depth.</h2>
        <p>
          The web world borrows the game’s HUD geometry and grid language, then
          rebuilds it as original stage art for scrolling, scanning, and moving
          between feature sections.
        </p>
      </div>
      <div className="world-system__visual">
        <Image
          src="/assets/generated/trapman/gameplay-atmosphere.webp"
          alt="Original pixel-art TrapMan route atmosphere with cyan lanes and night city depth."
          width={1536}
          height={864}
          sizes="(max-width: 900px) 100vw, 52vw"
        />
        <Image
          src="/assets/generated/trapman/portal.webp"
          alt=""
          width={1200}
          height={1200}
          sizes="(max-width: 900px) 42vw, 16rem"
          className="world-system__portal"
        />
      </div>
    </div>
  );
}

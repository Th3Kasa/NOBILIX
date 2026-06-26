import { existsSync } from "node:fs";
import { join } from "node:path";
import Image from "next/image";

function hasAudioFile(): boolean {
  try {
    return existsSync(join(process.cwd(), "public/assets/trapman/music-preview.mp3"));
  } catch {
    return false;
  }
}

export function MusicStrip() {
  const audioAvailable = hasAudioFile();

  return (
    <div className="music-strip">
      <div className="music-strip__art">
        <Image
          src="/assets/generated/trapman/music-atmosphere.webp"
          alt="Original TrapMan music atmosphere with speakers, cables, and neon waveform light."
          width={1536}
          height={864}
          sizes="(max-width: 900px) 100vw, 48vw"
        />
      </div>
      <div className="music-strip__player">
        <div className="music-waveform" aria-hidden="true">
          {Array.from({ length: 32 }, (_, i) => (
            <span key={i} className="music-bar" style={{ "--bar-i": i } as React.CSSProperties} />
          ))}
        </div>
        {audioAvailable ? (
          <div className="music-player">
            <audio controls preload="none" className="music-audio">
              <source src="/assets/trapman/music-preview.mp3" type="audio/mpeg" />
              Your browser does not support audio playback.
            </audio>
          </div>
        ) : (
          <p className="music-soon">Music preview coming soon</p>
        )}
        <p className="music-label">Original synthwave soundtrack by Nobilix</p>
      </div>
    </div>
  );
}

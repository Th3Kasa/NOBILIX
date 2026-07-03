import { existsSync } from "node:fs";
import { join } from "node:path";
import { CinematicVideo } from "@/components/motion/cinematic-video";

function hasAudioFile(): boolean {
  try {
    return existsSync(join(process.cwd(), "public/assets/trapman/music-preview.mp3"));
  } catch {
    return false;
  }
}

/**
 * Restyled as the in-game player bar: album dot, track title, pixel progress
 * bar, and pause/skip chips (decorative UI, matching the gameplay
 * screenshot's bottom music strip) — plus a crew section crediting Lonely
 * Souljaz — Cult Shotta as the Sydney trap rap group behind the game.
 */
export function MusicStrip() {
  const audioAvailable = hasAudioFile();

  return (
    <div className="music-strip">
      <div className="music-strip__art">
        <CinematicVideo
          src="/assets/generated/trapman/music-atmosphere.mp4"
          poster="/assets/generated/trapman/music-atmosphere.webp"
          posterWidth={1536}
          posterHeight={864}
          alt="Original TrapMan music atmosphere with speakers, cables, and neon waveform light."
          sizes="(max-width: 900px) 100vw, 48vw"
        />
      </div>
      <div className="music-strip__player">
        <div className="tm-crew-card">
          <p className="tm-crew-card__eyebrow">Created by</p>
          <p className="tm-crew-card__name pixel-type">Lonely Souljaz</p>
          <p className="tm-crew-card__tag">Cult Shotta &middot; Sydney trap rap</p>
          <p className="tm-crew-card__body">
            TrapMan is scored end-to-end by Lonely Souljaz — Cult Shotta, the
            Sydney trap rap group behind the game&apos;s original soundtrack.
            Every run plays out over their tracks.
          </p>
        </div>

        <div className="tm-player-bar" role="group" aria-label="In-game music player">
          <div className="tm-player-bar__meta">
            <span className="tm-player-bar__dot" aria-hidden="true" />
            <div>
              <p className="tm-player-bar__track pixel-type">CEEBS</p>
              <p className="tm-player-bar__artist">Lonely Souljaz</p>
            </div>
          </div>
          <div className="tm-player-bar__transport" aria-hidden="true">
            <span className="tm-player-bar__chip">⏮</span>
            <span className="tm-player-bar__chip tm-player-bar__chip--play">⏸</span>
            <span className="tm-player-bar__chip">⏭</span>
          </div>
          <div className="tm-player-bar__progress" aria-hidden="true">
            <span className="tm-player-bar__time">00:00</span>
            <span className="tm-player-bar__track-bar">
              <span className="tm-player-bar__track-fill" />
            </span>
            <span className="tm-player-bar__time">02:07</span>
          </div>
        </div>

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
        <p className="music-label">Original soundtrack by Lonely Souljaz — Cult Shotta</p>
      </div>
    </div>
  );
}

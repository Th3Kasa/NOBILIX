import { CinematicVideo } from "@/components/motion/cinematic-video";
import { TrapManAudioPlayer } from "./audio-player";

/**
 * The in-game player bar, live: real soundtrack playback (starting with
 * CEEBS) in the same visual language as the gameplay screenshot's bottom
 * music strip — plus a crew section crediting Lonely Souljaz — Cult Shotta
 * as the Sydney trap rap group behind the game.
 */
export function MusicStrip() {
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

        <TrapManAudioPlayer />

        <div className="music-waveform" aria-hidden="true">
          {Array.from({ length: 32 }, (_, i) => (
            <span key={i} className="music-bar" style={{ "--bar-i": i } as React.CSSProperties} />
          ))}
        </div>
        <p className="music-label">Original soundtrack by Lonely Souljaz — Cult Shotta</p>
      </div>
    </div>
  );
}

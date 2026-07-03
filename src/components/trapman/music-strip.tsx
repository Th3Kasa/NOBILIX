import { CinematicVideo } from "@/components/motion/cinematic-video";

/**
 * Crew card + ambient atmosphere crediting Lonely Souljaz — Cult Shotta as
 * the Sydney trap rap group behind the game. Playback itself lives in the
 * floating TrapManAudioPlayer (rendered once at the page level, fixed to
 * the viewport) so the transport stays reachable while scrolling.
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

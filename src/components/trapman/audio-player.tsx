"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface Track {
  src: string;
  type: string;
  title: string;
  artist: string;
}

/** CEEBS always leads the queue (owner requirement). */
const TRACKS: Track[] = [
  {
    src: "/assets/trapman/music/lonely-souljaz-ceebs-8bit.mp3",
    type: "audio/mpeg",
    title: "CEEBS",
    artist: "Lonely Souljaz · 8-bit remix",
  },
  {
    src: "/assets/trapman/music/lil-golo-250-8bit.mp3",
    type: "audio/mpeg",
    title: "250",
    artist: "Lil Golo · 8-bit remix",
  },
  {
    src: "/assets/trapman/music/cult-shotta-block-gets-hot-8bit.wav",
    type: "audio/wav",
    title: "BLOCK GETS HOT LIKE BANGKOK",
    artist: "Cult Shotta · 8-bit remix",
  },
];

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "00:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/**
 * Floating in-game-styled music player, fixed to the bottom of the
 * viewport (mirrors the collapsible bar in the real gameplay screenshot).
 * Starts with CEEBS and attempts autoplay on arrival; when the browser
 * blocks it, playback starts on the visitor's first interaction anywhere on
 * the page instead. Tracks advance automatically and wrap around.
 *
 * Auto-collapses (fades, non-interactive) once the page footer scrolls
 * into view so it never sits on top of the footer's legal links.
 */
export function TrapManAudioPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.65);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [expanded, setExpanded] = useState(true);
  const [nearFooter, setNearFooter] = useState(false);
  const wantsAutoplay = useRef(true);

  const track = TRACKS[index];

  const play = useCallback(() => {
    audioRef.current?.play().catch(() => {
      /* blocked — the gesture listener below will retry */
    });
  }, []);

  // Attempt autoplay once; if blocked, arm a one-time first-gesture starter.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !wantsAutoplay.current) return;
    wantsAutoplay.current = false;

    let armed = false;
    const startOnGesture = () => {
      audio.play().catch(() => {});
      disarm();
    };
    const disarm = () => {
      if (!armed) return;
      armed = false;
      document.removeEventListener("pointerdown", startOnGesture);
      document.removeEventListener("keydown", startOnGesture);
    };

    audio.play().catch(() => {
      armed = true;
      document.addEventListener("pointerdown", startOnGesture, { once: true });
      document.addEventListener("keydown", startOnGesture, { once: true });
    });
    return disarm;
  }, []);

  // Keep the <audio> element's volume in sync with the slider.
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  // Fade out (and disable pointer events on) the floating player once the
  // page's legal-links block enters the viewport, so it never covers them.
  // Note: the shared NobilixFooter (.public-footer) is intentionally
  // display:none on /trapman routes (see trapman.css — TrapMan pages carry
  // their own chrome), so the real "footer" here is the #support section's
  // privacy/terms/data-compliance/delete-account link row.
  useEffect(() => {
    const target = document.querySelector(".trapman-support__links") ?? document.getElementById("support");
    if (!target) return;
    const observer = new IntersectionObserver(
      ([entry]) => setNearFooter(entry.isIntersecting),
      { rootMargin: "0px 0px -10% 0px" },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  // When the queue position changes, load and keep playing if we were playing.
  const go = useCallback(
    (nextIndex: number, autoplay = true) => {
      const audio = audioRef.current;
      const next = (nextIndex + TRACKS.length) % TRACKS.length;
      setIndex(next);
      setCurrentTime(0);
      setDuration(0);
      if (audio && autoplay) {
        // src swap happens via React; play after the new source is ready.
        requestAnimationFrame(() => play());
      }
    },
    [play],
  );

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) play();
    else audio.pause();
  };

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const t = Number(e.target.value);
    audio.currentTime = t;
    setCurrentTime(t);
  };

  return (
    <div
      ref={rootRef}
      className="tm-floating-player"
      data-expanded={expanded || undefined}
      data-hidden={nearFooter || undefined}
    >
      {/* key forces a clean reload when the track changes */}
      <audio
        key={track.src}
        ref={audioRef}
        preload={index === 0 ? "auto" : "metadata"}
        muted={muted}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => go(index + 1)}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
      >
        <source src={track.src} type={track.type} />
      </audio>

      <div className="tm-player-bar tm-player-bar--live" role="group" aria-label="TrapMan soundtrack player">
        <button
          type="button"
          className="tm-floating-player__toggle"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          aria-label={expanded ? "Collapse music player" : "Expand music player"}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" className={expanded ? "" : "tm-floating-player__chevron--flipped"}>
            <path d="M6 15l6-6 6 6" stroke="currentColor" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <div className="tm-player-bar__meta">
          <span className="tm-player-bar__dot" data-playing={playing || undefined} aria-hidden="true" />
          <div aria-live="polite">
            <p className="tm-player-bar__track pixel-type">{track.title}</p>
            {expanded && <p className="tm-player-bar__artist">{track.artist}</p>}
          </div>
        </div>

        <div className="tm-player-bar__transport">
          {expanded && (
            <button type="button" className="tm-player-bar__chip" onClick={() => go(index - 1)} aria-label="Previous track">
              ⏮
            </button>
          )}
          <button
            type="button"
            className="tm-player-bar__chip tm-player-bar__chip--play"
            onClick={toggle}
            aria-label={playing ? "Pause" : "Play"}
          >
            {playing ? "⏸" : "▶"}
          </button>
          {expanded && (
            <>
              <button type="button" className="tm-player-bar__chip" onClick={() => go(index + 1)} aria-label="Next track">
                ⏭
              </button>
              <button
                type="button"
                className="tm-player-bar__chip tm-player-bar__chip--mute"
                onClick={() => setMuted((m) => !m)}
                aria-label={muted ? "Unmute" : "Mute"}
                aria-pressed={muted}
              >
                {muted ? "🔇" : "🔊"}
              </button>
            </>
          )}
        </div>

        {expanded && (
          <>
            <div className="tm-player-bar__progress">
              <span className="tm-player-bar__time">{formatTime(currentTime)}</span>
              <input
                type="range"
                className="tm-player-bar__seek"
                min={0}
                max={Number.isFinite(duration) && duration > 0 ? duration : 0}
                step={1}
                value={Math.min(currentTime, duration || 0)}
                onChange={seek}
                aria-label="Seek position"
              />
              <span className="tm-player-bar__time">{formatTime(duration)}</span>
            </div>

            <div className="tm-player-bar__volume-row">
              <span className="tm-player-bar__volume-icon" aria-hidden="true">{muted || volume === 0 ? "🔇" : "🔊"}</span>
              <input
                type="range"
                className="tm-player-bar__seek tm-player-bar__volume"
                min={0}
                max={1}
                step={0.01}
                value={muted ? 0 : volume}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setVolume(v);
                  if (muted && v > 0) setMuted(false);
                }}
                aria-label="Volume"
              />
            </div>

            <ol className="tm-player-queue" aria-label="Track list">
              {TRACKS.map((t, i) => (
                <li key={t.src}>
                  <button
                    type="button"
                    className="tm-player-queue__row"
                    data-active={i === index || undefined}
                    onClick={() => go(i)}
                    aria-current={i === index ? "true" : undefined}
                  >
                    <span className="tm-player-queue__num pixel-type">{String(i + 1).padStart(2, "0")}</span>
                    <span className="tm-player-queue__title">{t.title}</span>
                    <span className="tm-player-queue__artist">{t.artist}</span>
                  </button>
                </li>
              ))}
            </ol>
          </>
        )}
      </div>
    </div>
  );
}

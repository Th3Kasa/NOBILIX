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
 * The real in-game-styled music player. Starts with CEEBS and attempts
 * autoplay on arrival; when the browser blocks it (standard autoplay
 * policy), playback starts on the visitor's first interaction anywhere on
 * the page instead. Tracks advance automatically and wrap around.
 */
export function TrapManAudioPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
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
    <div className="tm-player-bar tm-player-bar--live" role="group" aria-label="TrapMan soundtrack player">
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

      <div className="tm-player-bar__meta">
        <span className="tm-player-bar__dot" data-playing={playing || undefined} aria-hidden="true" />
        <div aria-live="polite">
          <p className="tm-player-bar__track pixel-type">{track.title}</p>
          <p className="tm-player-bar__artist">{track.artist}</p>
        </div>
      </div>

      <div className="tm-player-bar__transport">
        <button type="button" className="tm-player-bar__chip" onClick={() => go(index - 1)} aria-label="Previous track">
          ⏮
        </button>
        <button
          type="button"
          className="tm-player-bar__chip tm-player-bar__chip--play"
          onClick={toggle}
          aria-label={playing ? "Pause" : "Play"}
        >
          {playing ? "⏸" : "▶"}
        </button>
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
      </div>

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
    </div>
  );
}

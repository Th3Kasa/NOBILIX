"use client";

import { useState } from "react";
import type React from "react";

const CHARACTERS = [
  {
    id: "lil-golo",
    accent: "#39e9ff",
    name: "Lil Golo",
    tag: "Speed · Agility",
    description:
      "Fast and fearless. Lil Golo slips through tight corridors at full sprint, collecting coins others can't reach.",
  },
  {
    id: "shotta",
    accent: "#f144ff",
    name: "Shotta",
    tag: "Power · Endurance",
    description:
      "Built different. Shotta breaks through barriers the others can't touch, turning every obstacle into a shortcut.",
  },
] as const;

/**
 * Recreates the game's character-select podium scene natively: a glowing
 * neon ring, left/right arrow chips, and a neon-bordered name plate, with a
 * stylized avatar badge standing in for detailed character art (per brief:
 * no attempt at pixel-accurate character art in CSS). Client component so
 * the toggle is interactive and keyboard accessible.
 *
 * The commented block below marks the future drop-in slot for
 * `trapman/characters-loop.mp4` (two runners idling on the podium) once
 * that asset is generated — the CSS scene underneath keeps working as the
 * poster/fallback in the meantime.
 */
export function CharacterShowcase() {
  const [index, setIndex] = useState(0);
  const character = CHARACTERS[index];

  function go(delta: 1 | -1) {
    setIndex((current) => (current + delta + CHARACTERS.length) % CHARACTERS.length);
  }

  return (
    <div
      className="tm-podium-stage"
      style={{ "--char-accent": character.accent } as React.CSSProperties}
    >
      <div className="tm-podium-scene" aria-hidden="true">
        {/* ── Future media slot: trapman/characters-loop.mp4 ──────────────
            A short animated loop of the two runners idling on this podium,
            generated later via the MuAPI pipeline (see
            docs/media-brief-trapman.md §"Podium loop"). When the asset
            lands, drop it in here as:
              <video className="tm-podium-scene__video" autoPlay muted loop
                     playsInline poster="/assets/generated/trapman/characters-loop-poster.webp">
                <source src="/assets/generated/trapman/characters-loop.mp4" type="video/mp4" />
              </video>
            positioned absolutely over the ring, with the CSS badge below
            remaining as the no-JS / reduced-motion / load-failure fallback. */}
        <div className="tm-podium-ring" />
        <div className="tm-podium-ring tm-podium-ring--outer" />
        <div className="tm-podium-glow" />
        <div className="tm-podium-avatar">
          <span className="tm-podium-avatar__initial">{character.name.charAt(0)}</span>
        </div>
        <div className="tm-podium-base" />
      </div>

      <div className="tm-podium-controls">
        <button
          type="button"
          className="tm-podium-arrow"
          onClick={() => go(-1)}
          aria-label="Previous runner"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 4 7 12l8 8" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>

        <div className="tm-podium-plate pixel-type" role="status" aria-live="polite">
          {character.name}
        </div>

        <button
          type="button"
          className="tm-podium-arrow"
          onClick={() => go(1)}
          aria-label="Next runner"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4l8 8-8 8" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
      </div>

      <div className="tm-podium-tabs" role="tablist" aria-label="Choose a runner">
        {CHARACTERS.map((c, i) => (
          <button
            key={c.id}
            type="button"
            role="tab"
            aria-selected={i === index}
            className="tm-podium-tab"
            data-active={i === index}
            onClick={() => setIndex(i)}
          >
            {c.name}
          </button>
        ))}
      </div>

      <div className="tm-podium-info">
        <p className="character-tag">{character.tag}</p>
        <p className="character-desc">{character.description}</p>
      </div>
    </div>
  );
}

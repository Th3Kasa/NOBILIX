import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = (path) => readFileSync(resolve(root, path), "utf8");

test("TrapMan route presents the complete animated project world", () => {
  const page = read("src/app/(public)/trapman/page.tsx");

  for (const id of [
    "trapman-hero",
    "the-run",
    "characters",
    "world",
    "music",
    "shop",
    "leaderboard",
    "account",
    "support",
  ]) {
    assert.match(page, new RegExp(`id="${id}"`), `${id} section missing`);
  }

  assert.match(page, /WorldSystem/);
  assert.match(page, /ShopSection/);
  // The floating in-game music player replaced the section-scoped audio.
  assert.match(page, /TrapManAudioPlayer/);
  assert.match(page, /Reveal/);
  assert.match(page, /Pixel soul\. Premium stage\./);
});

test("TrapMan uses generated atmosphere assets and no game screenshots", () => {
  const hero = read("src/components/trapman/city-hero.tsx");
  const gallery = read("src/components/trapman/gameplay-gallery.tsx");
  const characters = read("src/components/trapman/character-showcase.tsx");
  const world = read("src/components/trapman/world-system.tsx");
  const music = read("src/components/trapman/music-strip.tsx");

  for (const asset of [
    "city-hero.webp",
    "city-mobile.webp",
    "gameplay-atmosphere.webp",
    "music-atmosphere.webp",
  ]) {
    assert.match(`${hero}\n${world}\n${music}\n${gallery}`, new RegExp(asset));
  }
  assert.doesNotMatch(`${hero}\n${world}\n${gallery}`, /portal\.webp/, "portal.webp must not appear (removed)");

  const allSources = `${hero}\n${gallery}\n${characters}`;
  for (const screenshot of [
    "home-lil-golo.png",
    "home-shotta.png",
    "gameplay.png",
    "shop.png",
    "leaderboard.png",
  ]) {
    assert.doesNotMatch(allSources, new RegExp(screenshot), `Game screenshot must not appear: ${screenshot}`);
  }

  // The official logo now lives in the sticky header rather than the hero.
  const header = read("src/components/trapman/trapman-header.tsx");
  assert.match(header, /trapman-logo\.png/);
});

test("shop section is the deliberate exception: it exhibits the real in-game screenshot", () => {
  // Every other section recreates the game in original stage art; the shop
  // section intentionally breaks that rule and shows the real capture.
  const shop = read("src/components/trapman/shop-section.tsx");
  assert.match(shop, /shop-plate\.webp/);
  assert.match(shop, /shop\.png/);
  assert.match(shop, /Reveal/);
});

test("TrapMan animation is Motion-backed, pausable, and reduced-motion aware", () => {
  const cityMotion = read("src/components/trapman/city-motion.tsx");
  const css = read("src/app/(public)/trapman/trapman.css");

  assert.match(cityMotion, /motion\/react/);
  assert.match(cityMotion, /useReducedMotion/);
  assert.match(cityMotion, /visibilitychange/);
  assert.match(cityMotion, /document\.hidden/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /animation-play-state:\s*paused/);
});

test("TrapMan audio never autoplays", () => {
  // Playback lives in the floating audio player; it must start paused and
  // must never carry an autoPlay attribute. (Its internal `autoplay` track
  // -advance parameter only runs after the user has pressed play.)
  const player = read("src/components/trapman/audio-player.tsx");
  assert.doesNotMatch(player, /autoPlay/);
  assert.match(player, /setPlaying\]\s*=\s*useState\(false\)/);
  // The music section itself must not embed its own audio element.
  const music = read("src/components/trapman/music-strip.tsx");
  assert.doesNotMatch(music, /<audio/);
});

test("new TrapMan world components exist", () => {
  for (const path of [
    "src/components/trapman/world-system.tsx",
    "src/components/trapman/audio-player.tsx",
  ]) {
    assert.equal(existsSync(resolve(root, path)), true, `${path} must exist`);
  }
});

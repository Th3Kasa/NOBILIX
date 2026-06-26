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
  assert.match(page, /ShopShowcase/);
  assert.match(page, /Reveal/);
  assert.match(page, /Pixel soul\. Premium stage\./);
});

test("TrapMan uses generated atmosphere assets and official screenshot evidence", () => {
  const hero = read("src/components/trapman/city-hero.tsx");
  const gallery = read("src/components/trapman/gameplay-gallery.tsx");
  const world = read("src/components/trapman/world-system.tsx");
  const shop = read("src/components/trapman/shop-showcase.tsx");
  const music = read("src/components/trapman/music-strip.tsx");

  for (const asset of [
    "city-hero.webp",
    "city-mobile.webp",
    "portal.webp",
    "gameplay-atmosphere.webp",
    "music-atmosphere.webp",
  ]) {
    assert.match(`${hero}\n${world}\n${shop}\n${music}`, new RegExp(asset));
  }

  for (const screenshot of [
    "home-lil-golo.png",
    "home-shotta.png",
    "gameplay.png",
    "shop.png",
    "leaderboard.png",
  ]) {
    assert.match(`${hero}\n${gallery}\n${shop}`, new RegExp(screenshot));
  }

  assert.match(hero, /trapman-logo\.png/);
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
  const music = read("src/components/trapman/music-strip.tsx");
  assert.match(music, /preload="none"/);
  assert.doesNotMatch(music, /autoplay|autoPlay/);
});

test("new TrapMan world components exist", () => {
  for (const path of [
    "src/components/trapman/world-system.tsx",
    "src/components/trapman/shop-showcase.tsx",
  ]) {
    assert.equal(existsSync(resolve(root, path)), true, `${path} must exist`);
  }
});

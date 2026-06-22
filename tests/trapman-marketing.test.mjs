import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");

test("official TrapMan marketing assets are present", () => {
  for (const path of [
    "public/assets/trapman-logo.png",
    "public/assets/trapman/screens/home-lil-golo.png",
    "public/assets/trapman/screens/home-shotta.png",
    "public/assets/trapman/screens/gameplay.png",
    "public/assets/trapman/screens/shop.png",
    "public/assets/trapman/screens/leaderboard.png",
  ]) assert.equal(existsSync(resolve(root, path)), true, `${path} missing`);
});

test("TrapMan marketing route contains required sections", () => {
  const source = readFileSync(resolve(root, "src/app/(public)/trapman/page.tsx"), "utf8");
  for (const id of ["the-run", "characters", "music", "leaderboard", "account", "support"]) {
    assert.match(source, new RegExp(`id="${id}"`));
  }
});

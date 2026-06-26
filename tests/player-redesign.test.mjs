import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = (path) => readFileSync(resolve(root, path), "utf8");

test("TrapMan login is a designed, labeled, mobile-friendly player surface", () => {
  const page = read("src/app/(public)/trapman/account/login/page.tsx");
  const form = read("src/components/trapman/account/player-login-form.tsx");

  assert.match(page, /Pixel account portal/);
  assert.match(page, /trapman-login-card/);
  assert.match(form, /aria-live="polite"/);
  assert.match(form, /htmlFor="player-email"/);
  assert.match(form, /htmlFor="player-password"/);
  assert.match(form, /showPassword/);
  assert.match(form, /aria-label=\{showPassword \? "Hide password" : "Show password"\}/);
  assert.match(form, /autoComplete="current-password"/);
});

test("player account shell and states expose navigation, loading, error, and empty treatments", () => {
  const layout = read("src/app/(player)/trapman/account/layout.tsx");
  const page = read("src/app/(player)/trapman/account/page.tsx");
  const loading = read("src/app/(player)/trapman/account/loading.tsx");
  const error = read("src/app/(player)/trapman/account/error.tsx");
  const purchases = read("src/components/trapman/account/purchase-history.tsx");

  assert.match(layout, /MobileNavigation/);
  assert.match(layout, /accountNavigationItems/);
  assert.match(page, /player-dashboard-grid/);
  assert.match(loading, /player-account-skeleton/);
  assert.match(error, /player-account-error-card/);
  assert.match(purchases, /player-empty-state/);
});

test("account actions separate destructive deletion from normal account tasks", () => {
  const actions = read("src/components/trapman/account/account-actions.tsx");
  const deletion = read("src/components/trapman/account/delete-account-form.tsx");

  assert.match(actions, /player-action-group/);
  assert.match(actions, /player-danger-zone/);
  assert.match(actions, /Download my data/);
  assert.match(actions, /Delete my account/);
  assert.match(deletion, /DELETE TRAPMAN/);
  assert.match(deletion, /aria-describedby="delete-account-warning"/);
});

test("TrapMan legal shell provides contents navigation and exact collection disclosures", () => {
  const shell = read("src/app/(public)/trapman/_legal/legal-shell.tsx");
  const inventory = read("src/content/trapman/data-inventory.ts");
  const privacy = read("src/content/trapman/privacy.ts");

  assert.match(shell, /legal-contents-nav/);
  assert.match(shell, /Company legal/);
  for (const phrase of [
    "User Name",
    "User Email",
    "User Country",
    "Competitions Won",
    "Purchases Made",
    "Purchased Item",
    "Time Played",
    "Ads Watched",
    "Ads Clicked",
    "users/{uid}",
    "player_progress/{uid}",
    "purchases/{purchaseId}",
    "session_end",
    "duration_ms",
    "ad_closed",
    "ad_clicked",
  ]) {
    assert.match(`${inventory}\n${privacy}`, new RegExp(phrase.replace(/[{}]/g, "\\$&")));
  }
  assert.match(inventory, /ad_closed[\s\S]*closed/i);
  assert.doesNotMatch(inventory, /ad_closed[\s\S]{0,220}fully watched/i);
});

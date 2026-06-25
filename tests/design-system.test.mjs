import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = (path) => readFileSync(resolve(root, path), "utf8");

test("root layout exposes a keyboard skip link and target around route content", () => {
  const source = read("src/app/layout.tsx");

  assert.match(source, /href="#main-content"/);
  assert.match(source, /id="main-content"/);
  assert.match(source, /tabIndex=\{-1\}/);
  assert.match(source, /<MotionProvider>[\s\S]*\{children\}[\s\S]*<\/MotionProvider>/);
});

test("motion provider respects the user's reduced-motion preference", () => {
  const path = resolve(root, "src/components/motion/motion-provider.tsx");
  assert.equal(existsSync(path), true, "MotionProvider must exist");

  const source = read("src/components/motion/motion-provider.tsx");
  assert.match(source, /^"use client";/);
  assert.match(source, /MotionConfig/);
  assert.match(source, /reducedMotion="user"/);
});

test("reveal and parallax primitives have static reduced-motion behavior", () => {
  for (const path of [
    "src/components/motion/reveal.tsx",
    "src/components/motion/parallax-media.tsx",
  ]) {
    assert.equal(existsSync(resolve(root, path)), true, `${path} must exist`);
    assert.match(read(path), /useReducedMotion/);
  }

  const reveal = read("src/components/motion/reveal.tsx");
  assert.match(reveal, /whileInView/);
  assert.match(reveal, /viewport=\{\{\s*once:\s*true/);
  assert.match(reveal, /shouldReduceMotion/);

  const parallax = read("src/components/motion/parallax-media.tsx");
  assert.match(parallax, /useScroll/);
  assert.match(parallax, /useTransform/);
  assert.match(parallax, /shouldReduceMotion/);
});

test("global CSS defines semantic shared tokens and scoped TrapMan tokens", () => {
  const source = read("src/app/globals.css");
  const tokenGroups = [
    "--company-",
    "--project-",
    "--status-",
    "--surface-",
    "--focus-",
    "--space-",
    "--duration-",
    "--z-",
  ];

  for (const tokenGroup of tokenGroups) {
    assert.match(source, new RegExp(tokenGroup), `${tokenGroup} tokens missing`);
  }

  assert.match(source, /\.trapman-site\s*\{[\s\S]*--project-/);
  assert.match(source, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  assert.match(source, /@media\s*\(forced-colors:\s*active\)/);
});

test("shared controls meet minimum touch targets and expose interaction states", () => {
  const button = read("src/components/ui/button.tsx");
  const input = read("src/components/ui/input.tsx");
  const textarea = read("src/components/ui/textarea.tsx");
  const card = read("src/components/ui/card.tsx");

  assert.match(button, /min-h-11/);
  assert.match(button, /min-w-11/);
  assert.match(button, /aria-busy/);
  assert.match(button, /data-\[loading=true\]/);
  assert.match(button, /active:/);

  for (const [name, source] of [
    ["input", input],
    ["textarea", textarea],
  ]) {
    assert.match(source, /min-h-11/, `${name} must be at least 44px high`);
    assert.match(source, /aria-\[invalid=true\]/, `${name} error state missing`);
    assert.match(source, /focus-visible:/, `${name} focus state missing`);
    assert.match(source, /disabled:/, `${name} disabled state missing`);
  }

  assert.match(card, /data-\[state=selected\]/);
  assert.match(card, /focus-within:/);
});

test("mobile navigation provides a labeled dismissible accessible sheet", () => {
  const path = resolve(root, "src/components/nav/mobile-navigation.tsx");
  assert.equal(existsSync(path), true, "MobileNavigation must exist");

  const source = read("src/components/nav/mobile-navigation.tsx");
  assert.match(source, /^"use client";/);
  assert.match(source, /aria-label="Open navigation"/);
  assert.match(source, /aria-expanded=\{open\}/);
  assert.match(source, /role="dialog"/);
  assert.match(source, /aria-modal="true"/);
  assert.match(source, /aria-label=\{label\}/);
  assert.match(source, /event\.key === "Escape"/);
  assert.match(source, /aria-current=\{item\.active \? "page" : undefined\}/);
  assert.match(source, /AnimatePresence/);
});

test("modal has labeled semantics, Escape dismissal, and focus management", () => {
  const source = read("src/components/ui/modal.tsx");

  assert.match(source, /aria-labelledby/);
  assert.match(source, /aria-describedby/);
  assert.match(source, /e\.key === "Escape"/);
  assert.match(source, /\.focus\(\)/);
  assert.match(source, /previouslyFocused/);
});

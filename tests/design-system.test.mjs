import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = (path) => readFileSync(resolve(root, path), "utf8");

test("skip link targets the actual route main landmarks", () => {
  const source = read("src/app/layout.tsx");

  assert.match(source, /href="#main-content"/);
  assert.doesNotMatch(source, /<div id="main-content"/);
  assert.match(source, /<MotionProvider>[\s\S]*\{children\}[\s\S]*<\/MotionProvider>/);

  for (const path of [
    "src/app/(public)/layout.tsx",
    "src/app/console/(auth)/layout.tsx",
    "src/app/console/(dashboard)/page.tsx",
    "src/app/console/(dashboard)/trapman/layout.tsx",
    "src/app/(player)/trapman/account/layout.tsx",
  ]) {
    const shell = read(path);
    assert.match(shell, /<main[\s\S]*id="main-content"/, `${path} needs the target main`);
    assert.match(shell, /tabIndex=\{-1\}/, `${path} target must be programmatically focusable`);
  }
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

function parseOklch(value) {
  const match = value.match(
    /oklch\(\s*([\d.]+)\s+([\d.]+)\s+([-\d.]+)(?:deg)?\s*\)/,
  );
  assert.ok(match, `Expected OKLCH color, received ${value}`);
  return match.slice(1).map(Number);
}

function relativeLuminance(value) {
  const [lightness, chroma, hue] = parseOklch(value);
  const radians = (hue * Math.PI) / 180;
  const a = chroma * Math.cos(radians);
  const b = chroma * Math.sin(radians);
  const lPrime = lightness + 0.3963377774 * a + 0.2158037573 * b;
  const mPrime = lightness - 0.1055613458 * a - 0.0638541728 * b;
  const sPrime = lightness - 0.0894841775 * a - 1.291485548 * b;
  const l = lPrime ** 3;
  const m = mPrime ** 3;
  const s = sPrime ** 3;
  const clamp = (channel) => Math.min(1, Math.max(0, channel));
  const red = clamp(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s);
  const green = clamp(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s);
  const blue = clamp(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s);
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrastRatio(first, second) {
  const lighter = Math.max(relativeLuminance(first), relativeLuminance(second));
  const darker = Math.min(relativeLuminance(first), relativeLuminance(second));
  return (lighter + 0.05) / (darker + 0.05);
}

function readDarkToken(name) {
  const source = read("src/app/globals.css");
  const dark = source.match(/\.dark\s*\{([\s\S]*?)\n\}/)?.[1];
  assert.ok(dark, "dark token block missing");
  const value = dark.match(new RegExp(`${name}:\\s*([^;]+);`))?.[1].trim();
  assert.ok(value, `${name} missing from dark tokens`);
  return value;
}

test("dark danger text and control boundaries meet WCAG contrast", () => {
  assert.ok(
    contrastRatio(
      readDarkToken("--status-danger"),
      readDarkToken("--status-danger-contrast"),
    ) >= 4.5,
    "dark danger foreground must reach 4.5:1",
  );
  assert.ok(
    contrastRatio(
      readDarkToken("--surface-border"),
      readDarkToken("--surface-panel"),
    ) >= 3,
    "dark control boundary must reach 3:1 against panels",
  );
  assert.ok(
    contrastRatio(
      readDarkToken("--surface-border"),
      readDarkToken("--company-canvas"),
    ) >= 3,
    "dark control boundary must reach 3:1 against the canvas",
  );
});

test("shared controls meet touch targets without paint-property transitions", () => {
  const button = read("src/components/ui/button.tsx");
  const input = read("src/components/ui/input.tsx");
  const textarea = read("src/components/ui/textarea.tsx");
  const card = read("src/components/ui/card.tsx");
  const navigation = read("src/components/nav/mobile-navigation.tsx");
  const globals = read("src/app/globals.css");

  assert.match(button, /min-h-11/);
  assert.match(button, /min-w-11/);
  assert.match(button, /aria-busy/);
  assert.match(button, /data-\[loading=true\]/);
  assert.match(button, /active:/);
  assert.doesNotMatch(button, /transition-\[[^\]]*(?:color|background|border|shadow)/);

  for (const [name, source] of [
    ["input", input],
    ["textarea", textarea],
  ]) {
    assert.match(
      source,
      name === "textarea" ? /min-h-20/ : /min-h-11/,
      `${name} must meet its minimum height`,
    );
    assert.match(source, /aria-\[invalid=true\]/, `${name} error state missing`);
    assert.match(source, /focus-visible:/, `${name} focus state missing`);
    assert.match(source, /disabled:/, `${name} disabled state missing`);
    assert.doesNotMatch(
      source,
      /transition-(?:colors|\[[^\]]*(?:color|background|border|shadow))/,
      `${name} must not animate paint properties`,
    );
  }

  assert.match(textarea, /min-h-20/);
  assert.match(card, /data-\[state=selected\]/);
  assert.match(card, /focus-within:/);
  assert.doesNotMatch(card, /transition-\[[^\]]*(?:color|background|border|shadow)/);
  assert.doesNotMatch(navigation, /transition-colors/);
  assert.match(globals, /transition-property:\s*transform,\s*opacity/);
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
  assert.match(source, /item\.active\s*\?\s*"text-primary-foreground"/);
});

test("modal keeps its focus lifecycle dependent only on open", () => {
  const source = read("src/components/ui/modal.tsx");

  assert.match(source, /aria-labelledby/);
  assert.match(source, /aria-describedby/);
  assert.match(source, /useEffectEvent|onCloseRef/);
  assert.match(source, /\}, \[open\]\)/);
});

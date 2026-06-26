import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = (path) => readFileSync(resolve(root, path), "utf8");

test("Nobilix homepage exposes company brand landmarks and generated studio media", () => {
  const page = read("src/app/(public)/page.tsx");
  const hero = read("src/components/public/studio-hero.tsx");
  const principles = read("src/components/public/studio-principles.tsx");
  const showcase = read("src/components/public/project-showcase.tsx");

  assert.match(page, /<StudioHero\s*\/>/);
  assert.match(page, /<StudioPrinciples\s*\/>/);
  assert.match(page, /<ProjectShowcase\s*\/>/);
  assert.match(hero, /aria-labelledby="company-title"/);
  assert.match(hero, /id="company-title"/);
  assert.match(hero, /studio-hero\.webp/);
  assert.match(hero, /Reveal/);
  assert.match(hero, /ParallaxMedia/);
  assert.match(principles, /id="principles"/);
  assert.match(principles, /aria-labelledby="principles-title"/);
  assert.match(principles, /Design systems that can hold more than one project/);
  assert.match(showcase, /id="projects"/);
  assert.match(showcase, /aria-labelledby="projects-title"/);
  assert.match(showcase, /project-transition\.webp/);
});

test("public header offers responsive company navigation", () => {
  const header = read("src/components/public/nobilix-header.tsx");

  assert.match(header, /MobileNavigation/);
  assert.match(header, /items=\{navigationItems\}/);
  assert.match(header, /Studio/);
  assert.match(header, /Projects/);
  assert.match(header, /Company legal/);
  assert.match(header, /Console/);
  assert.match(header, /aria-label="Nobilix home"/);
});

test("portfolio remains scalable without inventing future projects", () => {
  const projectCard = read("src/components/public/project-card.tsx");
  const showcase = read("src/components/public/project-showcase.tsx");

  assert.match(projectCard, /ProjectDefinition/);
  assert.match(projectCard, /project\.status/);
  assert.match(projectCard, /project\.publicPath/);
  assert.match(projectCard, /project\.accountPath/);
  assert.match(showcase, /PROJECTS\.trapman/);
  assert.match(showcase, /main project/i);
  assert.match(showcase, /more worlds are being shaped/i);
  assert.doesNotMatch(showcase, /placeholder|coming soon card|fake/i);
});

test("company legal directory separates company and TrapMan legal destinations", () => {
  const legal = read("src/app/(public)/legal/page.tsx");

  assert.match(legal, /aria-labelledby="company-legal-title"/);
  assert.match(legal, /Company brand/);
  assert.match(legal, /Corporate notices/);
  assert.match(legal, /Project policies/);
  assert.match(legal, /Nobilix Pty Ltd/);
  assert.match(legal, /project\.legal\.privacy/);
  assert.match(legal, /project\.legal\.terms/);
  assert.match(legal, /project\.legal\.compliance/);
  assert.match(legal, /project\.legal\.deletion/);
  assert.match(legal, /max-width:\s*72ch|legal-reading/);
});

test("custom 404 offers useful recovery paths", () => {
  const notFound = read("src/app/(public)/not-found.tsx");

  assert.match(notFound, /Page not found/);
  assert.match(notFound, /Return to Nobilix/);
  assert.match(notFound, /View TrapMan/);
  assert.match(notFound, /Open console/);
  assert.match(notFound, /Contact Nobilix/);
});

test("Task 3 component files exist", () => {
  for (const path of [
    "src/components/public/studio-hero.tsx",
    "src/components/public/studio-principles.tsx",
    "src/components/public/project-showcase.tsx",
  ]) {
    assert.equal(existsSync(resolve(root, path)), true, `${path} must exist`);
  }
});

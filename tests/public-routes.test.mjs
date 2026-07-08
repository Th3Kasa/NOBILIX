import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const source = readFileSync(resolve(root, "next.config.ts"), "utf8");

test("legacy TrapMan legal URLs redirect to project-scoped routes", () => {
  assert.match(source, /source:\s*"\/privacy-policy"[\s\S]*destination:\s*"\/trapman\/privacy-policy"/);
  assert.match(source, /source:\s*"\/terms-of-use"[\s\S]*destination:\s*"\/trapman\/terms-of-use"/);
  assert.match(source, /source:\s*"\/data-compliance"[\s\S]*destination:\s*"\/trapman\/data-compliance"/);
  assert.doesNotMatch(source, /destination:\s*"\/site\//);
});

test("public shell is separated from the console shell", () => {
  const publicLayout = readFileSync(resolve(root, "src/app/(public)/layout.tsx"), "utf8");
  const rootLayout = readFileSync(resolve(root, "src/app/layout.tsx"), "utf8");
  assert.match(publicLayout, /NobilixHeader/);
  assert.match(publicLayout, /NobilixFooter/);
  assert.doesNotMatch(rootLayout, /robots:\s*\{\s*index:\s*false/);
});

test("Nobilix public routes are App Router pages", () => {
  for (const path of [
    "src/app/(public)/page.tsx",
    "src/app/(public)/legal/page.tsx",
    "src/app/(public)/not-found.tsx",
  ]) {
    assert.equal(existsSync(resolve(root, path)), true, `${path} must exist`);
  }
});

test("public metadata routes exist and preview artifacts stay ignored", () => {
  assert.equal(existsSync(resolve(root, "src/app/sitemap.ts")), true);
  assert.equal(existsSync(resolve(root, "src/app/robots.ts")), true);
  assert.match(readFileSync(resolve(root, ".gitignore"), "utf8"), /^\.superpowers\/$/m);
});

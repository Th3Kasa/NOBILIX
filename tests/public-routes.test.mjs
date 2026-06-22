import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const source = readFileSync(resolve(root, "next.config.ts"), "utf8");

test("legacy TrapMan legal URLs redirect to project-scoped routes", () => {
  assert.match(source, /source:\s*"\/privacy-policy"[\s\S]*destination:\s*"\/trapman\/privacy-policy"/);
  assert.match(source, /source:\s*"\/terms-of-use"[\s\S]*destination:\s*"\/trapman\/terms-of-use"/);
  assert.match(source, /source:\s*"\/data-compliance"[\s\S]*destination:\s*"\/trapman\/data-compliance"/);
  assert.match(source, /source:\s*"\/delete-account"[\s\S]*destination:\s*"\/trapman\/delete-account"/);
  assert.doesNotMatch(source, /destination:\s*"\/site\//);
});

test("public shell is separated from the console shell", () => {
  const publicLayout = readFileSync(resolve(root, "src/app/(public)/layout.tsx"), "utf8");
  const rootLayout = readFileSync(resolve(root, "src/app/layout.tsx"), "utf8");
  assert.match(publicLayout, /NobilixHeader/);
  assert.match(publicLayout, /NobilixFooter/);
  assert.doesNotMatch(rootLayout, /robots:\s*\{\s*index:\s*false/);
});

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = (path) => readFileSync(resolve(root, path), "utf8");

test("project registry defines TrapMan without secrets", () => {
  const source = read("src/config/projects.ts");
  assert.match(source, /slug:\s*"trapman"/);
  assert.match(source, /privacy:\s*"\/trapman\/privacy-policy"/);
  assert.doesNotMatch(source, /private_key|client_email|apiKey|password/i);
});

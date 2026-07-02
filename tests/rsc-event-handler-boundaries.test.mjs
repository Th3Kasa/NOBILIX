import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const srcDir = resolve(root, "src");

function collectTsxFiles(dir) {
  const results = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = resolve(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectTsxFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith(".tsx")) {
      results.push(fullPath);
    }
  }
  return results;
}

// A JSX event-handler prop like `onClick={...}` / `onError={...}` renders as a
// function passed to a DOM element. React forbids this inside a Server
// Component — it is a runtime crash that neither `next build` nor unit tests
// surface (it only fires when the server actually renders the element). This
// test enforces that any component using such a handler is a Client Component.
const EVENT_HANDLER_RE = /\son[A-Z][a-zA-Z]+=\{/;
const USE_CLIENT_RE = /^\s*["']use client["'];/m;

test("every component that uses a JSX event handler is a Client Component", () => {
  const offenders = [];

  for (const filePath of collectTsxFiles(srcDir)) {
    const contents = readFileSync(filePath, "utf8");
    if (EVENT_HANDLER_RE.test(contents) && !USE_CLIENT_RE.test(contents)) {
      offenders.push(filePath.replace(root, "").replace(/\\/g, "/"));
    }
  }

  assert.deepEqual(
    offenders,
    [],
    `These files pass a JSX event handler but are Server Components (missing "use client"). ` +
      `This crashes at runtime with "Event handlers cannot be passed to Client Component props". ` +
      `Offenders:\n${offenders.join("\n")}`,
  );
});

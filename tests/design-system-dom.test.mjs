import test, { after, afterEach } from "node:test";
import assert from "node:assert/strict";
import { rm } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import React, { act } from "react";
import { JSDOM } from "jsdom";
import { build, stop } from "esbuild";

const rootPath = resolve(import.meta.dirname, "..");
const compileDir = resolve(rootPath, "node_modules/.cache/task-2-dom-tests");

await rm(compileDir, { recursive: true, force: true });
await build({
  entryPoints: {
    modal: resolve(rootPath, "src/components/ui/modal.tsx"),
    button: resolve(rootPath, "src/components/ui/button.tsx"),
  },
  outdir: compileDir,
  outExtension: { ".js": ".mjs" },
  bundle: true,
  packages: "external",
  platform: "node",
  format: "esm",
  jsx: "automatic",
  logLevel: "silent",
  tsconfig: resolve(rootPath, "tsconfig.json"),
});
stop();

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "https://nobilix.test/",
  pretendToBeVisual: true,
});

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  HTMLElement: dom.window.HTMLElement,
  Element: dom.window.Element,
  Node: dom.window.Node,
  Event: dom.window.Event,
  KeyboardEvent: dom.window.KeyboardEvent,
  MouseEvent: dom.window.MouseEvent,
  MutationObserver: dom.window.MutationObserver,
  getComputedStyle: dom.window.getComputedStyle,
  requestAnimationFrame: dom.window.requestAnimationFrame.bind(dom.window),
  cancelAnimationFrame: dom.window.cancelAnimationFrame.bind(dom.window),
  IS_REACT_ACT_ENVIRONMENT: true,
});

Object.defineProperty(globalThis, "navigator", {
  configurable: true,
  value: dom.window.navigator,
});

Object.defineProperty(dom.window, "matchMedia", {
  configurable: true,
  value: () => ({
    matches: true,
    media: "(prefers-reduced-motion: reduce)",
    onchange: null,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent() {
      return true;
    },
  }),
});

const { createRoot } = await import("react-dom/client");
const { Modal } = await import(
  pathToFileURL(resolve(compileDir, "modal.mjs")).href
);
const { Button } = await import(
  pathToFileURL(resolve(compileDir, "button.mjs")).href
);

let root;

function render(element) {
  const container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  act(() => root.render(element));
  return container;
}

function rerender(element) {
  act(() => root.render(element));
}

async function pressEscape() {
  act(() => {
    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    );
  });
  await new Promise((resolve) => setTimeout(resolve, 0));
}

afterEach(() => {
  if (root) act(() => root.unmount());
  root = undefined;
  document.body.replaceChildren();
  document.body.style.overflow = "";
});

after(async () => {
  dom.window.close();
  await rm(compileDir, { recursive: true, force: true });
});

test("modal preserves controlled-input focus when the parent rerenders", () => {
  const container = render(
    React.createElement(
      Modal,
      { open: true, onClose: () => undefined, title: "Edit profile" },
      React.createElement("input", {
        "aria-label": "Display name",
        value: "Ada",
        readOnly: true,
      }),
    ),
  );
  const input = container.querySelector('input[aria-label="Display name"]');
  assert.ok(input);
  input.focus();
  assert.equal(document.activeElement === input, true);

  rerender(
    React.createElement(
      Modal,
      { open: true, onClose: () => undefined, title: "Edit profile" },
      React.createElement("input", {
        "aria-label": "Display name",
        value: "Grace",
        readOnly: true,
      }),
    ),
  );

  assert.equal(document.activeElement === input, true);
});

test("modal Escape calls the latest callback without restarting focus", async () => {
  let firstCalls = 0;
  let latestCalls = 0;
  const container = render(
    React.createElement(
      Modal,
      { open: true, onClose: () => firstCalls++, title: "Confirm" },
      React.createElement("input", { "aria-label": "Confirmation" }),
    ),
  );
  const input = container.querySelector('input[aria-label="Confirmation"]');
  assert.ok(input);
  input.focus();

  rerender(
    React.createElement(
      Modal,
      { open: true, onClose: () => latestCalls++, title: "Confirm" },
      React.createElement("input", { "aria-label": "Confirmation" }),
    ),
  );
  await pressEscape();

  assert.equal(firstCalls, 0);
  assert.equal(latestCalls, 1);
  assert.equal(document.activeElement === input, true);
});

test("button loading state cannot be overridden by caller props", () => {
  const container = render(
    React.createElement(
      Button,
      { loading: true, disabled: false, "aria-busy": false },
      "Save",
    ),
  );
  const button = container.querySelector("button");
  assert.ok(button);
  assert.equal(button.disabled, true);
  assert.equal(button.getAttribute("aria-busy"), "true");
});

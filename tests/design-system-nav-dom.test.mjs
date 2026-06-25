import test, { after, afterEach } from "node:test";
import assert from "node:assert/strict";
import { rm } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import React, { act } from "react";
import { JSDOM } from "jsdom";
import { build, stop } from "esbuild";

const rootPath = resolve(import.meta.dirname, "..");
const compileDir = resolve(rootPath, "node_modules/.cache/task-2-nav-tests");

await rm(compileDir, { recursive: true, force: true });
await build({
  entryPoints: {
    navigation: resolve(rootPath, "src/components/nav/mobile-navigation.tsx"),
    modal: resolve(rootPath, "src/components/ui/modal.tsx"),
  },
  outdir: compileDir,
  outExtension: { ".js": ".mjs" },
  bundle: true,
  packages: "external",
  platform: "node",
  format: "esm",
  splitting: true,
  jsx: "automatic",
  logLevel: "silent",
  tsconfig: resolve(rootPath, "tsconfig.json"),
  plugins: [
    {
      name: "test-ui-shims",
      setup(context) {
        context.onResolve(
          {
            filter: /^react(?:\/jsx-runtime)?$/,
            namespace: "test-shim",
          },
          (args) => ({ path: args.path, external: true }),
        );
        context.onResolve({ filter: /^next\/link$/ }, () => ({
          path: "next-link",
          namespace: "test-shim",
        }));
        context.onResolve({ filter: /^motion\/react$/ }, () => ({
          path: "motion-react",
          namespace: "test-shim",
        }));
        context.onLoad(
          { filter: /^next-link$/, namespace: "test-shim" },
          () => ({
            loader: "jsx",
            contents: `
              import React from "react";
              const Link = React.forwardRef(function Link(
                { href, children, ...props },
                ref,
              ) {
                return <a ref={ref} href={href} {...props}>{children}</a>;
              });
              export default Link;
            `,
          }),
        );
        context.onLoad(
          { filter: /^motion-react$/, namespace: "test-shim" },
          () => ({
            loader: "jsx",
            contents: `
              import React from "react";
              const omitMotionProps = ({
                initial,
                animate,
                exit,
                transition,
                whileInView,
                viewport,
                ...props
              }) => props;
              const makeMotionElement = (tag) =>
                React.forwardRef(function MotionElement(props, ref) {
                  const { children, ...rest } = omitMotionProps(props);
                  return React.createElement(tag, { ...rest, ref }, children);
                });
              export const motion = {
                button: makeMotionElement("button"),
                div: makeMotionElement("div"),
              };
              export function AnimatePresence({ children }) {
                return children;
              }
              export function useReducedMotion() {
                return true;
              }
            `,
          }),
        );
      },
    },
  ],
});
stop();

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "https://nobilix.test/",
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
  IS_REACT_ACT_ENVIRONMENT: true,
});

Object.defineProperty(globalThis, "navigator", {
  configurable: true,
  value: dom.window.navigator,
});

const { createRoot } = await import("react-dom/client");
const { MobileNavigation } = await import(
  pathToFileURL(resolve(compileDir, "navigation.mjs")).href
);
const { Modal } = await import(
  pathToFileURL(resolve(compileDir, "modal.mjs")).href
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

function click(element) {
  act(() => {
    element.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
}

function pressEscape() {
  act(() => {
    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    );
  });
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

test("mobile navigation focuses a destination and dismisses on Escape", () => {
  const container = render(
    React.createElement(MobileNavigation, {
      items: [
        {
          href: "/projects",
          label: "Projects",
          description: "View company work",
          active: true,
        },
      ],
    }),
  );
  const trigger = container.querySelector('[aria-label="Open navigation"]');
  assert.ok(trigger);
  click(trigger);

  const activeLink = document.querySelector('a[aria-current="page"]');
  assert.ok(document.querySelector('[role="dialog"]'));
  assert.ok(activeLink);
  assert.equal(
    document.querySelector('[role="dialog"]')?.contains(document.activeElement),
    true,
  );
  assert.match(
    activeLink.querySelector("span:last-child")?.className ?? "",
    /text-primary-foreground/,
  );

  pressEscape();
  assert.equal(document.querySelector('[role="dialog"]'), null);
  assert.equal(document.activeElement === trigger, true);
});

test("overlapping modal and navigation restore the original body overflow", () => {
  document.body.style.overflow = "clip";
  const renderOverlays = (modalOpen) =>
    React.createElement(
      React.Fragment,
      null,
      React.createElement(MobileNavigation, {
        key: "navigation",
        items: [{ href: "/", label: "Home" }],
      }),
      React.createElement(
        Modal,
        {
          key: "modal",
          open: modalOpen,
          onClose: () => undefined,
          title: "Overlay",
        },
        React.createElement("button", { type: "button" }, "Continue"),
      ),
    );
  const container = render(renderOverlays(true));

  const trigger = container.querySelector('[aria-label="Open navigation"]');
  assert.ok(trigger);
  click(trigger);
  assert.equal(document.body.style.overflow, "hidden");

  rerender(renderOverlays(false));
  assert.equal(document.body.style.overflow, "hidden");

  pressEscape();
  assert.equal(document.body.style.overflow, "clip");
});

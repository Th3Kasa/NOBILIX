"use client";
/**
 * Preview-only provider for the design-sync bundle.
 *
 * NOBILIX is a Next.js app, not a packaged library: 16 of its components
 * import next/link, next/image, or next/navigation, all of which read
 * app-router / image-config React contexts that only exist inside the Next
 * runtime. This provider supplies inert stand-ins so those components render
 * standalone in preview cards and in designs built on claude.ai/design.
 *
 * It also applies the `dark` class — the app hardcodes dark-only theming on
 * <html>, and every token in the compiled CSS assumes that ancestor exists.
 * Surface scoping (`.public-shell` vs `.console-shell`) stays per-preview:
 * authored previews wrap their subject in whichever shell it belongs to.
 */
import React from "react";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import {
  PathnameContext,
  SearchParamsContext,
} from "next/dist/shared/lib/hooks-client-context.shared-runtime";
import { ImageConfigContext } from "next/dist/shared/lib/image-config-context.shared-runtime";
import { imageConfigDefault } from "next/dist/shared/lib/image-config";

const noop = () => {};
const stubRouter = {
  push: noop,
  replace: noop,
  prefetch: noop,
  back: noop,
  forward: noop,
  refresh: noop,
  hmrRefresh: noop,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any;

export function DSProvider({ children }: { children?: React.ReactNode }) {
  return (
    <AppRouterContext.Provider value={stubRouter}>
      <PathnameContext.Provider value="/">
        <SearchParamsContext.Provider value={new URLSearchParams()}>
          <ImageConfigContext.Provider
            value={{ ...imageConfigDefault, unoptimized: true }}
          >
            <div className="dark">{children}</div>
          </ImageConfigContext.Provider>
        </SearchParamsContext.Provider>
      </PathnameContext.Provider>
    </AppRouterContext.Provider>
  );
}

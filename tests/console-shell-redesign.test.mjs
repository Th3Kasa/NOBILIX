import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = (path) => readFileSync(resolve(root, path), "utf8");

test("console auth is company-branded and shows sign-in progress", () => {
  const layout = read("src/app/console/(auth)/layout.tsx");
  const login = read("src/app/console/(auth)/login/page.tsx");
  const form = read("src/app/console/(auth)/login/login-form.tsx");
  const enroll = read("src/app/console/(auth)/enroll/page.tsx");

  assert.match(layout, /console-auth-shell/);
  assert.match(login, /Nobilix operations console/);
  assert.match(login, /console-auth-card/);
  assert.match(form, /console-step-list/);
  assert.match(form, /Credentials/);
  assert.match(form, /Two-factor/);
  assert.match(form, /aria-current=\{step === "credentials" \? "step" : undefined\}/);
  assert.match(enroll, /redirect\("\/console\/login"\)/);
});

test("console shell keeps auth server-side and adds responsive navigation", () => {
  const dashboard = read("src/app/console/(dashboard)/layout.tsx");
  const trapman = read("src/app/console/(dashboard)/trapman/layout.tsx");
  const mobile = read("src/components/nav/console-mobile-nav.tsx");

  assert.match(dashboard, /const session = await auth\(\)/);
  assert.match(dashboard, /ConsoleMobileNav/);
  assert.match(dashboard, /platformNavigationItems/);
  assert.match(trapman, /ConsoleMobileNav/);
  assert.match(trapman, /projectNavigationItems/);
  assert.match(mobile, /MobileNavigation/);
  assert.match(mobile, /min-h-11/);
  assert.match(mobile, /Nobilix \/ \{scopeLabel\}/);
});

test("desktop sidebars share active route metadata and 44px targets", () => {
  const platform = read("src/components/nav/platform-sidebar.tsx");
  const project = read("src/components/nav/project-sidebar.tsx");

  assert.match(platform, /PLATFORM_NAV/);
  assert.match(platform, /min-h-11/);
  assert.match(platform, /aria-current=\{active \? "page" : undefined\}/);
  assert.match(project, /MODULE_META/);
  assert.match(project, /min-h-11/);
  assert.match(project, /aria-current=\{active \? "page" : undefined\}/);
});

test("topbar and page header communicate platform/project orientation", () => {
  const topbar = read("src/components/nav/topbar.tsx");
  const pageHeader = read("src/components/page-header.tsx");

  assert.match(topbar, /aria-label="Signed in administrator"/);
  assert.match(topbar, /aria-label="Sign out"/);
  assert.match(topbar, /Nobilix/);
  assert.match(pageHeader, /console-page-header/);
  assert.match(pageHeader, /eyebrow/);
});

test("console mobile nav component exists", () => {
  assert.equal(existsSync(resolve(root, "src/components/nav/console-mobile-nav.tsx")), true);
});

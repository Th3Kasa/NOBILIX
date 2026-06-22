/**
 * Legal data inventory contract tests.
 * These tests prevent hand-maintained contradictory legal tables and
 * ensure the legal content files import from the typed inventory.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");

function read(relativePath) {
  return readFileSync(resolve(root, relativePath), "utf8");
}

// ── Inventory file existence and required fields ────────────────────────────

test("data-inventory.ts must exist", () => {
  assert.equal(
    existsSync(resolve(root, "src/content/trapman/data-inventory.ts")),
    true,
    "src/content/trapman/data-inventory.ts must exist"
  );
});

test("TRAPMAN_DATA_INVENTORY includes confirmed Firestore fields", () => {
  const source = read("src/content/trapman/data-inventory.ts");
  // Must include each of the confirmed data categories
  assert.match(source, /username/);
  assert.match(source, /email/);
  assert.match(source, /country/);
  assert.match(source, /competitionsWon|competitions_won/);
  assert.match(source, /purchase|Purchase/);
  assert.match(source, /productId|product_id|itemId/);
});

test("TRAPMAN_DATA_INVENTORY includes confirmed analytics events", () => {
  const source = read("src/content/trapman/data-inventory.ts");
  assert.match(source, /session_end/);
  assert.match(source, /ad_closed/);
  assert.match(source, /ad_clicked/);
});

test("REQUIRES_ENGINEERING_VERIFICATION exists in data inventory", () => {
  const source = read("src/content/trapman/data-inventory.ts");
  assert.match(
    source,
    /REQUIRES_ENGINEERING_VERIFICATION/,
    "unresolved data categories must be separately flagged"
  );
  assert.match(source, /Firebase Analytics/);
  assert.match(source, /device identifier|GAID/);
  assert.match(source, /FCM|push notification/);
  assert.match(source, /[Cc]rash reporting/);
  assert.match(source, /advertising SDK/i);
});

// ── Legal content files import the inventory ───────────────────────────────

test("privacy policy content imports from TRAPMAN_DATA_INVENTORY", () => {
  const privacyPath = resolve(root, "src/content/trapman/privacy.ts");
  if (!existsSync(privacyPath)) {
    assert.ok(true, "privacy.ts not yet created (Task 7)");
    return;
  }
  const source = read("src/content/trapman/privacy.ts");
  assert.match(
    source,
    /TRAPMAN_DATA_INVENTORY|data-inventory/,
    "privacy.ts must import from the typed data inventory"
  );
});

test("compliance content imports from TRAPMAN_DATA_INVENTORY", () => {
  const compliancePath = resolve(root, "src/content/trapman/compliance.ts");
  if (!existsSync(compliancePath)) {
    assert.ok(true, "compliance.ts not yet created (Task 7)");
    return;
  }
  const source = read("src/content/trapman/compliance.ts");
  assert.match(
    source,
    /TRAPMAN_DATA_INVENTORY|data-inventory/,
    "compliance.ts must import from the typed data inventory"
  );
});

// ── Legal pages use the content files ──────────────────────────────────────

test("privacy policy page imports from content file", () => {
  const pagePath = resolve(root, "src/app/(public)/trapman/privacy-policy/page.tsx");
  if (!existsSync(pagePath)) {
    assert.ok(true, "privacy-policy page not yet created (Task 7)");
    return;
  }
  const source = read("src/app/(public)/trapman/privacy-policy/page.tsx");
  assert.match(
    source,
    /content\/trapman\/privacy|trapman\/privacy/,
    "privacy policy page must import from the privacy content file"
  );
});

test("data compliance page renders inventory table", () => {
  const pagePath = resolve(root, "src/app/(public)/trapman/data-compliance/page.tsx");
  if (!existsSync(pagePath)) {
    assert.ok(true, "data-compliance page not yet created (Task 7)");
    return;
  }
  const source = read("src/app/(public)/trapman/data-compliance/page.tsx");
  assert.match(
    source,
    /TRAPMAN_DATA_INVENTORY|data-inventory/,
    "data-compliance page must render from the typed inventory"
  );
});

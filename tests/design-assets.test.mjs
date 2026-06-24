import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const generatedAssetsRoot = path.join(
  repositoryRoot,
  "public",
  "assets",
  "generated",
);
const manifestPath = path.join(generatedAssetsRoot, "asset-manifest.json");

const requiredAssets = [
  "nobilix/studio-hero.webp",
  "nobilix/project-transition.webp",
  "trapman/city-hero.webp",
  "trapman/city-mobile.webp",
  "trapman/portal.webp",
  "trapman/gameplay-atmosphere.webp",
  "trapman/music-atmosphere.webp",
];

function resolveGeneratedAsset(relativePath) {
  const resolvedPath = path.resolve(generatedAssetsRoot, relativePath);
  const relativeToRoot = path.relative(generatedAssetsRoot, resolvedPath);

  assert.ok(
    relativeToRoot !== "" &&
      !relativeToRoot.startsWith("..") &&
      !path.isAbsolute(relativeToRoot),
    `Asset path must remain inside public/assets/generated: ${relativePath}`,
  );

  return resolvedPath;
}

async function readManifest() {
  const manifestText = await readFile(manifestPath, "utf8");
  return {
    manifest: JSON.parse(manifestText),
    manifestText,
  };
}

test("required generated design assets exist", async () => {
  await Promise.all(
    requiredAssets.map((relativePath) =>
      access(resolveGeneratedAsset(relativePath)),
    ),
  );
});

test("asset manifest describes every required delivery file", async () => {
  const { manifest } = await readManifest();

  assert.ok(Array.isArray(manifest.assets), "Manifest must contain an assets array");

  const entriesByPath = new Map(
    manifest.assets.map((entry) => [entry.path, entry]),
  );

  for (const relativePath of requiredAssets) {
    const entry = entriesByPath.get(relativePath);
    assert.ok(entry, `Manifest is missing ${relativePath}`);

    for (const field of [
      "id",
      "kind",
      "path",
      "width",
      "height",
      "source",
      "purpose",
    ]) {
      assert.ok(entry[field], `${relativePath} is missing manifest field ${field}`);
    }

    assert.equal(
      resolveGeneratedAsset(entry.path),
      resolveGeneratedAsset(relativePath),
      `${relativePath} must resolve to its committed delivery file`,
    );
  }
});

test("asset manifest contains no MuAPI credential material", async () => {
  const { manifestText } = await readManifest();
  const apiKey = process.env.MUAPI_API_KEY;

  assert.doesNotMatch(manifestText, /MUAPI_API_KEY/i);
  if (apiKey) {
    assert.ok(!manifestText.includes(apiKey), "Manifest contains the MuAPI API key");
  }
});

test("asset generator validates the full plan without credentials or API calls", async () => {
  const scriptPath = path.join(
    repositoryRoot,
    "scripts",
    "generate-design-assets.mjs",
  );
  const { stdout, stderr } = await execFileAsync(
    process.execPath,
    [scriptPath, "--dry-run"],
    {
      cwd: repositoryRoot,
      env: {
        ...process.env,
        MUAPI_API_KEY: "",
      },
    },
  );

  assert.equal(stderr, "");
  assert.match(stdout, /Validated 7 design asset definitions/);
  assert.doesNotMatch(stdout, /MUAPI_API_KEY/i);
});

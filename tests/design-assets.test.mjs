import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import {
  access,
  cp,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
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
const generatorScriptPath = path.join(
  repositoryRoot,
  "scripts",
  "generate-design-assets.mjs",
);

const requiredAssets = [
  "nobilix/studio-hero.webp",
  "nobilix/project-transition.webp",
  "trapman/city-hero.webp",
  "trapman/city-mobile.webp",
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

async function importGenerator() {
  return import(`${pathToFileURL(generatorScriptPath).href}?test=${Date.now()}`);
}

async function hashTree(rootPath) {
  const hash = createHash("sha256");

  async function visit(currentPath) {
    const entries = await readdir(currentPath, { withFileTypes: true });
    entries.sort((left, right) => left.name.localeCompare(right.name));

    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);
      const relativePath = path.relative(rootPath, fullPath).replaceAll("\\", "/");
      hash.update(relativePath);
      if (entry.isDirectory()) {
        await visit(fullPath);
      } else {
        hash.update(await readFile(fullPath));
      }
    }
  }

  await visit(rootPath);
  return hash.digest("hex");
}

async function createGenerationRun(
  parentDirectory,
  name,
  generatedAt,
  assetPaths = requiredAssets,
) {
  const runDirectory = path.join(parentDirectory, name);
  const candidateDirectory = path.join(runDirectory, "candidates");
  await mkdir(candidateDirectory, { recursive: true });

  const records = [];
  for (const relativePath of assetPaths) {
    const id = relativePath.replaceAll("/", "-").replace(/\.webp$/, "");
    const candidatePath = path.join("candidates", `${id}.webp`);
    await cp(
      resolveGeneratedAsset(relativePath),
      path.join(runDirectory, candidatePath),
    );
    records.push({
      id,
      candidatePath,
      generatedAt,
    });
  }

  await writeFile(
    path.join(runDirectory, "generation.json"),
    `${JSON.stringify(
      {
        generatedAt,
        endpoint: "test-endpoint",
        model: "Test Model",
        assets: records,
      },
      null,
      2,
    )}\n`,
  );

  return runDirectory;
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
      "generatedAt",
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
  const { stdout, stderr } = await execFileAsync(
    process.execPath,
    [generatorScriptPath, "--dry-run"],
    {
      cwd: repositoryRoot,
      env: {
        ...process.env,
        MUAPI_API_KEY: "",
      },
    },
  );

  assert.equal(stderr, "");
  assert.match(stdout, /Validated 22 design asset definitions/);
  assert.doesNotMatch(stdout, /MUAPI_API_KEY/i);
});

test("generation submission does not retry a POST after a network failure", async () => {
  const { assets, submitGeneration } = await importGenerator();
  let calls = 0;

  await assert.rejects(
    submitGeneration("test-key", assets[0], {
      fetchImpl: async () => {
        calls += 1;
        throw new Error("connection reset after request write");
      },
    }),
    /connection reset/,
  );

  assert.equal(calls, 1);
});

test("malformed successful submission JSON produces a fixed secret-safe stderr message", async () => {
  const { assets, formatErrorForStderr, submitGeneration } =
    await importGenerator();
  const credential = "muapi-malformed-submission-secret-123456";
  const signedUrl =
    "https://cdn.example.test/output.webp?X-Amz-Credential=AKIAREFLECTED&X-Amz-Signature=deadbeef";
  let capturedError;

  try {
    await submitGeneration(credential, assets[0], {
      fetchImpl: async () =>
        new Response(
          `{"request_id":"broken","url":"${signedUrl}","key":"${credential}"`,
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        ),
    });
  } catch (error) {
    capturedError = error;
  }

  const stderrText = formatErrorForStderr(capturedError, [credential]);
  assert.equal(stderrText, "MuAPI generation submission returned invalid JSON");
  assert.ok(!stderrText.includes(credential));
  assert.ok(!stderrText.includes(signedUrl));
  assert.doesNotMatch(stderrText, /SyntaxError|Unexpected|position|X-Amz/i);
});

test("malformed successful polling JSON produces a fixed secret-safe stderr message", async () => {
  const { formatErrorForStderr, pollGeneration } = await importGenerator();
  const credential = "muapi-malformed-poll-secret-654321";
  const signedUrl =
    "https://cdn.example.test/result.webp?token=reflected-secret&signature=abc123";
  let capturedError;

  try {
    await pollGeneration(credential, "request-123", {
      fetchImpl: async () =>
        new Response(
          `{"status":"completed","output":"${signedUrl}","authorization":"Bearer ${credential}"`,
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        ),
      waitImpl: async () => {},
    });
  } catch (error) {
    capturedError = error;
  }

  const stderrText = formatErrorForStderr(capturedError, [credential]);
  assert.equal(stderrText, "MuAPI prediction status returned invalid JSON");
  assert.ok(!stderrText.includes(credential));
  assert.ok(!stderrText.includes(signedUrl));
  assert.doesNotMatch(stderrText, /SyntaxError|Unexpected|position|token=/i);
});

test("idempotent retries stop immediately for non-retryable HTTP responses", async () => {
  const { requestWithRetry } = await importGenerator();
  let calls = 0;
  let waits = 0;

  await assert.rejects(
    requestWithRetry("https://example.test/result", {}, {
      attempts: 5,
      fetchImpl: async () => {
        calls += 1;
        return new Response("bad request", { status: 400 });
      },
      waitImpl: async () => {
        waits += 1;
      },
    }),
    /MuAPI request failed \(400\)/,
  );

  assert.equal(calls, 1);
  assert.equal(waits, 0);
});

test("HTTP errors omit reflected response bodies and credentials", async () => {
  const { requestWithRetry } = await importGenerator();
  const configuredKey = "muapi-live-reflected-secret-123456";
  const reflectedCredential = "Bearer sk-live-reflected-abcdef123456";
  let capturedError;

  try {
    await requestWithRetry("https://example.test/result", {}, {
      attempts: 1,
      fetchImpl: async () =>
        new Response(
          `upstream rejected ${configuredKey}; authorization=${reflectedCredential}`,
          { status: 401 },
        ),
    });
  } catch (error) {
    capturedError = error;
  }

  assert.ok(capturedError instanceof Error);
  assert.match(capturedError.message, /MuAPI request failed \(401\)/);
  assert.ok(!capturedError.message.includes(configuredKey));
  assert.ok(!capturedError.message.includes(reflectedCredential));
  assert.doesNotMatch(capturedError.message, /upstream rejected|authorization=/i);
});

test("stderr formatting redacts configured and plausible credentials", async () => {
  const { formatErrorForStderr } = await importGenerator();
  const configuredKey = "muapi-configured-secret-123456";
  const plausibleCredential = "sk-live-another-secret-abcdef123456";
  const stderrText = formatErrorForStderr(
    new Error(
      `request failed key=${configuredKey} authorization=Bearer ${plausibleCredential}`,
    ),
    [configuredKey],
  );

  assert.ok(!stderrText.includes(configuredKey));
  assert.ok(!stderrText.includes(plausibleCredential));
  assert.match(stderrText, /\[REDACTED\]/);
});

test("idempotent requests retry transient HTTP responses", async () => {
  const { requestWithRetry } = await importGenerator();
  let calls = 0;
  let waits = 0;

  const response = await requestWithRetry("https://example.test/result", {}, {
    attempts: 3,
    fetchImpl: async () => {
      calls += 1;
      if (calls === 1) {
        return new Response("temporarily unavailable", { status: 503 });
      }
      return new Response("ok", { status: 200 });
    },
    waitImpl: async () => {
      waits += 1;
    },
  });

  assert.equal(await response.text(), "ok");
  assert.equal(calls, 2);
  assert.equal(waits, 1);
});

test("transaction staging and backup paths stay inside a non-public repository temp root", async () => {
  const { createTransactionPaths } = await importGenerator();
  const transactionPaths = createTransactionPaths(
    generatedAssetsRoot,
    "fixed-transaction-id",
  );
  const publicRoot = path.join(repositoryRoot, "public");

  for (const candidatePath of [
    transactionPaths.stagingPrefix,
    transactionPaths.backupRoot,
  ]) {
    const relativeToRepository = path.relative(repositoryRoot, candidatePath);
    const relativeToPublic = path.relative(publicRoot, candidatePath);

    assert.ok(
      relativeToRepository !== "" &&
        !relativeToRepository.startsWith("..") &&
        !path.isAbsolute(relativeToRepository),
      `${candidatePath} must stay inside the repository`,
    );
    assert.ok(
      relativeToPublic.startsWith("..") || path.isAbsolute(relativeToPublic),
      `${candidatePath} must not be inside or adjacent to public assets`,
    );
    assert.equal(
      path.parse(candidatePath).root.toLowerCase(),
      path.parse(generatedAssetsRoot).root.toLowerCase(),
    );
  }
});

test("failed approval leaves the prior delivery set unchanged", async () => {
  const { approveCandidates } = await importGenerator();
  const temporaryRoot = await mkdtemp(
    path.join(os.tmpdir(), "design-assets-approval-test-"),
  );
  const deliveryRoot = path.join(temporaryRoot, "delivery");
  await cp(generatedAssetsRoot, deliveryRoot, { recursive: true });
  const beforeHash = await hashTree(deliveryRoot);
  const runDirectory = await createGenerationRun(
    temporaryRoot,
    "complete-run",
    "2026-06-24T10:00:00.000Z",
  );
  let optimizationCalls = 0;

  await assert.rejects(
    approveCandidates({
      runDirectory,
      approvedValue: "all",
      deliveryRoot,
      optimizeCandidateImpl: async (sourcePath, destinationPath) => {
        optimizationCalls += 1;
        await mkdir(path.dirname(destinationPath), { recursive: true });
        await cp(sourcePath, destinationPath);
        if (optimizationCalls === 2) {
          throw new Error("simulated optimizer failure");
        }
      },
    }),
    /simulated optimizer failure/,
  );

  assert.equal(await hashTree(deliveryRoot), beforeHash);
  await rm(temporaryRoot, { recursive: true, force: true });
});

test("partial approval preserves already-committed delivery assets", async () => {
  const { approveCandidates } = await importGenerator();
  const temporaryRoot = await mkdtemp(
    path.join(os.tmpdir(), "design-assets-partial-approval-test-"),
  );
  const deliveryRoot = path.join(temporaryRoot, "delivery");
  await cp(generatedAssetsRoot, deliveryRoot, { recursive: true });

  // Only submit 5 of the 6 image assets in this run — simulates a video-only generation run
  const incompletePaths = requiredAssets.slice(0, -1);
  const runDirectory = await createGenerationRun(
    temporaryRoot,
    "partial-run",
    "2026-06-24T10:00:00.000Z",
    incompletePaths,
  );
  let optimizationCalls = 0;

  // Must succeed — the missing asset is preserved from the existing delivery root
  await approveCandidates({
    runDirectory,
    approvedValue: "all",
    deliveryRoot,
    optimizeCandidateImpl: async (sourcePath, destinationPath) => {
      optimizationCalls += 1;
      await mkdir(path.dirname(destinationPath), { recursive: true });
      await cp(sourcePath, destinationPath);
    },
  });

  // Only the 6 submitted assets should have been re-optimized
  assert.equal(optimizationCalls, incompletePaths.length);

  // All 7 image assets must still be present in the delivery root after partial approval
  for (const assetPath of requiredAssets) {
    const deliveredPath = path.join(deliveryRoot, assetPath);
    await assert.doesNotReject(
      () => access(deliveredPath),
      `Expected ${assetPath} to survive partial approval`,
    );
  }

  await rm(temporaryRoot, { recursive: true, force: true });
});

test("replacement-run entries retain their own generation timestamps", async () => {
  const { approveCandidates } = await importGenerator();
  const temporaryRoot = await mkdtemp(
    path.join(os.tmpdir(), "design-assets-timestamp-test-"),
  );
  const deliveryRoot = path.join(temporaryRoot, "delivery");
  const baseTimestamp = "2026-06-24T10:00:00.000Z";
  const replacementTimestamp = "2026-06-24T11:00:00.000Z";
  const runDirectory = await createGenerationRun(
    temporaryRoot,
    "base-run",
    baseTimestamp,
  );
  const replacementRunDirectory = await createGenerationRun(
    temporaryRoot,
    "replacement-run",
    replacementTimestamp,
    ["trapman/city-hero.webp"],
  );

  await approveCandidates({
    runDirectory,
    approvedValue: "all",
    replacementRunDirectory,
    deliveryRoot,
    optimizeCandidateImpl: async (sourcePath, destinationPath) => {
      await mkdir(path.dirname(destinationPath), { recursive: true });
      await cp(sourcePath, destinationPath);
    },
  });

  const approvedManifest = JSON.parse(
    await readFile(path.join(deliveryRoot, "asset-manifest.json"), "utf8"),
  );
  const replacementEntry = approvedManifest.assets.find(
    (entry) => entry.id === "trapman-city-hero",
  );
  const baseEntry = approvedManifest.assets.find(
    (entry) => entry.id === "nobilix-studio-hero",
  );

  assert.equal(baseEntry.generatedAt, baseTimestamp);
  assert.equal(replacementEntry.generatedAt, replacementTimestamp);
  assert.equal(approvedManifest.generatedAt, replacementTimestamp);
  await rm(temporaryRoot, { recursive: true, force: true });
});

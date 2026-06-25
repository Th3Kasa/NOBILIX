import { createHash, randomUUID } from "node:crypto";
import {
  access,
  mkdir,
  mkdtemp,
  readFile,
  rename,
  rm,
  rmdir,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

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
const transactionRoot = path.join(repositoryRoot, ".asset-pipeline-tmp");
const apiBaseUrl = "https://api.muapi.ai/api/v1";
const modelEndpoint = "flux-2-dev";
const modelName = "MuAPI Flux 2 Dev";
const sensitiveValues = new Set();

export const assets = [
  {
    id: "nobilix-studio-hero",
    kind: "image",
    path: "nobilix/studio-hero.webp",
    width: 1536,
    height: 864,
    generationWidth: 1536,
    generationHeight: 864,
    purpose: "Nobilix studio homepage hero material",
    source: `${modelName} original text-to-image generation`,
    prompt:
      "Original abstract editorial studio landscape for a premium independent software company. Warm bone paper, soft mineral plaster, charcoal-black architectural planes, brushed aluminium, translucent acrylic, and one restrained acid-lime light seam. Wide cinematic composition with generous negative space for web typography, tactile macro detail, quiet directional daylight, sophisticated Swiss editorial art direction, materially believable but not photorealistic. No people, no text, no letters, no logos, no interface, no game imagery, no neon cyberpunk, no gradients, no stock-photo look.",
  },
  {
    id: "nobilix-project-transition",
    kind: "image",
    path: "nobilix/project-transition.webp",
    width: 1440,
    height: 900,
    generationWidth: 1440,
    generationHeight: 900,
    purpose: "Nobilix portfolio transition plate",
    source: `${modelName} original text-to-image generation`,
    prompt:
      "Original editorial transition artwork for a software studio portfolio. An asymmetric field of folded warm-white paper, precision-cut black card, slim stainless-steel rails, subtle registration marks made only from abstract lines, and a small acid-lime translucent panel. Gallery-catalogue composition, calm neutral palette, tactile printmaking grain, disciplined negative space, premium art-direction still life. No text, no letters, no logos, no products, no game characters, no synthwave, no photorealistic office, no generic 3D blobs.",
  },
  {
    id: "trapman-city-hero",
    kind: "image",
    path: "trapman/city-hero.webp",
    width: 1536,
    height: 864,
    generationWidth: 1536,
    generationHeight: 864,
    purpose: "TrapMan wide neon-city hero atmosphere",
    source: `${modelName} original text-to-image generation`,
    prompt:
      "Original wide 16-bit pixel-art night city for an arcade runner website, viewed across layered rooftops and elevated transit lanes. Deep indigo sky, distant blocky skyline, cyan window rhythm, electric magenta light bars with no signage, amber street pools, wet pixel reflections, foreground fire escapes framing a clear central route. Graphic hand-authored sprite aesthetic, limited color clusters, crisp hard pixel edges, cinematic depth through three distinct skyline layers. Absolutely no signs, glyphs, symbols, letters, numbers, characters, gameplay UI, scores, logos, copyrighted landmarks, photorealism, smooth 3D rendering, or generic cyberpunk portrait.",
  },
  {
    id: "trapman-city-mobile",
    kind: "image",
    path: "trapman/city-mobile.webp",
    width: 864,
    height: 1536,
    generationWidth: 864,
    generationHeight: 1536,
    purpose: "TrapMan mobile portrait city atmosphere",
    source: `${modelName} original text-to-image generation`,
    prompt:
      "Original vertical 16-bit pixel-art night city for a mobile arcade runner website. A dramatic upward view through stacked rooftops, fire escapes, overhead rails, distant towers and a narrow indigo sky. Cyan windows, magenta electrical glow, amber street light, wet pixel reflections, strong vertical depth, uncluttered center for web copy, handcrafted limited-palette sprite art with crisp hard edges. No characters, no gameplay UI, no scores, no readable text, no logos, no copyrighted landmarks, no photorealism, no smooth 3D render, no generic cyberpunk portrait.",
  },
  {
    id: "trapman-portal",
    kind: "image",
    path: "trapman/portal.webp",
    width: 1200,
    height: 1200,
    generationWidth: 1200,
    generationHeight: 1200,
    purpose: "TrapMan pixel-energy portal transition",
    source: `${modelName} original text-to-image generation`,
    prompt:
      "Original square pixel-art energy portal suspended in a dark urban service tunnel. Concentric broken rings of cyan, hot magenta, violet and white pixel sparks, black center with usable negative space, chunky 16-bit clusters, subtle brick and cable silhouettes, energetic but readable composition, handcrafted arcade sprite-sheet aesthetic. No character, no creature, no weapon, no interface, no readable text, no logo, no photorealism, no glossy 3D render.",
  },
  {
    id: "trapman-gameplay-atmosphere",
    kind: "image",
    path: "trapman/gameplay-atmosphere.webp",
    width: 1536,
    height: 864,
    generationWidth: 1536,
    generationHeight: 864,
    purpose: "TrapMan gameplay section environmental plate",
    source: `${modelName} original text-to-image generation`,
    prompt:
      "Original side-scrolling 16-bit pixel-art urban route plate for an arcade runner website: layered rooftops, train platform edges, ventilation units, barriers, collectible-like light trails that remain abstract, distant apartment windows and a clear horizontal running lane. Indigo-black base with cyan, violet, magenta and amber accents, crisp limited-palette pixel clusters, strong parallax separation, atmospheric night haze represented with dithering. Environment only. No player character, no enemies, no invented gameplay event, no HUD, no score, no readable text, no logo, no photorealism, no smooth vector art.",
  },
  {
    id: "trapman-music-atmosphere",
    kind: "image",
    path: "trapman/music-atmosphere.webp",
    width: 1536,
    height: 864,
    generationWidth: 1536,
    generationHeight: 864,
    purpose: "TrapMan music section atmospheric plate",
    source: `${modelName} original text-to-image generation`,
    prompt:
      "Original 16-bit pixel-art nocturnal music atmosphere for an arcade runner website. Empty underground rehearsal room with a dark open doorway revealing a deep-indigo neon city at night, stacked speakers, coiled cables, cassette-deck silhouettes, restrained cyan and magenta waveform light reflected on a dark tiled floor, amber practical lamps, and calm dark central negative space for web typography. Handcrafted limited-palette sprite art, crisp pixels, moody editorial composition with controlled highlights. No white void, no daylight, no blown highlights, no people, no album cover, no readable text, no logo, no branded equipment, no interface, no photorealism, no smooth 3D render.",
  },
];

function parseArguments(argv) {
  const args = new Map();

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (!argument.startsWith("--")) {
      throw new Error(`Unexpected argument: ${argument}`);
    }

    const [key, inlineValue] = argument.slice(2).split("=", 2);
    if (inlineValue !== undefined) {
      args.set(key, inlineValue);
      continue;
    }

    const next = argv[index + 1];
    if (next && !next.startsWith("--")) {
      args.set(key, next);
      index += 1;
    } else {
      args.set(key, true);
    }
  }

  return args;
}

function validateAssetDefinitions() {
  const ids = new Set();
  const deliveryPaths = new Set();

  for (const asset of assets) {
    if (ids.has(asset.id)) {
      throw new Error(`Duplicate asset id: ${asset.id}`);
    }
    ids.add(asset.id);

    if (deliveryPaths.has(asset.path)) {
      throw new Error(`Duplicate asset path: ${asset.path}`);
    }
    deliveryPaths.add(asset.path);

    const resolvedPath = path.resolve(generatedAssetsRoot, asset.path);
    const relativePath = path.relative(generatedAssetsRoot, resolvedPath);
    if (
      relativePath === "" ||
      relativePath.startsWith("..") ||
      path.isAbsolute(relativePath)
    ) {
      throw new Error(`Asset escapes generated root: ${asset.path}`);
    }

    if (!asset.path.endsWith(".webp")) {
      throw new Error(`Delivery asset must be WebP: ${asset.path}`);
    }

    if (
      !Number.isInteger(asset.width) ||
      !Number.isInteger(asset.height) ||
      asset.width <= 0 ||
      asset.height <= 0
    ) {
      throw new Error(`Invalid delivery dimensions for ${asset.id}`);
    }

    if (!asset.prompt.trim() || asset.prompt.includes("MUAPI_API_KEY")) {
      throw new Error(`Invalid prompt for ${asset.id}`);
    }
  }
}

function loadEnvironmentFile(filePath) {
  return readFile(filePath, "utf8").then((contents) => {
    const values = {};

    for (const rawLine of contents.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) {
        continue;
      }

      const separatorIndex = line.indexOf("=");
      if (separatorIndex < 1) {
        continue;
      }

      const key = line.slice(0, separatorIndex).trim();
      let value = line.slice(separatorIndex + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      values[key] = value;
    }

    return values;
  });
}

async function getApiKey() {
  if (process.env.MUAPI_API_KEY) {
    sensitiveValues.add(process.env.MUAPI_API_KEY);
    return process.env.MUAPI_API_KEY;
  }

  const values = await loadEnvironmentFile(path.join(repositoryRoot, ".env.local"));
  if (!values.MUAPI_API_KEY) {
    throw new Error("MUAPI_API_KEY is not configured in .env.local");
  }
  sensitiveValues.add(values.MUAPI_API_KEY);
  return values.MUAPI_API_KEY;
}

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

class HttpResponseError extends Error {
  constructor(status) {
    super(`MuAPI request failed (${status})`);
    this.name = "HttpResponseError";
    this.status = status;
    this.retryable = status === 429 || status >= 500;
  }
}

async function requestOnce(url, options, fetchImpl = fetch) {
  const response = await fetchImpl(url, options);
  if (response.ok) {
    return response;
  }

  await response.body?.cancel().catch(() => {});
  throw new HttpResponseError(response.status);
}

function replaceAllLiteral(value, searchValue, replacement) {
  return searchValue ? value.split(searchValue).join(replacement) : value;
}

export function formatErrorForStderr(error, configuredSecrets = []) {
  let message =
    error instanceof Error ? error.message : "Design asset pipeline failed";

  for (const secret of configuredSecrets) {
    if (typeof secret === "string" && secret.length > 0) {
      message = replaceAllLiteral(message, secret, "[REDACTED]");
    }
  }

  return message
    .replace(
      /\b(Bearer)\s+[A-Za-z0-9._~+/=-]{8,}\b/gi,
      "$1 [REDACTED]",
    )
    .replace(
      /\b((?:authorization|x-api-key|api[_-]?key|key|token|secret)\s*[:=]\s*)(?:Bearer\s+)?[^\s,;]+/gi,
      "$1[REDACTED]",
    )
    .replace(/\b(?:sk|muapi)[-_][A-Za-z0-9._-]{8,}\b/gi, "[REDACTED]");
}

export async function parseJsonResponse(response, context) {
  try {
    return await response.json();
  } catch {
    throw new Error(`MuAPI ${context} returned invalid JSON`);
  }
}

export async function requestWithRetry(
  url,
  options,
  {
    attempts = 5,
    fetchImpl = fetch,
    waitImpl = wait,
  } = {},
) {
  let lastError;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await requestOnce(url, options, fetchImpl);
    } catch (error) {
      if (error instanceof HttpResponseError && !error.retryable) {
        throw error;
      }

      lastError = error;
      if (attempt === attempts - 1) {
        throw error;
      }
    }

    await waitImpl(1_000 * 2 ** attempt);
  }

  throw lastError;
}

function requestIdFrom(payload) {
  return payload.request_id ?? payload.requestId ?? payload.id;
}

function findOutputUrls(payload) {
  const urls = [];
  const preferredKeys = new Set([
    "output",
    "outputs",
    "image",
    "images",
    "image_url",
    "image_urls",
    "url",
    "urls",
  ]);

  function visit(value, key = "") {
    if (typeof value === "string" && /^https?:\/\//i.test(value)) {
      if (preferredKeys.has(key) || /\.(avif|jpe?g|png|webp)(\?|$)/i.test(value)) {
        urls.push(value);
      }
      return;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        visit(item, key);
      }
      return;
    }

    if (value && typeof value === "object") {
      for (const [nestedKey, nestedValue] of Object.entries(value)) {
        visit(nestedValue, nestedKey);
      }
    }
  }

  visit(payload);
  return [...new Set(urls)];
}

export async function submitGeneration(
  apiKey,
  asset,
  {
    fetchImpl = fetch,
  } = {},
) {
  const response = await requestOnce(
    `${apiBaseUrl}/${modelEndpoint}`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        prompt: asset.prompt,
        width: asset.generationWidth,
        height: asset.generationHeight,
      }),
    },
    fetchImpl,
  );
  const payload = await parseJsonResponse(response, "generation submission");
  const requestId = requestIdFrom(payload);

  if (!requestId) {
    throw new Error(`MuAPI did not return a request id for ${asset.id}`);
  }

  return requestId;
}

export async function pollGeneration(
  apiKey,
  requestId,
  {
    fetchImpl = fetch,
    waitImpl = wait,
    nowImpl = Date.now,
    timeoutMilliseconds = 12 * 60 * 1_000,
  } = {},
) {
  const deadline = nowImpl() + timeoutMilliseconds;

  while (nowImpl() < deadline) {
    const response = await requestWithRetry(
      `${apiBaseUrl}/predictions/${encodeURIComponent(requestId)}/result`,
      {
        headers: {
          "x-api-key": apiKey,
        },
      },
      {
        fetchImpl,
        waitImpl,
      },
    );
    const payload = await parseJsonResponse(response, "prediction status");
    const status = String(payload.status ?? "").toLowerCase();

    if (status === "completed") {
      const outputUrl = findOutputUrls(payload)[0];
      if (!outputUrl) {
        throw new Error(`Completed MuAPI request ${requestId} has no image output`);
      }
      return {
        outputUrl,
        payload,
      };
    }

    if (["failed", "cancelled", "canceled"].includes(status)) {
      throw new Error(`MuAPI request ${requestId} ended with status ${status}`);
    }

    await waitImpl(3_000);
  }

  throw new Error(`Timed out waiting for MuAPI request ${requestId}`);
}

async function downloadCandidate(outputUrl, destinationPath) {
  const response = await requestWithRetry(outputUrl, {});
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.startsWith("image/")) {
    throw new Error(`MuAPI output is not an image (${contentType || "unknown"})`);
  }

  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length < 10_000) {
    throw new Error("MuAPI output is unexpectedly small");
  }

  await writeFile(destinationPath, bytes);
  return {
    bytes: bytes.length,
    sha256: createHash("sha256").update(bytes).digest("hex"),
  };
}

function selectedAssets(value) {
  if (!value || value === true || value === "all") {
    return assets;
  }

  const requested = new Set(String(value).split(",").map((id) => id.trim()));
  const selected = assets.filter((asset) => requested.has(asset.id));
  const missing = [...requested].filter(
    (id) => !assets.some((asset) => asset.id === id),
  );

  if (missing.length > 0) {
    throw new Error(`Unknown asset ids: ${missing.join(", ")}`);
  }
  return selected;
}

async function generateCandidates(only) {
  const apiKey = await getApiKey();
  const runDirectory = path.join(
    os.tmpdir(),
    "nobilix-design-assets",
    new Date().toISOString().replace(/[:.]/g, "-"),
  );
  const candidateDirectory = path.join(runDirectory, "candidates");
  await mkdir(candidateDirectory, { recursive: true });

  const generation = {
    generatedAt: new Date().toISOString(),
    endpoint: modelEndpoint,
    model: modelName,
    assets: [],
  };
  const generationPath = path.join(runDirectory, "generation.json");

  async function saveGenerationRecord() {
    await writeFile(generationPath, `${JSON.stringify(generation, null, 2)}\n`);
  }

  await saveGenerationRecord();

  for (const asset of selectedAssets(only)) {
    process.stdout.write(`Generating ${asset.id}...\n`);
    const requestId = await submitGeneration(apiKey, asset);
    const { outputUrl } = await pollGeneration(apiKey, requestId);
    const candidatePath = path.join(candidateDirectory, `${asset.id}.source`);
    const download = await downloadCandidate(outputUrl, candidatePath);

    generation.assets.push({
      id: asset.id,
      requestId,
      candidatePath: path.relative(runDirectory, candidatePath),
      outputUrl,
      bytes: download.bytes,
      sha256: download.sha256,
      generatedAt: new Date().toISOString(),
      review: {
        approved: false,
        notes: "",
      },
    });
    await saveGenerationRecord();
    process.stdout.write(`Downloaded candidate ${asset.id}.\n`);
  }

  process.stdout.write(`Candidate run: ${runDirectory}\n`);
}

async function optimizeCandidate(sourcePath, destinationPath, width, height) {
  const { default: sharp } = await import("sharp");
  await mkdir(path.dirname(destinationPath), { recursive: true });

  await sharp(sourcePath, { failOn: "warning" })
    .rotate()
    .resize(width, height, {
      fit: "cover",
      position: "centre",
      withoutEnlargement: false,
    })
    .webp({
      quality: 84,
      effort: 6,
      smartSubsample: true,
    })
    .toFile(destinationPath);
}

async function pathExists(candidatePath) {
  try {
    await access(candidatePath);
    return true;
  } catch {
    return false;
  }
}

export function createTransactionPaths(
  deliveryRoot,
  transactionId = randomUUID(),
) {
  const resolvedDeliveryRoot = path.resolve(deliveryRoot);
  const repositoryVolume = path.parse(repositoryRoot).root.toLowerCase();
  const deliveryVolume = path.parse(resolvedDeliveryRoot).root.toLowerCase();

  if (repositoryVolume !== deliveryVolume) {
    throw new Error(
      "Delivery and repository transaction roots must be on the same volume",
    );
  }

  return {
    root: transactionRoot,
    stagingPrefix: path.join(transactionRoot, `staging-${transactionId}-`),
    backupRoot: path.join(transactionRoot, `backup-${transactionId}`),
  };
}

async function replaceDeliverySet(stagingRoot, deliveryRoot, backupRoot) {
  const hadExistingDelivery = await pathExists(deliveryRoot);

  if (hadExistingDelivery) {
    await rename(deliveryRoot, backupRoot);
  }

  try {
    await rename(stagingRoot, deliveryRoot);
  } catch (error) {
    if (hadExistingDelivery) {
      await rename(backupRoot, deliveryRoot);
    }
    throw error;
  }

  if (hadExistingDelivery) {
    await rm(backupRoot, { recursive: true, force: true }).catch(() => {});
  }
}

export async function approveCandidates({
  runDirectory,
  approvedValue,
  replacementRunDirectory,
  deliveryRoot = generatedAssetsRoot,
  optimizeCandidateImpl = optimizeCandidate,
}) {
  const resolvedRunDirectory = path.resolve(runDirectory);
  const generationPath = path.join(resolvedRunDirectory, "generation.json");
  const generation = JSON.parse(await readFile(generationPath, "utf8"));
  const recordsById = new Map(
    generation.assets.map((record) => [
      record.id,
      {
        generation,
        record,
        runDirectory: resolvedRunDirectory,
      },
    ]),
  );

  if (replacementRunDirectory) {
    const resolvedReplacementDirectory = path.resolve(replacementRunDirectory);
    const replacementGeneration = JSON.parse(
      await readFile(
        path.join(resolvedReplacementDirectory, "generation.json"),
        "utf8",
      ),
    );

    for (const record of replacementGeneration.assets) {
      recordsById.set(record.id, {
        generation: replacementGeneration,
        record,
        runDirectory: resolvedReplacementDirectory,
      });
    }
  }

  const approvedIds =
    approvedValue === "all"
      ? new Set(recordsById.keys())
      : new Set(
          String(approvedValue ?? "")
            .split(",")
            .map((id) => id.trim())
            .filter(Boolean),
        );

  if (approvedIds.size === 0) {
    throw new Error("Pass --approved=all or a comma-separated list of reviewed ids");
  }

  const selectedRecords = [...recordsById.values()].filter(({ record }) =>
    approvedIds.has(record.id),
  );
  const validatedRecords = [];
  for (const selectedRecord of selectedRecords) {
    const {
      generation: recordGeneration,
      record,
      runDirectory: recordRunDirectory,
    } = selectedRecord;
    const definition = assets.find((asset) => asset.id === record.id);
    if (!definition) {
      throw new Error(`Generation record has unknown id: ${record.id}`);
    }

    const sourcePath = path.resolve(recordRunDirectory, record.candidatePath);
    const relativeSource = path.relative(recordRunDirectory, sourcePath);
    if (
      relativeSource.startsWith("..") ||
      path.isAbsolute(relativeSource)
    ) {
      throw new Error(`Candidate escapes its run directory: ${record.candidatePath}`);
    }
    await access(sourcePath);
    validatedRecords.push({
      definition,
      generatedAt: record.generatedAt ?? recordGeneration.generatedAt,
      recordGeneration,
      sourcePath,
    });
  }

  const missingRequired = assets.filter(
    (asset) =>
      !validatedRecords.some(
        ({ definition }) => definition.id === asset.id,
      ),
  );
  if (missingRequired.length > 0) {
    throw new Error(
      `Approval set is incomplete: ${missingRequired
        .map((asset) => asset.id)
        .join(", ")}`,
    );
  }

  const resolvedDeliveryRoot = path.resolve(deliveryRoot);
  const transactionPaths = createTransactionPaths(resolvedDeliveryRoot);
  await mkdir(transactionPaths.root, { recursive: true });
  const stagingRoot = await mkdtemp(transactionPaths.stagingPrefix);

  try {
    const manifestEntries = [];
    for (const {
      definition,
      generatedAt,
      recordGeneration,
      sourcePath,
    } of validatedRecords) {
      const stagedDeliveryPath = path.resolve(stagingRoot, definition.path);
      await optimizeCandidateImpl(
        sourcePath,
        stagedDeliveryPath,
        definition.width,
        definition.height,
      );

      manifestEntries.push({
        id: definition.id,
        kind: definition.kind,
        path: definition.path,
        width: definition.width,
        height: definition.height,
        source: definition.source,
        purpose: definition.purpose,
        prompt: definition.prompt,
        model: recordGeneration.model,
        endpoint: recordGeneration.endpoint,
        seed: null,
        generatedAt,
        approved: true,
        approval: "Manual visual review",
      });
    }

    const latestGenerationTimestamp = manifestEntries
      .map((entry) => entry.generatedAt)
      .sort()
      .at(-1);
    await writeFile(
      path.join(stagingRoot, path.basename(manifestPath)),
      `${JSON.stringify(
        {
          version: 1,
          generatedAt: latestGenerationTimestamp,
          reviewedAt: new Date().toISOString(),
          assets: manifestEntries,
        },
        null,
        2,
      )}\n`,
    );

    await replaceDeliverySet(
      stagingRoot,
      resolvedDeliveryRoot,
      transactionPaths.backupRoot,
    );
  } catch (error) {
    await rm(stagingRoot, { recursive: true, force: true }).catch(() => {});
    throw error;
  } finally {
    await rmdir(transactionPaths.root).catch(() => {});
  }

  process.stdout.write(
    `Approved and optimized ${validatedRecords.length} delivery assets.\n`,
  );
}

async function main() {
  validateAssetDefinitions();
  const args = parseArguments(process.argv.slice(2));

  if (args.has("dry-run")) {
    process.stdout.write(`Validated ${assets.length} design asset definitions.\n`);
    return;
  }

  if (args.has("generate")) {
    await generateCandidates(args.get("only"));
    return;
  }

  if (args.has("approve")) {
    await approveCandidates({
      runDirectory: args.get("approve"),
      approvedValue: args.get("approved"),
      replacementRunDirectory: args.get("replacement-run"),
    });
    return;
  }

  throw new Error(
    "Usage: node scripts/generate-design-assets.mjs --dry-run | --generate [--only=id,...] | --approve=<run-directory> --approved=all",
  );
}

const isMainModule =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isMainModule) {
  main().catch(async (error) => {
    const configuredSecrets = [
      ...sensitiveValues,
      process.env.MUAPI_API_KEY,
    ].filter(Boolean);
    if (process.env.MUAPI_API_KEY) {
      delete process.env.MUAPI_API_KEY;
    }
    process.stderr.write(
      `${formatErrorForStderr(error, configuredSecrets)}\n`,
    );
    sensitiveValues.clear();
    process.exitCode = 1;
  });
}

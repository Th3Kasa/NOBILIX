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
const videoModelEndpoint = "kling-v3.0-pro-text-to-video";
const videoModelName = "MuAPI Kling v3.0 Pro";
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
      "Original dark editorial hero image for a premium independent game studio based in Sydney, Australia. Abstract top-down isometric view of a pristine pixel-art city grid — some tiles placed, some still void — suggesting a world under active construction. A single restrained neon-violet column of light rises from the active build point. Deep matte black background, precise geometric obsidian forms, minimal palette of charcoal and violet with one acid-lime construction-cursor accent. Wide cinematic 16:9 composition with generous negative space for web typography. Studio craft, pixel precision, dark Swiss editorial restraint. No people, no text, no logos, no generic office interior, no photorealism, no stock CGI, no cliché gaming props, no keyboards or monitors.",
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
      "Original editorial transition plate for an independent game studio portfolio page. Abstract dark cinematic composition: the left two-thirds is deep obsidian studio space with subtle charcoal geometric texture, the right third shows 16-bit pixel-art city fragments materialising from darkness — tiny rooftop silhouettes, a harbour waterline, distant glass towers beginning to appear as if a digital world is rendering into existence. A single thin violet-to-cyan gradient seam marks the transition zone. Gallery-catalogue restraint, disciplined dark negative space, no accidental brightness. No text, no letters, no logos, no people, no photorealistic office, no stationery, no rulers, no notepads, no paper, no craft materials.",
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
      "Original wide 16-bit pixel-art night cityscape representing Sydney, Australia, for an arcade runner game website. Wide view across layered rooftops and elevated rail lines. Left waterfront features an abstracted curved shell-roof silhouette evoking an opera house in chunky pixel blocks. Centre-right shows a slim tapering tower spire inspired by Sydney's CBD landmark. Clustered glass-tower blocks reflect cyan neon in dark harbour pixel water below. Deep indigo sky, amber street-lamp pools, cyan window rhythm, electric magenta light bars, wet pixel harbour reflections. Three distinct parallax layers: distant harbour-and-skyline, mid-ground rooftop route with elevated train tracks, foreground balustrades and fire-escape rails framing a clear horizontal running corridor. Graphic hand-authored sprite aesthetic, limited colour clusters, crisp hard pixel edges, cinematic depth. Absolutely no signs, glyphs, symbols, letters, numbers, characters, gameplay UI, scores, logos, photorealism, smooth 3D rendering, or generic cyberpunk portrait.",
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
      "Original vertical 16-bit pixel-art night cityscape representing Sydney, Australia, for a mobile arcade runner website. Dramatic upward view through a narrow Sydney laneway: wrought-iron lace balconies on terrace houses either side, sandstone colonial wall texture in chunky pixel blocks, modern glass CBD towers above reflecting cyan neon. Narrow strip of deep indigo sky at the top shows pixel Southern Cross constellation stars. Magenta electrical glow, amber street-lamp pools, pixel rain drops catching neon light, strong vertical depth, uncluttered centre for web copy. Handcrafted limited-palette sprite art with crisp hard edges. No characters, no gameplay UI, no scores, no readable text, no logos, no photorealism, no smooth 3D render, no generic cyberpunk portrait.",
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
      "Original side-scrolling 16-bit pixel-art street route through Sydney, Australia at night, for an arcade runner game website. A horizontal running corridor inspired by Sydney's streets: wrought-iron lace-balcony terrace houses as backdrop, sandstone wall texture on pixel blocks to the right, overhead Metro rail lines, a brief harbour water glimpse in the distance with pixel ferry lights. Cyan window rhythm, magenta neon bars, amber lamp pools, abstract collectible sparkle light trails along the route. Indigo-black base with cyan, violet, magenta and amber accents, crisp limited-palette pixel clusters, strong parallax separation. Environment only. No player character, no enemies, no HUD, no score, no readable text, no logo, no photorealism, no smooth vector art.",
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
      "Original 16-bit pixel-art nocturnal music atmosphere representing Sydney's underground music scene, for an arcade runner game website. Empty basement venue with exposed sandstone colonial-era walls lit by magenta and cyan neon strips, a vintage pub stage setup with chunky pixel speaker stacks and cable coils, a dark open doorway revealing Sydney's CBD neon skyline at night with a harbour glimpse beyond. Restrained cyan and magenta waveform light reflecting on a dark tiled pub floor, amber warm lamp pools, and calm dark central negative space for web typography. Handcrafted limited-palette sprite art, crisp pixels, moody editorial composition. No white void, no daylight, no people, no album cover, no readable text, no logo, no branded equipment, no interface, no photorealism, no smooth 3D render.",
  },

  // ── Cinematic video loops (Kling v3.0 Pro) ───────────────────────────────
  {
    id: "nobilix-studio-hero-video",
    kind: "video",
    path: "nobilix/studio-hero.mp4",
    duration: 5,
    aspectRatio: "16:9",
    posterWidth: 1536,
    posterHeight: 864,
    purpose: "Nobilix studio hero cinematic atmospheric loop",
    source: `${videoModelName} original text-to-video generation`,
    prompt:
      "Ultra-cinematic slow atmospheric loop for a premium independent game studio website hero. Abstract top-down isometric dark pixel-art city grid being built tile by tile in slow motion — obsidian tiles materialising out of black void, a single neon-violet light column pulsing gently where construction is active, one acid-lime cursor spark floating above the active tile. Deep charcoal and void-black palette, soft volumetric glow from the violet build light, subtle 16mm film grain. Completely still except for the gentle violet light pulse and new tiles quietly appearing. No camera movement. No people, no text, no logos, no generic office, no product shots, no generic cyberpunk, no bright highlights.",
    negativePrompt:
      "people, faces, text, letters, logos, UI, interface, games, bright colors, white backgrounds, daylight, camera shake, subtitles, watermarks, photorealism, 3D render",
  },
  {
    id: "trapman-city-hero-video",
    kind: "video",
    path: "trapman/city-hero.mp4",
    duration: 5,
    aspectRatio: "16:9",
    posterWidth: 1536,
    posterHeight: 864,
    purpose: "TrapMan city hero cinematic pixel loop (desktop)",
    source: `${videoModelName} original text-to-video generation`,
    prompt:
      "Cinematic looping 16-bit pixel-art Sydney night cityscape for an arcade runner game website. Wide view across layered rooftops and elevated rail lines. Left waterfront: an abstracted curved shell-roof pixel silhouette evoking an opera house. Centre: slim tapering CBD tower spire. Harbour pixel water below with neon reflections rippling as animated pixels. Cyan windows flickering with subtle life, electric magenta neon bars pulsing rhythmically, amber street-lamp pools glowing, pixel train lights crossing the upper skyline. Three-layer parallax depth with smooth background drift. Deep indigo sky, crisp hard pixel edges, limited Sydney night colour palette. Perfectly loopable 5-second cycle.",
    negativePrompt:
      "characters, enemies, player, HUD, score, text, logos, smooth 3D render, photorealistic, generic cyberpunk, watermarks, camera shake",
  },
  {
    id: "trapman-city-mobile-video",
    kind: "video",
    path: "trapman/city-mobile.mp4",
    duration: 5,
    aspectRatio: "9:16",
    posterWidth: 864,
    posterHeight: 1536,
    purpose: "TrapMan city hero cinematic pixel loop (mobile portrait)",
    source: `${videoModelName} original text-to-video generation`,
    prompt:
      "Cinematic looping vertical 16-bit pixel-art Sydney night cityscape for a mobile arcade runner game website. Dramatic upward view through a narrow Sydney laneway: wrought-iron lace balconies on terrace houses either side, chunky sandstone colonial pixel walls, modern CBD glass towers above with cyan neon reflections. Pixel Southern Cross stars visible in the narrow deep-indigo sky strip at top. Cyan windows flickering, magenta electrical glow pulsing, amber street lamp pools, pixel rain drops catching neon light. Vertical depth parallax with layers moving at different speeds. Handcrafted limited-palette sprite art, crisp hard pixel edges. Perfectly loopable 5-second vertical cycle.",
    negativePrompt:
      "characters, HUD, text, logos, smooth 3D, photorealistic, watermarks, camera shake, subtitles",
  },
  {
    id: "trapman-gameplay-video",
    kind: "video",
    path: "trapman/gameplay-atmosphere.mp4",
    duration: 5,
    aspectRatio: "16:9",
    posterWidth: 1536,
    posterHeight: 864,
    purpose: "TrapMan gameplay section cinematic environment loop",
    source: `${videoModelName} original text-to-video generation`,
    prompt:
      "Cinematic looping side-scrolling 16-bit pixel-art Sydney street route for an arcade runner game website. Smooth rightward parallax scroll: foreground wrought-iron lace-balcony terrace house rails and sandstone wall fragments, mid-ground colonial terrace facades with flickering cyan windows, overhead Metro rail lines, background Sydney harbour water with tiny pixel ferry lights and distant CBD skyline drifting slowly. Deep indigo night palette with cyan window accents, magenta neon bars, amber street lamps, abstract collectible sparkle trails along the running route. Three distinct scroll speeds. Perfectly loopable 5-second horizontal cycle.",
    negativePrompt:
      "player character, enemies, HUD, score, text, logos, smooth 3D render, photorealistic, watermarks, static image, no motion",
  },
  {
    id: "trapman-music-video",
    kind: "video",
    path: "trapman/music-atmosphere.mp4",
    duration: 5,
    aspectRatio: "16:9",
    posterWidth: 1536,
    posterHeight: 864,
    purpose: "TrapMan music section cinematic atmosphere loop",
    source: `${videoModelName} original text-to-video generation`,
    prompt:
      "Cinematic looping 16-bit pixel-art Sydney underground music venue atmosphere. Exposed sandstone colonial pixel walls lit by pulsing magenta and cyan neon strips, vintage pub stage speaker grille pixel lights gently pulsing to an implied rhythm, abstract equalizer waveform bars rising and falling, amber pub lamp warmth flickering gently, coiled cable shadows, open doorway in background revealing Sydney CBD neon skyline with harbour glimpse. Restrained cyan and magenta waveform light reflections on dark tiled pub floor. Handcrafted limited-palette sprite art. Perfectly loopable 5-second atmospheric cycle.",
    negativePrompt:
      "people, musicians, text, logos, album art, photorealistic, smooth 3D render, bright daylight, watermarks, camera shake",
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

    if (asset.kind === "video") {
      if (!asset.path.endsWith(".mp4")) {
        throw new Error(`Video asset must be .mp4: ${asset.path}`);
      }
      if (!Number.isInteger(asset.duration) || (asset.duration !== 5 && asset.duration !== 10)) {
        throw new Error(`Video duration must be 5 or 10 for ${asset.id}`);
      }
      if (!["16:9", "9:16", "1:1"].includes(asset.aspectRatio)) {
        throw new Error(`Video aspectRatio must be 16:9, 9:16, or 1:1 for ${asset.id}`);
      }
    } else {
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

export async function submitVideoGeneration(
  apiKey,
  asset,
  {
    fetchImpl = fetch,
  } = {},
) {
  const body = {
    prompt: asset.prompt,
    duration: asset.duration,
    aspect_ratio: asset.aspectRatio,
    cfg_scale: 0.5,
  };
  if (asset.negativePrompt) {
    body.negative_prompt = asset.negativePrompt;
  }

  const response = await requestOnce(
    `${apiBaseUrl}/${videoModelEndpoint}`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify(body),
    },
    fetchImpl,
  );
  const payload = await parseJsonResponse(response, "video generation submission");
  const requestId = requestIdFrom(payload);

  if (!requestId) {
    throw new Error(`MuAPI did not return a video request id for ${asset.id}`);
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

async function downloadCandidate(outputUrl, destinationPath, kind = "image") {
  const response = await requestWithRetry(outputUrl, {});
  const contentType = response.headers.get("content-type") ?? "";
  const validContentType =
    kind === "video"
      ? contentType.startsWith("video/") || contentType.startsWith("application/octet-stream")
      : contentType.startsWith("image/");
  if (!validContentType) {
    throw new Error(
      `MuAPI output has unexpected content-type for ${kind} (${contentType || "unknown"})`,
    );
  }

  const bytes = Buffer.from(await response.arrayBuffer());
  const minBytes = kind === "video" ? 100_000 : 10_000;
  if (bytes.length < minBytes) {
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
    process.stdout.write(`Generating ${asset.id} [${asset.kind ?? "image"}]...\n`);
    const requestId =
      asset.kind === "video"
        ? await submitVideoGeneration(apiKey, asset)
        : await submitGeneration(apiKey, asset);
    const { outputUrl } = await pollGeneration(apiKey, requestId);
    const candidatePath = path.join(candidateDirectory, `${asset.id}.source`);
    const download = await downloadCandidate(outputUrl, candidatePath, asset.kind);

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

async function copyCandidate(sourcePath, destinationPath) {
  await mkdir(path.dirname(destinationPath), { recursive: true });
  await writeFile(destinationPath, await readFile(sourcePath));
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

  const resolvedDeliveryRoot = path.resolve(deliveryRoot);
  const transactionPaths = createTransactionPaths(resolvedDeliveryRoot);
  await mkdir(transactionPaths.root, { recursive: true });
  const stagingRoot = await mkdtemp(transactionPaths.stagingPrefix);

  try {
    // Read existing manifest so we can preserve already-approved assets not being replaced.
    let existingManifestData = { assets: [] };
    const existingManifestFile = path.join(resolvedDeliveryRoot, path.basename(manifestPath));
    if (await pathExists(existingManifestFile)) {
      try {
        existingManifestData = JSON.parse(await readFile(existingManifestFile, "utf8"));
      } catch {
        // Ignore parse errors — treat as empty
      }
    }

    const manifestEntries = [];

    // Copy forward any already-approved delivery assets not being replaced this run.
    for (const existingEntry of existingManifestData.assets ?? []) {
      if (approvedIds.has(existingEntry.id)) continue;
      const existingSrc = path.join(resolvedDeliveryRoot, existingEntry.path);
      const existingDst = path.resolve(stagingRoot, existingEntry.path);
      if (await pathExists(existingSrc)) {
        await mkdir(path.dirname(existingDst), { recursive: true });
        await writeFile(existingDst, await readFile(existingSrc));
        manifestEntries.push(existingEntry);
      }
    }

    for (const {
      definition,
      generatedAt,
      recordGeneration,
      sourcePath,
    } of validatedRecords) {
      const stagedDeliveryPath = path.resolve(stagingRoot, definition.path);
      if (definition.kind === "video") {
        await copyCandidate(sourcePath, stagedDeliveryPath);
      } else {
        await optimizeCandidateImpl(
          sourcePath,
          stagedDeliveryPath,
          definition.width,
          definition.height,
        );
      }

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

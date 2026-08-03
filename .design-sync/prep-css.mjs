/**
 * Harvest the app's own compiled CSS for the design-sync bundle.
 *
 * NOBILIX has no library build — its real stylesheet is what `next build`
 * emits (Tailwind v4 utilities + globals.css + trapman.css, compiled).
 * This script concatenates the emitted chunks, relocates the self-hosted
 * font files next/font produced, and re-declares the `--font-*` variables
 * next/font normally sets via generated classes on <html> (preview cards
 * never carry those classes, so without this every card falls back to
 * system fonts).
 *
 * Run after `npm run build`; the converter's cssEntry/extraFonts point at
 * the output (.design-sync/.cache/compiled/app.css).
 */
import {
  readdirSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
  copyFileSync,
  existsSync,
} from "node:fs";
import path from "node:path";

const root = process.cwd();
const chunksDir = path.join(root, ".next/static/chunks");
const mediaDir = path.join(root, ".next/static/media");
const outDir = path.join(root, ".design-sync/.cache/compiled");
const fontsOut = path.join(outDir, "fonts");
mkdirSync(fontsOut, { recursive: true });

const cssFiles = existsSync(chunksDir)
  ? readdirSync(chunksDir).filter((f) => f.endsWith(".css"))
  : [];
if (!cssFiles.length) {
  console.error("no CSS chunks in .next/static/chunks — run `npm run build` first");
  process.exit(1);
}

let css = cssFiles
  .map((f) => `/* == ${f} == */\n` + readFileSync(path.join(chunksDir, f), "utf8"))
  .join("\n");

// Relocate /_next/static/media/* references (fonts) beside the output CSS.
const copied = new Set();
let missing = 0;
css = css.replace(
  /url\((['"]?)\/_next\/static\/media\/([^'")]+)\1\)/g,
  (whole, _q, file) => {
    const src = path.join(mediaDir, file);
    if (!existsSync(src)) {
      console.warn(`! missing media file: ${file}`);
      missing++;
      return whole;
    }
    if (!copied.has(file)) {
      copyFileSync(src, path.join(fontsOut, file));
      copied.add(file);
    }
    return `url(./fonts/${file})`;
  },
);

// Re-declare every --font-* custom property on :root.
const fontVars = new Map();
for (const m of css.matchAll(/(--font-[a-z0-9-]+)\s*:\s*([^;}]+)/g)) {
  fontVars.set(m[1], m[2].trim());
}
if (fontVars.size) {
  css += `\n/* prep-css: next/font variables re-scoped for standalone previews */\n:root{${[...fontVars].map(([k, v]) => `${k}:${v}`).join(";")}}\n`;
}

writeFileSync(path.join(outDir, "app.css"), css);
console.log(
  `wrote app.css (${(css.length / 1024).toFixed(0)} KB) from ${cssFiles.length} chunks; ` +
    `${copied.size} font files copied${missing ? `, ${missing} missing` : ""}; ` +
    `${fontVars.size} font vars re-scoped`,
);

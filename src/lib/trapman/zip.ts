import { unzipSync } from "fflate";

/**
 * The CSV files inside a zip, as raw bytes.
 *
 * Google zips its sales and earnings reports. Node can inflate a compressed
 * stream but cannot read a zip archive's directory, hence the small dependency.
 */
export function readZipCsvs(
  bytes: Uint8Array,
): { name: string; bytes: Uint8Array }[] {
  const entries = unzipSync(bytes, {
    filter: (file) => /\.csv$/i.test(file.name),
  });
  return Object.entries(entries).map(([name, data]) => ({ name, bytes: data }));
}

#!/usr/bin/env node
/**
 * Optional helper to pre-download the on-device food-recognition model into
 * `assets/model/` so it can be bundled with the binary instead of fetched at
 * runtime. The app works either way (it falls back to a one-time runtime
 * download), so this script is a convenience for offline-first builds.
 *
 * Usage:
 *   MODEL_URL="https://.../food101.tflite" npm run fetch-model
 *
 * The default URL must point to a Food-101 TFLite classifier whose output
 * classes match src/ml/labels.ts. See docs/MODEL.md.
 */

import { createWriteStream } from 'node:fs';
import { mkdir, stat } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'assets', 'model');
const OUT_FILE = join(OUT_DIR, 'food101.tflite');

const MODEL_URL =
  process.env.MODEL_URL ||
  'https://github.com/evanoctave/funny-idea/releases/download/model-v1/food101.tflite';

async function main() {
  console.log(`Fetching model:\n  ${MODEL_URL}`);
  await mkdir(OUT_DIR, { recursive: true });

  const res = await fetch(MODEL_URL);
  if (!res.ok || !res.body) {
    throw new Error(`Download failed: HTTP ${res.status} ${res.statusText}`);
  }

  await pipeline(Readable.fromWeb(res.body), createWriteStream(OUT_FILE));
  const { size } = await stat(OUT_FILE);
  if (size < 1024) {
    throw new Error(`Downloaded file looks too small (${size} bytes). Check MODEL_URL.`);
  }
  console.log(`Saved ${(size / 1e6).toFixed(2)} MB -> ${OUT_FILE}`);
}

main().catch((err) => {
  console.error(`\n✗ ${err.message}`);
  console.error(
    'Set a valid MODEL_URL (a hosted .tflite Food-101 classifier). See docs/MODEL.md.',
  );
  process.exit(1);
});

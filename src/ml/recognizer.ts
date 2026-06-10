// On-device Food-101 image classifier (TensorFlow Lite). Fails soft to manual
// search if the model can't be downloaded or loaded.

import * as Crypto from 'expo-crypto';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { decode as decodeJpeg } from 'jpeg-js';
import { loadTensorflowModel, type TensorflowModel } from 'react-native-fast-tflite';

import { FOOD101_LABELS, LABEL_TO_FOOD_ID, prettyLabel } from './labels';
import { getFoodById, type FoodItem } from '../data/foods';

// Hosted .tflite whose output classes match FOOD101_LABELS. See docs/MODEL.md.
// Must be HTTPS — the loader refuses any other scheme.
export const MODEL_URL =
  'https://github.com/evanoctave/plately/releases/download/model-v1/food101.tflite';

// Optional integrity pin. Set to the model's lowercase 64-char hex SHA-256 to
// reject any tampered or substituted download. Empty = skip hash check (TLS +
// size + functional-load validation still apply). See docs/MODEL.md.
export const MODEL_SHA256: string = '';

// Reject truncated downloads / HTML error pages masquerading as the model.
const MIN_MODEL_BYTES = 1_000_000;

const INPUT_SIZE = 160;
// 'raw' = feed pixels as 0–255 floats. Our exported model has MobileNetV2
// preprocess_input baked in, so it expects RAW 0–255 and normalizes to [-1,1]
// internally. Do NOT pre-normalize here or predictions will be garbage.
const NORMALIZE: 'zero_one' | 'minus_one_one' | 'raw' = 'raw';

const MODEL_FILENAME = 'food101.tflite';
const MODEL_PATH = `${FileSystem.documentDirectory ?? ''}${MODEL_FILENAME}`;

export interface Prediction {
  label: string;
  displayName: string;
  confidence: number;
  food?: FoodItem;
}

export type ModelStatus =
  | 'idle'
  | 'downloading'
  | 'loading'
  | 'ready'
  | 'unavailable';

let model: TensorflowModel | null = null;
let loadPromise: Promise<TensorflowModel | null> | null = null;
let status: ModelStatus = 'idle';

export function getModelStatus(): ModelStatus {
  return status;
}

export function isModelReady(): boolean {
  return status === 'ready' && model !== null;
}

export async function isModelCached(): Promise<boolean> {
  try {
    const info = await FileSystem.getInfoAsync(MODEL_PATH);
    return info.exists && (info.size ?? 0) > 0;
  } catch {
    return false;
  }
}

// Verifies the cached file is a plausible, untampered model. Deletes it and
// returns false on any failure so the next load re-downloads cleanly.
async function verifyModelFile(): Promise<boolean> {
  try {
    const info = await FileSystem.getInfoAsync(MODEL_PATH);
    if (!info.exists || (info.size ?? 0) < MIN_MODEL_BYTES) return false;

    if (MODEL_SHA256) {
      const b64 = await FileSystem.readAsStringAsync(MODEL_PATH, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const digest = await Crypto.digest(
        Crypto.CryptoDigestAlgorithm.SHA256,
        base64ToBytes(b64),
      );
      const hex = Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
      if (hex !== MODEL_SHA256.toLowerCase()) return false;
    }
    return true;
  } catch {
    return false;
  }
}

// Downloads the model once if needed; returns the local URI or null.
async function ensureModelFile(
  onProgress?: (fraction: number) => void,
): Promise<string | null> {
  try {
    // Defense in depth: never fetch model weights over a cleartext channel.
    if (!MODEL_URL.startsWith('https://')) return null;
    if (await isModelCached()) {
      return (await verifyModelFile()) ? MODEL_PATH : null;
    }
    if (!FileSystem.documentDirectory) return null;

    status = 'downloading';
    const download = FileSystem.createDownloadResumable(
      MODEL_URL,
      MODEL_PATH,
      {},
      (p) => {
        if (p.totalBytesExpectedToWrite > 0) {
          onProgress?.(p.totalBytesWritten / p.totalBytesExpectedToWrite);
        }
      },
    );
    const result = await download.downloadAsync();
    if (!result || result.status !== 200 || !(await verifyModelFile())) {
      await FileSystem.deleteAsync(MODEL_PATH, { idempotent: true });
      return null;
    }
    return MODEL_PATH;
  } catch {
    await FileSystem.deleteAsync(MODEL_PATH, { idempotent: true }).catch(() => undefined);
    return null;
  }
}

// Loads the model into memory. Idempotent; concurrent calls share one promise.
export async function loadModel(
  onProgress?: (fraction: number) => void,
): Promise<TensorflowModel | null> {
  if (model) return model;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    const fileUri = await ensureModelFile(onProgress);
    if (!fileUri) {
      status = 'unavailable';
      return null;
    }
    try {
      status = 'loading';
      const loaded = await loadTensorflowModel({ url: fileUri });
      model = loaded;
      status = 'ready';
      return loaded;
    } catch {
      status = 'unavailable';
      model = null;
      return null;
    }
  })();

  try {
    return await loadPromise;
  } finally {
    loadPromise = null;
  }
}

// --- Image preprocessing ---

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const B64_LOOKUP = (() => {
  const table = new Uint8Array(256);
  for (let i = 0; i < B64.length; i++) table[B64.charCodeAt(i)] = i;
  return table;
})();

function base64ToBytes(base64: string): Uint8Array {
  const clean = base64.replace(/[^A-Za-z0-9+/]/g, '');
  const padding = clean.endsWith('==') ? 2 : clean.endsWith('=') ? 1 : 0;
  const byteLength = (clean.length * 3) / 4 - padding;
  const bytes = new Uint8Array(byteLength);

  let p = 0;
  for (let i = 0; i < clean.length; i += 4) {
    const e1 = B64_LOOKUP[clean.charCodeAt(i)] ?? 0;
    const e2 = B64_LOOKUP[clean.charCodeAt(i + 1)] ?? 0;
    const e3 = B64_LOOKUP[clean.charCodeAt(i + 2)] ?? 0;
    const e4 = B64_LOOKUP[clean.charCodeAt(i + 3)] ?? 0;
    if (p < byteLength) bytes[p++] = (e1 << 2) | (e2 >> 4);
    if (p < byteLength) bytes[p++] = ((e2 & 15) << 4) | (e3 >> 2);
    if (p < byteLength) bytes[p++] = ((e3 & 3) << 6) | e4;
  }
  return bytes;
}

async function imageToTensor(uri: string): Promise<Float32Array> {
  const manipulated = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: INPUT_SIZE, height: INPUT_SIZE } }],
    { compress: 1, format: ImageManipulator.SaveFormat.JPEG, base64: true },
  );
  // Free the temp resized file as soon as we've read its bytes — these pile up
  // in the cache dir across many captures otherwise.
  void FileSystem.deleteAsync(manipulated.uri, { idempotent: true }).catch(() => undefined);

  if (!manipulated.base64) {
    throw new Error('Failed to read resized image data');
  }

  const jpegBytes = base64ToBytes(manipulated.base64);
  const { data, width, height } = decodeJpeg(jpegBytes, { useTArray: true });

  const tensor = new Float32Array(INPUT_SIZE * INPUT_SIZE * 3);
  let t = 0;
  // jpeg-js returns RGBA; drop alpha and normalize.
  for (let i = 0; i < width * height; i++) {
    const r = data[i * 4] ?? 0;
    const g = data[i * 4 + 1] ?? 0;
    const b = data[i * 4 + 2] ?? 0;
    if (NORMALIZE === 'zero_one') {
      tensor[t++] = r / 255;
      tensor[t++] = g / 255;
      tensor[t++] = b / 255;
    } else if (NORMALIZE === 'minus_one_one') {
      tensor[t++] = r / 127.5 - 1;
      tensor[t++] = g / 127.5 - 1;
      tensor[t++] = b / 127.5 - 1;
    } else {
      // 'raw' — model normalizes internally; pass 0–255 floats untouched.
      tensor[t++] = r;
      tensor[t++] = g;
      tensor[t++] = b;
    }
  }
  return tensor;
}

function softmax(logits: ArrayLike<number>): number[] {
  let max = -Infinity;
  for (let i = 0; i < logits.length; i++) max = Math.max(max, logits[i] ?? 0);
  let sum = 0;
  const exps = new Array<number>(logits.length);
  for (let i = 0; i < logits.length; i++) {
    const e = Math.exp((logits[i] ?? 0) - max);
    exps[i] = e;
    sum += e;
  }
  for (let i = 0; i < exps.length; i++) exps[i] = (exps[i] ?? 0) / (sum || 1);
  return exps;
}

// Returns up to topK predictions, or [] if the model is unavailable.
export async function classifyImage(uri: string, topK = 3): Promise<Prediction[]> {
  const m = await loadModel();
  if (!m) return [];

  try {
    const input = await imageToTensor(uri);
    const outputs = await m.run([input]);
    const raw = outputs[0] as ArrayLike<number>;

    let sum = 0;
    for (let i = 0; i < raw.length; i++) sum += raw[i] ?? 0;
    const probs = sum > 0.99 && sum < 1.01 ? Array.from(raw) : softmax(raw);

    const indexed = probs.map((confidence, index) => ({ confidence, index }));
    indexed.sort((a, b) => b.confidence - a.confidence);

    const predictions: Prediction[] = [];
    for (const { confidence, index } of indexed.slice(0, topK)) {
      const label = FOOD101_LABELS[index] ?? `class_${index}`;
      const foodId = LABEL_TO_FOOD_ID[label];
      predictions.push({
        label,
        displayName: prettyLabel(label),
        confidence,
        food: foodId ? getFoodById(foodId) : undefined,
      });
    }
    return predictions;
  } catch {
    return [];
  }
}
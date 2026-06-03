// On-device Food-101 image classifier (TensorFlow Lite). Fails soft to manual
// search if the model can't be downloaded or loaded.

import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { decode as decodeJpeg } from 'jpeg-js';
import { loadTensorflowModel, type TensorflowModel } from 'react-native-fast-tflite';

import { FOOD101_LABELS, LABEL_TO_FOOD_ID, prettyLabel } from './labels';
import { getFoodById, type FoodItem } from '../data/foods';

// Hosted .tflite whose output classes match FOOD101_LABELS. See docs/MODEL.md.
export const MODEL_URL =
  'https://github.com/evanoctave/funny-idea/releases/download/model-v1/food101.tflite';

const INPUT_SIZE = 224;
const NORMALIZE: 'zero_one' | 'minus_one_one' = 'zero_one';

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

// Downloads the model once if needed; returns the local URI or null.
async function ensureModelFile(
  onProgress?: (fraction: number) => void,
): Promise<string | null> {
  try {
    if (await isModelCached()) return MODEL_PATH;
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
    if (!result || result.status !== 200) {
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
    } else {
      tensor[t++] = r / 127.5 - 1;
      tensor[t++] = g / 127.5 - 1;
      tensor[t++] = b / 127.5 - 1;
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

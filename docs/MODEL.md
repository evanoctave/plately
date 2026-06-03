# On-device recognition model

Plately classifies meal photos **on the device** using a TensorFlow Lite
image classifier, via [`react-native-fast-tflite`](https://github.com/mrousavy/react-native-fast-tflite).
There is no server and no per-request cost — inference is free and private.

## How loading works

1. On first use, the app downloads the model file once from `MODEL_URL`
   (see `src/ml/recognizer.ts`) into the app's document directory.
2. The file is cached, so every subsequent launch works **fully offline**.
3. If the download fails (e.g. offline on first launch) or `MODEL_URL` is not
   yet configured, the app **does not crash** — it falls back to manual food
   search, and retries the download later.

You can also pre-bundle the model for an offline-first first launch:

```bash
MODEL_URL="https://.../food101.tflite" npm run fetch-model
```

## Choosing / hosting a model

The bundled label space (`src/ml/labels.ts`) assumes a **Food-101** classifier
(101 classes) whose output order matches `FOOD101_LABELS`.

Recommended, license-friendly options (all free):

- A MobileNetV3 / EfficientNet-Lite model fine-tuned on the
  [Food-101 dataset](https://data.vision.ee.ethz.ch/cvl/datasets_extra/food-101/)
  and exported to `.tflite`.
- Any public Food-101 `.tflite` on Hugging Face (use the `resolve` URL).

### Setup steps

1. Obtain or train a Food-101 `.tflite` classifier (input `224×224×3`).
2. Host it somewhere public and free — e.g. a **GitHub Release asset on this
   repo** (the default `MODEL_URL` already points at
   `releases/download/model-v1/food101.tflite`) or a Hugging Face file URL.
3. If your model's class order differs from `FOOD101_LABELS`, update that array
   (and `LABEL_TO_FOOD_ID`) to match, or re-export the model with matching
   order.
4. Confirm the input normalization in `recognizer.ts` (`NORMALIZE`) matches how
   your model was trained (`[0,1]` vs `[-1,1]`).

### Uploading the model (one-time)

```bash
# From the repo root, with the .tflite built/downloaded locally:
gh release create model-v1 ./food101.tflite \
  --repo evanoctave/plately --title "Recognition model v1" --notes "Food-101 tflite"
```

After the release exists, the app downloads it automatically on first photo.

## Hardening: integrity & transport

The loader is defensive by design:

- **HTTPS only** — `ensureModelFile` refuses any `MODEL_URL` that isn't
  `https://`, so weights are never fetched over cleartext.
- **Size floor** — a download under `MIN_MODEL_BYTES` (≈1 MB) is rejected and
  deleted, catching truncated files and HTML error pages.
- **Functional validation** — if the file isn't a loadable TFLite model, status
  becomes `unavailable` and the app falls back to manual search.
- **Optional SHA-256 pinning** — set `MODEL_SHA256` in `recognizer.ts` to the
  model's hash and any tampered or substituted file is rejected before it loads:

  ```bash
  shasum -a 256 food101.tflite   # paste the 64-char hex into MODEL_SHA256
  ```

Leaving `MODEL_SHA256` empty keeps the first three checks; setting it adds
end-to-end integrity verification against host compromise or a swapped asset.

## Why this keeps the app free

- **No inference servers**: classification happens on the user's device.
- **No API keys / billing**: nothing to meter.
- **One-time CDN download**: model weights are static files served for free by
  GitHub Releases or Hugging Face.

## App Store note

Downloading **model weights (data)** at runtime is permitted by the App Store
Review Guidelines. The app does **not** download or execute new code — only the
classifier's numeric weights. See `docs/APP_STORE_SUBMISSION.md`.

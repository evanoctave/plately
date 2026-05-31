#!/usr/bin/env node
/**
 * Generates the app's PNG assets (icon, adaptive icon, splash, favicon) with a
 * dependency-free PNG encoder. Produces a simple, original NutriSnap mark:
 * a rounded "plate" with a fork glyph on a brand background.
 *
 *   node scripts/gen-assets.mjs
 */

import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ASSETS = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets');
mkdirSync(ASSETS, { recursive: true });

// --- tiny PNG encoder (truecolor + alpha) ---------------------------------
const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const body = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

function encodePng(width, height, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  // 10-12: compression, filter, interlace = 0
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // filter type 0
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// --- simple raster canvas --------------------------------------------------
function canvas(w, h, [r, g, b, a] = [0, 0, 0, 0]) {
  const buf = Buffer.alloc(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    buf[i * 4] = r;
    buf[i * 4 + 1] = g;
    buf[i * 4 + 2] = b;
    buf[i * 4 + 3] = a;
  }
  return { w, h, buf };
}

function px(c, x, y, [r, g, b, a]) {
  if (x < 0 || y < 0 || x >= c.w || y >= c.h) return;
  const i = (y * c.w + x) * 4;
  const ia = a / 255;
  c.buf[i] = Math.round(c.buf[i] * (1 - ia) + r * ia);
  c.buf[i + 1] = Math.round(c.buf[i + 1] * (1 - ia) + g * ia);
  c.buf[i + 2] = Math.round(c.buf[i + 2] * (1 - ia) + b * ia);
  c.buf[i + 3] = Math.max(c.buf[i + 3], a);
}

function disc(c, cx, cy, radius, color) {
  for (let y = Math.floor(cy - radius); y <= Math.ceil(cy + radius); y++) {
    for (let x = Math.floor(cx - radius); x <= Math.ceil(cx + radius); x++) {
      const d = Math.hypot(x - cx, y - cy);
      if (d <= radius) {
        const edge = radius - d;
        const a = color[3] * Math.min(1, edge); // 1px antialias
        px(c, x, y, [color[0], color[1], color[2], Math.round(a)]);
      }
    }
  }
}

function rect(c, x0, y0, x1, y1, color) {
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) px(c, x, y, color);
}

const GREEN = [52, 199, 89, 255];
const DARK = [14, 17, 22, 255];
const WHITE = [242, 244, 248, 255];

/** Draws the NutriSnap mark (plate + fork) centered on a canvas. */
function drawMark(c, scale = 1) {
  const cx = c.w / 2;
  const cy = c.h / 2;
  const plateR = Math.min(c.w, c.h) * 0.3 * scale;
  disc(c, cx, cy, plateR, WHITE);
  disc(c, cx, cy, plateR * 0.7, GREEN);

  // Fork: a handle plus three tines, in green over the inner disc.
  const fw = plateR * 0.12;
  const fh = plateR * 0.9;
  const fx = cx - fw / 2;
  const fy = cy - fh / 2;
  rect(c, Math.round(fx), Math.round(cy - fh * 0.05), Math.round(fx + fw), Math.round(fy + fh), WHITE);
  for (let t = -1; t <= 1; t++) {
    const tx = cx + t * fw * 1.4;
    rect(c, Math.round(tx - fw * 0.18), Math.round(fy), Math.round(tx + fw * 0.18), Math.round(cy - fh * 0.02), WHITE);
  }
}

function save(name, c) {
  writeFileSync(join(ASSETS, name), encodePng(c.w, c.h, c.buf));
  console.log(`  ${name} (${c.w}x${c.h})`);
}

console.log('Generating assets:');

// App icon — 1024x1024, opaque (no alpha) brand background.
const icon = canvas(1024, 1024, GREEN);
disc(icon, 512, 512, 512, GREEN); // ensure fully opaque field
drawMark(icon, 1);
save('icon.png', icon);

// Adaptive icon foreground — transparent, mark only (safe zone).
const adaptive = canvas(1024, 1024, [0, 0, 0, 0]);
drawMark(adaptive, 0.7);
save('adaptive-icon.png', adaptive);

// Splash — dark background with centered mark.
const splash = canvas(1242, 2436, DARK);
drawMark({ w: splash.w, h: splash.h, buf: splash.buf }, 0.5);
save('splash.png', splash);

// Favicon.
const favicon = canvas(64, 64, GREEN);
drawMark(favicon, 1);
save('favicon.png', favicon);

console.log('Done.');

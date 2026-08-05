#!/usr/bin/env node
/**
 * Generates ChoiceGuard's extension icons as plain PNG files with zero
 * external dependencies (no canvas / sharp / imagemagick required).
 *
 * The mark is a rounded square in the brand gradient with a concentric
 * "guarded eye" glyph — a ring (the watchful lens) plus a solid core,
 * broken by a small gap that reads as a shield notch.
 */
const fs = require('node:fs')
const path = require('node:path')
const zlib = require('node:zlib')

const OUT_DIR = path.join(__dirname, '..', 'public', 'icons')
const SIZES = [16, 32, 48, 128]

/** @param {number} n @param {number} lo @param {number} hi */
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n))

function lerpColor(c1, c2, t) {
  return [
    Math.round(c1[0] + (c2[0] - c1[0]) * t),
    Math.round(c1[1] + (c2[1] - c1[1]) * t),
    Math.round(c1[2] + (c2[2] - c1[2]) * t),
  ]
}

// Brand gradient: indigo -> violet (top-left to bottom-right).
const COLOR_A = [99, 102, 241] // #6366F1
const COLOR_B = [124, 58, 237] // #7C3AED
const WHITE = [255, 255, 255]

function drawIcon(size) {
  const pixels = new Uint8Array(size * size * 4)
  const cx = size / 2
  const cy = size / 2
  const radius = size * 0.5
  const cornerRadius = size * 0.22

  const ringOuter = size * 0.36
  const ringInner = size * 0.26
  const coreRadius = size * 0.12
  // Notch: a small wedge cut from the ring, bottom-right, reading as a shield gap.
  const notchAngle = Math.atan2(1, 1) // 45deg
  const notchWidth = 0.55 // radians

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4
      const px = x + 0.5
      const py = y + 0.5

      // Rounded-square mask via signed distance to a rounded rect.
      const rx = clamp(Math.abs(px - cx) - (radius - cornerRadius), 0, radius)
      const ry = clamp(Math.abs(py - cy) - (radius - cornerRadius), 0, radius)
      const cornerDist = Math.sqrt(rx * rx + ry * ry) - cornerRadius
      const inRoundedSquare = cornerDist <= 0.5

      if (!inRoundedSquare) {
        pixels[idx + 3] = 0
        continue
      }

      const t = (px + py) / (size * 2)
      const [r, g, b] = lerpColor(COLOR_A, COLOR_B, clamp(t, 0, 1))

      const dx = px - cx
      const dy = py - cy
      const dist = Math.sqrt(dx * dx + dy * dy)
      const angle = Math.atan2(dy, dx)
      let angleDiff = Math.abs(angle - notchAngle)
      if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff
      const inNotch = angleDiff < notchWidth / 2

      const onRing = dist <= ringOuter && dist >= ringInner && !inNotch
      const onCore = dist <= coreRadius

      if (onRing || onCore) {
        pixels[idx] = WHITE[0]
        pixels[idx + 1] = WHITE[1]
        pixels[idx + 2] = WHITE[2]
        pixels[idx + 3] = 255
      } else {
        pixels[idx] = r
        pixels[idx + 1] = g
        pixels[idx + 2] = b
        pixels[idx + 3] = 255
      }
    }
  }

  return pixels
}

function crc32(buf) {
  let c
  const table = crc32.table || (crc32.table = makeCrcTable())
  let crc = 0xffffffff
  for (let i = 0; i < buf.length; i++) {
    c = (crc ^ buf[i]) & 0xff
    crc = (crc >>> 8) ^ table[c]
  }
  return (crc ^ 0xffffffff) >>> 0
}

function makeCrcTable() {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    }
    table[n] = c >>> 0
  }
  return table
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii')
  const lenBuf = Buffer.alloc(4)
  lenBuf.writeUInt32BE(data.length, 0)
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0)
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf])
}

function encodePNG(pixels, size) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

  const ihdrData = Buffer.alloc(13)
  ihdrData.writeUInt32BE(size, 0) // width
  ihdrData.writeUInt32BE(size, 4) // height
  ihdrData.writeUInt8(8, 8) // bit depth
  ihdrData.writeUInt8(6, 9) // color type: RGBA
  ihdrData.writeUInt8(0, 10) // compression
  ihdrData.writeUInt8(0, 11) // filter
  ihdrData.writeUInt8(0, 12) // interlace
  const ihdr = chunk('IHDR', ihdrData)

  // Raw scanlines, each prefixed with filter-type byte 0 (none).
  const stride = size * 4
  const raw = Buffer.alloc((stride + 1) * size)
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0
    Buffer.from(pixels.buffer, y * stride, stride).copy(raw, y * (stride + 1) + 1)
  }
  const idatData = zlib.deflateSync(raw, { level: 9 })
  const idat = chunk('IDAT', idatData)

  const iend = chunk('IEND', Buffer.alloc(0))

  return Buffer.concat([signature, ihdr, idat, iend])
}

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true })
  for (const size of SIZES) {
    const pixels = drawIcon(size)
    const png = encodePNG(pixels, size)
    const outPath = path.join(OUT_DIR, `icon${size}.png`)
    fs.writeFileSync(outPath, png)
    console.log(`✓ wrote ${outPath} (${png.length} bytes)`)
  }
}

main()

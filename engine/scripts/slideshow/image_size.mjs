// Pixel size of a PNG, JPEG or WebP file, read from its header. Used to place
// a screenshot crop without stretching it, and to prove after a render that
// every slide in a post is the same size.

import { readFileSync } from "node:fs";

const JPEG_FRAME_MARKERS_WITHOUT_SIZE = new Set([0xc4, 0xc8, 0xcc]);

function pngSize(bytes) {
  return [bytes.readUInt32BE(16), bytes.readUInt32BE(20)];
}

function jpegSize(bytes) {
  let offset = 2;
  while (offset + 9 < bytes.length) {
    if (bytes[offset] !== 0xff) { offset += 1; continue; }
    const marker = bytes[offset + 1];
    const isFrameHeader = marker >= 0xc0 && marker <= 0xcf && !JPEG_FRAME_MARKERS_WITHOUT_SIZE.has(marker);
    if (isFrameHeader) return [bytes.readUInt16BE(offset + 7), bytes.readUInt16BE(offset + 5)];
    offset += 2 + bytes.readUInt16BE(offset + 2);
  }
  return null;
}

function webpSize(bytes) {
  const chunk = bytes.toString("ascii", 12, 16);
  if (chunk === "VP8 ") return [bytes.readUInt16LE(26) & 0x3fff, bytes.readUInt16LE(28) & 0x3fff];
  if (chunk === "VP8L") {
    const bits = bytes.readUInt32LE(21);
    return [(bits & 0x3fff) + 1, ((bits >>> 14) & 0x3fff) + 1];
  }
  if (chunk === "VP8X") return [bytes.readUIntLE(24, 3) + 1, bytes.readUIntLE(27, 3) + 1];
  return null;
}

/** @returns {[number, number]} width and height in px */
export function imageSize(file) {
  const bytes = readFileSync(file);
  let size = null;
  if (bytes.toString("ascii", 1, 4) === "PNG") size = pngSize(bytes);
  else if (bytes[0] === 0xff && bytes[1] === 0xd8) size = jpegSize(bytes);
  else if (bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP") size = webpSize(bytes);
  if (!size || !size[0] || !size[1]) throw new Error(`${file}: not a PNG, JPEG or WebP image this tool can measure`);
  return size;
}

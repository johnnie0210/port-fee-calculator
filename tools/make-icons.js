/* Draws the app icon (white anchor on a navy square) and writes PNG files. Run: node tools/make-icons.js */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) { c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; }
  return c >>> 0;
});
function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) { c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8); }
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const head = Buffer.alloc(4);
  head.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([head, body, crc]);
}

// Anchor shape in 0..1 coordinates (kept inside the maskable safe zone)
function inAnchor(x, y) {
  const ring = Math.hypot(x - 0.5, y - 0.25);
  if (ring <= 0.075 && ring >= 0.04) { return true; }                       // top ring
  if (Math.abs(x - 0.5) <= 0.028 && y >= 0.315 && y <= 0.79) { return true; } // shaft
  if (Math.abs(y - 0.41) <= 0.025 && Math.abs(x - 0.5) <= 0.13) { return true; } // stock
  const arc = Math.hypot(x - 0.5, y - 0.53);
  if (arc <= 0.265 && arc >= 0.21 && y >= 0.6) { return true; }              // curved arms
  return false;
}

function png(size) {
  const bg = [11, 79, 108], fg = [255, 255, 255], ss = 3;
  const raw = Buffer.alloc(size * (size * 3 + 1));
  for (let py = 0; py < size; py++) {
    const row = py * (size * 3 + 1);
    for (let px = 0; px < size; px++) {
      let hit = 0;
      for (let sy = 0; sy < ss; sy++) {
        for (let sx = 0; sx < ss; sx++) {
          if (inAnchor((px + (sx + 0.5) / ss) / size, (py + (sy + 0.5) / ss) / size)) { hit++; }
        }
      }
      const a = hit / (ss * ss);
      for (let c = 0; c < 3; c++) { raw[row + 1 + px * 3 + c] = Math.round(bg[c] + (fg[c] - bg[c]) * a); }
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 2;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))
  ]);
}

const out = path.join(__dirname, '..', 'public', 'icons');
fs.mkdirSync(out, { recursive: true });
for (const size of [192, 512]) {
  fs.writeFileSync(path.join(out, `icon-${size}.png`), png(size));
  console.log(`icon-${size}.png`);
}

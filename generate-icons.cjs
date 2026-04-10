const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function generatePng(size, text) {
  const width = size;
  const height = size;
  
  // PNG Signature
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  
  // IHDR Chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // Bit depth
  ihdrData.writeUInt8(2, 9); // Color type (Truecolor)
  ihdrData.writeUInt8(0, 10); // Compression method
  ihdrData.writeUInt8(0, 11); // Filter method
  ihdrData.writeUInt8(0, 12); // Interlace method
  const ihdr = createChunk('IHDR', ihdrData);
  
  // IDAT Chunk (Pixel Data)
  // Each row starts with a filter byte (0 for none)
  // Truecolor (Color type 2) uses 3 bytes per pixel (RGB)
  const rowSize = 1 + width * 3;
  const pixelData = Buffer.alloc(rowSize * height);
  
  for (let y = 0; y < height; y++) {
    pixelData[y * rowSize] = 0; // Filter type 0
    for (let x = 0; x < width; x++) {
      const offset = y * rowSize + 1 + x * 3;
      
      // Default black background
      let r = 0, g = 0, b = 0;
      
      // Simple 'C' shape logic
      // Center of the image
      const cx = width / 2;
      const cy = height / 2;
      const radius = width * 0.3;
      const thickness = width * 0.08;
      
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      // Check if pixel is within the 'C' arc
      if (dist > radius - thickness && dist < radius + thickness) {
        // Angle from center
        const angle = Math.atan2(dy, dx);
        // 'C' is open on the right (approx -45 to 45 degrees)
        if (angle < -Math.PI / 4 || angle > Math.PI / 4) {
          r = 255; g = 255; b = 255;
        }
      }
      
      pixelData[offset] = r;
      pixelData[offset + 1] = g;
      pixelData[offset + 2] = b;
    }
  }
  
  const compressedData = zlib.deflateSync(pixelData);
  const idat = createChunk('IDAT', compressedData);
  
  // IEND Chunk
  const iend = createChunk('IEND', Buffer.alloc(0));
  
  return Buffer.concat([signature, ihdr, idat, iend]);
}

function createChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(4 + 4 + len + 4);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4);
  data.copy(chunk, 8);
  const crc = calculateCrc(Buffer.concat([Buffer.from(type), data]));
  chunk.writeUInt32BE(crc, 8 + len);
  return chunk;
}

// Simple CRC32 implementation
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) {
      c = 0xedb88320 ^ (c >>> 1);
    } else {
      c = c >>> 1;
    }
  }
  crcTable[n] = c;
}

function calculateCrc(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

const iconsDir = path.join(__dirname, 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

fs.writeFileSync(path.join(iconsDir, 'icon-192.png'), generatePng(192, 'C'));
fs.writeFileSync(path.join(iconsDir, 'icon-512.png'), generatePng(512, 'C'));

console.log('Icons generated successfully in public/icons/');

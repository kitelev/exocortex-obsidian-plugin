/**
 * Pure JavaScript hash implementations for SPARQL 1.1 hash functions.
 *
 * These implementations are browser-compatible and don't rely on Node.js crypto.
 * They provide MD5, SHA-1, SHA-256, SHA-384, and SHA-512 hashing.
 *
 * @see https://www.w3.org/TR/sparql11-query/#func-hash
 */

/**
 * Helper to convert string to byte array (UTF-8)
 */
function stringToBytes(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

/**
 * Helper to convert byte array to lowercase hex string
 */
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * MD5 hash implementation
 * Based on RFC 1321: https://tools.ietf.org/html/rfc1321
 */
export function md5(message: string): string {
  const bytes = stringToBytes(message);

  // Initialize hash values
  let a0 = 0x67452301;
  let b0 = 0xefcdab89;
  let c0 = 0x98badcfe;
  let d0 = 0x10325476;

  // Pre-computed K constants
  const K = new Uint32Array(64);
  for (let i = 0; i < 64; i++) {
    K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 0x100000000) >>> 0;
  }

  // Shift amounts
  const s = [
    7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
    5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
    4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
    6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
  ];

  // Pre-processing: adding padding bits
  const bitLen = bytes.length * 8;
  const newLen = (((bytes.length + 8) >>> 6) + 1) << 6;
  const paddedBytes = new Uint8Array(newLen);
  paddedBytes.set(bytes);
  paddedBytes[bytes.length] = 0x80;

  // Append original length in bits as 64-bit little-endian
  const dataView = new DataView(paddedBytes.buffer);
  dataView.setUint32(newLen - 8, bitLen, true);
  dataView.setUint32(newLen - 4, Math.floor(bitLen / 0x100000000), true);

  // Process each 64-byte chunk
  for (let offset = 0; offset < newLen; offset += 64) {
    const M = new Uint32Array(16);
    for (let j = 0; j < 16; j++) {
      M[j] = dataView.getUint32(offset + j * 4, true);
    }

    let A = a0;
    let B = b0;
    let C = c0;
    let D = d0;

    for (let i = 0; i < 64; i++) {
      let F: number;
      let g: number;

      if (i < 16) {
        F = (B & C) | (~B & D);
        g = i;
      } else if (i < 32) {
        F = (D & B) | (~D & C);
        g = (5 * i + 1) % 16;
      } else if (i < 48) {
        F = B ^ C ^ D;
        g = (3 * i + 5) % 16;
      } else {
        F = C ^ (B | ~D);
        g = (7 * i) % 16;
      }

      F = (F + A + K[i] + M[g]) >>> 0;
      A = D;
      D = C;
      C = B;
      B = (B + ((F << s[i]) | (F >>> (32 - s[i])))) >>> 0;
    }

    a0 = (a0 + A) >>> 0;
    b0 = (b0 + B) >>> 0;
    c0 = (c0 + C) >>> 0;
    d0 = (d0 + D) >>> 0;
  }

  // Produce the final hash value (little-endian)
  const result = new Uint8Array(16);
  const resultView = new DataView(result.buffer);
  resultView.setUint32(0, a0, true);
  resultView.setUint32(4, b0, true);
  resultView.setUint32(8, c0, true);
  resultView.setUint32(12, d0, true);

  return bytesToHex(result);
}

/**
 * SHA-1 hash implementation
 * Based on FIPS 180-4: https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.180-4.pdf
 */
export function sha1(message: string): string {
  const bytes = stringToBytes(message);

  // Initialize hash values
  let h0 = 0x67452301;
  let h1 = 0xefcdab89;
  let h2 = 0x98badcfe;
  let h3 = 0x10325476;
  let h4 = 0xc3d2e1f0;

  // Pre-processing
  const bitLen = bytes.length * 8;
  const newLen = (((bytes.length + 8) >>> 6) + 1) << 6;
  const paddedBytes = new Uint8Array(newLen);
  paddedBytes.set(bytes);
  paddedBytes[bytes.length] = 0x80;

  // Append length as 64-bit big-endian
  const dataView = new DataView(paddedBytes.buffer);
  dataView.setUint32(newLen - 8, Math.floor(bitLen / 0x100000000), false);
  dataView.setUint32(newLen - 4, bitLen, false);

  // Process each 64-byte chunk
  for (let offset = 0; offset < newLen; offset += 64) {
    const W = new Uint32Array(80);

    // Break chunk into sixteen 32-bit big-endian words
    for (let j = 0; j < 16; j++) {
      W[j] = dataView.getUint32(offset + j * 4, false);
    }

    // Extend the sixteen 32-bit words into eighty 32-bit words
    for (let j = 16; j < 80; j++) {
      const n = W[j - 3] ^ W[j - 8] ^ W[j - 14] ^ W[j - 16];
      W[j] = (n << 1) | (n >>> 31);
    }

    let a = h0;
    let b = h1;
    let c = h2;
    let d = h3;
    let e = h4;

    for (let i = 0; i < 80; i++) {
      let f: number;
      let k: number;

      if (i < 20) {
        f = (b & c) | (~b & d);
        k = 0x5a827999;
      } else if (i < 40) {
        f = b ^ c ^ d;
        k = 0x6ed9eba1;
      } else if (i < 60) {
        f = (b & c) | (b & d) | (c & d);
        k = 0x8f1bbcdc;
      } else {
        f = b ^ c ^ d;
        k = 0xca62c1d6;
      }

      const temp = (((a << 5) | (a >>> 27)) + f + e + k + W[i]) >>> 0;
      e = d;
      d = c;
      c = (b << 30) | (b >>> 2);
      b = a;
      a = temp;
    }

    h0 = (h0 + a) >>> 0;
    h1 = (h1 + b) >>> 0;
    h2 = (h2 + c) >>> 0;
    h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0;
  }

  // Produce final hash value (big-endian)
  const result = new Uint8Array(20);
  const resultView = new DataView(result.buffer);
  resultView.setUint32(0, h0, false);
  resultView.setUint32(4, h1, false);
  resultView.setUint32(8, h2, false);
  resultView.setUint32(12, h3, false);
  resultView.setUint32(16, h4, false);

  return bytesToHex(result);
}

/**
 * SHA-256 hash implementation
 * Based on FIPS 180-4
 */
export function sha256(message: string): string {
  const bytes = stringToBytes(message);

  // Round constants
  const K = new Uint32Array([
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5,
    0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
    0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc,
    0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7,
    0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
    0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3,
    0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5,
    0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
    0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ]);

  // Initial hash values
  let h0 = 0x6a09e667;
  let h1 = 0xbb67ae85;
  let h2 = 0x3c6ef372;
  let h3 = 0xa54ff53a;
  let h4 = 0x510e527f;
  let h5 = 0x9b05688c;
  let h6 = 0x1f83d9ab;
  let h7 = 0x5be0cd19;

  // Pre-processing
  const bitLen = bytes.length * 8;
  const newLen = (((bytes.length + 8) >>> 6) + 1) << 6;
  const paddedBytes = new Uint8Array(newLen);
  paddedBytes.set(bytes);
  paddedBytes[bytes.length] = 0x80;

  // Append length as 64-bit big-endian
  const dataView = new DataView(paddedBytes.buffer);
  dataView.setUint32(newLen - 8, Math.floor(bitLen / 0x100000000), false);
  dataView.setUint32(newLen - 4, bitLen, false);

  // Helper functions
  const rotr = (n: number, x: number): number => (x >>> n) | (x << (32 - n));
  const ch = (x: number, y: number, z: number): number => (x & y) ^ (~x & z);
  const maj = (x: number, y: number, z: number): number => (x & y) ^ (x & z) ^ (y & z);
  const sigma0 = (x: number): number => rotr(2, x) ^ rotr(13, x) ^ rotr(22, x);
  const sigma1 = (x: number): number => rotr(6, x) ^ rotr(11, x) ^ rotr(25, x);
  const gamma0 = (x: number): number => rotr(7, x) ^ rotr(18, x) ^ (x >>> 3);
  const gamma1 = (x: number): number => rotr(17, x) ^ rotr(19, x) ^ (x >>> 10);

  // Process each 64-byte chunk
  for (let offset = 0; offset < newLen; offset += 64) {
    const W = new Uint32Array(64);

    for (let j = 0; j < 16; j++) {
      W[j] = dataView.getUint32(offset + j * 4, false);
    }

    for (let j = 16; j < 64; j++) {
      W[j] = (gamma1(W[j - 2]) + W[j - 7] + gamma0(W[j - 15]) + W[j - 16]) >>> 0;
    }

    let a = h0;
    let b = h1;
    let c = h2;
    let d = h3;
    let e = h4;
    let f = h5;
    let g = h6;
    let h = h7;

    for (let i = 0; i < 64; i++) {
      const T1 = (h + sigma1(e) + ch(e, f, g) + K[i] + W[i]) >>> 0;
      const T2 = (sigma0(a) + maj(a, b, c)) >>> 0;

      h = g;
      g = f;
      f = e;
      e = (d + T1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (T1 + T2) >>> 0;
    }

    h0 = (h0 + a) >>> 0;
    h1 = (h1 + b) >>> 0;
    h2 = (h2 + c) >>> 0;
    h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0;
    h5 = (h5 + f) >>> 0;
    h6 = (h6 + g) >>> 0;
    h7 = (h7 + h) >>> 0;
  }

  // Produce final hash value
  const result = new Uint8Array(32);
  const resultView = new DataView(result.buffer);
  resultView.setUint32(0, h0, false);
  resultView.setUint32(4, h1, false);
  resultView.setUint32(8, h2, false);
  resultView.setUint32(12, h3, false);
  resultView.setUint32(16, h4, false);
  resultView.setUint32(20, h5, false);
  resultView.setUint32(24, h6, false);
  resultView.setUint32(28, h7, false);

  return bytesToHex(result);
}

/**
 * SHA-384 and SHA-512 implementation
 * These use 64-bit operations, implemented with BigInt for correctness
 */

// Helper to create BigInt from hex string (for ES2019 compatibility)
function B(hex: string): bigint {
  return BigInt("0x" + hex);
}

function sha512Core(message: string, is384: boolean): string {
  const bytes = stringToBytes(message);

  // Round constants (first 80 primes' cube roots, fractional part)
  const K = [
    B("428a2f98d728ae22"), B("7137449123ef65cd"), B("b5c0fbcfec4d3b2f"), B("e9b5dba58189dbbc"),
    B("3956c25bf348b538"), B("59f111f1b605d019"), B("923f82a4af194f9b"), B("ab1c5ed5da6d8118"),
    B("d807aa98a3030242"), B("12835b0145706fbe"), B("243185be4ee4b28c"), B("550c7dc3d5ffb4e2"),
    B("72be5d74f27b896f"), B("80deb1fe3b1696b1"), B("9bdc06a725c71235"), B("c19bf174cf692694"),
    B("e49b69c19ef14ad2"), B("efbe4786384f25e3"), B("0fc19dc68b8cd5b5"), B("240ca1cc77ac9c65"),
    B("2de92c6f592b0275"), B("4a7484aa6ea6e483"), B("5cb0a9dcbd41fbd4"), B("76f988da831153b5"),
    B("983e5152ee66dfab"), B("a831c66d2db43210"), B("b00327c898fb213f"), B("bf597fc7beef0ee4"),
    B("c6e00bf33da88fc2"), B("d5a79147930aa725"), B("06ca6351e003826f"), B("142929670a0e6e70"),
    B("27b70a8546d22ffc"), B("2e1b21385c26c926"), B("4d2c6dfc5ac42aed"), B("53380d139d95b3df"),
    B("650a73548baf63de"), B("766a0abb3c77b2a8"), B("81c2c92e47edaee6"), B("92722c851482353b"),
    B("a2bfe8a14cf10364"), B("a81a664bbc423001"), B("c24b8b70d0f89791"), B("c76c51a30654be30"),
    B("d192e819d6ef5218"), B("d69906245565a910"), B("f40e35855771202a"), B("106aa07032bbd1b8"),
    B("19a4c116b8d2d0c8"), B("1e376c085141ab53"), B("2748774cdf8eeb99"), B("34b0bcb5e19b48a8"),
    B("391c0cb3c5c95a63"), B("4ed8aa4ae3418acb"), B("5b9cca4f7763e373"), B("682e6ff3d6b2b8a3"),
    B("748f82ee5defb2fc"), B("78a5636f43172f60"), B("84c87814a1f0ab72"), B("8cc702081a6439ec"),
    B("90befffa23631e28"), B("a4506cebde82bde9"), B("bef9a3f7b2c67915"), B("c67178f2e372532b"),
    B("ca273eceea26619c"), B("d186b8c721c0c207"), B("eada7dd6cde0eb1e"), B("f57d4f7fee6ed178"),
    B("06f067aa72176fba"), B("0a637dc5a2c898a6"), B("113f9804bef90dae"), B("1b710b35131c471b"),
    B("28db77f523047d84"), B("32caab7b40c72493"), B("3c9ebe0a15c9bebc"), B("431d67c49c100d4c"),
    B("4cc5d4becb3e42b6"), B("597f299cfc657e2a"), B("5fcb6fab3ad6faec"), B("6c44198c4a475817"),
  ];

  // Initial hash values
  let h: bigint[];
  if (is384) {
    h = [
      B("cbbb9d5dc1059ed8"), B("629a292a367cd507"), B("9159015a3070dd17"), B("152fecd8f70e5939"),
      B("67332667ffc00b31"), B("8eb44a8768581511"), B("db0c2e0d64f98fa7"), B("47b5481dbefa4fa4"),
    ];
  } else {
    h = [
      B("6a09e667f3bcc908"), B("bb67ae8584caa73b"), B("3c6ef372fe94f82b"), B("a54ff53a5f1d36f1"),
      B("510e527fade682d1"), B("9b05688c2b3e6c1f"), B("1f83d9abfb41bd6b"), B("5be0cd19137e2179"),
    ];
  }

  const mask64 = B("ffffffffffffffff");
  const mask32 = B("ffffffff");
  const n32 = BigInt(32);
  const n6 = BigInt(6);
  const n7 = BigInt(7);

  // Pre-processing
  const bitLen = BigInt(bytes.length * 8);
  const newLen = (((bytes.length + 16) >>> 7) + 1) << 7; // 128-byte blocks
  const paddedBytes = new Uint8Array(newLen);
  paddedBytes.set(bytes);
  paddedBytes[bytes.length] = 0x80;

  // Append length as 128-bit big-endian (we only use lower 64 bits)
  const dataView = new DataView(paddedBytes.buffer);
  // Upper 64 bits are 0 for messages < 2^64 bits
  const lenBytes = newLen - 8;
  dataView.setUint32(lenBytes, Number((bitLen >> n32) & mask32), false);
  dataView.setUint32(lenBytes + 4, Number(bitLen & mask32), false);

  // Helper functions for 64-bit operations
  const rotr = (n: number, x: bigint): bigint => ((x >> BigInt(n)) | (x << BigInt(64 - n))) & mask64;
  const ch = (x: bigint, y: bigint, z: bigint): bigint => (x & y) ^ (~x & z);
  const maj = (x: bigint, y: bigint, z: bigint): bigint => (x & y) ^ (x & z) ^ (y & z);
  const sigma0 = (x: bigint): bigint => rotr(28, x) ^ rotr(34, x) ^ rotr(39, x);
  const sigma1 = (x: bigint): bigint => rotr(14, x) ^ rotr(18, x) ^ rotr(41, x);
  const gamma0 = (x: bigint): bigint => rotr(1, x) ^ rotr(8, x) ^ (x >> n7);
  const gamma1 = (x: bigint): bigint => rotr(19, x) ^ rotr(61, x) ^ (x >> n6);

  // Process each 128-byte chunk
  for (let offset = 0; offset < newLen; offset += 128) {
    const W: bigint[] = new Array(80);

    // Break chunk into sixteen 64-bit big-endian words
    for (let j = 0; j < 16; j++) {
      const hi = BigInt(dataView.getUint32(offset + j * 8, false));
      const lo = BigInt(dataView.getUint32(offset + j * 8 + 4, false));
      W[j] = ((hi << n32) | lo) & mask64;
    }

    // Extend the sixteen 64-bit words into eighty 64-bit words
    for (let j = 16; j < 80; j++) {
      W[j] = (gamma1(W[j - 2]) + W[j - 7] + gamma0(W[j - 15]) + W[j - 16]) & mask64;
    }

    let [a, b, c, d, e, f, g, hh] = h;

    for (let i = 0; i < 80; i++) {
      const T1 = (hh + sigma1(e) + ch(e, f, g) + K[i] + W[i]) & mask64;
      const T2 = (sigma0(a) + maj(a, b, c)) & mask64;

      hh = g;
      g = f;
      f = e;
      e = (d + T1) & mask64;
      d = c;
      c = b;
      b = a;
      a = (T1 + T2) & mask64;
    }

    h[0] = (h[0] + a) & mask64;
    h[1] = (h[1] + b) & mask64;
    h[2] = (h[2] + c) & mask64;
    h[3] = (h[3] + d) & mask64;
    h[4] = (h[4] + e) & mask64;
    h[5] = (h[5] + f) & mask64;
    h[6] = (h[6] + g) & mask64;
    h[7] = (h[7] + hh) & mask64;
  }

  // Produce final hash value
  const hashLen = is384 ? 48 : 64;
  const numWords = is384 ? 6 : 8;
  const result = new Uint8Array(hashLen);
  const resultView = new DataView(result.buffer);

  for (let i = 0; i < numWords; i++) {
    resultView.setUint32(i * 8, Number((h[i] >> n32) & mask32), false);
    resultView.setUint32(i * 8 + 4, Number(h[i] & mask32), false);
  }

  return bytesToHex(result);
}

/**
 * SHA-384 hash implementation
 */
export function sha384(message: string): string {
  return sha512Core(message, true);
}

/**
 * SHA-512 hash implementation
 */
export function sha512(message: string): string {
  return sha512Core(message, false);
}

import { randomBytes } from "node:crypto";

// Crockford-style alphabet: no 0/O/1/I/L/U — safe to read aloud and type.
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTVWXYZ";
export const CODE_SUFFIX_LEN = 12;

function randomSegment(len: number) {
  const bytes = randomBytes(len);
  let out = "";
  for (let i = 0; i < len; i++) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return out;
}

export function formatActivationCode(planId: string) {
  return `${planId}-${randomSegment(CODE_SUFFIX_LEN)}`;
}

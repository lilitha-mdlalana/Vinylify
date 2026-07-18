import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

/**
 * AES-256-GCM sealing for the Spotify refresh token cookie.
 * Key is derived from SESSION_SECRET (any strong string; 32-byte base64 recommended).
 */

function getKey(): Buffer | null {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    console.error("SESSION_SECRET is not set; refresh tokens cannot be stored.");
    return null;
  }
  return createHash("sha256").update(secret).digest();
}

export function encryptToken(plain: string): string | null {
  const key = getKey();
  if (!key) {
    return null;
  }
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [
    iv.toString("base64url"),
    ciphertext.toString("base64url"),
    tag.toString("base64url"),
  ].join(".");
}

export function decryptToken(sealed: string): string | null {
  const key = getKey();
  if (!key) {
    return null;
  }
  const parts = sealed.split(".");
  if (parts.length !== 3) {
    return null;
  }
  try {
    const [iv, ciphertext, tag] = parts.map((p) => Buffer.from(p, "base64url"));
    const decipher = createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString(
      "utf8"
    );
  } catch {
    return null;
  }
}

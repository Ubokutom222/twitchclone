import crypto from "crypto";

const KEY = Buffer.from(process.env.URL_SECRET_KEY!, "hex");

/**
 * TODO: Rework this encrypt and decryption work
 */

export function encrypt(data: string) {
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv("aes-256-cbc", KEY, iv);

  let encrypted = cipher.update(JSON.stringify(data), "utf8", "base64");
  encrypted += cipher.final("base64");

  return `${iv.toString("base64")}:${encrypted}`;
}

export function decrypt(payload: string) {
  const [ivStr, encrypted] = payload.split(":");
  const iv = Buffer.from(ivStr, "base64");

  const decipher = crypto.createDecipheriv("aes-256-cbc", KEY, iv);

  let decrypted = decipher.update(encrypted, "base64", "utf8");
  decrypted += decipher.final("utf8");

  return JSON.parse(decrypted);
}

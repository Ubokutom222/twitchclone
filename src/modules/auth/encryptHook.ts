import jwt from "jsonwebtoken";
const KEY = process.env.URL_SECRET_KEY!;

interface encryptProps {
  number: string;
}
export function encrypt(data: encryptProps) {
  const encrypted = jwt.sign(data, KEY, { expiresIn: "10m" });
  return encrypted;
}

export function decrypt(payload: string) {
  const decryptedData = jwt.verify(payload, KEY);
  return decryptedData;
}

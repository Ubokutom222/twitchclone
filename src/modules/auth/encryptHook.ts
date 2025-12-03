import jwt, { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import { toast } from "sonner"
const KEY = process.env.URL_SECRET_KEY!;


interface encryptProps {
  number: string;
}
export function encrypt(data: encryptProps) {
  const encrypted = jwt.sign(data, KEY, { expiresIn: "10m" });
  return encrypted;
}

export function decrypt(payload: string) {
  try {
    const decryptedData = jwt.verify(payload, KEY);
    return decryptedData;
  } catch (error) {
    if (error instanceof JsonWebTokenError) {
      toast.error("Invalid Data")
      const data: jwt.JwtPayload = { number: "" }
      return data
    } else if (error instanceof TokenExpiredError) {
      toast.error("Verification Expired")
      const data: jwt.JwtPayload = { number: "" }
      return data
    } else {
      toast.error("An unexpected error occurred");
      const data: jwt.JwtPayload = { number: "" };
      return data;
    }
  }
}
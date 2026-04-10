import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "hazel-archive-secret-2024-xoxo";
const EXPIRES = "7d";

export interface JwtPayload {
  id: string;
  username: string;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { readUserByEmail, readSession } from "./backend";
import { AUTH_COOKIE_NAME } from "./auth-constants";
export { AUTH_COOKIE_NAME };
export async function findUserByEmail(email: string) {
  return readUserByEmail(email);
}
export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}
export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}
export async function getCurrentUser() {
  const token = (await cookies()).get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    return await readSession(token);
  } catch {
    return null;
  }
}

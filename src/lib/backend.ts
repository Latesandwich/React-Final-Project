// Server-only persistence boundary: Supabase online, separate SQLite locally.
import { createHash, randomBytes } from "node:crypto";
import * as local from "./database";
import type { Booking, Movie, Showtime, User } from "../types";
import { bookingContactSchema } from "./booking-validation";
export type { ReservationInput } from "./database";

const hosted = () => Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SECRET_KEY);
const digest = (token: string) => createHash("sha256").update(token).digest("hex");

async function rpc<T>(operation: string, args: object = {}, catalogueCache = false): Promise<T> {
  if (process.env.CINEMAGO_DATA_MODE === "mock") throw new Error("Database disabled");
  const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/rpc/cinemago_backend`, {
    method: "POST",
    headers: { apikey: process.env.SUPABASE_SECRET_KEY!, "Content-Type": "application/json" },
    body: JSON.stringify({ operation, args }),
    ...(catalogueCache ? { cache: "force-cache" as const, next: { revalidate: 3600 } } : { cache: "no-store" as const }),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    // Only intentional Thai validation messages reach users, never connection details.
    throw new Error(typeof error.message === "string" && /^[\u0E00-\u0E7F]/.test(error.message)
      ? error.message : "Database request failed");
  }
  return response.json();
}

export async function readCatalogue(catalogueCache = false): Promise<{ movies: Movie[]; showtimes: Showtime[] }> {
  return hosted() ? rpc("catalogue", {}, catalogueCache) : local.readCatalogue();
}
export async function insertUser(user: User & { password: string }) {
  return hosted() ? rpc<void>("insert_user", { ...user, email: user.email.trim().toLowerCase() }) : local.insertUser(user);
}
export async function readUserByEmail(email: string): Promise<User | undefined> {
  return hosted() ? (await rpc<User | null>("user_by_email", { email: email.trim().toLowerCase() })) ?? undefined : local.readUserByEmail(email);
}
export async function createSession(userId: string) {
  if (!hosted()) return local.createSession(userId);
  const token = randomBytes(32).toString("hex");
  await rpc("create_session", { userId, hash: digest(token), expires: Date.now() + 7 * 86400000 });
  return token;
}
export async function readSession(token: string): Promise<User | null> {
  if (!/^[a-f0-9]{64}$/.test(token)) return null;
  return hosted() ? rpc("read_session", { hash: digest(token) }) : local.readSession(token);
}
export async function deleteSession(token: string) {
  return hosted() ? rpc("delete_session", { hash: digest(token) }) : local.deleteSession(token);
}
export async function reserveSeats(userId: string, input: local.ReservationInput): Promise<Booking> {
  if (!hosted()) return local.reserveSeats(userId, input);
  const contact = bookingContactSchema.safeParse(input);
  if (!contact.success) throw new Error("กรุณาตรวจสอบข้อมูลติดต่อและช่องทางชำระเงิน");
  return rpc("reserve", { ...input, ...contact.data, userId });
}
export async function readBooking(id: string, userId: string): Promise<Booking | null> {
  return hosted() ? rpc("booking", { id, userId }) : local.readBooking(id, userId);
}
export async function readBookings(userId: string): Promise<Booking[]> {
  return hosted() ? rpc("bookings", { userId }) : local.readBookings(userId);
}

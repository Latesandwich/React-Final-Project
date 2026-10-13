import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import type { Booking, Movie, Showtime, User } from "../types";
import { INITIAL_MOVIES, INITIAL_SHOWTIMES } from "./mock-data";
import { bookingContactSchema } from "./booking-validation";

let database: DatabaseSync | undefined;
export function getDatabase(): DatabaseSync {
  if (process.env.CINEMAGO_DATA_MODE === "mock" || process.env.VERCEL) {
    throw new Error("Local database unavailable. Catalogue demo only.");
  }
  if (database) return database;
  const filename = path.resolve(
    /* turbopackIgnore: true */ process.env.CINEMAGO_DB_PATH ||
      "data/cinemago.sqlite",
  );
  mkdirSync(path.dirname(filename), { recursive: true });
  const db = new DatabaseSync(filename);
  try {
    db.exec(`
      PRAGMA foreign_keys = ON;
      PRAGMA journal_mode = WAL;
      PRAGMA busy_timeout = 5000;
      CREATE TABLE IF NOT EXISTS movies (id TEXT PRIMARY KEY, payload TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS showtimes (
        id TEXT PRIMARY KEY, movie_id TEXT NOT NULL REFERENCES movies(id), payload TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE COLLATE NOCASE,
        name TEXT NOT NULL, password TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS sessions (
        token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), expires_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS bookings (
        id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id),
        showtime_id TEXT NOT NULL REFERENCES showtimes(id), payload TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS bookings_user ON bookings(user_id);
      CREATE TABLE IF NOT EXISTS booked_seats (
        showtime_id TEXT NOT NULL REFERENCES showtimes(id), seat_id TEXT NOT NULL,
        booking_id TEXT NOT NULL REFERENCES bookings(id), PRIMARY KEY(showtime_id, seat_id)
      );
      BEGIN IMMEDIATE;
    `);
    const movieInsert = db.prepare(
      "INSERT OR IGNORE INTO movies VALUES (?, ?)",
    );
    const showtimeInsert = db.prepare(
      "INSERT OR IGNORE INTO showtimes VALUES (?, ?, ?)",
    );
    for (const movie of INITIAL_MOVIES)
      movieInsert.run(movie.id, JSON.stringify(movie));
    for (const showtime of INITIAL_SHOWTIMES)
      showtimeInsert.run(
        showtime.id,
        showtime.movieId,
        JSON.stringify(showtime),
      );
    db.exec("COMMIT");
    database = db;
    return db;
  } catch (error) {
    db.close();
    throw error;
  }
}

function payload<T>(row: unknown): T {
  return JSON.parse((row as { payload: string }).payload) as T;
}
export function readCatalogue(): { movies: Movie[]; showtimes: Showtime[] } {
  const db = getDatabase();
  const movies = db
    .prepare("SELECT payload FROM movies ORDER BY id")
    .all()
    .map(payload<Movie>);
  const showtimes = db
    .prepare("SELECT payload FROM showtimes ORDER BY id")
    .all()
    .map(payload<Showtime>);
  const occupied = db
    .prepare("SELECT showtime_id, seat_id FROM booked_seats")
    .all();
  for (const showtime of showtimes) {
    const ids = new Set(
      occupied
        .filter((row) => row.showtime_id === showtime.id)
        .map((row) => row.seat_id),
    );
    for (const seat of showtime.seats) seat.isBooked ||= ids.has(seat.id);
  }
  return { movies, showtimes };
}
export function insertUser(user: User & { password: string }): void {
  getDatabase()
    .prepare(
      "INSERT INTO users (id, email, name, password) VALUES (?, ?, ?, ?)",
    )
    .run(user.id, user.email.trim().toLowerCase(), user.name, user.password);
}
export function readUserByEmail(email: string): User | undefined {
  return getDatabase()
    .prepare("SELECT * FROM users WHERE email = ?")
    .get(email.trim().toLowerCase()) as unknown as User | undefined;
}
const digest = (token: string) =>
  createHash("sha256").update(token).digest("hex");
export function createSession(userId: string): string {
  const db = getDatabase();
  db.prepare("DELETE FROM sessions WHERE expires_at <= ?").run(Date.now());
  const token = randomBytes(32).toString("hex");
  db.prepare("INSERT INTO sessions VALUES (?, ?, ?)").run(
    digest(token),
    userId,
    Date.now() + 7 * 86400000,
  );
  return token;
}
export function readSession(token: string): User | null {
  if (!/^[a-f0-9]{64}$/.test(token)) return null;
  return (
    (getDatabase()
      .prepare(
        `SELECT u.id, u.email, u.name FROM users u
    JOIN sessions s ON s.user_id = u.id WHERE s.token_hash = ? AND s.expires_at > ?`,
      )
      .get(digest(token), Date.now()) as unknown as User | undefined) || null
  );
}
export function deleteSession(token: string): void {
  getDatabase()
    .prepare("DELETE FROM sessions WHERE token_hash = ?")
    .run(digest(token));
}
export interface ReservationInput {
  showtimeId: string;
  seats: { id: string }[];
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  paymentMethod: Booking["paymentMethod"];
  promoCode?: string;
}
export function reserveSeats(userId: string, input: ReservationInput): Booking {
  const seatIds = input.seats?.map((seat) => seat.id);
  if (
    !seatIds?.length ||
    seatIds.length > 8 ||
    new Set(seatIds).size !== seatIds.length
  ) {
    throw new Error("กรุณาเลือกที่นั่งที่ถูกต้องและไม่ซ้ำกัน");
  }
  const contact = bookingContactSchema.safeParse(input);
  if (!contact.success) {
    throw new Error("กรุณาตรวจสอบข้อมูลติดต่อและช่องทางชำระเงิน");
  }
  const db = getDatabase();
  // CHECK 06 — one transaction + unique seat key prevents double booking.
  db.exec("BEGIN IMMEDIATE");
  try {
    const { movies, showtimes } = readCatalogue();
    const showtime = showtimes.find((item) => item.id === input.showtimeId);
    const movie = movies.find((item) => item.id === showtime?.movieId);
    if (!showtime || !movie) throw new Error("ไม่พบรอบฉาย");
    const selected = seatIds.map((id) =>
      showtime.seats.find((seat) => seat.id === id),
    );
    if (selected.some((seat) => !seat || seat.isBooked))
      throw new Error("ที่นั่งถูกจองแล้ว กรุณาเลือกที่นั่งใหม่");
    const seats = selected.map((seat) => ({
      id: seat!.id,
      row: seat!.row,
      number: seat!.number,
      type: seat!.type,
      price: seat!.price,
    }));
    const discount = ["CINEMA50", "FRAME50"].includes(
      input.promoCode?.trim().toUpperCase() || "",
    )
      ? 50
      : 0;
    const booking: Booking = {
      id: `BK-${randomUUID()}`,
      userId,
      userName: contact.data.customerName,
      userEmail: contact.data.customerEmail,
      userPhone: contact.data.customerPhone,
      showtimeId: showtime.id,
      movie,
      hallName: showtime.hall.name,
      hallType: showtime.hall.type,
      dateTime: showtime.dateTime,
      audio: showtime.audio,
      seats,
      totalPrice: Math.max(
        0,
        seats.reduce((sum, seat) => sum + seat.price, 0) - discount,
      ),
      paymentMethod: input.paymentMethod,
      paymentStatus: "pending",
      bookedAt: new Date().toISOString(),
    };
    db.prepare("INSERT INTO bookings VALUES (?, ?, ?, ?)").run(
      booking.id,
      userId,
      showtime.id,
      JSON.stringify(booking),
    );
    const insertSeat = db.prepare("INSERT INTO booked_seats VALUES (?, ?, ?)");
    for (const seat of seats) insertSeat.run(showtime.id, seat.id, booking.id);
    db.exec("COMMIT");
    return booking;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}
export function readBooking(id: string, userId: string): Booking | null {
  const row = getDatabase()
    .prepare("SELECT payload FROM bookings WHERE id = ? AND user_id = ?")
    .get(id, userId);
  return row ? payload<Booking>(row) : null;
}
export function readBookings(userId: string): Booking[] {
  return getDatabase()
    .prepare(
      "SELECT payload FROM bookings WHERE user_id = ? ORDER BY rowid DESC",
    )
    .all(userId)
    .map(payload<Booking>);
}

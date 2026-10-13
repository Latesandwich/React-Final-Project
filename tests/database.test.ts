import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  getDatabase,
  insertUser,
  readUserByEmail,
  createSession,
  readSession,
  deleteSession,
  readCatalogue,
  reserveSeats,
  readBooking,
  readBookings,
} from "../src/lib/database";

test("persistent, isolated accounts and atomic seat reservations", () => {
  const directory = mkdtempSync(path.join(tmpdir(), "cinemago-test-"));
  process.env.CINEMAGO_DB_PATH = path.join(directory, "test.sqlite");
  let db: ReturnType<typeof getDatabase> | undefined;
  try {
    db = getDatabase();
    assert.equal(readCatalogue().movies.length, 9);
    assert.equal(readCatalogue().showtimes.length, 10);
    insertUser({
      id: "u1",
      name: "One",
      email: "ONE@example.com",
      password: "test-hash",
    });
    insertUser({
      id: "u2",
      name: "Two",
      email: "two@example.com",
      password: "test-hash",
    });
    assert.equal(readUserByEmail(" one@EXAMPLE.COM ")?.id, "u1");
    assert.throws(() =>
      insertUser({
        id: "u3",
        name: "Duplicate",
        email: "one@example.com",
        password: "hash",
      }),
    );

    const token = createSession("u1");
    assert.equal(readSession(token)?.id, "u1");
    assert.equal(readSession("u1"), null, "user IDs are not sessions");
    assert.equal(readSession("a".repeat(64)), null);
    assert.equal("password" in readSession(token)!, false);
    assert.notEqual(
      db.prepare("SELECT token_hash FROM sessions").get()?.token_hash,
      token,
    );
    db.prepare("UPDATE sessions SET expires_at = 0 WHERE token_hash = ?").run(
      createHash("sha256").update(token).digest("hex"),
    );
    assert.equal(readSession(token), null);
    const revoked = createSession("u1");
    deleteSession(revoked);
    assert.equal(readSession(revoked), null);

    const input = {
      showtimeId: "st-101",
      seats: [{ id: "H-1", price: 1 }],
      totalPrice: 1,
      movieId: "forged",
      customerName: "Test",
      customerEmail: "test@example.com",
      customerPhone: "0891234567",
      paymentMethod: "promptpay" as const,
      promoCode: "CINEMA50",
    };
    const booking = reserveSeats("u1", input);
    const nineSeats = Array.from({ length: 9 }, (_, index) => ({
      id: `E-${index + 1}`,
    }));
    assert.throws(
      () => reserveSeats("u1", { ...input, seats: nineSeats }),
      /ที่นั่ง/,
      "server also enforces the eight-seat limit",
    );
    assert.equal(
      booking.totalPrice,
      190,
      "price and discount are calculated from server inventory",
    );
    assert.equal(booking.movie.id, "m-1");
    assert.equal(booking.paymentStatus, "pending");
    assert.equal(readBooking(booking.id, "u1")?.id, booking.id);
    assert.equal(readBooking(booking.id, "u2"), null);
    assert.equal(readBooking("made-up", "u1"), null);
    assert.equal(readBookings("u2").length, 0);
    assert.throws(() => reserveSeats("u2", input), /ที่นั่ง/);
    assert.throws(() =>
      reserveSeats("u1", { ...input, seats: [{ id: "H-2" }, { id: "H-2" }] }),
    );
    assert.throws(() =>
      reserveSeats("u1", { ...input, seats: [{ id: "missing" }] }),
    );
    assert.throws(() =>
      reserveSeats("missing-user", { ...input, seats: [{ id: "H-2" }] }),
    );
    assert.equal(
      readCatalogue().showtimes[0].seats.find((seat) => seat.id === "H-2")
        ?.isBooked,
      false,
      "failed write rolls back",
    );

    // A separate Node process proves data survives the original process/module state.
    const child = spawnSync(
      process.execPath,
      [
        "-e",
        `const { DatabaseSync } = require('node:sqlite');
      const db = new DatabaseSync(process.env.CINEMAGO_DB_PATH);
      const row = db.prepare('SELECT count(*) AS total FROM bookings').get();
      if (row.total !== 1) process.exit(1);`,
      ],
      { env: process.env, encoding: "utf8" },
    );
    assert.equal(child.status, 0, child.stderr);
    process.env.CINEMAGO_DATA_MODE = "mock";
    assert.throws(() =>
      reserveSeats("u1", { ...input, seats: [{ id: "H-2" }] }),
    );
    delete process.env.CINEMAGO_DATA_MODE;
  } finally {
    db?.close();
    rmSync(directory, { recursive: true, force: true });
  }
});

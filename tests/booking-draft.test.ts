import { test } from "node:test";
import assert from "node:assert/strict";
import {
  readCheckoutDraft,
  bookingContactSchema,
} from "../src/lib/booking-validation";

test("checkout storage rejects malformed and impossible selections", () => {
  const draft = {
    showtimeId: "st-101",
    movieId: "m-1",
    movieTitle: "Dune",
    movieTitleTh: "ดูน",
    moviePoster: "https://example.test/poster.jpg",
    hallName: "Cinema 1",
    hallType: "IMAX",
    dateTime: "19:30",
    audio: "EN/TH",
    totalPrice: 240,
    seats: [{ id: "H-1", row: "H", number: 1, type: "standard", price: 240 }],
  };
  assert.equal(readCheckoutDraft(JSON.stringify(draft))?.seats[0].id, "H-1");
  for (const raw of [
    null,
    "{broken",
    "null",
    "{}",
    JSON.stringify({ ...draft, seats: [] }),
    JSON.stringify({ ...draft, seats: [...draft.seats, ...draft.seats] }),
    JSON.stringify({
      ...draft,
      seats: draft.seats.map((seat) => ({ ...seat, price: -1 })),
    }),
  ]) {
    assert.equal(readCheckoutDraft(raw), null);
  }
});

test("contact validation rejects invalid fields and trims valid contact data", () => {
  const contact = {
    customerName: " Test ",
    customerEmail: " test@example.test ",
    customerPhone: "089-123-4567",
    paymentMethod: "promptpay",
  };
  assert.equal(bookingContactSchema.parse(contact).customerName, "Test");
  assert.equal(
    bookingContactSchema.safeParse({ ...contact, customerName: " " }).success,
    false,
  );
  assert.equal(
    bookingContactSchema.safeParse({ ...contact, customerEmail: "invalid" })
      .success,
    false,
  );
  assert.equal(
    bookingContactSchema.safeParse({ ...contact, customerPhone: "123" })
      .success,
    false,
  );
  assert.equal(
    bookingContactSchema.safeParse({ ...contact, paymentMethod: "other" })
      .success,
    false,
  );
});

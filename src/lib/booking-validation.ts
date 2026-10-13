import { z } from "zod";

// CHECK 04 — shared browser/server validation. Never trust browser-only checks.
export const bookingContactSchema = z.object({
  customerName: z.string().trim().min(1, "กรุณากรอกชื่อผู้ติดต่อ").max(200),
  customerEmail: z.string().trim().max(254).email("กรุณากรอกอีเมลให้ถูกต้อง"),
  customerPhone: z
    .string()
    .trim()
    .max(30)
    .refine(
      (value) =>
        /^[\d\s()+-]+$/.test(value) &&
        value.replace(/\D/g, "").length >= 9 &&
        value.replace(/\D/g, "").length <= 15,
      "กรุณากรอกเบอร์โทรศัพท์ 9–15 หลัก",
    ),
  paymentMethod: z.enum(["promptpay", "credit_card", "truemoney"]),
});
export type BookingContact = z.infer<typeof bookingContactSchema>;

const checkoutDraftSchema = z.object({
  showtimeId: z.string().min(1),
  movieId: z.string().min(1),
  movieTitle: z.string().min(1),
  movieTitleTh: z.string(),
  moviePoster: z.string().url(),
  hallName: z.string(),
  hallType: z.string(),
  dateTime: z.string(),
  audio: z.string(),
  totalPrice: z.number().nonnegative(),
  seats: z
    .array(
      z.object({
        id: z.string().min(1),
        row: z.string(),
        number: z.number().int().positive(),
        type: z.enum(["standard", "premium", "vip"]),
        price: z.number().nonnegative(),
      }),
    )
    .min(1)
    .max(8)
    .refine(
      (seats) => new Set(seats.map((seat) => seat.id)).size === seats.length,
    ),
});
export type CheckoutData = z.infer<typeof checkoutDraftSchema>;

// Storage may be stale or edited. An invalid draft becomes the empty checkout state.
export function readCheckoutDraft(raw: string | null): CheckoutData | null {
  if (!raw) return null;
  try {
    const result = checkoutDraftSchema.safeParse(JSON.parse(raw));
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

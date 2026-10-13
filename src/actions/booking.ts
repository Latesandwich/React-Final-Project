"use server";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import {
  readBooking,
  readBookings,
  reserveSeats,
  type ReservationInput,
} from "@/lib/backend";

export interface CreateBookingInput extends ReservationInput {
  movieId?: string;
  hallName?: string;
  hallType?: string;
  dateTime?: string;
  audio?: string;
  totalPrice?: number;
}
export interface BookingResponse {
  success: boolean;
  bookingId?: string;
  message?: string;
}
// CHECK 05 — mutation: authenticate, reserve atomically, then refresh affected routes.
export async function createBookingAction(
  input: CreateBookingInput,
): Promise<BookingResponse> {
  const user = await getCurrentUser();
  if (!user) return { success: false, message: "กรุณาเข้าสู่ระบบก่อนจองตั๋ว" };
  try {
    const booking = await reserveSeats(user.id, input);
    revalidatePath("/booking/" + input.showtimeId);
    revalidatePath("/my-ticket");
    return { success: true, bookingId: booking.id };
  } catch (error) {
    const message =
      error instanceof Error && /^[\u0E00-\u0E7F]/.test(error.message)
        ? error.message
        : "ไม่สามารถบันทึกการจองได้ กรุณาลองใหม่อีกครั้ง";
    return { success: false, message };
  }
}
export async function getBookingById(id: string) {
  const user = await getCurrentUser();
  return user ? readBooking(id, user.id) : null;
}
export async function getUserBookings() {
  const user = await getCurrentUser();
  return user ? readBookings(user.id) : [];
}

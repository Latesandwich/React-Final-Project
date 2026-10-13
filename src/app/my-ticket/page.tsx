import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Ticket } from "lucide-react";
import { getUserBookings } from "@/actions/booking";
import { getCurrentUser } from "@/lib/auth";
import TicketCard from "@/components/TicketCard";

export const metadata = { title: "ตั๋วของฉัน — CinemaGo" };
// Server: only the current account's bookings are queried and rendered.
export default async function MyTicketPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/my-ticket");
  const bookings = await getUserBookings();
  return (
    <main className="cg-shell py-10 sm:py-14">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="cg-label">YOUR COLLECTION</p>
          <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">
            ตั๋วของฉัน
          </h1>
          <p className="mt-3 text-sm text-neutral-400">
            สวัสดี {user.name} • {bookings.length} รายการจอง
          </p>
        </div>
        <Link href="/" className="cg-button cg-button-secondary">
          เลือกภาพยนตร์ <ArrowRight size={15} />
        </Link>
      </div>
      {bookings.length ? (
        <div className="grid gap-6 lg:grid-cols-2">
          {bookings.map((booking) => (
            <TicketCard key={booking.id} booking={booking} />
          ))}
        </div>
      ) : (
        <section className="cg-panel grid min-h-80 place-items-center p-8 text-center">
          <div>
            <Ticket size={36} className="mx-auto text-amber-400" />
            <h2 className="mt-5 text-xl font-semibold">
              เรื่องราวของคุณยังไม่เริ่ม
            </h2>
            <p className="my-4 text-sm text-neutral-400">
              เลือกหนังสักเรื่อง แล้วเก็บค่ำคืนดี ๆ ไว้ที่นี่
            </p>
            <Link href="/" className="cg-button">
              ค้นหาภาพยนตร์ <ArrowRight size={15} />
            </Link>
          </div>
        </section>
      )}
      <p className="mt-6 text-xs leading-6 text-neutral-500">
        รายการนี้เป็นข้อมูลการจองในระบบสาธิต
        ยังไม่ใช่บัตรสำหรับเข้าโรงภาพยนตร์จริง
      </p>
    </main>
  );
}

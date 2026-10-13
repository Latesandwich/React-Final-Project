import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Ticket } from "lucide-react";
import type { Booking } from "@/types";

// Server: pure presentation of an owner-checked booking. This is not an admission QR code.
export default function TicketCard({ booking }: { booking: Booking }) {
  return (
    <article className="cg-panel overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800 px-6 py-4">
        <span className="cg-label flex items-center gap-2 !text-amber-300">
          <Ticket size={15} />
          CINEMAGO / BOOKING
        </span>
        <span
          className={`rounded-full px-3 py-1 text-[10px] ${booking.paymentStatus === "completed" ? "bg-emerald-500/10 text-emerald-300" : "bg-amber-500/10 text-amber-300"}`}
        >
          {booking.paymentStatus === "completed"
            ? "ชำระแล้ว"
            : "รอชำระเงิน · ระบบสาธิต"}
        </span>
      </div>
      <div className="flex flex-col gap-6 p-6 sm:flex-row sm:p-8">
        <Image
          src={booking.movie.poster}
          alt={booking.movie.title}
          width={120}
          height={180}
          unoptimized
          className="h-40 w-28 shrink-0 rounded-lg object-cover"
        />
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-semibold">{booking.movie.title}</h2>
          <p className="mt-1 text-xs text-neutral-400">
            {booking.movie.titleTh}
          </p>
          <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-5 text-xs">
            {[
              ["รอบฉาย", booking.dateTime],
              ["โรงภาพยนตร์", booking.hallName],
              ["ที่นั่ง", booking.seats.map((seat) => seat.id).join(", ")],
              ["ยอดรวม", `฿${booking.totalPrice.toLocaleString()}`],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="mb-1 text-[10px] text-neutral-500">{label}</dt>
                <dd className="break-words font-semibold">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-dashed border-neutral-700 px-6 py-4">
        <div className="min-w-0">
          <p className="cg-label !text-[8px]">BOOKING REFERENCE</p>
          <p className="mt-1 break-all font-mono text-[10px] text-neutral-400">
            {booking.id}
          </p>
        </div>
        <Link
          href={`/confirmation/${booking.id}`}
          className="flex items-center gap-2 text-xs text-amber-300"
        >
          รายละเอียด <ArrowUpRight size={14} />
        </Link>
      </div>
    </article>
  );
}

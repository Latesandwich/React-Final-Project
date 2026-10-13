import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Check, Info } from "lucide-react";
import { getBookingById } from "@/actions/booking";
import TicketCard from "@/components/TicketCard";

export const metadata = { title: "บันทึกการจองแล้ว — CinemaGo" };
// CHECK 07 — ownership: action resolves the current session and queries id + user_id.
export default async function ConfirmationPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const booking = await getBookingById((await params).bookingId);
  if (!booking) notFound();
  return (
    <main className="cg-shell max-w-3xl py-10 sm:py-14">
      <div className="mb-8 text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
          <Check size={26} />
        </span>
        <p className="cg-label mt-6">SEE YOU AT THE MOVIES</p>
        <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">
          บันทึกการจองแล้ว
        </h1>
        <p className="mt-3 text-sm leading-7 text-neutral-400">
          รายละเอียดถูกเก็บไว้ในบัญชีของคุณ
          <br />
          กลับมาดูได้ทุกเมื่อที่หน้าตั๋วของฉัน
        </p>
      </div>
      <TicketCard booking={booking} />
      <div className="mt-5 flex gap-3 rounded-xl border border-amber-400/20 bg-amber-400/5 p-4 text-xs leading-6 text-amber-200">
        <Info size={16} className="mt-1 shrink-0" />
        <p>
          นี่คือการจองในระบบสาธิต ไม่มีการเรียกเก็บเงิน ส่งอีเมล หรือออก QR
          สำหรับเข้าโรงจริง
        </p>
      </div>
      <dl className="my-6 grid gap-4 text-xs sm:grid-cols-2">
        <div>
          <dt className="mb-1 text-neutral-500">ผู้ติดต่อ</dt>
          <dd>{booking.userName}</dd>
        </div>
        <div>
          <dt className="mb-1 text-neutral-500">อีเมลที่บันทึกไว้</dt>
          <dd className="break-all">{booking.userEmail}</dd>
        </div>
      </dl>
      <div className="no-print flex flex-wrap justify-center gap-3">
        <Link href="/my-ticket" className="cg-button">
          ตั๋วของฉัน <ArrowRight size={15} />
        </Link>
        <Link href="/" className="cg-button cg-button-secondary">
          เลือกภาพยนตร์เพิ่มเติม
        </Link>
      </div>
    </main>
  );
}

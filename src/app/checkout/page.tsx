import { LazyCheckoutForm as CheckoutForm } from "@/components/LazyBooking";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export const metadata = {
  title: "ตรวจสอบและยืนยันการจอง — CinemaGo",
  description: "ตรวจสอบข้อมูลติดต่อและที่นั่งก่อนยืนยันการจองในระบบสาธิต",
};

export default async function CheckoutPage() {
  if (!(await getCurrentUser())) redirect("/login?callbackUrl=/checkout");
  return (
    <main className="cg-shell py-8 sm:py-12">
      <div className="space-y-6">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-400 hover:text-amber-400 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>กลับหน้ารายชื่อภาพยนตร์</span>
          </Link>
        </div>

        <ol aria-label="ขั้นตอนการจอง" className="flex flex-wrap gap-5 pb-2">
          <li className="cg-step">
            <b>1</b>เลือกที่นั่ง
          </li>
          <li className="cg-step" aria-current="step">
            <b>2</b>ตรวจสอบข้อมูล
          </li>
          <li className="cg-step">
            <b>3</b>ยืนยันการจอง
          </li>
        </ol>
        <CheckoutForm />
      </div>
    </main>
  );
}

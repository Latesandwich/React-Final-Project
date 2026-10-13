"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CreditCard,
  Info,
  Loader2,
  QrCode,
  Ticket,
  Wallet,
} from "lucide-react";
import { useBooking } from "./BookingContext";
import {
  bookingContactSchema,
  type BookingContact,
} from "@/lib/booking-validation";
import { createBookingAction } from "@/actions/booking";

// Client: contact fields, discounts and mutation feedback need interactive browser state.
export default function CheckoutForm() {
  const router = useRouter();
  const { data, ready, setCheckout } = useBooking();
  const [promo, setPromo] = useState("");
  const [appliedPromo, setAppliedPromo] = useState("");
  const [promoError, setPromoError] = useState("");
  const [serverError, setServerError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<BookingContact>({
    resolver: zodResolver(bookingContactSchema),
    defaultValues: {
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      paymentMethod: "promptpay",
    },
  });
  // CHECK 05 — only a Server Action can turn this draft into a saved booking.
  const confirm = handleSubmit(async (contact) => {
    if (!data) return;
    setServerError("");
    try {
      const result = await createBookingAction({
        ...contact,
        showtimeId: data.showtimeId,
        seats: data.seats.map((seat) => ({ id: seat.id })),
        promoCode: appliedPromo || undefined,
      });
      if (!result.success || !result.bookingId) {
        setServerError(result.message || "บันทึกการจองไม่สำเร็จ");
        return;
      }
      setCheckout(null);
      router.push(`/confirmation/${result.bookingId}`);
    } catch {
      setServerError("เชื่อมต่อไม่สำเร็จ กรุณาลองอีกครั้ง");
    }
  });
  if (!ready)
    return (
      <div role="status" className="grid min-h-60 place-items-center">
        <Loader2
          className="animate-spin text-amber-400"
          aria-label="กำลังโหลดการจอง"
        />
      </div>
    );
  if (!data)
    return (
      <div className="cg-panel mx-auto max-w-lg p-10 text-center">
        <Ticket className="mx-auto text-amber-400" size={36} />
        <h1 className="mt-5 text-2xl font-semibold">ยังไม่ได้เลือกที่นั่ง</h1>
        <p className="my-5 text-sm leading-7 text-neutral-400">
          เลือกภาพยนตร์ รอบฉาย และที่นั่งก่อนยืนยันการจอง
        </p>
        <Link href="/" className="cg-button">
          เลือกภาพยนตร์ <ArrowRight size={16} />
        </Link>
      </div>
    );
  const subtotal = data.seats.reduce((sum, seat) => sum + seat.price, 0);
  const discount = appliedPromo ? 50 : 0;
  const total = Math.max(0, subtotal - discount);
  return (
    <div>
      <div className="mb-8">
        <p className="cg-label">ONE MORE STEP</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          ตรวจสอบการจองของคุณ
        </h1>
        <p className="mt-3 text-sm text-neutral-400">
          กรอกข้อมูลติดต่อ แล้วตรวจสอบรายละเอียดก่อนยืนยัน
        </p>
      </div>
      <div className="mb-6 flex gap-3 rounded-xl border border-amber-400/20 bg-amber-400/5 p-4 text-xs leading-6 text-amber-200">
        <Info size={17} className="mt-1 shrink-0" />
        <p>
          ระบบสาธิตการจอง — ไม่มีการเรียกเก็บเงินจริงหรือส่งอีเมล
          ที่นั่งจะถูกตรวจสอบอีกครั้งตอนยืนยัน
        </p>
      </div>
      <form
        onSubmit={confirm}
        noValidate
        className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]"
      >
        <div className="space-y-6">
          <section className="cg-panel p-6 sm:p-8">
            <p className="cg-label">01 / CONTACT DETAILS</p>
            <h2 className="mb-6 mt-2 text-lg font-semibold">ข้อมูลผู้ติดต่อ</h2>
            <div className="space-y-5">
              {(
                [
                  {
                    name: "customerName",
                    label: "ชื่อ–นามสกุล",
                    type: "text",
                    autocomplete: "name",
                    placeholder: "ชื่อผู้ติดต่อ",
                  },
                  {
                    name: "customerEmail",
                    label: "อีเมล",
                    type: "email",
                    autocomplete: "email",
                    placeholder: "you@example.com",
                  },
                  {
                    name: "customerPhone",
                    label: "เบอร์โทรศัพท์",
                    type: "tel",
                    autocomplete: "tel",
                    placeholder: "089 123 4567",
                  },
                ] as const
              ).map((field) => (
                <div key={field.name}>
                  <label
                    htmlFor={field.name}
                    className="mb-2 block text-xs font-semibold text-neutral-300"
                  >
                    {field.label} <span className="text-amber-400">*</span>
                  </label>
                  <input
                    id={field.name}
                    type={field.type}
                    autoComplete={field.autocomplete}
                    placeholder={field.placeholder}
                    {...register(field.name)}
                    aria-invalid={!!errors[field.name]}
                    aria-describedby={
                      errors[field.name] ? `${field.name}-error` : undefined
                    }
                    className="cg-input"
                  />
                  {errors[field.name] && (
                    <p
                      id={`${field.name}-error`}
                      role="alert"
                      className="mt-2 text-xs text-red-400"
                    >
                      {errors[field.name]?.message}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
          <fieldset className="cg-panel p-6 sm:p-8">
            <legend className="sr-only">ช่องทางชำระเงินตัวอย่าง</legend>
            <p className="cg-label">02 / PAYMENT PREFERENCE</p>
            <h2 className="mb-2 mt-2 text-lg font-semibold">
              ช่องทางชำระเงินตัวอย่าง
            </h2>
            <p className="mb-5 text-xs leading-6 text-neutral-400">
              บันทึกตัวเลือกเท่านั้น การจองจะอยู่ในสถานะรอชำระเงิน
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { value: "promptpay", label: "พร้อมเพย์", Icon: QrCode },
                { value: "credit_card", label: "บัตรเครดิต", Icon: CreditCard },
                { value: "truemoney", label: "TrueMoney", Icon: Wallet },
              ].map(({ value, label, Icon }) => (
                <label
                  key={value}
                  className="relative flex cursor-pointer items-center gap-3 rounded-xl border border-neutral-700 p-4 has-[:checked]:border-amber-400 has-[:checked]:bg-amber-400/5"
                >
                  <input
                    type="radio"
                    value={value}
                    {...register("paymentMethod")}
                    className="size-4 accent-amber-400"
                  />
                  <Icon size={18} className="text-neutral-400" />
                  <span className="text-xs">{label}</span>
                </label>
              ))}
            </div>
            {errors.paymentMethod && (
              <p role="alert" className="mt-2 text-xs text-red-400">
                {errors.paymentMethod.message}
              </p>
            )}
          </fieldset>
          <Link
            href={`/booking/${data.showtimeId}`}
            className="inline-flex items-center gap-2 text-xs text-neutral-400 hover:text-amber-400"
          >
            <ArrowLeft size={14} />
            กลับไปเลือกที่นั่ง
          </Link>
        </div>
        <aside className="cg-panel p-6 lg:sticky lg:top-40">
          <p className="cg-label">BOOKING SUMMARY</p>
          <div className="my-5 flex items-center gap-4">
            <Image
              src={data.moviePoster}
              alt={data.movieTitle}
              width={70}
              height={100}
              unoptimized
              className="h-24 w-16 rounded-lg object-cover"
            />
            <div>
              <h2 className="text-lg font-semibold">{data.movieTitle}</h2>
              <p className="mt-1 text-xs text-neutral-400">
                {data.movieTitleTh}
              </p>
            </div>
          </div>
          <dl className="space-y-3 text-xs">
            {[
              ["รอบฉาย", data.dateTime],
              ["โรงภาพยนตร์", data.hallName],
              ["ภาษา", data.audio],
              ["ที่นั่ง", data.seats.map((seat) => seat.id).join(", ")],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4">
                <dt className="text-neutral-500">{label}</dt>
                <dd className="max-w-[65%] text-right">{value}</dd>
              </div>
            ))}
          </dl>
          <div className="cg-rule my-5" />
          <label
            htmlFor="promo"
            className="mb-2 block text-xs text-neutral-400"
          >
            โค้ดส่วนลด <span className="text-neutral-500">(ลอง CINEMA50)</span>
          </label>
          <div className="flex gap-2">
            <input
              id="promo"
              value={promo}
              onChange={(event) => {
                setPromo(event.target.value);
                setAppliedPromo("");
                setPromoError("");
              }}
              className="cg-input !py-2"
              placeholder="กรอกโค้ด"
            />
            <button
              type="button"
              className="cg-button cg-button-secondary !min-h-10 !px-4"
              onClick={() => {
                const code = promo.trim().toUpperCase();
                if (["CINEMA50", "FRAME50"].includes(code)) {
                  setAppliedPromo(code);
                  setPromoError("");
                } else {
                  setAppliedPromo("");
                  setPromoError("โค้ดส่วนลดไม่ถูกต้อง");
                }
              }}
            >
              ใช้โค้ด
            </button>
          </div>
          {promoError && (
            <p role="alert" className="mt-2 text-xs text-red-400">
              {promoError}
            </p>
          )}
          {appliedPromo && (
            <p
              role="status"
              className="mt-2 flex items-center gap-1 text-xs text-emerald-400"
            >
              <Check size={13} />
              ใช้ส่วนลด 50 บาทแล้ว
            </p>
          )}
          <dl className="my-5 space-y-3 text-xs">
            <div className="flex justify-between">
              <dt className="text-neutral-400">
                ราคาตั๋ว ({data.seats.length} ที่นั่ง)
              </dt>
              <dd>฿{subtotal.toLocaleString()}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-neutral-400">ส่วนลด</dt>
              <dd className="text-emerald-400">−฿{discount}</dd>
            </div>
          </dl>
          <div className="cg-rule mb-5" />
          <div className="mb-5 flex items-end justify-between">
            <span className="text-xs text-neutral-400">ยอดรวม</span>
            <strong className="text-3xl font-semibold text-amber-400">
              ฿{total.toLocaleString()}
            </strong>
          </div>
          {serverError && (
            <p
              role="alert"
              className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs leading-6 text-red-300"
            >
              {serverError}
            </p>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="cg-button w-full"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                กำลังบันทึก...
              </>
            ) : (
              <>
                ยืนยันการจอง <ArrowRight size={16} />
              </>
            )}
          </button>
          <p className="mt-3 text-center text-[10px] leading-5 text-neutral-500">
            บันทึกการจองเข้าบัญชีของคุณ • ยังไม่มีการชำระเงิน
          </p>
        </aside>
      </form>
    </div>
  );
}

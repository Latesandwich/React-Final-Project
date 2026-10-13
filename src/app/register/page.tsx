"use client";

import { startTransition, useActionState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { Film, UserPlus, Lock, Mail, User, ShieldCheck } from "lucide-react";
import { registerAction, type AuthFormState } from "@/lib/actions/auth";

const initialState: AuthFormState = { error: "" };
// CHECK 04 — RHF delegates field validation to this Zod schema.
const registrationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "กรุณากรอกชื่อ")
    .max(200, "ชื่อต้องไม่เกิน 200 ตัวอักษร"),
  email: z.string().trim().max(254).email("รูปแบบอีเมลไม่ถูกต้อง"),
  password: z
    .string()
    .min(6, "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร")
    .refine(
      (value) => new TextEncoder().encode(value).length <= 72,
      "รหัสผ่านต้องไม่เกิน 72 ไบต์",
    ),
});

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState(
    registerAction,
    initialState,
  );
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof registrationSchema>>({
    resolver: zodResolver(registrationSchema),
  });
  // Validate in the browser for feedback; the existing Server Action also validates every write.
  const submit = handleSubmit((values) => {
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => formData.set(key, value));
    startTransition(() => formAction(formData));
  });

  return (
    <main className="min-h-[75vh] bg-neutral-950 text-neutral-100 flex items-center justify-center py-12 px-4 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md cg-panel p-6 sm:p-8 space-y-6 relative z-10">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-amber-400 mx-auto flex items-center justify-center ">
            <Film className="w-6 h-6 text-neutral-950 font-bold" />
          </div>
          <h1 className="text-2xl font-semibold text-white">
            สมัครสมาชิก CinemaGo
          </h1>
          <p className="text-xs text-neutral-400">
            สร้างบัญชีเพื่อจองตั๋ว ผูกการจองกับสมาชิกของคุณ และดู E-Ticket
            ย้อนหลัง
          </p>
        </div>

        <form
          action={formAction}
          onSubmit={submit}
          noValidate
          className="space-y-4"
        >
          <div>
            <label
              htmlFor="name"
              className="block text-xs font-semibold text-neutral-300 mb-1.5"
            >
              ชื่อ-นามสกุล (Name)
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="name"
                {...register("name")}
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? "name-error" : undefined}
                type="text"
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-amber-400"
                placeholder="ชื่อของคุณ"
              />
            </div>
            {errors.name && (
              <p
                id="name-error"
                role="alert"
                className="mt-1 text-xs text-red-400"
              >
                {errors.name.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-xs font-semibold text-neutral-300 mb-1.5"
            >
              อีเมล (Email)
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="email"
                {...register("email")}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
                type="email"
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-amber-400"
                placeholder="name@example.com"
              />
            </div>
            {errors.email && (
              <p
                id="email-error"
                role="alert"
                className="mt-1 text-xs text-red-400"
              >
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs font-semibold text-neutral-300 mb-1.5"
            >
              รหัสผ่าน (อย่างน้อย 6 ตัวอักษร)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="password"
                {...register("password")}
                aria-invalid={!!errors.password}
                aria-describedby={
                  errors.password ? "password-error" : undefined
                }
                type="password"
                minLength={6}
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-amber-400"
                placeholder="••••••••"
              />
            </div>
            {errors.password && (
              <p
                id="password-error"
                role="alert"
                className="mt-1 text-xs text-red-400"
              >
                {errors.password.message}
              </p>
            )}
          </div>

          {state?.error && (
            <p className="text-xs font-semibold text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-semibold text-sm  transition-all flex items-center justify-center gap-2 cursor-pointer  disabled:opacity-60"
          >
            <UserPlus className="w-4 h-4" />
            <span>
              {isPending ? "กำลังสมัครสมาชิก..." : "สมัครสมาชิก (Sign Up)"}
            </span>
          </button>
        </form>

        <div className="text-center pt-2 border-t border-neutral-800 text-xs text-neutral-400">
          <span>มีบัญชีอยู่แล้ว? </span>
          <Link
            href="/login"
            className="text-amber-400 font-semibold hover:underline"
          >
            เข้าสู่ระบบ
          </Link>
        </div>

        <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-[11px] text-neutral-400 flex items-center justify-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>รหัสผ่านถูก hash ด้วย bcrypt ก่อนบันทึกลงฐานข้อมูล</span>
        </div>
      </div>
    </main>
  );
}

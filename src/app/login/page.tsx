"use client";

import { useActionState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Film, LogIn, Lock, Mail, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { loginAction, type AuthFormState } from "@/lib/actions/auth";

const initialState: AuthFormState = { error: "" };

function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const [state, formAction, isPending] = useActionState(
    loginAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="callbackUrl" value={callbackUrl} />

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
            name="email"
            type="email"
            required
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-amber-400"
            placeholder="name@example.com"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-xs font-semibold text-neutral-300 mb-1.5"
        >
          รหัสผ่าน (Password)
        </label>
        <div className="relative">
          <Lock className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="password"
            name="password"
            type="password"
            required
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-amber-400"
            placeholder="••••••••"
          />
        </div>
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
        <LogIn className="w-4 h-4" />
        <span>
          {isPending ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ (Sign In)"}
        </span>
      </button>

      <div className="text-center pt-2 border-t border-neutral-800 text-xs text-neutral-400">
        <span>ยังไม่มีบัญชีสมาชิก? </span>
        <Link
          href="/register"
          className="text-amber-400 font-semibold hover:underline"
        >
          สมัครสมาชิกใหม่
        </Link>
      </div>

      <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-[11px] text-neutral-400 flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>ตรวจสอบสิทธิ์ด้วยเซสชันที่ปลอดภัย</span>
        </span>
        <span className="text-neutral-500">
          สมัครสมาชิกใหม่เพื่อเริ่มต้นใช้งาน
        </span>
      </div>
    </form>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-[75vh] bg-neutral-950 text-neutral-100 flex items-center justify-center py-12 px-4 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md cg-panel p-6 sm:p-8 space-y-6 relative z-10">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-amber-400 mx-auto flex items-center justify-center ">
            <Film className="w-6 h-6 text-neutral-950 font-bold" />
          </div>
          <h1 className="text-2xl font-semibold text-white">
            เข้าสู่ระบบ CinemaGo
          </h1>
          <p className="text-xs text-neutral-400">
            เข้าสู่ระบบเพื่อดำเนินการเลือกที่นั่งและจองตั๋วภาพยนตร์
          </p>
        </div>

        <Suspense
          fallback={
            <div className="text-neutral-400 text-sm text-center">
              กำลังโหลด...
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}

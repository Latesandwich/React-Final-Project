"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Film, LogOut, Ticket } from "lucide-react";
import { logoutAction } from "@/lib/actions/auth";
import { useAuth } from "@/components/AuthProvider";

// Client: usePathname highlights navigation; authentication is checked on the server.
export default function Navbar() {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-50 border-b border-neutral-800 bg-neutral-950/95 backdrop-blur-lg">
      <div className="cg-shell flex min-h-20 flex-wrap items-center justify-between gap-3 py-4">
        <Link
          href="/"
          aria-label="CinemaGo หน้าแรก"
          className="flex items-center gap-3"
        >
          <span className="grid size-10 place-items-center rounded-xl bg-amber-400 text-neutral-950">
            <Film size={21} />
          </span>
          <span>
            <span className="block text-xl font-extrabold tracking-tight">
              Cinema<span className="text-amber-400">Go</span>
            </span>
            <span className="cg-label !text-[8px]">A better movie night</span>
          </span>
        </Link>
        <div className="flex items-center gap-2 sm:gap-4">
          {loading ? (
            <span role="status" className="text-xs text-neutral-500">กำลังตรวจสอบบัญชี…</span>
          ) : user ? (
            <>
              <Link
                href="/my-ticket"
                title={user.email}
                className="flex items-center gap-2 rounded-lg border border-neutral-700 px-3 py-2 text-xs hover:border-amber-400"
              >
                <Ticket size={16} />
                <span className="max-w-24 truncate">{user.name}</span>
              </Link>
              <form action={logoutAction}>
                <button
                  type="submit"
                  aria-label="ออกจากระบบ"
                  title="ออกจากระบบ"
                  className="rounded-lg p-3 text-neutral-400 hover:bg-neutral-800 hover:text-white"
                >
                  <LogOut size={17} />
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-xs font-semibold text-neutral-300 hover:text-amber-400"
              >
                เข้าสู่ระบบ
              </Link>
              <Link
                href="/register"
                className="cg-button !min-h-10 !px-3 !py-2 !text-xs"
              >
                สมัครสมาชิก
              </Link>
            </>
          )}
        </div>
      </div>
      <nav
        aria-label="เมนูหลัก"
        className="cg-shell flex gap-6 border-t border-neutral-800/70 text-xs font-semibold"
      >
        {[
          { href: "/", label: "ภาพยนตร์" },
          { href: "/my-ticket", label: "ตั๋วของฉัน" },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={pathname === item.href ? "page" : undefined}
            className={`border-b-2 py-3 ${pathname === item.href ? "border-amber-400 text-amber-400" : "border-transparent text-neutral-400 hover:text-white"}`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}

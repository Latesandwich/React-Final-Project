import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CinemaGo — ระบบจองตั๋วภาพยนตร์ออนไลน์",
  description:
    "จองตั๋วภาพยนตร์ออนไลน์ เลือกดูรอบฉายและเลือกที่นั่งได้สะดวกรวดเร็ว",
};

import Navbar from "@/components/Navbar";
import { BookingProvider } from "@/components/BookingContext";
import { AuthProvider } from "@/components/AuthProvider";
import { readPublicCatalogue } from "@/lib/data";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Public layout avoids cookies/connection so the homepage can use ISR.
  // AuthProvider reads the current session from the uncached /api/me endpoint.
  const { mode } = await readPublicCatalogue(true);

  return (
    <html
      lang="th"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-neutral-950 text-neutral-100">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-amber-400 focus:p-3 focus:text-neutral-950"
        >
          ข้ามไปเนื้อหา
        </a>
        <AuthProvider>
        <Navbar />
        {mode === "demo" && (
          <p
            role="status"
            className="bg-amber-950 px-4 py-3 text-center text-sm text-amber-200"
          >
            โหมดสาธิต — ฐานข้อมูลไม่พร้อมใช้งาน แสดงข้อมูลตัวอย่างเท่านั้น
            ไม่สามารถบันทึกการจองได้
          </p>
        )}
        <div id="main-content" className="flex-1">
          <BookingProvider>{children}</BookingProvider>
        </div>
        <footer className="border-t border-neutral-800 py-8">
          <div className="cg-shell flex flex-wrap items-start justify-between gap-5">
            <div>
              <Link href="/" className="text-lg font-bold">
                Cinema<span className="text-amber-400">Go</span>
              </Link>
              <p className="mt-2 text-xs leading-6 text-neutral-500">
                เว็บสาธิตระบบจองภาพยนตร์ • ไม่มีการเรียกเก็บเงินจริง
              </p>
            </div>
            <div className="flex gap-6 text-xs text-neutral-400">
              <Link href="/" className="hover:text-amber-400">
                ภาพยนตร์
              </Link>
              <Link href="/my-ticket" className="hover:text-amber-400">
                ตั๋วของฉัน
              </Link>
            </div>
          </div>
        </footer>
        </AuthProvider>
      </body>
    </html>
  );
}

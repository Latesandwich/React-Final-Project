"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Armchair, ArrowRight, Info, X } from "lucide-react";
import { useBooking } from "./BookingContext";
import type { Seat, Showtime, Movie } from "@/types";

// Client: clicks update selection immediately; the server rechecks inventory on confirmation.
export default function SeatSelector({
  showtime,
  movie,
}: {
  showtime: Showtime;
  movie: Movie;
}) {
  const router = useRouter();
  const { setCheckout } = useBooking();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [error, setError] = useState("");
  const selected = showtime.seats.filter((seat) =>
    selectedIds.includes(seat.id),
  );
  const total = selected.reduce((sum, seat) => sum + seat.price, 0);
  const rows = [...new Set(showtime.seats.map((seat) => seat.row))];

  function toggle(seat: Seat) {
    if (seat.isBooked) return;
    setError("");
    if (selectedIds.includes(seat.id))
      setSelectedIds((ids) => ids.filter((id) => id !== seat.id));
    else if (selectedIds.length === 8)
      setError("เลือกได้สูงสุด 8 ที่นั่งต่อรายการ");
    else setSelectedIds((ids) => [...ids, seat.id]);
  }
  function proceed() {
    if (!selected.length) return;
    setCheckout({
      showtimeId: showtime.id,
      movieId: movie.id,
      movieTitle: movie.title,
      movieTitleTh: movie.titleTh,
      moviePoster: movie.poster,
      hallName: showtime.hall.name,
      hallType: showtime.hall.type,
      dateTime: showtime.dateTime,
      audio: showtime.audio,
      seats: selected.map(({ id, row, number, type, price }) => ({
        id,
        row,
        number,
        type,
        price,
      })),
      totalPrice: total,
    });
    router.push("/checkout");
  }
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <section className="cg-panel min-w-0 p-4 sm:p-8" aria-label="ผังที่นั่ง">
        <div className="flex flex-wrap justify-between gap-3 border-b border-neutral-800 pb-5">
          <div>
            <p className="cg-label">SELECT YOUR SEATS</p>
            <h2 className="mt-2 text-lg font-semibold">เลือกมุมโปรดของคุณ</h2>
          </div>
          <span className="h-fit rounded-lg border border-neutral-700 px-3 py-2 text-xs text-amber-300">
            {showtime.hall.type}
          </span>
        </div>
        <div className="mb-9 mt-10 text-center">
          <div className="mx-auto h-8 max-w-md rounded-[50%] border-t-2 border-amber-300/80 bg-gradient-to-b from-amber-400/10 to-transparent" />
          <p className="cg-label !text-[9px]">จอภาพยนตร์ / SCREEN</p>
        </div>
        <p className="mb-4 text-center text-[11px] text-neutral-500">
          แถว A อยู่ใกล้จอ • เลื่อนผังแนวนอนได้บนมือถือ
        </p>
        <div
          className="overflow-x-auto pb-4"
          tabIndex={0}
          aria-label="เลื่อนเพื่อดูที่นั่งทั้งหมด"
        >
          <div className="mx-auto w-max space-y-2.5 px-1">
            {rows.map((row) => (
              <div key={row} className="flex items-center gap-2">
                <span className="w-5 text-xs font-mono text-neutral-500">
                  {row}
                </span>
                <div className="flex gap-1.5">
                  {showtime.seats
                    .filter((seat) => seat.row === row)
                    .sort((a, b) => a.number - b.number)
                    .map((seat) => {
                      const active = selectedIds.includes(seat.id);
                      return (
                        <button
                          key={seat.id}
                          type="button"
                          disabled={seat.isBooked}
                          aria-pressed={active}
                          aria-label={`ที่นั่ง ${seat.id} ${seat.type} ราคา ${seat.price} บาท${seat.isBooked ? " จองแล้ว" : ""}`}
                          title={`${seat.id} · ${seat.type} · ฿${seat.price}`}
                          onClick={() => toggle(seat)}
                          className={`flex h-10 w-9 flex-col items-center justify-center rounded-t-xl rounded-b-md border text-[9px] transition-colors ${seat.number === 7 ? "ml-4" : ""} ${seat.isBooked ? "cursor-not-allowed border-neutral-800 bg-neutral-900 text-neutral-700" : active ? "border-amber-300 bg-amber-400 text-neutral-950" : seat.type === "vip" ? "border-amber-700/70 bg-amber-950/20 text-amber-300 hover:bg-amber-400/20" : seat.type === "premium" ? "border-sky-800 bg-sky-950/20 text-sky-300 hover:bg-sky-900/40" : "border-neutral-600 bg-neutral-800 text-neutral-200 hover:border-amber-400"}`}
                        >
                          <Armchair size={15} />
                          <span>{seat.number}</span>
                        </button>
                      );
                    })}
                </div>
                <span className="w-4 text-right text-xs font-mono text-neutral-500">
                  {row}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-3 border-t border-neutral-800 pt-5 text-[10px] text-neutral-400">
          {[
            ["bg-neutral-700", "Standard ฿240"],
            ["bg-sky-700", "Premium ฿300"],
            ["bg-amber-800", "VIP ฿450"],
            ["bg-amber-400", "เลือกแล้ว"],
            ["bg-neutral-900 border border-neutral-700", "จองแล้ว"],
          ].map(([color, label]) => (
            <span key={label} className="flex items-center gap-2">
              <i className={`size-3 rounded-sm ${color}`} />
              {label}
            </span>
          ))}
        </div>
      </section>
      <aside className="cg-panel p-6 lg:sticky lg:top-40">
        <p className="cg-label">YOUR MOVIE NIGHT</p>
        <h2 className="mt-3 text-xl font-semibold">{movie.title}</h2>
        <p className="mt-1 text-xs text-neutral-400">{movie.titleTh}</p>
        <dl className="my-5 space-y-3 text-xs">
          {[
            ["รอบฉาย", showtime.dateTime],
            ["โรงภาพยนตร์", showtime.hall.name],
            ["ภาษา", showtime.audio],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between gap-3">
              <dt className="text-neutral-500">{label}</dt>
              <dd className="text-right">{value}</dd>
            </div>
          ))}
        </dl>
        <div className="cg-rule" />
        <div className="my-5">
          <p className="mb-3 text-xs text-neutral-400">
            ที่นั่งที่เลือก ({selected.length}/8)
          </p>
          {selected.length ? (
            <div className="flex flex-wrap gap-2">
              {selected.map((seat) => (
                <button
                  key={seat.id}
                  type="button"
                  onClick={() => toggle(seat)}
                  aria-label={`ยกเลิกที่นั่ง ${seat.id}`}
                  className="flex items-center gap-2 rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs text-amber-300"
                >
                  {seat.id}
                  <X size={12} />
                </button>
              ))}
            </div>
          ) : (
            <p className="rounded-lg border border-dashed border-neutral-700 p-4 text-xs leading-6 text-neutral-500">
              แตะที่นั่งบนผังเพื่อเริ่มเลือก
              <br />
              เลือกได้สูงสุด 8 ที่นั่ง
            </p>
          )}
        </div>
        {error && (
          <p role="alert" className="mb-4 text-xs text-red-400">
            {error}
          </p>
        )}
        <div aria-live="polite" className="mb-5 flex items-end justify-between">
          <span className="text-xs text-neutral-400">ยอดรวม</span>
          <strong className="text-3xl font-semibold text-amber-400">
            ฿{total.toLocaleString()}
          </strong>
        </div>
        <button
          type="button"
          onClick={proceed}
          disabled={!selected.length}
          className="cg-button w-full"
        >
          ดำเนินการต่อ <ArrowRight size={16} />
        </button>
        <p className="mt-4 flex gap-2 text-[10px] leading-5 text-neutral-500">
          <Info size={14} className="mt-0.5 shrink-0" />
          ที่นั่งจะถูกตรวจสอบและบันทึกเมื่อยืนยันการจอง
          ยังไม่ถูกล็อกในขั้นตอนนี้
        </p>
      </aside>
    </div>
  );
}

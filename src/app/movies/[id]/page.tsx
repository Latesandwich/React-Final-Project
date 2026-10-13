import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Clock, Ticket } from "lucide-react";
import { getMovieById, getShowtimesByMovieId } from "@/lib/data";

// Server: route params choose the database record; unknown movies return 404.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const movie = await getMovieById((await params).id);
  return {
    title: movie ? `${movie.title} — CinemaGo` : "ไม่พบภาพยนตร์ — CinemaGo",
  };
}
export default async function MovieDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const movie = await getMovieById(id);
  if (!movie) notFound();
  const showtimes = await getShowtimesByMovieId(id);
  return (
    <main className="pb-20">
      <section className="relative isolate overflow-hidden border-b border-neutral-800">
        <Image
          src={movie.backdrop || movie.poster}
          alt=""
          fill
          unoptimized
          priority
          className="object-cover opacity-25"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/60 to-transparent" />
        <div className="cg-shell relative py-8 sm:py-12">
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-2 text-xs text-neutral-300 hover:text-amber-400"
          >
            <ArrowLeft size={15} />
            ภาพยนตร์ทั้งหมด
          </Link>
          <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-end sm:gap-9">
            <Image
              src={movie.poster}
              alt={movie.title}
              width={240}
              height={340}
              unoptimized
              className="aspect-[2/3] w-32 rounded-xl border border-neutral-700 object-cover shadow-2xl sm:w-48"
            />
            <div className="max-w-2xl pb-2">
              <p className="cg-label !text-amber-300">
                {movie.genre.join(" / ")}
              </p>
              <h1 className="mt-4 text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">
                {movie.title}
              </h1>
              <p className="mt-3 text-sm text-neutral-400">{movie.titleTh}</p>
              <div className="mt-6 flex items-center gap-4 text-xs text-neutral-300">
                <span className="rounded-md border border-neutral-600 px-2 py-1">
                  {movie.rating}
                </span>
                <span className="flex items-center gap-2">
                  <Clock size={14} />
                  {movie.duration} นาที
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
      <div className="cg-shell grid items-start gap-8 pt-10 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section className="cg-panel p-6 sm:p-8">
          <p className="cg-label">THE STORY</p>
          <h2 className="mb-5 mt-2 text-xl font-semibold">เรื่องย่อ</h2>
          <p className="text-sm leading-8 text-neutral-400">{movie.synopsis}</p>
          <div className="cg-rule my-6" />
          <p className="text-xs text-neutral-500">
            วันที่เข้าฉายตามข้อมูลตัวอย่าง: {movie.releaseDate}
          </p>
        </section>
        <section className="cg-panel p-6">
          <p className="cg-label">FIND YOUR SHOWTIME</p>
          <h2 className="mb-5 mt-2 text-xl font-semibold">เลือกรอบฉาย</h2>
          <div className="space-y-3">
            {showtimes.map((showtime) => (
              <Link
                key={showtime.id}
                href={`/booking/${showtime.id}`}
                className="block rounded-xl border border-neutral-700 p-4 transition-colors hover:border-amber-400 hover:bg-amber-400/5"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-amber-300">
                    {showtime.dateTime}
                  </span>
                  <ArrowRight size={16} />
                </div>
                <p className="mt-2 text-xs text-neutral-400">
                  {showtime.hall.name} · {showtime.hall.type}
                </p>
                <div className="mt-3 flex justify-between text-[10px] text-neutral-500">
                  <span>{showtime.audio}</span>
                  <span>
                    {showtime.seats.filter((seat) => !seat.isBooked).length}{" "}
                    ที่นั่งว่าง
                  </span>
                </div>
              </Link>
            ))}
          </div>
          {!showtimes.length && (
            <p className="text-sm text-neutral-400">
              ยังไม่มีรอบฉายสำหรับเรื่องนี้
            </p>
          )}
          <p className="mt-5 flex gap-2 text-[11px] leading-6 text-neutral-500">
            <Ticket size={14} className="mt-1 shrink-0" />
            เข้าสู่ระบบเพื่อเลือกที่นั่งและเก็บการจองไว้ในบัญชี
          </p>
        </section>
      </div>
    </main>
  );
}

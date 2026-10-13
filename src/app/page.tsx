import Image from "next/image";
import Link from "next/link";
import { readPublicCatalogue } from "@/lib/data";
import { ArrowRight, Clock, Ticket } from "lucide-react";

// CHECK 01 — Server Component + ISR: refresh the public movie listing hourly.
// Adapted from origin/main e9c82b6; seat selection still uses request-time SSR.
export const revalidate = 3600;

export default async function HomePage() {
  const { movies, showtimes } = await readPublicCatalogue(true);
  const featured = movies[0];
  return (
    <main className="pb-20">
      <div className="cg-shell pt-6 sm:pt-10">
        {featured && (
          <section className="relative isolate min-h-[450px] overflow-hidden rounded-3xl border border-neutral-800 bg-neutral-900 sm:min-h-[510px]">
            <Image
              src={featured.backdrop || featured.poster}
              alt=""
              fill
              unoptimized
              priority
              sizes="100vw"
              className="object-cover opacity-45"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/80 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 to-transparent" />
            <div className="relative flex min-h-[450px] flex-col justify-center px-6 py-10 sm:min-h-[510px] sm:px-14">
              <p className="cg-label !text-amber-300">
                THE BIG SCREEN IS CALLING
              </p>
              <h1 className="mt-5 max-w-xl text-4xl font-semibold leading-[1.25] tracking-tight sm:text-6xl">
                ค่ำคืนที่ดี
                <br />
                เริ่มที่<span className="text-amber-400">หนังดี ๆ</span>
              </h1>
              <p className="mt-5 max-w-md text-sm leading-7 text-neutral-300">
                เลือกรอบที่ใช่ ที่นั่งที่ชอบ แล้วให้เรื่องราวบนจอพาคุณออกเดินทาง
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="#now-showing" className="cg-button">
                  เลือกรอบฉาย <ArrowRight size={17} />
                </Link>
                <Link
                  href={`/movies/${featured.id}`}
                  className="cg-button cg-button-secondary"
                >
                  พบกับ {featured.title}
                </Link>
              </div>
              <div className="mt-10 flex flex-wrap items-center gap-4 text-[11px] text-neutral-400">
                <span className="rounded border border-neutral-700 px-2 py-1 text-neutral-200">
                  {featured.rating}
                </span>
                <span>{featured.genre.join(" / ")}</span>
                <span className="flex items-center gap-1.5">
                  <Clock size={13} />
                  {featured.duration} นาที
                </span>
              </div>
            </div>
            <span className="absolute bottom-8 right-8 hidden text-xs tracking-[.25em] text-neutral-400 lg:block">
              CINEMAGO / FEATURED 01
            </span>
          </section>
        )}
        <section id="now-showing" className="scroll-mt-40 pt-12">
          <div className="mb-7 flex items-end justify-between gap-4">
            <div>
              <p className="cg-label">NOW SHOWING</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                วันนี้ดูเรื่องไหนดี
              </h2>
            </div>
            <span className="whitespace-nowrap text-xs text-neutral-400">
              {movies.length} เรื่อง • {showtimes.length} รอบฉาย
            </span>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {movies.map((movie, index) => (
              <article
                key={movie.id}
                className="cg-panel group overflow-hidden"
              >
                <Link
                  href={`/movies/${movie.id}`}
                  className="relative block aspect-[16/11] overflow-hidden"
                >
                  <Image
                    src={movie.poster}
                    alt={movie.title}
                    width={800}
                    height={550}
                    unoptimized
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/90 via-transparent to-transparent" />
                  <span className="absolute left-5 top-5 rounded-md bg-neutral-950/80 px-2 py-1 text-[10px] font-bold text-amber-300">
                    {movie.rating}
                  </span>
                  <span className="absolute bottom-4 left-5 text-4xl font-light text-white/60">
                    0{index + 1}
                  </span>
                  <span className="absolute bottom-5 right-5 flex items-center gap-2 text-xs font-semibold text-white">
                    รายละเอียด <ArrowRight size={15} />
                  </span>
                </Link>
                <div className="p-6">
                  <p className="cg-label !text-[9px]">
                    {movie.genre.join(" · ")}
                  </p>
                  <h3 className="mt-3 text-xl font-semibold">
                    <Link
                      href={`/movies/${movie.id}`}
                      className="hover:text-amber-400"
                    >
                      {movie.title}
                    </Link>
                  </h3>
                  <p className="mt-1 text-xs text-neutral-400">
                    {movie.titleTh}
                  </p>
                  <p className="mt-4 line-clamp-2 text-xs leading-6 text-neutral-400">
                    {movie.synopsis}
                  </p>
                  <div className="cg-rule my-5" />
                  <div className="mb-3 flex justify-between text-[11px] text-neutral-400">
                    <span className="flex items-center gap-1">
                      <Clock size={13} /> {movie.duration} นาที
                    </span>
                    <span>เลือกรอบฉาย</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {showtimes
                      .filter((showtime) => showtime.movieId === movie.id)
                      .map((showtime) => (
                        <Link
                          key={showtime.id}
                          href={`/booking/${showtime.id}`}
                          className="rounded-lg border border-neutral-700 px-3 py-2.5 text-xs font-semibold hover:border-amber-400 hover:bg-amber-400/10 hover:text-amber-300"
                        >
                          <span className="flex items-center gap-1.5">
                            <Ticket size={13} />
                            {showtime.dateTime.split(", ")[1] ||
                              showtime.dateTime}
                          </span>
                          <span className="mt-1 block text-[9px] font-normal text-neutral-400">
                            {showtime.hall.type} · {showtime.audio}
                          </span>
                        </Link>
                      ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
        <section className="mt-12 grid gap-6 border-y border-neutral-800 py-7 sm:grid-cols-3">
          {[
            ["01", "เลือกเรื่องที่อยากดู", "ดูรายละเอียดและรอบฉายที่สะดวก"],
            ["02", "เลือกมุมโปรดของคุณ", "เลือกที่นั่งพร้อมดูราคารวม"],
            [
              "03",
              "เก็บการจองไว้ในบัญชี",
              "กลับมาดูรายละเอียดได้ที่ตั๋วของฉัน",
            ],
          ].map(([number, title, description]) => (
            <div key={number} className="flex gap-4">
              <span className="text-sm font-mono text-amber-400">{number}</span>
              <div>
                <h3 className="text-sm font-semibold">{title}</h3>
                <p className="mt-2 text-xs leading-5 text-neutral-400">
                  {description}
                </p>
              </div>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}

import { notFound, redirect } from "next/navigation";
import { getMovieById, getShowtimeById } from "@/lib/data";
import { getCurrentUser } from "@/lib/auth";
import SeatSelector from "@/components/SeatSelector";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

interface BookingPageProps {
  params: Promise<{
    showtimeId: string;
  }>;
}

export default async function BookingPage({ params }: BookingPageProps) {
  const { showtimeId } = await params;
  if (!(await getCurrentUser()))
    redirect(
      "/login?callbackUrl=" + encodeURIComponent("/booking/" + showtimeId),
    );
  const showtime = await getShowtimeById(showtimeId);
  const movie = showtime ? await getMovieById(showtime.movieId) : undefined;

  if (!showtime || !movie) {
    notFound();
  }

  return (
    <main className="cg-shell py-8 sm:py-12">
      <div className="space-y-6">
        {/* Breadcrumb / Back button */}
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-400 hover:text-amber-400 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>กลับหน้ารายชื่อภาพยนตร์</span>
          </Link>
        </div>

        <div>
          <p className="cg-label">YOUR SEAT, YOUR STORY</p>
          <h1 className="mt-3 text-2xl font-semibold sm:text-3xl">
            {movie.title}
          </h1>
          <p className="mt-2 text-xs text-neutral-400">
            {showtime.dateTime} · {showtime.hall.name} · {showtime.audio}
          </p>
        </div>
        <ol aria-label="ขั้นตอนการจอง" className="flex flex-wrap gap-5 pb-2">
          <li className="cg-step" aria-current="step">
            <b>1</b>เลือกที่นั่ง
          </li>
          <li className="cg-step">
            <b>2</b>ตรวจสอบข้อมูล
          </li>
          <li className="cg-step">
            <b>3</b>ยืนยันการจอง
          </li>
        </ol>
        <SeatSelector showtime={showtime} movie={movie} />
      </div>
    </main>
  );
}

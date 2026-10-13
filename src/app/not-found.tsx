import Link from "next/link";
import { ArrowLeft } from "lucide-react";

// Server: shared empty result for missing movies and inaccessible booking IDs.
export default function NotFound() {
  return (
    <main className="cg-shell grid min-h-[65vh] place-items-center py-12 text-center">
      <div>
        <p className="cg-label !text-amber-300">404 / SCENE NOT FOUND</p>
        <h1 className="mt-5 text-3xl font-semibold">ไม่พบหน้าที่คุณต้องการ</h1>
        <p className="my-5 text-sm leading-7 text-neutral-400">
          ข้อมูลอาจไม่มีอยู่ หรือคุณไม่มีสิทธิ์เข้าถึงการจองนี้
        </p>
        <Link href="/" className="cg-button">
          <ArrowLeft size={15} />
          กลับไปเลือกภาพยนตร์
        </Link>
      </div>
    </main>
  );
}

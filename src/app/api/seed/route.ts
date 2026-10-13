import { NextResponse } from "next/server";
export async function GET() {
  return NextResponse.json(
    { error: "Public seeding is disabled. Run npm run db:init locally." },
    { status: 410 },
  );
}

import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  const user = await getCurrentUser();
  // ส่งเฉพาะ name/email ห้ามส่งทั้ง object เพราะมี password hash อยู่ด้วย
  return NextResponse.json({
    user: user ? { name: user.name, email: user.email } : null,
  }, { headers: { 'Cache-Control': 'private, no-store' } });
}

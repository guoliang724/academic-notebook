import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth';

// GET /api/auth/me — { admin: boolean }
export async function GET() {
  return NextResponse.json({ admin: await isAdmin() });
}

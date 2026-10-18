import { NextResponse } from 'next/server';
import { checkCredentials, createSessionToken, isAuthConfigured, SESSION_COOKIE, sessionCookieOptions } from '@/lib/auth';

// POST /api/auth/login — { username, password }
export async function POST(request: Request) {
  if (!isAuthConfigured()) {
    return NextResponse.json({ error: '服务器未配置 ADMIN_USERNAME / ADMIN_PASSWORD 环境变量' }, { status: 500 });
  }
  const body = await request.json().catch(() => ({}));
  const username = typeof body.username === 'string' ? body.username : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (!checkCredentials(username, password)) {
    // Small fixed delay to slow down password guessing
    await new Promise(r => setTimeout(r, 800));
    return NextResponse.json({ error: '用户名或密码错误' }, { status: 401 });
  }

  const res = NextResponse.json({ success: true });
  res.cookies.set(SESSION_COOKIE, createSessionToken(username), sessionCookieOptions);
  return res;
}

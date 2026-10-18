import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

/**
 * Single-admin auth. Credentials come from environment variables (set them in Vercel):
 *   ADMIN_USERNAME, ADMIN_PASSWORD, and optionally AUTH_SECRET (signs the session cookie;
 *   falls back to ADMIN_PASSWORD, so changing the password logs every session out).
 */
export const SESSION_COOKIE = 'admin_session';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function secret(): string | null {
  return process.env.AUTH_SECRET || process.env.ADMIN_PASSWORD || null;
}

function sign(payload: string, key: string): string {
  return createHmac('sha256', key).update(payload).digest('base64url');
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a), bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export function isAuthConfigured(): boolean {
  return Boolean(process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD);
}

export function checkCredentials(username: string, password: string): boolean {
  const u = process.env.ADMIN_USERNAME, p = process.env.ADMIN_PASSWORD;
  if (!u || !p) return false;
  // Evaluate both comparisons so timing doesn't reveal which one failed
  const okUser = safeEqual(username, u);
  const okPass = safeEqual(password, p);
  return okUser && okPass;
}

/** Token format: `<username>.<expiresAt>.<signature>` */
export function createSessionToken(username: string): string {
  const key = secret();
  if (!key) throw new Error('ADMIN_PASSWORD 未配置');
  const payload = `${Buffer.from(username).toString('base64url')}.${Date.now() + SESSION_TTL_MS}`;
  return `${payload}.${sign(payload, key)}`;
}

function verifySessionToken(token: string | undefined): boolean {
  const key = secret();
  if (!token || !key) return false;
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  const [user, expires, signature] = parts;
  if (!safeEqual(signature, sign(`${user}.${expires}`, key))) return false;
  if (!(Number(expires) > Date.now())) return false;
  return Buffer.from(user, 'base64url').toString() === process.env.ADMIN_USERNAME;
}

export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value);
}

/** Use at the top of every mutating route handler: `const denied = await requireAdmin(); if (denied) return denied;` */
export async function requireAdmin(): Promise<NextResponse | null> {
  if (await isAdmin()) return null;
  return NextResponse.json({ error: '需要管理员登录' }, { status: 401 });
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: SESSION_TTL_MS / 1000,
};

import type { User } from "@prisma/client";
import jwt from "jsonwebtoken";
import type { Cookies } from "@sveltejs/kit";
import { JWT_SECRET } from "$env/static/private";
import crypto from "node:crypto";
import { CSRF_COOKIE_NAME } from "$lib/constants/security";
const COOKIE_NAME = "session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

interface Session {
  userId: number;
  exp: number;
}

export async function createSession(user: User): Promise<string> {
  const token = jwt.sign(
    { userId: user.id, exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE },
    JWT_SECRET,
  );
  return token;
}

export async function getSession(cookies: Cookies): Promise<Session | null> {
  const token = cookies.get(COOKIE_NAME);
  if (!token) return null;

  try {
    const session = jwt.verify(token, JWT_SECRET) as Session;
    return session;
  } catch {
    return null;
  }
}

export function createSessionCookie(token: string, secure: boolean = true): string {
  const secureFlag = secure ? " Secure;" : "";
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Strict;${secureFlag} Max-Age=${SESSION_MAX_AGE}`;
}

export function clearSessionCookie(): string {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`;
}

export function createCsrfToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function createCsrfCookie(token: string, secure: boolean = true): string {
  const secureFlag = secure ? " Secure;" : "";
  return `${CSRF_COOKIE_NAME}=${token}; Path=/; SameSite=Strict;${secureFlag} Max-Age=${SESSION_MAX_AGE}`;
}

export function clearCsrfCookie(): string {
  return `${CSRF_COOKIE_NAME}=; Path=/; SameSite=Strict; Max-Age=0`;
}

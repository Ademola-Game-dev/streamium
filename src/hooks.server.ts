import type { Handle } from "@sveltejs/kit";
import { getSession, createCsrfToken } from "$lib/server/auth";
import { prisma } from "$lib/server/prisma";
import { isDatabaseConnectionError } from "$lib/server/services/db-error";
import { dev } from "$app/environment";
import crypto from "node:crypto";
import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from "$lib/constants/security";

const ADMIN_RATE_LIMIT = 100;
const ADMIN_RATE_WINDOW = 5 * 60 * 1000;
const adminRateLimits = new Map<string, { count: number; firstAttempt: number }>();
const CSRF_MAX_AGE = 60 * 60 * 24 * 7;

function checkAdminRateLimit(ip: string): boolean {
  const now = Date.now();
  const limit = adminRateLimits.get(ip);

  if (!limit) {
    adminRateLimits.set(ip, { count: 1, firstAttempt: now });
    return true;
  }

  if (now - limit.firstAttempt >= ADMIN_RATE_WINDOW) {
    adminRateLimits.set(ip, { count: 1, firstAttempt: now });
    return true;
  }

  if (limit.count >= ADMIN_RATE_LIMIT) {
    return false;
  }

  limit.count++;
  adminRateLimits.set(ip, limit);
  return true;
}

setInterval(() => {
  const now = Date.now();
  for (const [key, limit] of adminRateLimits.entries()) {
    if (now - limit.firstAttempt >= ADMIN_RATE_WINDOW) {
      adminRateLimits.delete(key);
    }
  }
}, ADMIN_RATE_WINDOW);

function setSecurityHeaders(response: Response, nonce: string): void {
  const isDev = dev;

  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; " +
    (isDev
      ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
      : `script-src 'self' 'nonce-${nonce}'; `) +
    (isDev
      ? "style-src 'self' 'unsafe-inline'; "
      : `style-src 'self' 'nonce-${nonce}'; `) +
    "img-src 'self' data: https:; " +
    "font-src 'self' data:; " +
    "frame-src 'self' " +
    "https://vidsrc.cc/ https://*.vidsrc.cc/ " +
    "https://vidplay.site/ https://*.vidplay.site/ " +
    "https://vidplay.online/ https://*.vidplay.online/ " +
    "https://vidlink.pro/ https://*.vidlink.pro/ " +
    "https://111movies.com/ https://*.111movies.com/ " +
    "https://2embed.cc/ https://*.2embed.cc/;"
  );
}

export const handle: Handle = async ({ event, resolve }) => {
  const nonce = crypto.randomBytes(16).toString("base64");
  const isAdminRoute = event.url.pathname.startsWith('/admin');
  const method = event.request.method.toUpperCase();
  const hasSessionCookie = Boolean(event.cookies.get("session"));

  if (!["GET", "HEAD", "OPTIONS"].includes(method) && hasSessionCookie) {
    const origin = event.request.headers.get("origin");
    if (origin && origin !== event.url.origin) {
      const response = new Response("Cross-origin requests not allowed", { status: 403 });
      setSecurityHeaders(response, nonce);
      return response;
    }

    const csrfHeader = event.request.headers.get(CSRF_HEADER_NAME);
    const csrfCookie = event.cookies.get(CSRF_COOKIE_NAME);
    if (!csrfHeader || !csrfCookie || csrfHeader !== csrfCookie) {
      const response = new Response("Invalid CSRF token", { status: 403 });
      setSecurityHeaders(response, nonce);
      return response;
    }
  }

  // Authenticate user BEFORE resolving the request
  try {
    const session = await getSession(event.cookies);

    if (session?.userId) {
      const user = await prisma.user.findUnique({
        where: {
          id: session.userId,
        },
        select: {
          id: true,
          username: true,
          email: true,
          isAdmin: true,
        },
      });

      if (user) {
        event.locals.user = {
          id: user.id,
          username: user.username,
          email: user.email || '',
          isAdmin: user.isAdmin,
        };

        if (isAdminRoute) {
          if (!user.isAdmin) {
            const response = new Response('Unauthorized', { status: 403 });
            setSecurityHeaders(response, nonce);
            return response;
          }

          const clientIp = event.getClientAddress();
          if (!checkAdminRateLimit(clientIp)) {
            const response = new Response('Too Many Requests', { status: 429 });
            setSecurityHeaders(response, nonce);
            return response;
          }
        }
        if (!event.cookies.get(CSRF_COOKIE_NAME)) {
          const csrfToken = createCsrfToken();
          event.cookies.set(CSRF_COOKIE_NAME, csrfToken, {
            path: "/",
            sameSite: "strict",
            secure: !dev,
            httpOnly: false,
            maxAge: CSRF_MAX_AGE,
          });
        }
      } else {
        event.cookies.delete("session", { path: "/" });

        if (isAdminRoute) {
          const response = new Response('Unauthorized', { status: 403 });
          setSecurityHeaders(response, nonce);
          return response;
        }
      }
    } else if (isAdminRoute) {
      const response = new Response('Unauthorized', { status: 403 });
      setSecurityHeaders(response, nonce);
      return response;
    }
  } catch (error) {
    // Handle database connection errors gracefully
    if (isDatabaseConnectionError(error)) {
      console.error("Database unavailable during session validation");
      // Don't delete session cookie - DB might come back
      // For admin routes, return 503; for others, continue without auth
      if (isAdminRoute) {
        const response = new Response('Service temporarily unavailable', { status: 503 });
        setSecurityHeaders(response, nonce);
        return response;
      }
      // Continue without user context for non-admin routes
    } else {
      event.cookies.delete("session", { path: "/" });
      console.error("Session validation error:", error);

      if (isAdminRoute) {
        const response = new Response('Unauthorized', { status: 403 });
        setSecurityHeaders(response, nonce);
        return response;
      }
    }
  }

  // Only resolve AFTER auth checks pass
  const response = await resolve(event, {
    transformPageChunk: ({ html }) =>
      html
        .replace(/<script(?![^>]*nonce=)/g, `<script nonce=\"${nonce}\"`)
        .replace(/<style(?![^>]*nonce=)/g, `<style nonce=\"${nonce}\"`),
  });
  setSecurityHeaders(response, nonce);

  return response;
};

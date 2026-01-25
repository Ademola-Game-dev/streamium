import type { RequestEvent } from "@sveltejs/kit";
import { error } from "@sveltejs/kit";
import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from "$lib/constants/security";

export async function requireAdmin(event: RequestEvent) {
  const user = event.locals.user;

  if (!user) {
    throw error(401, "Authentication required");
  }

  if (!user.isAdmin) {
    throw error(403, "Admin access required");
  }


  const origin = event.request.headers.get('origin');
  if (origin && origin !== event.url.origin) {
    throw error(403, "Cross-origin requests not allowed");
  }


  if (event.request.method !== 'GET') {
    const csrfToken = event.request.headers.get(CSRF_HEADER_NAME);
    const csrfCookie = event.cookies.get(CSRF_COOKIE_NAME);

    if (!csrfToken || !csrfCookie || csrfToken !== csrfCookie) {
      throw error(403, "Invalid CSRF token");
    }
  }


  if (['POST', 'PUT', 'PATCH'].includes(event.request.method)) {
    const contentType = event.request.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      throw error(415, "Content type must be application/json");
    }
  }
}

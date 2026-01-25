import { json } from "@sveltejs/kit";
import type { RequestEvent } from "@sveltejs/kit";
import { authService } from "$lib/server/services/auth";
import { createSessionCookie, createCsrfCookie, createCsrfToken } from "$lib/server/auth";
import { RateLimitService } from "$lib/server/services/rate-limit";
import { handleDatabaseError } from "$lib/server/services/db-error";
import { dev } from "$app/environment";

export async function POST({ request, getClientAddress }: RequestEvent) {
  const clientIp = getClientAddress();

  const rateLimit = RateLimitService.checkLoginLimit(clientIp);
  if (!rateLimit.allowed) {
    return json(
      { error: `Too many login attempts. Please try again in ${Math.ceil(rateLimit.timeLeft! / 60)} minutes.` },
      { status: 429 }
    );
  }

  try {
    const { usernameOrEmail, identifier, password } = await request.json();
    const loginIdentifier = usernameOrEmail ?? identifier;

    if (!loginIdentifier || !password) {
      return json({ error: "Username/Email and password are required" }, { status: 400 });
    }

    const user = await authService.validateUser(loginIdentifier, password);
    if (!user) {
      return json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = await authService.generateToken(user);
    const isProduction = !dev;
    const csrfToken = createCsrfToken();
    const headers = new Headers();
    headers.append("Set-Cookie", createSessionCookie(token, isProduction));
    headers.append("Set-Cookie", createCsrfCookie(csrfToken, isProduction));

    return json(user, {
      headers,
    });
  } catch (error) {
    return handleDatabaseError(error, "login");
  }
}

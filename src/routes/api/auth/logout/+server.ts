import { json } from "@sveltejs/kit";
import type { RequestEvent } from "@sveltejs/kit";
import { clearSessionCookie, clearCsrfCookie } from "$lib/server/auth";

export async function POST(_event: RequestEvent) {
  try {
    const headers = new Headers();
    headers.append("Set-Cookie", clearSessionCookie());
    headers.append("Set-Cookie", clearCsrfCookie());

    return json(
      { success: true },
      {
        headers,
      },
    );
  } catch (error) {
    console.error("Logout error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}

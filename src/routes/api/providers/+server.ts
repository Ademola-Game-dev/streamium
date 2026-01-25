import { json } from "@sveltejs/kit";
import { env } from "$env/dynamic/private";

// Validate that URLs are HTTPS and from expected patterns
function validateProviderUrl(url: string | undefined): string | null {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    // Only allow HTTPS URLs
    if (parsed.protocol !== 'https:') {
      return null;
    }
    return url;
  } catch {
    return null;
  }
}

export async function GET() {
  return json({
    vidsrc: validateProviderUrl(env.VIDSRC_BASE_URL),
    vidlink: validateProviderUrl(env.VIDLINK_BASE_URL),
    movies111: validateProviderUrl(env.MOVIES111_BASE_URL),
    embed2: validateProviderUrl(env.EMBED2_BASE_URL),
  });
}

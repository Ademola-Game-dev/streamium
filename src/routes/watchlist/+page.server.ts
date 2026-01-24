import { error } from "@sveltejs/kit";
import type { ServerLoad } from "@sveltejs/kit";
import { watchlistService } from "$lib/server/services/watchlist";
import { TMDBService } from "$lib/services/tmdb";

export const load: ServerLoad = async ({ locals }) => {
  if (!locals.user) {
    throw error(401, "Unauthorized");
  }

  const tmdbService = new TMDBService();

  try {
    const watchlist = await watchlistService.getWatchlist(locals.user.id);


    const mediaDetails = await Promise.all(
      watchlist.map(async (item) => {
        try {
          if (item.mediaType === "movie") {
            const movie = await tmdbService.getMovieDetails(item.mediaId);
            return {
              ...movie,
              mediaType: "movie" as const,
              addedAt: item.addedAt,
            };
          } else {
            const show = await tmdbService.getTVShowDetails(item.mediaId);
            return {
              ...show,
              mediaType: "tv" as const,
              addedAt: item.addedAt,
            };
          }
        } catch (error) {
          console.error(
            `Failed to fetch details for ${item.mediaType} ${item.mediaId}:`,
            error,
          );
          return null;
        }
      }),
    );


    const validMediaDetails = mediaDetails
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort(
        (a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime(),
      );

    return {
      watchlistItems: validMediaDetails,
    };
  } catch (e) {
    console.error("Failed to load watchlist:", e);
    throw error(500, "Failed to load watchlist");
  }
};

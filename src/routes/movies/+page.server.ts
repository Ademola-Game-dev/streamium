import type { ServerLoad } from "@sveltejs/kit";
import { TMDBService } from "$lib/services/tmdb";
import type { FilterOptions } from "$lib/types/filters";
import { parseQueryString } from "$lib/types/filters";

const tmdbService = new TMDBService();

export const load: ServerLoad = async ({ url }) => {
  try {

    const filters = parseQueryString(url.search);


    const genres = await tmdbService.getMovieGenres();


    const {
      results: movies,
      total_pages: totalPages,
      total_results: totalResults,
    } = await fetchFilteredMovies(filters);

    return {
      movies,
      genres,
      totalPages: Math.min(totalPages, 500),
      totalResults,
    };
  } catch (error) {
    console.error("Failed to load movies:", error);
    return {
      movies: [],
      genres: [],
      totalPages: 0,
      totalResults: 0,
      error: "Failed to load movies",
    };
  }
};

async function fetchFilteredMovies(filters: FilterOptions) {
  const {
    query,
    genres,
    year,
    rating,
    sortBy = "popularity",
    sortOrder = "desc",
    page = 1,
  } = filters;


  if (query) {
    return tmdbService.searchMovies(query, page);
  }


  const params: Record<string, string | number> = {
    page,
    sort_by: `${sortBy}.${sortOrder}`,
    "vote_count.gte": 100,
  };


  if (genres && genres.length > 0) {
    params.with_genres = genres.join(",");
  }


  if (year) {
    params.primary_release_year = year;
  }


  if (rating) {
    params["vote_average.gte"] = rating;
  }


  params.with_original_language = "en";


  return tmdbService.discoverMovies(params);
}

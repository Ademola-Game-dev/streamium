import type { ServerLoad } from "@sveltejs/kit";
import { TMDBService } from "$lib/services/tmdb";
import type { FilterOptions } from "$lib/types/filters";
import { parseQueryString } from "$lib/types/filters";

const tmdbService = new TMDBService();

export const load: ServerLoad = async ({ url }) => {
  try {

    const filters = parseQueryString(url.search);


    const genres = await tmdbService.getTVGenres();


    const {
      results: shows,
      total_pages: totalPages,
      total_results: totalResults,
    } = await fetchFilteredShows(filters);

    return {
      shows,
      genres,
      totalPages: Math.min(totalPages, 500),
      totalResults,
    };
  } catch (error) {
    console.error("Failed to load TV shows:", error);
    return {
      shows: [],
      genres: [],
      totalPages: 0,
      totalResults: 0,
      error: "Failed to load TV shows",
    };
  }
};

async function fetchFilteredShows(filters: FilterOptions) {
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
    return tmdbService.searchTVShows(query, page);
  }


  const params: Record<string, string | number | boolean> = {
    page,
    sort_by: `${sortBy}.${sortOrder}`,
    "vote_count.gte": 100,
  };


  if (genres && genres.length > 0) {
    params.with_genres = genres.join(",");
  }


  if (year) {
    params.first_air_date_year = year;
  }


  if (rating) {
    params["vote_average.gte"] = rating;
  }


  params.with_original_language = "en";


  params.include_null_first_air_dates = false;
  params.screened_theatrically = true;
  params["with_status"] = "0,2,3";


  return tmdbService.discoverTVShows(params);
}

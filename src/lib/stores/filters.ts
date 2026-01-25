import { writable, derived, get } from "svelte/store";
import type {
  FilterState,
  FilterOptions,
  Genre,
  SortBy,
  SortOrder,
  WatchStatus,
} from "$lib/types/filters";
import { defaultFilterState, createQueryString } from "$lib/types/filters";
import { goto } from "$app/navigation";
import { page } from "$app/stores";
import type { Page } from "@sveltejs/kit";

const sortByValues: SortBy[] = ["popularity", "rating", "release_date", "title"];
const sortOrderValues: SortOrder[] = ["asc", "desc"];
const watchStatusValues: WatchStatus[] = ["all", "watching", "completed", "planned"];

function isSortBy(value: string): value is SortBy {
  return sortByValues.includes(value as SortBy);
}

function isSortOrder(value: string): value is SortOrder {
  return sortOrderValues.includes(value as SortOrder);
}

function isWatchStatus(value: string): value is WatchStatus {
  return watchStatusValues.includes(value as WatchStatus);
}

function createFilterStore() {
  const { subscribe, set, update } = writable<FilterState>(defaultFilterState);

  return {
    subscribe,

    initialize(genres: Genre[]) {
      update((state) => ({
        ...state,
        availableGenres: genres,
      }));
    },

    setFromQueryString(queryString: string) {
      const params = new URLSearchParams(queryString);

      update((state) => {
        const newState = { ...state };


        const query = params.get("query");
        if (query) newState.query = query;


        const genres = params.get("genres");
        if (genres) {
          newState.genres = genres.split(",").map(Number);
        }


        const year = params.get("year");
        if (year) newState.year = parseInt(year);


        const rating = params.get("rating");
        if (rating) newState.rating = parseInt(rating);


        const sortBy = params.get("sortBy");
        if (sortBy && isSortBy(sortBy)) newState.sortBy = sortBy;

        const sortOrder = params.get("sortOrder");
        if (sortOrder && isSortOrder(sortOrder)) newState.sortOrder = sortOrder;


        const watchStatus = params.get("watchStatus");
        if (watchStatus && isWatchStatus(watchStatus)) {
          newState.watchStatus = watchStatus;
        }


        const page = params.get("page");
        if (page) newState.page = parseInt(page);

        const limit = params.get("limit");
        if (limit) newState.limit = parseInt(limit);

        return newState;
      });
    },

    updateFilters(filters: Partial<FilterOptions>, navigate = true) {
      update((state) => {
        const newState = {
          ...state,
          ...filters,

          page: "page" in filters ? filters.page || 1 : 1,
        };

        if (navigate) {
          const currentPage = get(page);
          const baseUrl = currentPage.url.pathname;
          const queryString = createQueryString(newState);
          goto(`${baseUrl}?${queryString}`, { replaceState: true });
        }

        return newState;
      });
    },

    reset() {
      update((state) => ({
        ...defaultFilterState,
        availableGenres: state.availableGenres,
      }));

      const currentPage = get(page);
      const baseUrl = currentPage.url.pathname;
      goto(baseUrl, { replaceState: true });
    },

    setResults(totalResults: number, totalPages: number) {
      update((state) => ({
        ...state,
        totalResults,
        totalPages,
      }));
    },
  };
}

export const filters = createFilterStore();


export const activeFilters = derived(filters, ($filters) => {
  const active: string[] = [];

  if ($filters.query) {
    active.push(`Search: "${$filters.query}"`);
  }

  if ($filters.genres && $filters.genres.length > 0) {
    const genreNames = $filters.genres
      .map((id) => $filters.availableGenres.find((g) => g.id === id)?.name)
      .filter(Boolean);
    if (genreNames.length > 0) {
      active.push(`Genres: ${genreNames.join(", ")}`);
    }
  }

  if ($filters.year) {
    active.push(`Year: ${$filters.year}`);
  }

  if ($filters.rating) {
    active.push(`Rating: ${$filters.rating}+`);
  }

  if ($filters.watchStatus && $filters.watchStatus !== "all") {
    active.push(`Status: ${$filters.watchStatus}`);
  }

  if ($filters.sortBy && $filters.sortBy !== "popularity") {
    active.push(`Sort: ${$filters.sortBy} (${$filters.sortOrder})`);
  }

  return active;
});

export const hasActiveFilters = derived(
  activeFilters,
  ($activeFilters) => $activeFilters.length > 0,
);

export const currentPage = derived(filters, ($filters) => $filters.page || 1);

export const totalPages = derived(filters, ($filters) => $filters.totalPages);

export const selectedGenres = derived(filters, ($filters) => {
  if (!$filters.genres) return [];
  return $filters.availableGenres.filter((genre) =>
    $filters.genres?.includes(genre.id),
  );
});

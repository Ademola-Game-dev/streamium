import { writable } from "svelte/store";
import { authStore } from "./auth";
import { get } from "svelte/store";
import { csrfFetch } from "$lib/utils/csrf";

interface WatchlistItem {
  id: number;
  mediaId: number;
  mediaType: string;
  title: string;
  posterPath: string | null;
  voteAverage: number;
  addedAt: string;
}

interface WatchlistStore {
  items: WatchlistItem[];
  total: number;
  loading: boolean;
  error: string | null;
}

function createWatchlistStore() {
  const { subscribe, set, update } = writable<WatchlistStore>({
    items: [],
    total: 0,
    loading: false,
    error: null,
  });

  return {
    subscribe,
    async getWatchlist() {
      const auth = get(authStore);
      if (!auth.user) {
        update(state => ({ ...state, items: [], total: 0, loading: false, error: null }));
        return { items: [], total: 0 };
      }

      update((state) => ({ ...state, loading: true, error: null }));
      try {
        const response = await fetch("/api/watchlist");
        if (!response.ok) throw new Error("Failed to fetch watchlist");
        const data = await response.json();
        update((state) => ({
          ...state,
          items: data.items,
          total: data.total,
          loading: false,
        }));
        return data;
      } catch (error) {
        update((state) => ({
          ...state,
          error:
            error instanceof Error
              ? error.message
              : "Failed to fetch watchlist",
          loading: false,
        }));
        throw error;
      }
    },

    async addToWatchlist(
      mediaId: number,
      mediaType: string,
      title: string,
      posterPath: string | null,
      voteAverage: number,
    ) {
      const auth = get(authStore);
      if (!auth.user) {
        throw new Error("Must be logged in to add to watchlist");
      }

      try {
        const response = await csrfFetch("/api/watchlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mediaId,
            mediaType,
            title,
            posterPath,
            voteAverage,
          }),
        });
        if (!response.ok) throw new Error("Failed to add to watchlist");
        const newItem = await response.json();
        update((state) => ({
          ...state,
          items: [newItem, ...state.items],
          total: state.total + 1,
        }));
        return newItem;
      } catch (error) {
        throw error;
      }
    },

    async removeFromWatchlist(mediaId: number, mediaType: string) {
      const auth = get(authStore);
      if (!auth.user) {
        throw new Error("Must be logged in to remove from watchlist");
      }

      try {
        const response = await csrfFetch("/api/watchlist", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mediaId, mediaType }),
        });
        if (!response.ok) throw new Error("Failed to remove from watchlist");
        update((state) => ({
          ...state,
          items: state.items.filter(
            (item) =>
              !(item.mediaId === mediaId && item.mediaType === mediaType),
          ),
          total: state.total - 1,
        }));
      } catch (error) {
        throw error;
      }
    },

    async isInWatchlist(mediaId: number, mediaType: string) {
      const auth = get(authStore);
      if (!auth.user) {
        return false;
      }

      try {
        const response = await fetch(
          `/api/watchlist/check?mediaId=${mediaId}&mediaType=${mediaType}`,
        );
        if (!response.ok) throw new Error("Failed to check watchlist status");
        const { inWatchlist } = await response.json();
        return inWatchlist;
      } catch (error) {
        throw error;
      }
    },

    reset() {
      set({
        items: [],
        total: 0,
        loading: false,
        error: null,
      });
    }
  };
}

export const watchlistStore = createWatchlistStore();

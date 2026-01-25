import { csrfFetch } from "$lib/utils/csrf";

interface WatchlistItem {
  id: number;
  userId: number;
  mediaId: number;
  mediaType: "movie" | "tv";
  title: string;
  posterPath: string | null;
  voteAverage: number;
  addedAt: string;
}

export class WatchlistService {
  async addToWatchlist(
    mediaId: number,
    mediaType: "movie" | "tv",
    title: string,
    posterPath: string | null,
    voteAverage: number,
  ): Promise<WatchlistItem> {
    const response = await csrfFetch('/api/watchlist', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mediaId,
        mediaType,
        title,
        posterPath,
        voteAverage,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to add to watchlist');
    }

    return response.json();
  }

  async removeFromWatchlist(
    mediaId: number,
    mediaType: "movie" | "tv",
  ): Promise<void> {
    const response = await csrfFetch('/api/watchlist', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ mediaId, mediaType }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to remove from watchlist');
    }
  }

  async getWatchlist(): Promise<WatchlistItem[]> {
    const response = await fetch('/api/watchlist');

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch watchlist');
    }

    return response.json();
  }

  async isInWatchlist(
    mediaId: number,
    mediaType: "movie" | "tv",
  ): Promise<boolean> {
    const response = await fetch(`/api/watchlist/check?mediaId=${mediaId}&mediaType=${mediaType}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to check watchlist status');
    }

    const data = await response.json();
    return data.inWatchlist;
  }
}

export const watchlistService = new WatchlistService();

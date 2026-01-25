import { browser } from "$app/environment";
import { get } from "svelte/store";
import { providerUrls } from "$lib/stores/provider-urls";

export interface Provider {
  id: string;
  name: string;
  getEmbedUrl: (
    mediaId: string | number,
    type: "movie" | "tv",
    season?: number,
    episode?: number,
  ) => string;
}

export const providers: Provider[] = [
  {
    id: "vidsrc",
    name: "VidSrc",
    getEmbedUrl: (mediaId, type, season, episode) => {
      const urls = get(providerUrls);
      if (!urls?.vidsrc) return "";

      if (type === "movie") {
        return `${urls.vidsrc}/movie/${mediaId}?autoPlay=true`;
      } else {
        if (typeof season !== "undefined" && typeof episode !== "undefined") {
          return `${urls.vidsrc}/tv/${mediaId}/${season}/${episode}?autoPlay=true&autoNext=true`;
        }
        return `${urls.vidsrc}/tv/${mediaId}?autoPlay=true`;
      }
    },
  },
  {
    id: "vidlink",
    name: "VidLink",
    getEmbedUrl: (mediaId, type, season, episode) => {
      const urls = get(providerUrls);
      if (!urls?.vidlink) return "";

      if (type === "movie") {
        return `${urls.vidlink}/movie/${mediaId}?autoplay=true&title=true`;
      } else {
        if (typeof season !== "undefined" && typeof episode !== "undefined") {
          return `${urls.vidlink}/tv/${mediaId}/${season}/${episode}?autoplay=true&title=true`;
        }
        return `${urls.vidlink}/tv/${mediaId}/1/1?autoplay=true&title=true`;
      }
    },
  },
  {
    id: "111movies",
    name: "111Movies",
    getEmbedUrl: (mediaId, type, season, episode) => {
      const urls = get(providerUrls);
      if (!urls?.movies111) return "";

      if (type === "movie") {
        return `${urls.movies111}/movie/${mediaId}`;
      } else {
        if (typeof season !== "undefined" && typeof episode !== "undefined") {
          return `${urls.movies111}/tv/${mediaId}/${season}/${episode}`;
        }
        return `${urls.movies111}/tv/${mediaId}/1/1`;
      }
    },
  },
  {
    id: "2embed",
    name: "2Embed",
    getEmbedUrl: (mediaId, type, season, episode) => {
      const urls = get(providerUrls);
      if (!urls?.embed2) return "";

      if (type === "movie") {
        return `${urls.embed2}/embed/${mediaId}`;
      } else {
        if (typeof season !== "undefined" && typeof episode !== "undefined") {
          return `${urls.embed2}/embedtv/${mediaId}&s=${season}&e=${episode}`;
        }
        return `${urls.embed2}/embedtv/${mediaId}&s=1&e=1`;
      }
    },
  },
  {
    id: "moviesapi",
    name: "MoviesAPI",
    getEmbedUrl: (mediaId, type, season, episode) => {
      const urls = get(providerUrls);
      if (!urls?.moviesapi) return "";

      if (type === "movie") {
        return `${urls.moviesapi}/movie/${mediaId}`;
      } else {
        if (typeof season !== "undefined" && typeof episode !== "undefined") {
          return `${urls.moviesapi}/tv/${mediaId}/${season}/${episode}`;
        }
        return `${urls.moviesapi}/tv/${mediaId}/1/1`;
      }
    },
  },
  {
    id: "multiembed",
    name: "MultiEmbed",
    getEmbedUrl: (mediaId, type, season, episode) => {
      const urls = get(providerUrls);
      if (!urls?.multiembed) return "";

      if (type === "movie") {
        return `${urls.multiembed}/?video_id=${mediaId}&tmdb=1`;
      } else {
        if (typeof season !== "undefined" && typeof episode !== "undefined") {
          return `${urls.multiembed}/?video_id=${mediaId}&tmdb=1&s=${season}&e=${episode}`;
        }
        return `${urls.multiembed}/?video_id=${mediaId}&tmdb=1&s=1&e=1`;
      }
    },
  },
];

export function getProvider(id: string): Provider | undefined {
  return providers.find((p) => p.id === id);
}

export function getDefaultProvider(): Provider {
  if (!browser) {
    return providers[0];
  }

  const savedProvider = localStorage.getItem("selectedProvider");
  if (savedProvider) {
    const provider = providers.find((p) => p.id === savedProvider);
    if (provider) return provider;
  }

  return providers.find((p) => p.id === "vidsrc") || providers[0];
}

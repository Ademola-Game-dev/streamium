export interface MediaProvider {
  id: string;
  name: string;
  supportsMovies: boolean;
  supportsTVShows: boolean;
  requiresLanguage?: boolean;
  languages?: string[];
  getMovieUrl: (
    mediaId: string | number,
    options?: ProviderOptions,
  ) => Promise<string>;
  getTVShowUrl?: (
    mediaId: string | number,
    seasonId: number,
    episodeId: number,
    options?: ProviderOptions,
  ) => Promise<string>;
}

export interface ProviderOptions {
  language?: string;
  primaryColor?: string;
  secondaryColor?: string;
  iconColor?: string;
  autoPlay?: boolean;
  autoNext?: boolean;
}

export interface StreamingQuality {
  quality: string;
  url: string;
  metadata?: {
    baseUrl?: string;
    [key: string]: unknown;
  };
}

export interface ProviderResponse {
  url: string;
  type: "iframe" | "hls" | "dash";
  qualities?: StreamingQuality[];
}

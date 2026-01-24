export interface TMDBReleaseDatesResponse {
  id: number;
  results: TMDBReleaseDateResult[];
}

export interface TMDBReleaseDateResult {
  iso_3166_1: string;
  release_dates: TMDBReleaseDate[];
}

export interface TMDBReleaseDate {
  certification: string;
  iso_639_1?: string;
  release_date: string;
  type: number;
  note?: string;
}

export interface TMDBMediaResponse {
  id: number;
  title?: string;
  name?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  media_type?: "movie" | "tv";
  popularity: number;
}

export interface TMDBResponse<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

export interface TMDBVideoResponse {
  id: number;
  results: TMDBVideo[];
}

export interface TMDBVideo {
  id: string;
  key: string;
  name: string;
  site: string;
  size: number;
  type: string;
}

export interface TMDBMovie extends TMDBMediaResponse {
  title: string;
  release_date: string;
  media_type: "movie";
}

export interface TMDBTVShow extends TMDBMediaResponse {
  name: string;
  first_air_date: string;
  media_type: "tv";
}

export interface TMDBGenre {
  id: number;
  name: string;
}

export interface TMDBWatchProvider {
  logo_path: string;
  provider_id: number;
  provider_name: string;
  display_priority: number;
}

export interface TMDBWatchProviderRegion {
  link?: string;
  flatrate?: TMDBWatchProvider[];
  rent?: TMDBWatchProvider[];
  buy?: TMDBWatchProvider[];
}

export interface TMDBWatchProvidersResponse {
  id: number;
  results: Record<string, TMDBWatchProviderRegion>;
}

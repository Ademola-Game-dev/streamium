/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TMDB_API_KEY: string;
  readonly TMDB_API_KEY: string;
  readonly JWT_SECRET: string;
  readonly DATABASE_URL: string;
  readonly SMTP_HOST: string;
  readonly SMTP_PORT: string;
  readonly SMTP_USER: string;
  readonly SMTP_PASS: string;
  readonly SMTP_FROM: string;
  readonly NODE_ENV: "development" | "production";
  readonly VIDSRC_BASE_URL: string;
  readonly VIDLINK_BASE_URL: string;
  readonly MOVIES111_BASE_URL: string;
  readonly EMBED2_BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module "$env/static/private" {
  export const JWT_SECRET: string;
  export const DATABASE_URL: string;
  export const TMDB_API_KEY: string;
  export const SMTP_HOST: string;
  export const SMTP_PORT: string;
  export const SMTP_USER: string;
  export const SMTP_PASS: string;
  export const SMTP_FROM: string;
  export const NODE_ENV: "development" | "production";
  export const VIDSRC_BASE_URL: string;
  export const VIDLINK_BASE_URL: string;
  export const MOVIES111_BASE_URL: string;
  export const EMBED2_BASE_URL: string;
}

declare module "$env/static/public" {
  export const PUBLIC_TMDB_API_KEY: string;
}

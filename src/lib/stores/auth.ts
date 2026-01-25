import { writable } from "svelte/store";
import { csrfFetch } from "$lib/utils/csrf";

interface User {
  id: number;
  username: string;
  email: string | null;
  isAdmin: boolean;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
}

function createAuthStore() {
  const { subscribe, set, update } = writable<AuthState>({
    isAuthenticated: false,
    user: null,
    loading: true,
    error: null,
  });

  return {
    subscribe,

    async initialize() {
      try {
        const response = await fetch("/api/auth/me");
        if (response.ok) {
          const user = await response.json();
          set({
            isAuthenticated: true,
            user,
            loading: false,
            error: null,
          });
        } else {
          set({
            isAuthenticated: false,
            user: null,
            loading: false,
            error: null,
          });
        }
      } catch (error) {
        set({
          isAuthenticated: false,
          user: null,
          loading: false,
          error: "Failed to initialize auth",
        });
      }
    },

    async login(identifier: string, password: string) {
      try {
        const response = await csrfFetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ usernameOrEmail: identifier, password }),
        });

        if (!response.ok) {
          throw new Error("Login failed");
        }

        const user = await response.json();
        set({
          isAuthenticated: true,
          user,
          loading: false,
          error: null,
        });

        return true;
      } catch (error) {
        update((state: AuthState) => ({
          ...state,
          error: "Login failed",
          loading: false,
        }));
        return false;
      }
    },

    async register(
      username: string,
      email: string | null,
      password: string,
      captchaId: string,
      captchaAnswer: string,
    ) {
      try {
        const response = await csrfFetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, email, password, captchaId, captchaAnswer }),
        });

        if (!response.ok) {
          throw new Error("Registration failed");
        }

        const user = await response.json();
        set({
          isAuthenticated: true,
          user,
          loading: false,
          error: null,
        });

        return true;
      } catch (error) {
        update((state: AuthState) => ({
          ...state,
          error: "Registration failed",
          loading: false,
        }));
        return false;
      }
    },

    async logout() {
      try {
        await csrfFetch("/api/auth/logout", { method: "POST" });
      } finally {
        set({
          isAuthenticated: false,
          user: null,
          loading: false,
          error: null,
        });
      }
    },

    clearError() {
      update((state: AuthState) => ({ ...state, error: null }));
    },
  };
}

export const authStore = createAuthStore();

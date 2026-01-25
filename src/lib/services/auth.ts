import type { UserSession } from "$lib/types/auth";
import { csrfFetch } from "$lib/utils/csrf";

class AuthService {
  private static instance: AuthService;

  private constructor() {}

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async login(usernameOrEmail: string, password: string): Promise<UserSession> {
    const response = await csrfFetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ usernameOrEmail, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to login');
    }

    return response.json();
  }

  async register(
    username: string,
    email: string | null,
    password: string,
    captchaId: string,
    captchaAnswer: string,
  ): Promise<UserSession> {
    const response = await csrfFetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, email, password, captchaId, captchaAnswer }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to register');
    }

    return response.json();
  }

  async logout(): Promise<void> {
    const response = await csrfFetch('/api/auth/logout', {
      method: 'POST',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to logout');
    }
  }

  async getCurrentUser(): Promise<UserSession | null> {
    const response = await fetch('/api/auth/me');

    if (!response.ok) {
      if (response.status === 401) {
        return null;
      }
      const error = await response.json();
      throw new Error(error.message || 'Failed to get current user');
    }

    return response.json();
  }

  async requestPasswordReset(identifier: string): Promise<void> {
    const response = await csrfFetch('/api/auth/reset-password/request', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ identifier }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to request password reset');
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const response = await csrfFetch('/api/auth/reset-password/reset', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token, newPassword }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to reset password');
    }
  }
}

export const authService = AuthService.getInstance();

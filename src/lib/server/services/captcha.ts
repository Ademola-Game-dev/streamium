import crypto from 'crypto';

interface CaptchaEntry {
  text: string;
  createdAt: number;
}

const CAPTCHA_EXPIRY = 5 * 60 * 1000; // 5 minutes
const captchaStore = new Map<string, CaptchaEntry>();

// Cleanup expired captchas every minute
setInterval(() => {
  const now = Date.now();
  for (const [id, entry] of captchaStore.entries()) {
    if (now - entry.createdAt > CAPTCHA_EXPIRY) {
      captchaStore.delete(id);
    }
  }
}, 60 * 1000);

export class CaptchaService {
  private static readonly CHARS = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz';
  private static readonly LENGTH = 6;

  static generateCaptcha(): { id: string; text: string } {
    const text = Array(this.LENGTH)
      .fill(0)
      .map(() => this.CHARS[Math.floor(Math.random() * this.CHARS.length)])
      .join('');

    const id = crypto.randomBytes(16).toString('hex');

    captchaStore.set(id, {
      text,
      createdAt: Date.now(),
    });

    return { id, text };
  }

  static validateCaptcha(
    id: string,
    userInput: string,
    options: { consume?: boolean } = {},
  ): boolean {
    const entry = captchaStore.get(id);

    if (!entry) {
      return false;
    }

    // Check if expired
    if (Date.now() - entry.createdAt > CAPTCHA_EXPIRY) {
      captchaStore.delete(id);
      return false;
    }

    const matches = entry.text.toLowerCase() === userInput.toLowerCase();
    const consume = options.consume ?? true;
    if (consume || !matches) {
      captchaStore.delete(id);
    }

    return matches;
  }

  static invalidateCaptcha(id: string): void {
    captchaStore.delete(id);
  }
}

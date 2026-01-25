import { describe, it, expect } from "vitest";
import { CaptchaService } from "./captcha";

describe("CaptchaService", () => {
  it("generates and validates captchas", () => {
    const { id, text } = CaptchaService.generateCaptcha();

    expect(id).toHaveLength(32);
    expect(text).toHaveLength(6);
    expect(CaptchaService.validateCaptcha(id, text, { consume: true })).toBe(true);
    expect(CaptchaService.validateCaptcha(id, text, { consume: true })).toBe(false);
  });

  it("allows non-consuming validation", () => {
    const { id, text } = CaptchaService.generateCaptcha();

    expect(CaptchaService.validateCaptcha(id, text, { consume: false })).toBe(true);
    expect(CaptchaService.validateCaptcha(id, text, { consume: true })).toBe(true);
    expect(CaptchaService.validateCaptcha(id, text, { consume: true })).toBe(false);
  });
});

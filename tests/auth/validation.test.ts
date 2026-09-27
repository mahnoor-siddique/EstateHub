import { describe, expect, it } from "vitest";
import {
  EMAIL_MAX,
  FULL_NAME_MAX,
  PASSWORD_MAX,
  validateLogin,
  validateSignup,
} from "@/lib/validations/auth";

// Server-side validation for /login and /signup — the check that cannot be bypassed in the browser.

function form(fields: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

const validSignup = {
  fullName: "Ayesha Khan",
  email: "ayesha@example.com",
  password: "Lahore2026",
  confirmPassword: "Lahore2026",
};

describe("validateLogin", () => {
  it("accepts an email and password, trimming the email", () => {
    const result = validateLogin(form({ email: "  ayesha@example.com ", password: "anything" }));
    expect(result).toEqual({
      ok: true,
      data: { email: "ayesha@example.com", password: "anything" },
    });
  });

  it("rejects empty fields", () => {
    const result = validateLogin(form({ email: "", password: "" }));
    expect(result).toEqual({
      ok: false,
      fieldErrors: { email: "Enter your email address.", password: "Enter your password." },
    });
  });

  it("treats missing fields like empty ones", () => {
    const result = validateLogin(new FormData());
    expect(result.ok).toBe(false);
  });

  it.each(["not-an-email", "a@b", "a @b.com", `${"x".repeat(EMAIL_MAX)}@example.com`])(
    "rejects the invalid email %j",
    (email) => {
      const result = validateLogin(form({ email, password: "secret" }));
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.fieldErrors.email).toBe("Enter a valid email address.");
    },
  );

  it("does not apply signup password rules at login", () => {
    expect(validateLogin(form({ email: "a@b.co", password: "x" })).ok).toBe(true);
  });

  it("ignores File values instead of crashing", () => {
    const data = new FormData();
    data.set("email", new Blob(["a@b.co"]));
    data.set("password", "secret");
    expect(validateLogin(data).ok).toBe(false);
  });
});

describe("validateSignup", () => {
  it("accepts valid input and normalises the name", () => {
    const result = validateSignup(form({ ...validSignup, fullName: "  Ayesha   Khan " }));
    expect(result).toEqual({
      ok: true,
      data: { fullName: "Ayesha Khan", email: "ayesha@example.com", password: "Lahore2026" },
    });
  });

  it("reports every problem at once for an empty form", () => {
    const result = validateSignup(new FormData());
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(Object.keys(result.fieldErrors).sort()).toEqual(
        ["confirmPassword", "email", "fullName", "password"].sort(),
      );
    }
  });

  it.each([
    ["A", "Your name must be at least 2 characters."],
    ["   ", "Enter your full name."],
    ["x".repeat(FULL_NAME_MAX + 1), `Your name must be ${FULL_NAME_MAX} characters or fewer.`],
  ])("rejects the name %j", (fullName, message) => {
    const result = validateSignup(form({ ...validSignup, fullName }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.fieldErrors.fullName).toBe(message);
  });

  it.each([
    ["Short1", "Use at least 8 characters."],
    ["onlyletters", "Include at least one letter and one number."],
    ["12345678", "Include at least one letter and one number."],
    [`a1${"x".repeat(PASSWORD_MAX)}`, `Use ${PASSWORD_MAX} characters or fewer.`],
  ])("rejects the weak or oversized password %j", (password, message) => {
    const result = validateSignup(form({ ...validSignup, password, confirmPassword: password }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.fieldErrors.password).toBe(message);
  });

  it("requires the confirmation to match", () => {
    const result = validateSignup(form({ ...validSignup, confirmPassword: "Lahore2025" }));
    expect(result).toEqual({
      ok: false,
      fieldErrors: { confirmPassword: "Passwords do not match." },
    });
  });

  it("accepts a password exactly at the length limits", () => {
    const min = "abcdef12";
    const max = `a1${"x".repeat(PASSWORD_MAX - 2)}`;
    for (const password of [min, max]) {
      expect(validateSignup(form({ ...validSignup, password, confirmPassword: password })).ok).toBe(
        true,
      );
    }
  });
});

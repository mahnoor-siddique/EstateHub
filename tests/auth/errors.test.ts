import { AuthApiError, AuthRetryableFetchError } from "@supabase/supabase-js";
import { afterEach, describe, expect, it, vi } from "vitest";
import { logAuthError, loginErrorMessage, signupErrorMessage } from "@/lib/auth/errors";

// Supabase errors must become friendly messages that never leak raw server text.

function apiError(code: string, status = 400, message = "raw server message") {
  return new AuthApiError(message, status, code);
}

afterEach(() => vi.restoreAllMocks());

describe("loginErrorMessage", () => {
  it("uses one message for a wrong password and an unknown email", () => {
    // Same wording either way, so login cannot be used to discover registered emails.
    expect(loginErrorMessage(apiError("invalid_credentials"))).toBe("Incorrect email or password.");
  });

  it("explains unconfirmed accounts", () => {
    expect(loginErrorMessage(apiError("email_not_confirmed"))).toMatch(/confirm your email/i);
  });

  it("handles rate limiting and network failures", () => {
    expect(loginErrorMessage(apiError("over_request_rate_limit", 429))).toMatch(/too many attempts/i);
    expect(loginErrorMessage(new AuthRetryableFetchError("fetch failed", 0))).toMatch(
      /couldn't reach/i,
    );
  });

  it("falls back to a generic message without exposing the raw error", () => {
    const message = loginErrorMessage(apiError("something_new", 500, "db exploded at row 7"));
    expect(message).toBe("We couldn't sign you in. Please try again.");
    expect(message).not.toContain("exploded");
  });
});

describe("signupErrorMessage", () => {
  it.each([
    ["user_already_exists", /already exists/i],
    ["email_exists", /already exists/i],
    ["weak_password", /stronger/i],
    ["email_address_invalid", /can't be used/i],
    ["over_email_send_rate_limit", /too many attempts/i],
    ["signup_disabled", /unavailable/i],
  ])("maps %s to a friendly message", (code, expected) => {
    expect(signupErrorMessage(apiError(code))).toMatch(expected);
  });

  it("falls back to a generic message", () => {
    expect(signupErrorMessage(apiError("mystery", 500, "secret detail"))).toBe(
      "We couldn't create your account. Please try again.",
    );
  });
});

describe("logAuthError", () => {
  it("logs only the error code and status, never the message", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    logAuthError("login", apiError("invalid_credentials", 400, "user test@example.com not found"));
    expect(spy).toHaveBeenCalledWith("[auth] login failed", {
      code: "invalid_credentials",
      status: 400,
    });
    expect(JSON.stringify(spy.mock.calls)).not.toContain("test@example.com");
  });
});

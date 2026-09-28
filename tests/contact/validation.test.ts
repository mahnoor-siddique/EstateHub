import { describe, expect, it } from "vitest";
import { CONTACT_MESSAGE_MAX, validateContact } from "@/lib/validations/contact";

// Server-side validation for the contact-agent form.

const PROPERTY_ID = "ba3d940c-b0d1-50dd-9fb1-44f62f2d2264";
const AGENT_ID = "6ceb4716-6d87-591e-9ead-212a4e979b44";

const valid = {
  propertyId: PROPERTY_ID,
  agentId: AGENT_ID,
  name: "Ayesha Khan",
  email: "ayesha@example.com",
  phone: "0300 1234567",
  message: "Is the villa still available for a viewing next week?",
};

function form(overrides: Record<string, string> = {}) {
  const data = new FormData();
  for (const [key, value] of Object.entries({ ...valid, ...overrides })) data.set(key, value);
  return data;
}

function fieldError(overrides: Record<string, string>, field: string) {
  const result = validateContact(form(overrides));
  return result.ok ? undefined : result.fieldErrors[field as keyof typeof result.fieldErrors];
}

describe("validateContact", () => {
  it("accepts a full enquiry and tidies the text", () => {
    const result = validateContact(form({ name: "  Ayesha   Khan ", phone: " 0300  1234567 " }));
    expect(result).toEqual({ ok: true, data: { ...valid, name: "Ayesha Khan" } });
  });

  it("accepts a general enquiry without property, agent or phone", () => {
    const result = validateContact(form({ propertyId: "", agentId: "", phone: "" }));
    expect(result).toEqual({
      ok: true,
      data: { ...valid, propertyId: null, agentId: null, phone: null },
    });
  });

  it("never returns a user id, even if the form contains one", () => {
    const result = validateContact(form({ user_id: "00000000-0000-0000-0000-000000000000", userId: "x" }));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(Object.keys(result.data).sort()).toEqual(
        ["agentId", "email", "message", "name", "phone", "propertyId"].sort(),
      );
    }
  });

  it.each([
    ["propertyId", "not-a-uuid"],
    ["agentId", "1 or 1=1"],
  ])("rejects a tampered %s as an out-of-date form", (field, value) => {
    expect(validateContact(form({ [field]: value }))).toEqual({
      ok: false,
      fieldErrors: {},
      formError: "This form is out of date. Please reload the page and try again.",
    });
  });

  it("reports every missing required field for an empty form", () => {
    const result = validateContact(new FormData());
    expect(result.ok).toBe(false);
    if (!result.ok) expect(Object.keys(result.fieldErrors).sort()).toEqual(["email", "message", "name"]);
  });

  it("validates the name", () => {
    expect(fieldError({ name: "" }, "name")).toBe("Enter your full name.");
    expect(fieldError({ name: "A" }, "name")).toMatch(/at least 2/);
    expect(fieldError({ name: "x".repeat(121) }, "name")).toMatch(/120 characters/);
  });

  it.each(["not-an-email", "a@b", "a b@c.com", `${"x".repeat(250)}@example.com`])(
    "rejects the email %j",
    (email) => expect(fieldError({ email }, "email")).toBe("Enter a valid email address."),
  );

  it.each(["12345", "call me", "+92 300 1234567 ext 9", "1".repeat(16)])(
    "rejects the phone number %j",
    (phone) => expect(fieldError({ phone }, "phone")).toMatch(/valid phone number/),
  );

  it("validates the message length", () => {
    expect(fieldError({ message: "   " }, "message")).toBe("Enter a message for the agent.");
    expect(fieldError({ message: "Hi there" }, "message")).toMatch(/at least 10/);
    expect(fieldError({ message: "x".repeat(CONTACT_MESSAGE_MAX + 1) }, "message")).toMatch(/under 2000/);
    expect(fieldError({ message: "x".repeat(CONTACT_MESSAGE_MAX) }, "message")).toBeUndefined();
  });

  it("keeps script-like input as plain text (React escapes it when displayed)", () => {
    const result = validateContact(form({ message: "<script>alert('x')</script> hello there" }));
    expect(result.ok && result.data.message).toBe("<script>alert('x')</script> hello there");
  });
});

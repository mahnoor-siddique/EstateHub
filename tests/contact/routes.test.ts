import { describe, expect, it } from "vitest";
import { contactPath } from "@/lib/contact/routes";

// The contact return path: keeps the enquiry's property/agent context, drops anything else.

const PROPERTY_ID = "ba3d940c-b0d1-50dd-9fb1-44f62f2d2264";
const AGENT_ID = "6ceb4716-6d87-591e-9ead-212a4e979b44";

describe("contactPath", () => {
  it("keeps both ids for a listing enquiry", () => {
    expect(contactPath(PROPERTY_ID, AGENT_ID)).toBe(`/contact?propertyId=${PROPERTY_ID}&agentId=${AGENT_ID}`);
  });

  it("keeps either id on its own", () => {
    expect(contactPath(PROPERTY_ID, "")).toBe(`/contact?propertyId=${PROPERTY_ID}`);
    expect(contactPath("", AGENT_ID)).toBe(`/contact?agentId=${AGENT_ID}`);
  });

  it("is the general contact page without ids", () => {
    expect(contactPath("", "")).toBe("/contact");
  });

  it("drops values that are not uuids", () => {
    expect(contactPath("//evil.com", `${AGENT_ID}&next=/x`)).toBe("/contact");
  });
});

import { describe, expect, it } from "vitest";
import { emailKey, phoneKey } from "@/lib/contact-keys";

// These functions define "same person" for lead dedupe, and each has a SQL
// twin (crm_email_key / crm_phone_key). If a case here changes, the SQL must
// change in the same commit via a new migration.
describe("phoneKey", () => {
  it("converges Meta's international format with the website's local format", () => {
    expect(phoneKey("+234 803 123 4567")).toBe(phoneKey("08031234567"));
  });

  it("ignores punctuation and spacing", () => {
    expect(phoneKey("(0803) 123-4567")).toBe("8031234567");
    expect(phoneKey("234-803-123-4567")).toBe("8031234567");
  });

  it("keeps different numbers apart", () => {
    expect(phoneKey("08031234567")).not.toBe(phoneKey("08031234568"));
  });

  it("refuses fragments — under ten digits is not an identity", () => {
    expect(phoneKey("12345")).toBeNull();
    expect(phoneKey("")).toBeNull();
    expect(phoneKey(null)).toBeNull();
  });
});

describe("emailKey", () => {
  it("is case- and whitespace-insensitive", () => {
    expect(emailKey("  John.Smith@Gmail.com ")).toBe("john.smith@gmail.com");
  });

  it("treats underscore literally — never as a SQL wildcard", () => {
    // The bug this guards: ILIKE matching once merged john_smith@ with
    // johnXsmith@ because "_" matches any character.
    expect(emailKey("john_smith@gmail.com")).not.toBe(emailKey("johnxsmith@gmail.com"));
  });

  it("maps empty and null to null", () => {
    expect(emailKey("")).toBeNull();
    expect(emailKey("   ")).toBeNull();
    expect(emailKey(null)).toBeNull();
    expect(emailKey(undefined)).toBeNull();
  });
});

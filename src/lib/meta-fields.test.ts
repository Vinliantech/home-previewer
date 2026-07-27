import { describe, expect, it } from "vitest";
import { parseBudget, parseInvestment, parseMetaLeadFields } from "@/lib/meta-fields";

const ctx = { leadgenId: "lead-1", pageId: "page-1", formId: "form-1" };

function lead(fields: Record<string, string>) {
  return {
    field_data: Object.entries(fields).map(([name, value]) => ({ name, values: [value] })),
  };
}

describe("parseMetaLeadFields", () => {
  it("keeps the three fields the CRM follows up on", () => {
    const result = parseMetaLeadFields(
      lead({
        full_name: "Amaka Obi",
        email: "amaka@example.com",
        phone_number: "+2348012345678",
      }),
      ctx,
    );

    expect(result.fullName).toBe("Amaka Obi");
    expect(result.email).toBe("amaka@example.com");
    expect(result.phone).toBe("+2348012345678");
  });

  it("rebuilds a name split across two questions", () => {
    const result = parseMetaLeadFields(lead({ first_name: "Amaka", last_name: "Obi" }), ctx);
    expect(result.fullName).toBe("Amaka Obi");
  });

  it("keeps a nameless lead rather than discarding a usable phone number", () => {
    const result = parseMetaLeadFields(lead({ phone_number: "+2348012345678" }), ctx);
    expect(result.fullName).toBe("Unknown lead");
    expect(result.phone).toBe("+2348012345678");
  });

  it("matches field names case-insensitively and trims values", () => {
    const result = parseMetaLeadFields(lead({ "  EMAIL  ": "  a@b.com  " }), ctx);
    expect(result.email).toBe("a@b.com");
  });

  it("treats an empty answer as absent", () => {
    const result = parseMetaLeadFields(lead({ email: "", phone_number: "0801" }), ctx);
    expect(result.email).toBeNull();
    expect(result.phone).toBe("0801");
  });

  it("falls back to the phone number for WhatsApp when unanswered", () => {
    const result = parseMetaLeadFields(lead({ phone_number: "+234801" }), ctx);
    expect(result.whatsappNumber).toBe("+234801");
  });

  it("carries the leadgen id so a redelivery cannot duplicate the lead", () => {
    const result = parseMetaLeadFields(lead({ email: "a@b.com" }), ctx);
    expect(result.submissionId).toBe("lead-1");
    expect(result.facebook.leadId).toBe("lead-1");
  });

  it("survives a payload with no field_data at all", () => {
    const result = parseMetaLeadFields({}, ctx);
    expect(result.fullName).toBe("Unknown lead");
    expect(result.email).toBeNull();
    expect(result.phone).toBeNull();
  });
});

describe("parseBudget", () => {
  it("reads a range in millions", () => {
    expect(parseBudget("50 - 100 million")).toEqual([50_000_000, 100_000_000]);
  });

  it("reads a single figure as both bounds", () => {
    expect(parseBudget("₦250m")).toEqual([250_000_000, 250_000_000]);
  });

  it("strips thousands separators", () => {
    expect(parseBudget("1,500,000")).toEqual([1_500_000, 1_500_000]);
  });

  // Regression: \b never matches between a digit and "m", so the attached
  // form read as a budget of 250 rather than 250,000,000.
  it.each(["250m", "\u20a6250M", "50-100m", "50 - 100 million"])(
    "reads the unit when written against the figure: %s",
    (input) => {
      const [min, max] = parseBudget(input);
      expect(min).toBeGreaterThanOrEqual(50_000_000);
      expect(max).toBeGreaterThanOrEqual(50_000_000);
    },
  );

  it("returns nulls for an unparseable answer", () => {
    expect(parseBudget("not sure yet")).toEqual([null, null]);
    expect(parseBudget(undefined)).toEqual([null, null]);
  });
});

describe("parseInvestment", () => {
  it.each([
    ["Group purchase", "group_purchase"],
    ["Fractional ownership", "fractional"],
    ["Tokenized units", "tokenized"],
    ["Rental income", "rental_income"],
    ["Land purchase", "land_purchase"],
    ["Outright purchase", "full_purchase"],
  ])("maps %s", (input, expected) => {
    expect(parseInvestment(input)).toBe(expected);
  });

  it("defaults to not_decided", () => {
    expect(parseInvestment(undefined)).toBe("not_decided");
    expect(parseInvestment("something else")).toBe("not_decided");
  });
});

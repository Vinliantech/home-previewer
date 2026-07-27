import { describe, expect, it } from "vitest";
import { advanceLeadStatus } from "@/lib/crm";

// Pins the forward-only rule that stops automated capture from dragging a
// lead backwards through the pipeline. The scenario that motivated it: a
// converted client filling in another Facebook form must stay converted.
describe("advanceLeadStatus", () => {
  describe("never regresses an advanced lead", () => {
    it.each([
      ["converted", "auto_response_sent"],
      ["converted", "assigned_to_adviser"],
      ["payment_approved", "auto_response_sent"],
      ["qualified", "auto_response_sent"],
      ["inspection_booked", "assigned_to_adviser"],
      ["follow_up_later", "auto_response_sent"],
    ] as const)("%s + %s stays put", (current, next) => {
      expect(advanceLeadStatus(current, next)).toBeNull();
    });
  });

  describe("terminal statuses are owned by humans", () => {
    it.each(["converted", "not_interested", "lost"] as const)(
      "automation never moves %s",
      (current) => {
        expect(advanceLeadStatus(current, "assigned_to_adviser")).toBeNull();
      },
    );
  });

  describe("genuinely new leads still advance", () => {
    it("new → auto_response_sent", () => {
      expect(advanceLeadStatus("new", "auto_response_sent")).toBe("auto_response_sent");
    });
    it("new → assigned_to_adviser", () => {
      expect(advanceLeadStatus("new", "assigned_to_adviser")).toBe("assigned_to_adviser");
    });
    it("auto_response_sent → assigned_to_adviser", () => {
      expect(advanceLeadStatus("auto_response_sent", "assigned_to_adviser")).toBe(
        "assigned_to_adviser",
      );
    });
  });

  it("identical status is a no-op", () => {
    expect(advanceLeadStatus("contacted", "contacted")).toBeNull();
  });

  it("aliases of the same pipeline point do not bounce between each other", () => {
    expect(advanceLeadStatus("brochure_sent", "property_information_sent")).toBeNull();
    expect(advanceLeadStatus("property_information_sent", "brochure_sent")).toBeNull();
  });
});

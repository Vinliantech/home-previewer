import { describe, expect, it } from "vitest";
import { clientNumber } from "./client-number";

describe("clientNumber", () => {
  it("pads to five digits", () => {
    expect(clientNumber(1)).toBe("KS-C-00001");
    expect(clientNumber(42)).toBe("KS-C-00042");
    expect(clientNumber(99999)).toBe("KS-C-99999");
  });

  it("does not truncate once the sequence passes five digits", () => {
    expect(clientNumber(100000)).toBe("KS-C-100000");
  });

  it("stays distinct from the affiliate member id for the same integer", () => {
    // Affiliates render as KS-00042; a client must never collide with that.
    expect(clientNumber(42)).not.toBe("KS-00042");
  });

  it("renders a dash for a missing number rather than KS-C-NaN", () => {
    expect(clientNumber(null)).toBe("—");
    expect(clientNumber(undefined)).toBe("—");
  });

  it("rejects values a sequence never produces", () => {
    expect(clientNumber(0)).toBe("—");
    expect(clientNumber(-1)).toBe("—");
    expect(clientNumber(1.5)).toBe("—");
  });
});

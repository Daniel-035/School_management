import { describe, expect, it } from "vitest";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

describe("admin formatting utilities", () => {
  it("formats INR amounts for India", () => {
    expect(formatCurrency(12500)).toContain("12,500");
  });

  it("formats date strings deterministically enough for UI", () => {
    expect(formatDate("2026-07-16T00:00:00.000Z")).toContain("2026");
  });

  it("merges tailwind class conflicts", () => {
    const isHidden = false;
    expect(cn("px-2", "px-4", isHidden && "hidden")).toBe("px-4");
  });
});

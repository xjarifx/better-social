import { describe, it, expect } from "vitest";
import { parsePaginationParams } from "@/lib/pagination";

describe("parsePaginationParams", () => {
  it("returns defaults when no params are provided", () => {
    const params = new URLSearchParams();
    const result = parsePaginationParams(params, { limit: 20, offset: 0 });
    expect(result).toEqual({ limit: 20, offset: 0 });
  });

  it("parses valid limit and offset", () => {
    const params = new URLSearchParams({ limit: "10", offset: "5" });
    const result = parsePaginationParams(params, { limit: 20, offset: 0 });
    expect(result).toEqual({ limit: 10, offset: 5 });
  });

  it("throws for limit less than 1", () => {
    const params = new URLSearchParams({ limit: "0" });
    expect(() =>
      parsePaginationParams(params, { limit: 20, offset: 0 }),
    ).toThrow("limit must be an integer >= 1");
  });

  it("throws for negative offset", () => {
    const params = new URLSearchParams({ offset: "-1" });
    expect(() =>
      parsePaginationParams(params, { limit: 20, offset: 0 }),
    ).toThrow("offset must be an integer >= 0");
  });

  it("throws for non-numeric limit", () => {
    const params = new URLSearchParams({ limit: "abc" });
    expect(() =>
      parsePaginationParams(params, { limit: 20, offset: 0 }),
    ).toThrow("limit must be an integer >= 1");
  });

  it("throws for non-numeric offset", () => {
    const params = new URLSearchParams({ offset: "xyz" });
    expect(() =>
      parsePaginationParams(params, { limit: 20, offset: 0 }),
    ).toThrow("offset must be an integer >= 0");
  });
});

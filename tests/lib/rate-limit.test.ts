import { describe, it, expect, afterEach, vi } from "vitest";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

describe("checkRateLimit", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows the first request", () => {
    const result = checkRateLimit("first", 5, 60_000);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it("allows requests within the limit", () => {
    checkRateLimit("within", 3, 60_000);
    const result = checkRateLimit("within", 3, 60_000);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(1);
  });

  it("blocks requests exceeding the limit", () => {
    checkRateLimit("exceed", 2, 60_000);
    checkRateLimit("exceed", 2, 60_000);
    const third = checkRateLimit("exceed", 2, 60_000);
    expect(third.allowed).toBe(false);
    expect(third.remaining).toBe(0);
  });

  it("resets after the window expires", () => {
    vi.useFakeTimers();
    const k = "timer-reset";
    checkRateLimit(k, 1, 60_000);
    vi.advanceTimersByTime(60_001);
    const next = checkRateLimit(k, 1, 60_000);
    expect(next.allowed).toBe(true);
  });
});

describe("RATE_LIMITS", () => {
  it("has a general rate limit of 100 per minute", () => {
    expect(RATE_LIMITS.general.limit).toBe(100);
    expect(RATE_LIMITS.general.windowMs).toBe(60_000);
  });

  it("has a createPost rate limit of 10 per minute", () => {
    expect(RATE_LIMITS.createPost.limit).toBe(10);
    expect(RATE_LIMITS.createPost.windowMs).toBe(60_000);
  });
});

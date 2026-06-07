import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/services/auth", () => ({
  login: vi.fn(),
}));

vi.mock("@/utils/auth", () => ({
  authenticateRequest: vi.fn(),
  authenticateOptional: vi.fn(),
}));

const { login: loginService } = await import("@/services/auth");
const { POST } = await import("@/app/api/auth/login/route");

function createRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost:3000/api/auth/login", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/auth/login", () => {
  it("returns 200 with tokens on successful login", async () => {
    const mockResponse = {
      accessToken: "jwt-token",
      user: {
        id: "user-1",
        username: "testuser",
        email: "test@example.com",
        firstName: "Test",
        lastName: "User",
        createdAt: new Date("2025-01-01T00:00:00Z"),
        plan: "FREE" as const,
      },
    };
    vi.mocked(loginService).mockResolvedValue(mockResponse);

    const request = createRequest({
      email: "test@example.com",
      password: "ValidP@ss1",
    });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.accessToken).toBe("jwt-token");
  });

  it("returns 400 for invalid email", async () => {
    const request = createRequest({
      email: "not-an-email",
      password: "ValidP@ss1",
    });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
  });

  it("returns 400 for missing password", async () => {
    const request = createRequest({ email: "test@example.com" });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
  });

  it("returns 401 for invalid credentials", async () => {
    vi.mocked(loginService).mockRejectedValue(
      new (await import("@/lib/errors")).AppError("Invalid email or password", 401),
    );

    const request = createRequest({
      email: "test@example.com",
      password: "WrongP@ss1",
    });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe("Invalid email or password");
  });
});

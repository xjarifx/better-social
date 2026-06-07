import { describe, it, expect } from "vitest";
import { AuthError, AppError, handleApiError, successResponse } from "@/lib/errors";

describe("AuthError", () => {
  it("creates an error with the correct name", () => {
    const error = new AuthError("Unauthorized");
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("AuthError");
    expect(error.message).toBe("Unauthorized");
  });
});

describe("AppError", () => {
  it("creates an error with default status 400", () => {
    const error = new AppError("Bad request");
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("AppError");
    expect(error.statusCode).toBe(400);
  });

  it("creates an error with a custom status code", () => {
    const error = new AppError("Not found", 404);
    expect(error.statusCode).toBe(404);
  });
});

describe("handleApiError", () => {
  it("returns 401 for AuthError", async () => {
    const response = handleApiError(new AuthError("Unauthorized"));
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body).toEqual({
      success: false,
      data: null,
      error: "Unauthorized",
    });
  });

  it("returns the custom status for AppError", async () => {
    const response = handleApiError(new AppError("Not found", 404));
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body).toEqual({
      success: false,
      data: null,
      error: "Not found",
    });
  });

  it("returns 500 for unknown errors", async () => {
    const response = handleApiError(new Error("Something broke"));
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body).toEqual({
      success: false,
      data: null,
      error: "Internal server error",
    });
  });
});

describe("successResponse", () => {
  it("returns a 200 JSON response with data", async () => {
    const data = { id: "1", name: "test" };
    const response = successResponse(data);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({
      success: true,
      data,
      error: null,
    });
  });

  it("returns a custom status when provided", async () => {
    const response = successResponse({}, 201);
    expect(response.status).toBe(201);
  });
});

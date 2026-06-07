import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { AuthError } from "@/lib/errors";

vi.mock("@/services/posts", () => ({
  createPost: vi.fn(),
  getFeed: vi.fn(),
}));

vi.mock("@/utils/auth", () => ({
  authenticateRequest: vi.fn(),
}));

const { createPost: createPostService, getFeed } = await import(
  "@/services/posts"
);
const { authenticateRequest } = await import("@/utils/auth");
const { GET, POST } = await import("@/app/api/posts/route");

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(authenticateRequest).mockReturnValue({ userId: "user-1" });
});

describe("GET /api/posts", () => {
  it("returns feed posts", async () => {
    vi.mocked(getFeed).mockResolvedValue([
      {
        id: "post-1",
        content: "Feed post",
        imageUrl: null,
        visibility: "PUBLIC",
        author: {
          id: "user-2",
          username: "other",
          email: "other@test.com",
          firstName: "Other",
          lastName: "User",
          plan: "FREE",
        },
        likesCount: 0,
        commentsCount: 0,
        likes: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const request = new NextRequest(
      "http://localhost:3000/api/posts?limit=20&offset=0",
    );
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(1);
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(authenticateRequest).mockImplementation(() => {
      throw new AuthError("Authentication required");
    });

    const request = new NextRequest("http://localhost:3000/api/posts");
    const response = await GET(request);
    expect(response.status).toBe(401);
  });
});

describe("POST /api/posts", () => {
  it("creates a post with text content", async () => {
    vi.mocked(createPostService).mockResolvedValue({
      id: "post-1",
      content: "New post",
      imageUrl: null,
      visibility: "PUBLIC",
      author: {
        id: "user-1",
        username: "testuser",
        email: "test@example.com",
        firstName: "Test",
        lastName: "User",
      },
      likesCount: 0,
      commentsCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const formData = new FormData();
    formData.append("content", "New post");
    const request = new NextRequest("http://localhost:3000/api/posts", {
      method: "POST",
      body: formData,
    });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.content).toBe("New post");
  });

  it("returns 401 when not authenticated for POST", async () => {
    vi.mocked(authenticateRequest).mockImplementation(() => {
      throw new AuthError("Authentication required");
    });

    const formData = new FormData();
    formData.append("content", "Test");
    const request = new NextRequest("http://localhost:3000/api/posts", {
      method: "POST",
      body: formData,
    });
    const response = await POST(request);
    expect(response.status).toBe(401);
  });
});

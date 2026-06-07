import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { transformPost } from "@/lib/transformPost";
import type { Post } from "@/types/api";

const basePost: Post = {
  id: "post-1",
  content: "Hello world",
  imageUrl: null,
  visibility: "PUBLIC",
  likesCount: 5,
  commentsCount: 2,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  author: {
    id: "user-1",
    username: "testuser",
    email: "test@example.com",
    firstName: "Test",
    lastName: "User",
    createdAt: new Date().toISOString(),
    plan: "FREE",
  },
  likes: ["user-1", "user-2"],
};

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2025-06-01T12:00:00Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("transformPost", () => {
  it("transforms a post with all fields", () => {
    const result = transformPost(basePost, "user-1");

    expect(result.id).toBe("post-1");
    expect(result.content).toBe("Hello world");
    expect(result.author.name).toBe("Test User");
    expect(result.author.handle).toBe("testuser");
    expect(result.likes).toBe(5);
    expect(result.replies).toBe(2);
    expect(result.liked).toBe(true);
  });

  it("sets liked=false when currentUserId does not match", () => {
    const result = transformPost(basePost, "other-user");
    expect(result.liked).toBe(false);
  });

  it("sets liked=false when no currentUserId", () => {
    const result = transformPost(basePost);
    expect(result.liked).toBe(false);
  });

  it("handles missing author fields", () => {
    const minimalPost: Post = {
      id: "post-2",
      content: "Minimal",
      likesCount: 0,
      commentsCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      author: {
        id: "user-2",
        username: "minimaluser",
        email: "min@test.com",
        firstName: "",
        lastName: "",
        createdAt: new Date().toISOString(),
        plan: "FREE",
      },
    };

    const result = transformPost(minimalPost);
    expect(result.author.name).toBe("minimaluser");
  });

  it("handles null author", () => {
    const post: Post = {
      id: "post-3",
      content: "No author",
      likesCount: 0,
      commentsCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = transformPost(post);
    expect(result.author.name).toBe("Unknown");
    expect(result.author.handle).toBe("user");
  });

  it("formats recent posts in hours", () => {
    const recentPost: Post = {
      ...basePost,
      createdAt: new Date("2025-06-01T10:00:00Z").toISOString(),
    };

    const result = transformPost(recentPost);
    expect(result.timestamp).toBe("2h");
  });

  it("formats older posts by date", () => {
    const oldPost: Post = {
      ...basePost,
      createdAt: new Date("2025-05-15T12:00:00Z").toISOString(),
    };

    const result = transformPost(oldPost);
    expect(result.timestamp).toMatch(/^[A-Z][a-z]{2}\s\d{1,2}$/);
  });

  it("resolves relative image URLs", () => {
    const postWithImage: Post = {
      ...basePost,
      imageUrl: "/uploads/image.png",
    };

    const result = transformPost(postWithImage);
    expect(result.image).toContain("/uploads/image.png");
  });

  it("keeps absolute image URLs as-is", () => {
    const postWithImage: Post = {
      ...basePost,
      imageUrl: "https://cdn.example.com/image.png",
    };

    const result = transformPost(postWithImage);
    expect(result.image).toBe("https://cdn.example.com/image.png");
  });
});

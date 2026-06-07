import { describe, it, expect, beforeEach, vi } from "vitest";

const mockFindFirst = vi.fn();
const mockFindUnique = vi.fn();
const mockFindMany = vi.fn();
const mockCount = vi.fn();
const mockCreate = vi.fn();
const mockUpdate = vi.fn();
const mock$transaction = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    post: {
      findFirst: mockFindFirst,
      findUnique: mockFindUnique,
      update: vi.fn(),
    },
    like: {
      findFirst: mockFindFirst,
      findUnique: mockFindUnique,
      findMany: mockFindMany,
      create: mockCreate,
      update: mockUpdate,
      count: mockCount,
    },
    $transaction: mock$transaction,
  },
}));

const { likePost, unlikePost, getPostLikes } = await import(
  "@/services/likes"
);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("likePost", () => {
  const userId = "user-1";
  const postId = "post-1";

  it("likes a post successfully", async () => {
    mockFindFirst
      .mockResolvedValueOnce({ id: postId, authorId: "user-2" })
      .mockResolvedValueOnce(null);
    mock$transaction.mockImplementation(async (cb: (tx: any) => unknown) => {
      const tx = {
        like: { findFirst: vi.fn().mockResolvedValue(null), create: mockCreate },
        post: { update: vi.fn() },
      };
      return cb(tx);
    });

    const result = await likePost(userId, { postId });
    expect(result.message).toBe("Post liked successfully");
    expect(result.userId).toBe(userId);
  });

  it("throws if post not found", async () => {
    mockFindFirst.mockResolvedValueOnce(null);
    await expect(likePost(userId, { postId })).rejects.toThrow(
      "Post not found",
    );
  });

  it("throws if already liked", async () => {
    mockFindFirst
      .mockResolvedValueOnce({ id: postId })
      .mockResolvedValueOnce({ id: "like-1" });
    await expect(likePost(userId, { postId })).rejects.toThrow(
      "Post already liked",
    );
  });
});

describe("unlikePost", () => {
  const userId = "user-1";
  const postId = "post-1";

  it("unlikes a post successfully", async () => {
    mockFindFirst.mockResolvedValueOnce({ id: postId });
    mockFindUnique.mockResolvedValueOnce({ id: "like-1" });
    mock$transaction.mockImplementation(async (cb: (tx: any) => unknown) => {
      const tx = {
        like: { update: vi.fn() },
        post: { update: vi.fn() },
      };
      return cb(tx);
    });

    const result = await unlikePost(userId, { postId });
    expect(result.message).toBe("Post unliked successfully");
  });

  it("throws if post not found", async () => {
    mockFindFirst.mockResolvedValueOnce(null);
    await expect(unlikePost(userId, { postId })).rejects.toThrow(
      "Post not found",
    );
  });

  it("throws if like not found", async () => {
    mockFindFirst.mockResolvedValueOnce({ id: postId });
    mockFindUnique.mockResolvedValueOnce(null);
    await expect(unlikePost(userId, { postId })).rejects.toThrow(
      "Like not found",
    );
  });
});

describe("getPostLikes", () => {
  const postId = "post-1";

  it("returns paginated likes", async () => {
    mockFindUnique.mockResolvedValueOnce({ id: postId });
    mockFindMany.mockResolvedValueOnce([
      {
        id: "like-1",
        userId: "user-1",
        postId,
        createdAt: new Date(),
        user: { id: "user-1", username: "testuser", firstName: "Test", lastName: "User" },
      },
    ]);
    mockCount.mockResolvedValueOnce(1);

    const result = await getPostLikes({ postId }, { limit: 20, offset: 0 });
    expect(result.total).toBe(1);
    expect(result.likes).toHaveLength(1);
  });

  it("throws if post not found", async () => {
    mockFindUnique.mockResolvedValueOnce(null);
    await expect(getPostLikes({ postId }, {})).rejects.toThrow(
      "Post not found",
    );
  });
});

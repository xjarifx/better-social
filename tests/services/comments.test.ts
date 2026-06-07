import { describe, it, expect, beforeEach, vi } from "vitest";

const mockFindFirst = vi.fn();
const mockFindMany = vi.fn();
const mockCount = vi.fn();
const mockCreate = vi.fn();
const mockUpdate = vi.fn();
const mock$transaction = vi.fn();
const mockFindUnique = vi.fn();
const mockCommentLikeCreate = vi.fn();
const mockCommentLikeDelete = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    post: {
      findFirst: mockFindFirst,
      update: vi.fn(),
    },
    comment: {
      findFirst: mockFindFirst,
      findMany: mockFindMany,
      create: mockCreate,
      update: mockUpdate,
      count: mockCount,
    },
    commentLike: {
      findUnique: mockFindUnique,
      create: mockCommentLikeCreate,
      delete: mockCommentLikeDelete,
    },
    $transaction: mock$transaction,
  },
}));

const {
  createComment,
  getComments,
  updateComment,
  deleteComment,
} = await import("@/services/comments");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("createComment", () => {
  const userId = "user-1";

  it("creates a top-level comment", async () => {
    mockFindFirst.mockResolvedValueOnce({ id: "post-1", authorId: "user-2" });
    mock$transaction.mockImplementation(async (cb: (tx: any) => unknown) => {
      const tx = {
        comment: {
          create: mockCreate.mockResolvedValue({
            id: "comment-1",
            content: "Great post!",
            authorId: userId,
            postId: "post-1",
            parentId: null,
            likesCount: 0,
            createdAt: new Date(),
            author: {
              id: userId,
              username: "testuser",
              firstName: "Test",
              lastName: "User",
              plan: "FREE",
            },
            _count: { replies: 0 },
          }),
        },
        post: { update: vi.fn() },
      };
      return cb(tx);
    });

    const result = await createComment(userId, {
      postId: "post-1",
      content: "Great post!",
    });
    expect(result.content).toBe("Great post!");
  });

  it("throws if post not found", async () => {
    mockFindFirst.mockResolvedValueOnce(null);
    await expect(
      createComment(userId, { postId: "post-1", content: "Nice" }),
    ).rejects.toThrow("Post not found");
  });

  it("throws if parent comment not found", async () => {
    mockFindFirst
      .mockResolvedValueOnce({ id: "post-1", authorId: "user-2" })
      .mockResolvedValueOnce(null);
    await expect(
      createComment(userId, {
        postId: "post-1",
        content: "Reply",
        parentId: "bad-id",
      }),
    ).rejects.toThrow("Parent comment not found");
  });

  it("throws if replying to a reply", async () => {
    mockFindFirst
      .mockResolvedValueOnce({ id: "post-1", authorId: "user-2" })
      .mockResolvedValueOnce({ id: "c1", parentId: "c0" });
    await expect(
      createComment(userId, {
        postId: "post-1",
        content: "Nested reply",
        parentId: "c1",
      }),
    ).rejects.toThrow("Cannot reply to a reply");
  });
});

describe("getComments", () => {
  it("returns paginated comments", async () => {
    mockFindFirst.mockResolvedValueOnce({ id: "post-1" });
    mockCount.mockResolvedValueOnce(1);
    mockFindMany.mockResolvedValueOnce([
      {
        id: "comment-1",
        content: "Nice!",
        author: {
          id: "user-2",
          username: "other",
          firstName: "Other",
          lastName: "User",
          plan: "FREE",
        },
        _count: { replies: 0 },
        postId: "post-1",
        parentId: null,
        likesCount: 0,
        createdAt: new Date(),
      },
    ]);

    const result = await getComments("user-1", { postId: "post-1" }, {});
    expect(result.comments).toHaveLength(1);
    expect(result.total).toBe(1);
  });
});

describe("updateComment", () => {
  it("updates own comment", async () => {
    mockFindFirst.mockResolvedValueOnce({
      id: "comment-1",
      authorId: "user-1",
    });
    mockUpdate.mockResolvedValue({
      id: "comment-1",
      content: "Updated",
      author: { id: "user-1", username: "testuser" },
      _count: { replies: 0 },
      postId: "post-1",
      parentId: null,
      likesCount: 0,
      createdAt: new Date(),
    });

    const result = await updateComment(
      "user-1",
      { commentId: "comment-1" },
      { content: "Updated" },
    );
    expect(result.content).toBe("Updated");
  });

  it("throws when updating another's comment", async () => {
    mockFindFirst.mockResolvedValueOnce({
      id: "comment-1",
      authorId: "user-2",
    });
    await expect(
      updateComment(
        "user-1",
        { commentId: "comment-1" },
        { content: "Hacked" },
      ),
    ).rejects.toThrow("Cannot update other user's comment");
  });
});

describe("deleteComment", () => {
  it("deletes own comment", async () => {
    mockFindFirst.mockResolvedValueOnce({
      id: "comment-1",
      authorId: "user-1",
      postId: "post-1",
    });
    mockFindMany.mockResolvedValueOnce([]);
    mock$transaction.mockImplementation(async (cb: (tx: any) => unknown) => {
      const tx = {
        comment: { update: vi.fn() },
        post: { update: vi.fn() },
      };
      return cb(tx);
    });

    const result = await deleteComment("user-1", { commentId: "comment-1" });
    expect(result.message).toBe("Comment deleted successfully");
  });
});

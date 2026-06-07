import { describe, it, expect, beforeEach, vi } from "vitest";

const mockUserFindFirst = vi.fn();
const mockPostFindFirst = vi.fn();
const mockPostFindMany = vi.fn();
const mockPostCreate = vi.fn();
const mockPostUpdate = vi.fn();
const mockPostDelete = vi.fn();
const mockBlockFindMany = vi.fn();
const mockFollowerFindMany = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findFirst: mockUserFindFirst },
    post: {
      findFirst: mockPostFindFirst,
      findMany: mockPostFindMany,
      create: mockPostCreate,
      update: mockPostUpdate,
      delete: mockPostDelete,
    },
    block: { findMany: mockBlockFindMany },
    follower: { findMany: mockFollowerFindMany },
  },
}));

vi.mock("@/services/billing", () => ({
  syncUserPlanExpiration: vi.fn().mockResolvedValue(undefined),
}));

const {
  createPost,
  getPostById,
  updatePost,
  deletePost,
  getFeed,
} = await import("@/services/posts");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("createPost", () => {
  const userId = "user-1";

  it("creates a public post successfully", async () => {
    mockUserFindFirst.mockResolvedValue({ plan: "FREE" });
    mockPostCreate.mockResolvedValue({
      id: "post-1",
      content: "Hello world",
      imageUrl: null,
      visibility: "PUBLIC",
      authorId: userId,
      likesCount: 0,
      commentsCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      author: {
        id: userId,
        username: "testuser",
        email: "test@example.com",
        firstName: "Test",
        lastName: "User",
      },
    });

    const result = await createPost(userId, { content: "Hello world" });
    expect(result.content).toBe("Hello world");
    expect(result.visibility).toBe("PUBLIC");
  });

  it("throws if content is empty and no file", async () => {
    await expect(createPost(userId, { content: "" })).rejects.toThrow(
      "Post must include text or an image",
    );
  });

  it("throws if user not found", async () => {
    mockUserFindFirst.mockResolvedValue(null);
    await expect(createPost(userId, { content: "Test" })).rejects.toThrow(
      "User not found",
    );
  });

  it("enforces Free plan character limit", async () => {
    mockUserFindFirst.mockResolvedValue({ plan: "FREE" });
    await expect(
      createPost(userId, { content: "a".repeat(21) }),
    ).rejects.toThrow("Free plan limit of 20 characters");
  });

  it("enforces PRO plan character limit", async () => {
    mockUserFindFirst.mockResolvedValue({ plan: "PRO" });
    await expect(
      createPost(userId, { content: "a".repeat(101) }),
    ).rejects.toThrow("Pro plan limit of 100 characters");
  });

  it("allows PRO users up to 100 characters", async () => {
    mockUserFindFirst.mockResolvedValue({ plan: "PRO" });
    mockPostCreate.mockResolvedValue({
      id: "post-2",
      content: "a".repeat(100),
      imageUrl: null,
      visibility: "PUBLIC",
      authorId: userId,
      likesCount: 0,
      commentsCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      author: {
        id: userId,
        username: "testuser",
        email: "test@example.com",
        firstName: "Test",
        lastName: "User",
      },
    });

    const result = await createPost(userId, { content: "a".repeat(100) });
    expect(result.content.length).toBe(100);
  });

  it("creates a private post when specified", async () => {
    mockUserFindFirst.mockResolvedValue({ plan: "FREE" });
    mockPostCreate.mockResolvedValue({
      id: "post-1",
      content: "Private",
      imageUrl: null,
      visibility: "PRIVATE",
      authorId: userId,
      likesCount: 0,
      commentsCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      author: {
        id: userId,
        username: "testuser",
        email: "test@example.com",
        firstName: "Test",
        lastName: "User",
      },
    });

    const result = await createPost(userId, {
      content: "Private",
      visibility: "PRIVATE",
    });
    expect(result.visibility).toBe("PRIVATE");
  });
});

describe("getPostById", () => {
  const postId = "post-1";
  const userId = "user-1";

  it("returns a post when found", async () => {
    mockPostFindFirst.mockResolvedValue({
      id: postId,
      content: "Test post",
      imageUrl: null,
      visibility: "PUBLIC",
      authorId: userId,
      likesCount: 5,
      commentsCount: 2,
      createdAt: new Date(),
      updatedAt: new Date(),
      author: { id: userId, username: "testuser" },
      comments: [],
      likes: [{ userId: "user-2" }],
    });

    const result = await getPostById({ postId }, userId);
    expect(result.id).toBe(postId);
    expect(result.content).toBe("Test post");
  });

  it("throws if post not found", async () => {
    mockPostFindFirst.mockResolvedValue(null);
    await expect(getPostById({ postId })).rejects.toThrow("Post not found");
  });

  it("blocks access to private posts for other users", async () => {
    mockPostFindFirst.mockResolvedValue({
      id: postId,
      visibility: "PRIVATE",
      authorId: "user-2",
    });
    await expect(getPostById({ postId }, userId)).rejects.toThrow(
      "Post is private",
    );
  });

  it("allows author to view their own private post", async () => {
    mockPostFindFirst.mockResolvedValue({
      id: postId,
      content: "My private post",
      imageUrl: null,
      visibility: "PRIVATE",
      authorId: userId,
      likesCount: 0,
      commentsCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      author: { id: userId, username: "testuser" },
      comments: [],
      likes: [],
    });

    const result = await getPostById({ postId }, userId);
    expect(result.content).toBe("My private post");
  });
});

describe("updatePost", () => {
  const userId = "user-1";
  const postId = "post-1";

  it("updates a post successfully", async () => {
    mockPostFindFirst.mockResolvedValueOnce({ id: postId, authorId: userId });
    mockUserFindFirst.mockResolvedValueOnce({ plan: "FREE" });
    mockPostUpdate.mockResolvedValue({
      id: postId,
      content: "Updated content",
      imageUrl: null,
      visibility: "PUBLIC",
      authorId: userId,
      likesCount: 0,
      commentsCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      author: { id: userId, username: "testuser" },
    });

    const result = await updatePost(
      userId,
      { postId },
      { content: "Updated content" },
    );
    expect(result.content).toBe("Updated content");
  });

  it("throws when updating another user's post", async () => {
    mockPostFindFirst.mockResolvedValueOnce({
      id: postId,
      authorId: "user-2",
    });
    await expect(
      updatePost(userId, { postId }, { content: "Hacked" }),
    ).rejects.toThrow("Cannot update other user's post");
  });
});

describe("deletePost", () => {
  const userId = "user-1";
  const postId = "post-1";

  it("deletes a post successfully", async () => {
    mockPostFindFirst.mockResolvedValueOnce({
      id: postId,
      authorId: userId,
    });
    mockPostDelete.mockResolvedValue({ id: postId });

    const result = await deletePost(userId, { postId });
    expect(result.message).toBe("Post deleted successfully");
  });

  it("throws when deleting another user's post", async () => {
    mockPostFindFirst.mockResolvedValueOnce({
      id: postId,
      authorId: "user-2",
    });
    await expect(deletePost(userId, { postId })).rejects.toThrow(
      "Cannot delete other user's post",
    );
  });
});

describe("getFeed", () => {
  it("returns feed posts for a user", async () => {
    mockBlockFindMany.mockResolvedValue([]);
    mockFollowerFindMany.mockResolvedValue([{ followingId: "user-2" }]);
    mockPostFindMany.mockResolvedValue([
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
        likes: [{ userId: "user-3" }],
        likesCount: 1,
        commentsCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const posts = await getFeed("user-1", { limit: 20, offset: 0 });
    expect(posts).toHaveLength(1);
    expect(posts[0].content).toBe("Feed post");
  });

  it("returns empty feed when not following anyone", async () => {
    mockBlockFindMany.mockResolvedValue([]);
    mockFollowerFindMany.mockResolvedValue([]);
    mockPostFindMany.mockResolvedValue([]);

    const posts = await getFeed("user-1", { limit: 20, offset: 0 });
    expect(posts).toHaveLength(0);
  });
});

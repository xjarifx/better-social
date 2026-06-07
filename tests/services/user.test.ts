import { describe, it, expect, beforeEach, vi } from "vitest";

const mockUserFindFirst = vi.fn();
const mockUserFindMany = vi.fn();
const mockUserCount = vi.fn();
const mockUserUpdate = vi.fn();
const mockBlockFindFirst = vi.fn();
const mockFollowerFindMany = vi.fn();
const mockPostFindMany = vi.fn();
const mockPostCount = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findFirst: mockUserFindFirst,
      findMany: mockUserFindMany,
      count: mockUserCount,
      update: mockUserUpdate,
    },
    block: { findFirst: mockBlockFindFirst },
    follower: { findMany: mockFollowerFindMany },
    post: {
      findMany: mockPostFindMany,
      count: mockPostCount,
    },
  },
}));

vi.mock("@/services/billing", () => ({
  syncUserPlanExpiration: vi.fn().mockResolvedValue(undefined),
}));

const {
  getProfile,
  updateProfile,
  getUserPosts,
  searchUsers,
  getUserFollowers,
  getUserFollowing,
} = await import("@/services/user");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getProfile", () => {
  it("returns a user profile", async () => {
    mockUserFindFirst.mockResolvedValue({
      id: "user-1",
      username: "testuser",
      email: "test@example.com",
      firstName: "Test",
      lastName: "User",
      createdAt: new Date(),
      plan: "FREE",
    });

    const result = await getProfile("user-1");
    expect(result.username).toBe("testuser");
  });

  it("throws if user not found", async () => {
    mockUserFindFirst.mockResolvedValue(null);
    await expect(getProfile("user-1")).rejects.toThrow("User not found");
  });
});

describe("updateProfile", () => {
  it("updates user profile", async () => {
    mockUserFindFirst.mockResolvedValue({ id: "user-1" });
    mockUserUpdate.mockResolvedValue({
      id: "user-1",
      username: "testuser",
      email: "test@example.com",
      firstName: "Updated",
      lastName: "User",
      createdAt: new Date(),
    });

    const result = await updateProfile("user-1", { firstName: "Updated" });
    expect(result.firstName).toBe("Updated");
  });
});

describe("getUserPosts", () => {
  it("returns paginated posts for the user", async () => {
    mockUserFindFirst.mockResolvedValue({ id: "user-1" });
    mockPostFindMany.mockResolvedValue([
      {
        id: "post-1",
        content: "Hello",
        authorId: "user-1",
        imageUrl: null,
        visibility: "PUBLIC",
        likesCount: 0,
        commentsCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        author: { id: "user-1", username: "testuser", plan: "FREE" },
        likes: [],
      },
    ]);
    mockPostCount.mockResolvedValue(1);

    const result = await getUserPosts("user-1", 10, 0);
    expect(result.posts).toHaveLength(1);
    expect(result.total).toBe(1);
  });

  it("returns empty array when blocked viewer", async () => {
    mockUserFindFirst.mockResolvedValue({ id: "user-1" });
    mockBlockFindFirst.mockResolvedValue({ id: "block-1" });

    const result = await getUserPosts("user-1", 10, 0, "viewer-1");
    expect(result.posts).toEqual([]);
    expect(result.total).toBe(0);
  });

  it("throws if user not found", async () => {
    mockUserFindFirst.mockResolvedValue(null);
    await expect(getUserPosts("nonexistent", 10, 0)).rejects.toThrow(
      "User not found",
    );
  });
});

describe("searchUsers", () => {
  it("searches users by name", async () => {
    mockUserFindMany.mockResolvedValue([
      {
        id: "user-1",
        username: "johndoe",
        firstName: "John",
        lastName: "Doe",
        email: "john@test.com",
        plan: "FREE",
        createdAt: new Date(),
      },
    ]);
    mockUserCount.mockResolvedValue(1);

    const result = await searchUsers("john");
    expect(result.results).toHaveLength(1);
    expect(result.total).toBe(1);
  });

  it("returns empty results for no match", async () => {
    mockUserFindMany.mockResolvedValue([]);
    mockUserCount.mockResolvedValue(0);

    const result = await searchUsers("nonexistent");
    expect(result.results).toEqual([]);
    expect(result.total).toBe(0);
  });
});

describe("getUserFollowers", () => {
  it("returns followers list", async () => {
    mockFollowerFindMany.mockResolvedValue([
      {
        id: "follow-1",
        createdAt: new Date(),
        follower: {
          id: "user-2",
          username: "follower1",
          firstName: "F",
          lastName: "User",
        },
      },
    ]);

    const result = await getUserFollowers("user-1");
    expect(result).toHaveLength(1);
    expect(result[0].follower?.username).toBe("follower1");
  });
});

describe("getUserFollowing", () => {
  it("returns following list", async () => {
    mockFollowerFindMany.mockResolvedValue([
      {
        id: "follow-1",
        createdAt: new Date(),
        following: {
          id: "user-3",
          username: "following1",
          firstName: "F",
          lastName: "User",
        },
      },
    ]);

    const result = await getUserFollowing("user-1");
    expect(result).toHaveLength(1);
    expect(result[0].user?.username).toBe("following1");
  });
});

import { describe, it, expect, beforeEach, vi } from "vitest";

const mockUserFindFirst = vi.fn();
const mockBlockFindFirst = vi.fn();
const mockFollowerFindFirst = vi.fn();
const mockFollowerCreate = vi.fn();
const mockFollowerDelete = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findFirst: mockUserFindFirst },
    block: { findFirst: mockBlockFindFirst },
    follower: {
      findFirst: mockFollowerFindFirst,
      create: mockFollowerCreate,
      delete: mockFollowerDelete,
    },
  },
}));

const { followUser, unfollowUser } = await import("@/services/follows");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("followUser", () => {
  const followerId = "user-1";
  const followingId = "user-2";

  it("follows a user successfully", async () => {
    mockUserFindFirst.mockResolvedValue({ id: followingId });
    mockBlockFindFirst.mockResolvedValue(null);
    mockFollowerFindFirst.mockResolvedValue(null);
    mockFollowerCreate.mockResolvedValue({ id: "follow-1", followerId, followingId });

    const result = await followUser(followerId, followingId);
    expect(result.followerId).toBe(followerId);
  });

  it("throws when following yourself", async () => {
    await expect(followUser(followerId, followerId)).rejects.toThrow(
      "Cannot follow yourself",
    );
  });

  it("throws if user does not exist", async () => {
    mockUserFindFirst.mockResolvedValue(null);
    await expect(followUser(followerId, followingId)).rejects.toThrow(
      "User not found",
    );
  });

  it("throws if already following", async () => {
    mockUserFindFirst.mockResolvedValue({ id: followingId });
    mockBlockFindFirst.mockResolvedValue(null);
    mockFollowerFindFirst.mockResolvedValue({ id: "existing" });
    await expect(followUser(followerId, followingId)).rejects.toThrow(
      "Already following this user",
    );
  });
});

describe("unfollowUser", () => {
  const followerId = "user-1";
  const followingId = "user-2";

  it("unfollows a user successfully", async () => {
    mockFollowerFindFirst.mockResolvedValue({ id: "follow-1", followerId, followingId });
    mockFollowerDelete.mockResolvedValue({ id: "follow-1" });

    const result = await unfollowUser(followerId, followingId);
    expect(result.deleted).toBe(true);
  });

  it("throws if follow relationship not found", async () => {
    mockFollowerFindFirst.mockResolvedValue(null);
    await expect(unfollowUser(followerId, followingId)).rejects.toThrow(
      "Follow relationship not found",
    );
  });
});

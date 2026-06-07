import { describe, it, expect, beforeEach, vi } from "vitest";

const mockFindFirst = vi.fn();
const mockFindMany = vi.fn();
const mockCreate = vi.fn();
const mockDelete = vi.fn();
const mockDeleteMany = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findFirst: mockFindFirst },
    block: {
      findFirst: mockFindFirst,
      findMany: mockFindMany,
      create: mockCreate,
      delete: mockDelete,
    },
    follower: { deleteMany: mockDeleteMany },
  },
}));

const { blockUser, unblockUser, getBlockedUsers, checkBlockStatus } =
  await import("@/services/blocks");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("blockUser", () => {
  const blockerId = "user-1";
  const username = "targetuser";

  it("blocks a user successfully", async () => {
    mockFindFirst
      .mockResolvedValueOnce({ id: "user-2", username })
      .mockResolvedValueOnce(null);
    mockCreate.mockResolvedValue({ id: "block-1", blockerId, blockedId: "user-2" });

    const result = await blockUser(blockerId, username);
    expect(result.blockerId).toBe(blockerId);
  });

  it("throws when blocking yourself", async () => {
    mockFindFirst.mockResolvedValueOnce({ id: blockerId, username });
    await expect(blockUser(blockerId, username)).rejects.toThrow(
      "Cannot block yourself",
    );
  });

  it("throws if user not found", async () => {
    mockFindFirst.mockResolvedValueOnce(null);
    await expect(blockUser(blockerId, username)).rejects.toThrow(
      "User not found",
    );
  });

  it("throws if user already blocked", async () => {
    mockFindFirst
      .mockResolvedValueOnce({ id: "user-2", username })
      .mockResolvedValueOnce({ id: "existing" });
    await expect(blockUser(blockerId, username)).rejects.toThrow(
      "User already blocked",
    );
  });
});

describe("unblockUser", () => {
  const blockerId = "user-1";
  const username = "targetuser";

  it("unblocks a user successfully", async () => {
    mockFindFirst
      .mockResolvedValueOnce({ id: "user-2", username })
      .mockResolvedValueOnce({ id: "block-1" });
    mockDelete.mockResolvedValue({ id: "block-1" });

    const result = await unblockUser(blockerId, username);
    expect(result.id).toBe("block-1");
  });

  it("throws if not blocked", async () => {
    mockFindFirst
      .mockResolvedValueOnce({ id: "user-2", username })
      .mockResolvedValueOnce(null);
    await expect(unblockUser(blockerId, username)).rejects.toThrow(
      "User is not blocked",
    );
  });
});

describe("getBlockedUsers", () => {
  it("returns blocked users", async () => {
    mockFindMany.mockResolvedValue([
      {
        blocked: {
          id: "user-2",
          username: "blockeduser",
          firstName: "Blocked",
          lastName: "User",
        },
      },
    ]);

    const result = await getBlockedUsers("user-1");
    expect(result).toHaveLength(1);
    expect(result[0].username).toBe("blockeduser");
  });
});

describe("checkBlockStatus", () => {
  it("returns not blocked when no block exists", async () => {
    mockFindFirst.mockResolvedValue(null);
    const result = await checkBlockStatus("user-1", "user-2");
    expect(result).toEqual({
      isBlocked: false,
      blockedByMe: false,
      blockedByThem: false,
    });
  });

  it("returns blocked by me", async () => {
    mockFindFirst.mockResolvedValue({
      blockerId: "user-1",
      blockedId: "user-2",
    });
    const result = await checkBlockStatus("user-1", "user-2");
    expect(result).toEqual({
      isBlocked: true,
      blockedByMe: true,
      blockedByThem: false,
    });
  });
});

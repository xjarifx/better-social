import { describe, it, expect, vi } from "vitest";
import type { ReactNode } from "react";
import { render, screen } from "@/test-utils/index";
import { PostCard } from "@/components/PostCard";

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "user-1", username: "testuser" },
    isAuthenticated: true,
  }),
  AuthProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock("@/context/BlockContext", () => ({
  useBlocks: () => ({
    blockedUsers: [],
    isBlocked: () => false,
    blockUser: vi.fn(),
    unblockUser: vi.fn(),
  }),
  BlockProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock("@/components/ActionButton", () => ({
  default: ({ children, ...props }: any) => (
    <button {...props}>{children}</button>
  ),
}));

const mockPost = {
  id: "post-1",
  authorId: "user-1",
  author: {
    name: "Test User",
    handle: "testuser",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=user-1",
  },
  content: "Hello world",
  timestamp: "2h",
  likes: 5,
  replies: 2,
  liked: false,
  visibility: "PUBLIC" as const,
};

describe("PostCard", () => {
  it("renders post content", () => {
    render(<PostCard {...mockPost} />);
    expect(screen.getByText("Hello world")).toBeTruthy();
  });

  it("renders author name and handle", () => {
    render(<PostCard {...mockPost} />);
    expect(screen.getByText("Test User")).toBeTruthy();
    expect(screen.getByText(/@testuser/)).toBeTruthy();
  });

  it("renders like and reply counts", () => {
    render(<PostCard {...mockPost} />);
    expect(screen.getByText("5")).toBeTruthy();
    expect(screen.getByText("2")).toBeTruthy();
  });

  it("renders timestamp", () => {
    render(<PostCard {...mockPost} />);
    expect(screen.getByText("2h")).toBeTruthy();
  });

  it("shows liked state", () => {
    render(<PostCard {...mockPost} liked={true} />);
    expect(screen.getByText("5")).toBeTruthy();
  });

  it("handles missing optional handlers gracefully", () => {
    render(<PostCard {...mockPost} />);
    expect(screen.getByText("Hello world")).toBeTruthy();
  });
});

import { describe, it, expect, beforeEach, vi } from "vitest";
import bcrypt from "bcryptjs";

const mockFindUnique = vi.fn();
const mockCreate = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: mockFindUnique,
      create: mockCreate,
    },
  },
}));

const { register, login } = await import("@/services/auth");

beforeEach(() => {
  vi.clearAllMocks();
  process.env.JWT_SECRET = "test-secret";
});

describe("register", () => {
  const validData = {
    email: "test@example.com",
    username: "testuser",
    password: "StrongP@ss1",
    firstName: "Test",
    lastName: "User",
  };

  it("registers a new user successfully", async () => {
    mockFindUnique.mockResolvedValue(null);
    mockFindUnique.mockResolvedValue(null);
    mockCreate.mockResolvedValue({
      id: "user-1",
      email: validData.email,
      username: validData.username,
      firstName: validData.firstName,
      lastName: validData.lastName,
      createdAt: new Date(),
      plan: "FREE",
    });

    const result = await register(validData);

    expect(result.user.email).toBe(validData.email);
    expect(result.user.username).toBe(validData.username);
    expect(result.accessToken).toBeTruthy();
    expect(typeof result.accessToken).toBe("string");
  });

  it("throws if email is taken", async () => {
    mockFindUnique.mockResolvedValueOnce({ id: "existing" });
    await expect(register(validData)).rejects.toThrow("Email already taken");
  });

  it("throws if username is taken", async () => {
    mockFindUnique.mockResolvedValueOnce(null);
    mockFindUnique.mockResolvedValueOnce({ id: "existing" });
    await expect(register(validData)).rejects.toThrow("Username already taken");
  });

  it("throws for short password", async () => {
    await expect(
      register({ ...validData, password: "Short1!" }),
    ).rejects.toThrow("Password must be at least 8 characters");
  });

  it("throws for password without uppercase", async () => {
    await expect(
      register({ ...validData, password: "weakpass1!" }),
    ).rejects.toThrow("Password must contain an uppercase letter");
  });

  it("throws for password without number", async () => {
    await expect(
      register({ ...validData, password: "WeakPasss!" }),
    ).rejects.toThrow("Password must contain a number");
  });

  it("throws for password without special char", async () => {
    await expect(
      register({ ...validData, password: "WeakPass1a" }),
    ).rejects.toThrow("Password must contain a special character");
  });
});

describe("login", () => {
  const email = "test@example.com";
  const password = "StrongP@ss1";
  const hashedPassword = bcrypt.hashSync(password, 10);

  it("logs in with valid credentials", async () => {
    mockFindUnique.mockResolvedValue({
      id: "user-1",
      email,
      username: "testuser",
      password: hashedPassword,
      firstName: "Test",
      lastName: "User",
      createdAt: new Date(),
      plan: "FREE",
    });

    const result = await login(email, password);

    expect(result.user.email).toBe(email);
    expect(result.accessToken).toBeTruthy();
  });

  it("throws for non-existent email", async () => {
    mockFindUnique.mockResolvedValue(null);
    await expect(login(email, password)).rejects.toThrow(
      "Invalid email or password",
    );
  });

  it("throws for wrong password", async () => {
    mockFindUnique.mockResolvedValue({
      id: "user-1",
      email,
      password: hashedPassword,
    });
    await expect(login(email, "WrongP@ss1")).rejects.toThrow(
      "Invalid email or password",
    );
  });
});

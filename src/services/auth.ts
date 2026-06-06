import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AppError } from "@/lib/errors";
const SALT_ROUNDS = 10;

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN?.trim() || "5m";

function getJwtSecret() {
  try {
    return process.env.JWT_SECRET!;
  } catch (error) {
    console.error("Missing auth environment variables.", error);
    throw new AppError(
      "Authentication service is temporarily unavailable. Please try again later.",
      503,
    );
  }
}

const generateToken = (userId: string): string => {
  const jwtSecret = getJwtSecret();
  return jwt.sign({ userId }, jwtSecret, {
    expiresIn: JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
};

function validatePasswordStrength(password: string) {
  if (password.length < 8) {
    throw new AppError("Password must be at least 8 characters", 400);
  }
  if (!/[A-Z]/.test(password)) {
    throw new AppError("Password must contain an uppercase letter", 400);
  }
  if (!/[0-9]/.test(password)) {
    throw new AppError("Password must contain a number", 400);
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    throw new AppError("Password must contain a special character", 400);
  }
}

export async function register(data: {
  email: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
}) {
  try {
    const { email, username, password, firstName, lastName } = data;
    validatePasswordStrength(password);

    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) throw new AppError("Email already taken", 409);

    const existingUsername = await prisma.user.findUnique({ where: { username } });
    if (existingUsername) throw new AppError("Username already taken", 409);

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await prisma.user.create({
      data: { email, username, password: hashedPassword, firstName, lastName },
    });

    const accessToken = generateToken(user.id);

    return {
      accessToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        createdAt: user.createdAt,
        plan: user.plan,
      },
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error("Unexpected error during register:", error);
    throw new AppError("An unexpected error occurred. Please try again.", 500);
  }
}

export async function login(email: string, password: string) {
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new AppError("Invalid email or password", 401);

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) throw new AppError("Invalid email or password", 401);

    const accessToken = generateToken(user.id);

    return {
      accessToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        createdAt: user.createdAt,
        plan: user.plan,
      },
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error("Unexpected error during login:", error);
    throw new AppError("An unexpected error occurred. Please try again.", 500);
  }
}

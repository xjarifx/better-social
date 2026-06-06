import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma";
import { AppError } from "@/lib/errors";

export async function likePost(
  userId: string,
  params: { postId: string },
) {
  const { postId } = params;

  const post = await prisma.post.findFirst({
    where: { id: postId, deletedAt: null },
    select: { id: true, authorId: true },
  });
  if (!post) throw new AppError("Post not found", 404);

  const existingLike = await prisma.like.findFirst({
    where: { userId, postId, deletedAt: null },
  });
  if (existingLike) throw new AppError("Post already liked", 400);

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const softDeleted = await tx.like.findFirst({
      where: { userId, postId, deletedAt: { not: null } },
    });

    if (softDeleted) {
      await tx.like.update({
        where: { id: softDeleted.id },
        data: { deletedAt: null },
      });
    } else {
      await tx.like.create({
        data: { userId, postId },
      });
    }

    await tx.post.update({
      where: { id: postId },
      data: { likesCount: { increment: 1 } },
    });
  });

  return { userId, postId, message: "Post liked successfully" };
}

export async function unlikePost(
  userId: string,
  params: { postId: string },
) {
  const { postId } = params;

  const post = await prisma.post.findFirst({ where: { id: postId, deletedAt: null } });
  if (!post) throw new AppError("Post not found", 404);

  const existingLike = await prisma.like.findUnique({
    where: { userId_postId: { userId, postId } },
  });
  if (!existingLike) throw new AppError("Like not found", 404);

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.like.update({
      where: { userId_postId: { userId, postId } },
      data: { deletedAt: new Date() },
    });
    await tx.post.update({
      where: { id: postId },
      data: { likesCount: { decrement: 1 } },
    });
  });

  return { message: "Post unliked successfully" };
}

export async function getPostLikes(
  params: { postId: string },
  query: { limit?: number; offset?: number },
) {
  const { postId } = params;
  const limit = query.limit ?? 20;
  const offset = query.offset ?? 0;

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) throw new AppError("Post not found", 404);

  const likes = await prisma.like.findMany({
    where: { postId },
    include: {
      user: {
        select: { id: true, username: true, firstName: true, lastName: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: offset,
  });

  const total = await prisma.like.count({ where: { postId } });

  return {
    likes: likes.map((l) => ({
      id: l.id,
      userId: l.userId,
      postId: l.postId,
      user: l.user,
      createdAt: l.createdAt,
    })),
    total,
    limit,
    offset,
  };
}

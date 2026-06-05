import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";

export async function likePost(
  userId: string,
  params: { postId: string },
) {
  const { postId } = params;

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true, authorId: true },
  });
  if (!post) throw new AppError("Post not found", 404);

  const existingLike = await prisma.like.findUnique({
    where: { userId_postId: { userId, postId } },
  });
  if (existingLike) throw new AppError("Post already liked", 400);

  const result = await prisma.$transaction(async (tx: any) => {
    const like = await tx.like.create({
      data: { userId, postId },
      include: {
        user: {
          select: { id: true, username: true, firstName: true, lastName: true },
        },
      },
    });

    await tx.post.update({
      where: { id: postId },
      data: { likesCount: { increment: 1 } },
    });

    return like;
  });

  return {
    id: result.id,
    userId: result.userId,
    postId: result.postId,
    user: result.user,
    createdAt: result.createdAt,
    message: "Post liked successfully",
  };
}

export async function unlikePost(
  userId: string,
  params: { postId: string },
) {
  const { postId } = params;

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) throw new AppError("Post not found", 404);

  const existingLike = await prisma.like.findUnique({
    where: { userId_postId: { userId, postId } },
  });
  if (!existingLike) throw new AppError("Like not found", 404);

  await prisma.$transaction(async (tx: any) => {
    await tx.like.delete({
      where: { userId_postId: { userId, postId } },
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
    likes: likes.map((l: any) => ({
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

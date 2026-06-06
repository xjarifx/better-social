import { prisma } from "@/shared/lib/prisma";
import { AppError } from "@/shared/lib/errors";

async function countCommentSubtree(commentId: string): Promise<number> {
  const visited = new Set<string>();
  let queue = [commentId];

  while (queue.length > 0) {
    const children = await prisma.comment.findMany({
      where: { parentId: { in: queue } },
      select: { id: true },
    });
    queue = [];
    for (const child of children) {
      if (!visited.has(child.id)) {
        visited.add(child.id);
        queue.push(child.id);
      }
    }
  }

  return 1 + visited.size;
}

export async function createComment(
  userId: string,
  body: { postId: string; content: string; parentId?: string | null },
) {
  const { postId, content, parentId } = body;
  const authorId = userId;

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true, authorId: true },
  });
  if (!post) throw new AppError("Post not found", 404);

  if (parentId) {
    const parent = await prisma.comment.findFirst({
      where: { id: parentId, postId },
    });
    if (!parent) throw new AppError("Parent comment not found", 404);
    if (parent.parentId) throw new AppError("Cannot reply to a reply", 400);
  }

  const result = await prisma.$transaction(async (tx: any) => {
    const comment = await tx.comment.create({
      data: {
        content,
        authorId,
        postId,
        ...(parentId && { parentId }),
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            plan: true,
          },
        },
        _count: { select: { replies: true } },
      },
    });

    await tx.post.update({
      where: { id: postId },
      data: { commentsCount: { increment: 1 } },
    });

    return comment;
  });

  return {
    id: result.id,
    content: result.content,
    author: result.author,
    postId: result.postId,
    parentId: result.parentId,
    likesCount: result.likesCount,
    repliesCount: result._count.replies,
    createdAt: result.createdAt,
  };
}

export async function getComments(
  userId: string,
  params: { postId: string },
  query: { limit?: number; offset?: number; parentId?: string | null },
) {
  const { postId } = params;
  const limit = query.limit ?? 10;
  const offset = query.offset ?? 0;
  const parentId = query.parentId ?? null;

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) throw new AppError("Post not found", 404);

  const total = await prisma.comment.count({
    where: { postId, parentId },
  });

  const includeAuthor = {
    author: {
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        plan: true,
      },
    },
    _count: { select: { replies: true } },
  };

  let comments: any[] = [];

  if (!userId) {
    comments = await prisma.comment.findMany({
      where: { postId, parentId },
      include: includeAuthor,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });
  } else {
    const userWhere = { postId, authorId: userId, parentId };
    const otherWhere = {
      postId,
      parentId,
      NOT: { authorId: userId },
    };
    const userCount = await prisma.comment.count({ where: userWhere });

    if (offset < userCount) {
      const userTake = Math.min(limit, userCount - offset);
      const userComments = await prisma.comment.findMany({
        where: userWhere,
        include: includeAuthor,
        orderBy: { createdAt: "desc" },
        take: userTake,
        skip: offset,
      });

      const remaining = limit - userTake;
      if (remaining > 0) {
        const otherComments = await prisma.comment.findMany({
          where: otherWhere,
          include: includeAuthor,
          orderBy: { createdAt: "desc" },
          take: remaining,
          skip: 0,
        });
        comments = [...userComments, ...otherComments];
      } else {
        comments = userComments;
      }
    } else {
      const otherOffset = offset - userCount;
      comments = await prisma.comment.findMany({
        where: otherWhere,
        include: includeAuthor,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: otherOffset,
      });
    }
  }

  const response = {
    comments: comments.map((c) => ({
      id: c.id,
      content: c.content,
      author: c.author,
      postId: c.postId,
      parentId: c.parentId,
      likesCount: c.likesCount,
      repliesCount: c._count.replies,
      createdAt: c.createdAt,
    })),
    total,
    limit,
    offset,
  };

  return response;
}

export async function updateComment(
  userId: string,
  params: { commentId: string },
  body: { content: string },
) {
  const { commentId } = params;
  const { content } = body;

  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment) throw new AppError("Comment not found", 404);
  if (comment.authorId !== userId) throw new AppError("Cannot update other user's comment", 403);

  const updatedComment = await prisma.comment.update({
    where: { id: commentId },
    data: { content },
    include: {
      author: {
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          plan: true,
        },
      },
      _count: { select: { replies: true } },
    },
  });

  return {
    id: updatedComment.id,
    content: updatedComment.content,
    author: updatedComment.author,
    postId: updatedComment.postId,
    parentId: updatedComment.parentId,
    likesCount: updatedComment.likesCount,
    repliesCount: updatedComment._count.replies,
    createdAt: updatedComment.createdAt,
  };
}

export async function deleteComment(
  userId: string,
  params: { commentId: string },
) {
  const { commentId } = params;

  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment) throw new AppError("Comment not found", 404);
  if (comment.authorId !== userId) throw new AppError("Cannot delete other user's comment", 403);

  const subtreeCount = await countCommentSubtree(commentId);

  await prisma.$transaction(async (tx: any) => {
    await tx.comment.delete({ where: { id: commentId } });
    await tx.post.update({
      where: { id: comment.postId },
      data: { commentsCount: { decrement: subtreeCount } },
    });
  });

  return { message: "Comment deleted successfully", deletedCount: subtreeCount };
}

export async function likeComment(
  userId: string,
  params: { postId: string; commentId: string },
) {
  const { postId, commentId } = params;

  const comment = await prisma.comment.findFirst({
    where: { id: commentId, postId },
  });
  if (!comment) throw new AppError("Comment not found", 404);

  const existingLike = await prisma.commentLike.findUnique({
    where: { userId_commentId: { userId, commentId } },
  });
  if (existingLike) throw new AppError("Comment already liked", 400);

  const result = await prisma.$transaction(async (tx: any) => {
    const like = await tx.commentLike.create({
      data: { userId, commentId },
    });
    await tx.comment.update({
      where: { id: commentId },
      data: { likesCount: { increment: 1 } },
    });
    return like;
  });

  return {
    id: result.id,
    userId: result.userId,
    commentId: result.commentId,
    createdAt: result.createdAt,
    message: "Comment liked successfully",
  };
}

export async function unlikeComment(
  userId: string,
  params: { postId: string; commentId: string },
) {
  const { postId, commentId } = params;

  const comment = await prisma.comment.findFirst({
    where: { id: commentId, postId },
  });
  if (!comment) throw new AppError("Comment not found", 404);

  const existingLike = await prisma.commentLike.findUnique({
    where: { userId_commentId: { userId, commentId } },
  });
  if (!existingLike) throw new AppError("Like not found", 404);

  await prisma.$transaction(async (tx: any) => {
    await tx.commentLike.delete({
      where: { userId_commentId: { userId, commentId } },
    });
    await tx.comment.update({
      where: { id: commentId },
      data: { likesCount: { decrement: 1 } },
    });
  });

  return { message: "Comment unliked successfully" };
}

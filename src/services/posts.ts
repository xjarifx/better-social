import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { syncUserPlanExpiration } from "@/services/billing";

const getPlanPostLimit = (plan: string | null | undefined): number =>
  plan === "PRO" ? 100 : 20;

function toArrayFromSet(set: Set<string>): string[] {
  return Array.from(set);
}

interface PostFeedItem {
  id: string;
  content: string;
  imageUrl: string | null;
  visibility: "PUBLIC" | "PRIVATE";
  author: {
    id: string;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    plan: "FREE" | "PRO";
  };
  likesCount: number;
  commentsCount: number;
  likes: { userId: string }[];
  createdAt: Date;
  updatedAt: Date;
}

function mapPost(post: PostFeedItem) {
  return {
    id: post.id,
    content: post.content,
    imageUrl: post.imageUrl,
    visibility: post.visibility,
    author: post.author,
    likesCount: post.likesCount,
    commentsCount: post.commentsCount,
    likes: post.likes.map((l) => l.userId),
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
  };
}

/** Returns PUBLIC posts from users the current user follows, excluding blocked users and self. Sorted by newest first. */
export async function getFeed(
  userId: string,
  query: { limit?: number; offset?: number },
) {
  const limit = query.limit ?? 20;
  const offset = query.offset ?? 0;

  const blockedRelationships = await prisma.block.findMany({
    where: {
      OR: [{ blockerId: userId }, { blockedId: userId }],
    },
    select: { blockerId: true, blockedId: true },
  });

  const blockedUserIds = new Set<string>();
  for (const block of blockedRelationships) {
    if (block.blockerId === userId) {
      blockedUserIds.add(block.blockedId);
    } else {
      blockedUserIds.add(block.blockerId);
    }
  }

  const posts = await prisma.post.findMany({
    where: {
      deletedAt: null,
      authorId: {
        not: userId,
        notIn: toArrayFromSet(blockedUserIds),
      },
      visibility: "PUBLIC",
      author: {
        deletedAt: null,
        followers: {
          some: { followerId: userId },
        },
      },
    },
    include: {
      author: {
        select: {
          id: true,
          username: true,
          email: true,
          firstName: true,
          lastName: true,
          plan: true,
        },
      },
      likes: { select: { userId: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: offset,
  });

  return posts.map(mapPost);
}

/** Returns PUBLIC posts from 2nd-degree connections (users followed by users you follow). */
export async function getForYouFeed(
  userId: string,
  query: { limit?: number; offset?: number },
) {
  const limit = query.limit ?? 20;
  const offset = query.offset ?? 0;

  const blockedRelationships = await prisma.block.findMany({
    where: {
      OR: [{ blockerId: userId }, { blockedId: userId }],
    },
    select: { blockerId: true, blockedId: true },
  });

  const blockedUserIds = new Set<string>();
  for (const block of blockedRelationships) {
    if (block.blockerId === userId) {
      blockedUserIds.add(block.blockedId);
    } else {
      blockedUserIds.add(block.blockerId);
    }
  }

  const directFollowing = await prisma.follower.findMany({
    where: { followerId: userId },
    select: { followingId: true },
  });

  if (directFollowing.length === 0) return [];

  const directFollowingIds = directFollowing.map((f) => f.followingId);
  const directFollowingSet = new Set(directFollowingIds);

  const secondDegree = await prisma.follower.findMany({
    where: { followerId: { in: directFollowingIds } },
    select: { followingId: true },
  });

  const secondDegreeIds = Array.from(
    new Set(secondDegree.map((f) => f.followingId)),
  );
  const filteredSecondDegreeIds = secondDegreeIds.filter(
    (id) =>
      id !== userId &&
      !directFollowingSet.has(id) &&
      !blockedUserIds.has(id),
  );

  if (filteredSecondDegreeIds.length === 0) return [];

  const posts = await prisma.post.findMany({
    where: {
      deletedAt: null,
      authorId: {
        in: filteredSecondDegreeIds,
        notIn: toArrayFromSet(blockedUserIds),
      },
      visibility: "PUBLIC",
      author: { deletedAt: null },
    },
    include: {
      author: {
        select: {
          id: true,
          username: true,
          email: true,
          firstName: true,
          lastName: true,
          plan: true,
        },
      },
      likes: { select: { userId: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: offset,
  });
  
  return posts.map(mapPost);
}

/** Creates a new post with optional image upload. Enforces per-plan character limits. */
export async function createPost(
  userId: string,
  body: { content: string; visibility?: string },
  file?: File | null,
) {
  await syncUserPlanExpiration(userId);

  const { content, visibility } = body;
  const authorId = userId;
  const normalizedContent = (content ?? "").trim();

  if (!normalizedContent && !file) {
    throw new AppError("Post must include text or an image", 400);
  }

  const user = await prisma.user.findFirst({
    where: { id: authorId, deletedAt: null },
    select: { plan: true },
  });
  if (!user) throw new AppError("User not found", 404);

  if (normalizedContent) {
    const limit = getPlanPostLimit(user.plan);
    if (normalizedContent.length > limit) {
      const planName = user.plan === "PRO" ? "Pro" : "Free";
      throw new AppError(
        `Post content exceeds ${planName} plan limit of ${limit} characters`,
        400,
      );
    }
  }

  let imageUrl: string | null = null;
  if (file) {
    const { uploadMedia } = await import("@/lib/imagekit");
    try {
      const uploadResult = await uploadMedia(file);
      imageUrl = uploadResult.url;
    } catch {
      throw new AppError("Unable to upload media", 500);
    }
  }

  const post = await prisma.post.create({
    data: {
      content: normalizedContent,
      authorId,
      imageUrl,
      visibility: visibility === "PRIVATE" ? "PRIVATE" : "PUBLIC",
    },
    include: {
      author: {
        select: {
          id: true,
          username: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  return {
    id: post.id,
    content: post.content,
    imageUrl: post.imageUrl,
    visibility: post.visibility,
    author: post.author,
    likesCount: post.likesCount,
    commentsCount: post.commentsCount,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
  };
}

export async function getPostById(
  params: { postId: string },
  userId?: string | null,
) {
  const { postId } = params;
  const requesterId = userId || "anon";

  const post = await prisma.post.findFirst({
    where: { id: postId, deletedAt: null, author: { deletedAt: null } },
    include: {
      author: {
        select: {
          id: true,
          username: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
      comments: {
        select: {
          id: true,
          content: true,
          author: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
            },
          },
          parentId: true,
          likesCount: true,
          _count: { select: { replies: true } },
          createdAt: true,
        },
        where: { parentId: null, deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      likes: { select: { userId: true } },
    },
  });

  if (!post) throw new AppError("Post not found", 404);

  if (post.visibility === "PRIVATE") {
    if (requesterId === "anon" || requesterId !== post.authorId) {
      throw new AppError("Post is private", 403);
    }
  }

  const response = {
    id: post.id,
    content: post.content,
    imageUrl: post.imageUrl,
    visibility: post.visibility,
    author: post.author,
    likesCount: post.likesCount,
    commentsCount: post.commentsCount,
    likes: post.likes.map((l) => l.userId),
    comments: post.comments.map((c) => ({
      id: c.id,
      content: c.content,
      author: c.author,
      postId: post.id,
      parentId: c.parentId,
      likesCount: c.likesCount,
      repliesCount: c._count.replies,
      createdAt: c.createdAt,
    })),
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
  };

  return response;
}

export async function updatePost(
  userId: string,
  params: { postId: string },
  body: { content?: string; visibility?: string },
) {
  await syncUserPlanExpiration(userId);

  const { postId } = params;
  const { content, visibility } = body;

  const post = await prisma.post.findFirst({ where: { id: postId, deletedAt: null } });
  if (!post) throw new AppError("Post not found", 404);
  if (post.authorId !== userId) throw new AppError("Cannot update other user's post", 403);

  if (content) {
    const user = await prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: { plan: true },
    });
    const limit = getPlanPostLimit(user?.plan);
    if (content.length > limit) {
      const planName = user?.plan === "PRO" ? "Pro" : "Free";
      throw new AppError(
        `Post content exceeds ${planName} plan limit of ${limit} characters`,
        400,
      );
    }
  }

  const updatedPost = await prisma.post.update({
    where: { id: postId },
    data: {
      ...(content !== undefined && { content }),
      ...(visibility !== undefined && {
        visibility: visibility === "PRIVATE" ? "PRIVATE" : "PUBLIC",
      }),
    },
    include: {
      author: {
        select: {
          id: true,
          username: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  return {
    id: updatedPost.id,
    content: updatedPost.content,
    imageUrl: updatedPost.imageUrl,
    visibility: updatedPost.visibility,
    author: updatedPost.author,
    likesCount: updatedPost.likesCount,
    commentsCount: updatedPost.commentsCount,
    createdAt: updatedPost.createdAt,
    updatedAt: updatedPost.updatedAt,
  };
}

export async function deletePost(
  userId: string,
  params: { postId: string },
) {
  const { postId } = params;

  const post = await prisma.post.findFirst({ where: { id: postId, deletedAt: null } });
  if (!post) throw new AppError("Post not found", 404);
  if (post.authorId !== userId) throw new AppError("Cannot delete other user's post", 403);

  await prisma.post.delete({ where: { id: postId } });

  return { message: "Post deleted successfully" };
}

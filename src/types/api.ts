export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  plan: "FREE" | "PRO";
}

export interface UserSummary {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  plan?: "FREE" | "PRO";
}

export interface Post {
  id: string;
  authorId?: string;
  content: string;
  imageUrl?: string | null;
  visibility?: "PUBLIC" | "PRIVATE";
  likesCount: number;
  commentsCount: number;
  createdAt: string;
  updatedAt: string;
  author?: User;
  likes?: string[];
  comments?: Comment[];
}

export interface Comment {
  id: string;
  postId?: string;
  parentId?: string | null;
  content: string;
  likesCount: number;
  repliesCount: number;
  createdAt: string;
  author?: UserSummary;
}

export interface Follower {
  id: string;
  followedAt: string;
  follower?: UserSummary;
  user?: UserSummary;
}

export interface BlockedUser {
  id: string;
  blockedAt: string;
  user: UserSummary;
}

export type RawBlockedUser =
  | BlockedUser
  | (UserSummary & { blockedAt?: string; createdAt?: string });

export interface BillingStatus {
  id: string;
  email: string;
  plan: "FREE" | "PRO";
  planStatus: string | null;
  planStartedAt: string | null;
  stripeCurrentPeriodEndAt: string | null;
  stripeSubscriptionId: string | null;
  proPriceAmount: number;
  proPriceCurrency: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface BlocksResponse {
  blocked: BlockedUser[];
  total: number;
  limit: number;
  offset: number;
}

export interface CommentsResponse {
  comments: Comment[];
  total: number;
  limit: number;
  offset: number;
}

export interface UserPostsResponse {
  posts: Post[];
  total: number;
  limit: number;
  offset: number;
}

export interface SearchUsersResponse {
  results: User[];
  total: number;
  limit: number;
  offset: number;
}

import type { Comment as ApiComment } from "./api";

export interface PostProps {
  id: string;
  authorId?: string;
  author: {
    name: string;
    handle: string;
    avatar: string;
  };
  authorPlan?: "FREE" | "PRO";
  content: string;
  image?: string;
  visibility?: "PUBLIC" | "PRIVATE";
  timestamp: string;
  likes: number;
  replies: number;
  liked?: boolean;
  isFollowing?: boolean;
  showPostMenu?: boolean;
  onLike?: (id: string) => void | Promise<void>;
  onReply?: (id: string) => void;
  onFollowToggle?: (
    authorId: string,
    isFollowing: boolean,
  ) => void | Promise<void>;
  onEdit?: (id: string, content: string) => void | Promise<void>;
  onDelete?: (id: string) => void | Promise<void>;
}

export interface FeedProps {
  posts: PostProps[];
  isLoading?: boolean;
  showPostMenu?: boolean;
  onLike?: (postId: string) => void | Promise<void>;
  onReply?: (postId: string) => void;
  onFollowToggle?: (
    authorId: string,
    isFollowing: boolean,
  ) => void | Promise<void>;
  onEdit?: (postId: string, content: string) => void | Promise<void>;
  onDelete?: (postId: string) => void | Promise<void>;
  renderPostFooter?: (post: PostProps) => React.ReactNode;
}

export interface PostComposerProps {
  onPostCreated?: () => void;
  placeholder?: string;
  className?: string;
}

export interface PostComposerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mediaPickerRequestId?: number;
}

export interface CommentsModalProps {
  post: PostProps;
  commentsApi: UseCommentsReturn;
  onClose: () => void;
  onLike: (postId: string) => void | Promise<void>;
  onFollowToggle?: (
    authorId: string,
    isFollowing: boolean,
  ) => void | Promise<void>;
}

export interface EditPostModalProps {
  editingContent: string;
  visibility: "PUBLIC" | "PRIVATE";
  isSaving: boolean;
  onClose: () => void;
  onSave: (content: string) => void;
  onContentChange: (content: string) => void;
  onVisibilityChange: (visibility: "PUBLIC" | "PRIVATE") => void;
}

export interface ProBadgeProps {
  isPro?: boolean;
  className?: string;
}

export interface CommentMeta {
  total: number;
  limit: number;
  offset: number;
}

export interface UseCommentsReturn {
  openCommentsPostId: string | null;
  commentsByPost: Record<string, ApiComment[]>;
  commentMetaByPost: Record<string, CommentMeta>;
  repliesByComment: Record<string, ApiComment[]>;
  replyMetaByComment: Record<string, CommentMeta>;
  repliesExpanded: Record<string, boolean>;
  replyDrafts: Record<string, string>;
  repliesLoading: Record<string, boolean>;
  repliesMoreLoading: Record<string, boolean>;
  commentLikeState: Record<string, { liked: boolean; count: number }>;
  editingCommentByPost: Record<string, string | null>;
  commentEditDrafts: Record<string, string>;
  commentDrafts: Record<string, string>;
  commentsLoading: Record<string, boolean>;
  commentsMoreLoading: Record<string, boolean>;
  toggleComments: (postId: string) => Promise<void>;
  handleAddComment: (postId: string) => Promise<void>;
  handleAddReply: (postId: string, parentId: string) => Promise<void>;
  toggleReplies: (postId: string, commentId: string) => Promise<void>;
  handleLoadMoreReplies: (postId: string, commentId: string) => Promise<void>;
  setReplyDraft: (commentId: string, value: string) => void;
  handleToggleCommentLike: (postId: string, commentId: string) => Promise<void>;
  handleStartEditComment: (postId: string, comment: ApiComment) => void;
  handleCancelEditComment: (postId: string, commentId: string) => void;
  handleSaveEditComment: (postId: string, commentId: string) => Promise<void>;
  handleDeleteComment: (postId: string, commentId: string) => Promise<void>;
  handleLoadMoreComments: (postId: string) => Promise<void>;
  handleCloseComments: () => void;
  setCommentDraft: (postId: string, value: string) => void;
  setCommentEditDraft: (commentId: string, value: string) => void;
  onReplyCountChange: ((postId: string, delta: number) => void) | null;
  setOnReplyCountChange: (cb: (postId: string, delta: number) => void) => void;
}

export interface DraftData {
  content: string;
  timestamp: number;
}

export type FeedTab = "following" | "forYou";

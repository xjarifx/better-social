"use client";
import { memo } from "react";
import { MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import { PostCard } from "@/components/PostCard";
import { LoadingSkeleton, EmptyState } from "@/components";
import type { PostProps, FeedProps } from "@/types/posts";

function FeedComponent({
  posts,
  isLoading = false,
  showPostMenu = true,
  onLike,
  onReply,
  onFollowToggle,
  onEdit,
  onDelete,
  renderPostFooter,
}: FeedProps) {
  if (isLoading) {
    return <LoadingSkeleton variant="post" count={3} />;
  }

  return (
    <motion.div 
      className="space-y-0"
      initial="hidden"
      animate="visible"
      variants={{
        visible: {
          transition: {
            staggerChildren: 0.05
          }
        }
      }}
    >
      {posts.map((post, index) => (
        <div key={`${post.id}-${index}`}>
          <PostCard
            {...post}
            showPostMenu={showPostMenu}
            onLike={onLike}
            onReply={onReply}
            onFollowToggle={onFollowToggle}
            onEdit={onEdit}
            onDelete={onDelete}
          />
          {renderPostFooter?.(post)}
        </div>
      ))}

      {posts.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <EmptyState
            icon={MessageCircle}
            title="No posts yet"
            description="Your feed is empty. Follow people to see their posts here."
          />
        </motion.div>
      )}
    </motion.div>
  );
}

export const Feed = memo(FeedComponent);

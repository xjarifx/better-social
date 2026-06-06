import type { ProBadgeProps } from "@/types/posts";

export function ProBadge({ isPro, className = "" }: ProBadgeProps) {
  if (!isPro) return null;

  return (
    <img
      src="/verify.png"
      alt="Pro user"
      title="Pro user"
      className={`inline-block h-4 w-4 ${className}`}
    />
  );
}

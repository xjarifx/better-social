import type { LucideIcon } from "lucide-react";
import type { ImageProps } from "next/image";

export interface TopNavProps {
  onOpenPostComposer?: () => void;
}

export interface UserInfoProps {
  name: string;
  handle: string;
  plan?: "FREE" | "PRO";
  userId?: string;
  currentUserId?: string;
  showHandle?: boolean;
  size?: "sm" | "md";
  className?: string;
}

export interface UserCardProps {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
    plan?: "FREE" | "PRO";
  };
  currentUserId?: string;
  action?: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
    variant?: "default" | "outline" | "ghost";
  };
}

export interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export interface VisibilityToggleProps {
  visibility: "PUBLIC" | "PRIVATE";
  onToggle: () => void;
  className?: string;
}

export interface Tab {
  id: string;
  label: string;
}

export interface TabNavigationProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export interface Stat {
  label: string;
  value: number;
  onClick?: () => void;
}

export interface StatsCardProps {
  stats: Stat[];
  className?: string;
}

export interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export type SafeImageProps = ImageProps & {
  suppressHydrationWarning?: boolean;
};

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  backPath?: string;
  action?: {
    icon: LucideIcon;
    onClick: () => void;
    label: string;
  };
}

export interface MediaUploadProps {
  onFileSelect: (file: File | null) => void;
  maxSizeBytes?: number;
  accept?: string;
  className?: string;
}

export interface MediaPreviewProps {
  file: File;
  onRemove: () => void;
}

export interface LoadingSkeletonProps {
  variant?: "post" | "user" | "list";
  count?: number;
}

export interface ErrorMessageProps {
  message: string;
  className?: string;
}

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  iconClassName?: string;
}

export interface CharacterCounterProps {
  current: number;
  limit: number;
  className?: string;
}

export interface AvatarProps {
  initials: string;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "default" | "primary" | "secondary";
  className?: string;
}

export interface ActionButtonProps {
  icon: LucideIcon;
  count: number;
  isActive?: boolean;
  onClick?: () => void;
  activeColor?: string;
  className?: string;
}

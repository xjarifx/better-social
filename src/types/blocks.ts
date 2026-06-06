import type { BlockedUser } from "./api";

export interface BlockContextType {
  blockedUsers: BlockedUser[];
  isBlocked: (username: string) => boolean;
  blockUser: (username: string) => Promise<void>;
  unblockUser: (username: string) => Promise<void>;
  refreshBlocks: () => Promise<void>;
  isLoading: boolean;
}

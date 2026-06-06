import { Avatar } from "./Avatar";
import { UserInfo } from "./UserInfo";
import { Button } from "@/ui/button";
import type { UserCardProps } from "@/types/shared";

export function UserCard({ user, currentUserId, action }: UserCardProps) {
  const initials = `${user.firstName[0]}${user.lastName[0]}`;

  return (
    <div className="flex items-center justify-between border-b border-border bg-background p-4 transition-colors duration-200 hover:bg-surface-hover">
      <div className="flex items-center gap-3">
        <Avatar initials={initials} size="lg" variant="secondary" />
        <div>
          <UserInfo
            name={`${user.firstName} ${user.lastName}`}
            handle={user.username}
            plan={user.plan}
            userId={user.id}
            currentUserId={currentUserId}
            showHandle={true}
          />
        </div>
      </div>
      {action && (
        <Button
          variant={action.variant || "outline"}
          size="sm"
          onClick={action.onClick}
          disabled={action.disabled || currentUserId === user.id}
        >
          {currentUserId === user.id ? "You" : action.label}
        </Button>
      )}
    </div>
  );
}

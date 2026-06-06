import { Globe, Lock } from "lucide-react";
import type { VisibilityToggleProps } from "@/types/shared";

export function VisibilityToggle({
  visibility,
  onToggle,
  className = "",
}: VisibilityToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`cursor-pointer ${className}`}
      aria-label="Change visibility"
      title={`Visibility: ${visibility.toLowerCase()}`}
    >
      {visibility === "PUBLIC" ? (
        <Globe className="h-4 w-4" />
      ) : (
        <Lock className="h-4 w-4" />
      )}
    </button>
  );
}

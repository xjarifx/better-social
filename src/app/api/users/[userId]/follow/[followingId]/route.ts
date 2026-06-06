import { NextRequest } from "next/server";
import { authenticateRequest } from "@/modules/auth/utils/auth";
import { unfollowUser } from "@/modules/users/services/follows.service";
import { successResponse, handleApiError } from "@/shared/lib/errors";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string; followingId: string }> },
) {
  try {
    const { userId } = authenticateRequest(request);
    const { followingId } = await params;
    await unfollowUser(userId, followingId);
    return successResponse({ message: "Unfollowed successfully" });
  } catch (error) {
    return handleApiError(error);
  }
}

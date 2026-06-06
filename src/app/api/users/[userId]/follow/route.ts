import { NextRequest } from "next/server";
import { authenticateRequest } from "@/modules/auth/utils/auth";
import { followUser } from "@/modules/users/services/follows.service";
import { successResponse, handleApiError } from "@/shared/lib/errors";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const { userId: currentUserId } = authenticateRequest(request);
    const { userId: targetUserId } = await params;
    const result = await followUser(currentUserId, targetUserId);
    return successResponse(result, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

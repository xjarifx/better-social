import { NextRequest } from "next/server";
import { authenticateRequest } from "@/modules/auth/utils/auth";
import { getUserFollowers } from "@/modules/users/services/user.service";
import { successResponse, handleApiError } from "@/shared/lib/errors";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const { userId } = authenticateRequest(request);
    const followers = await getUserFollowers(userId);
    return successResponse(followers);
  } catch (error) {
    return handleApiError(error);
  }
}

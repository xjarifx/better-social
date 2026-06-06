import { NextRequest } from "next/server";
import { authenticateOptional } from "@/modules/auth/utils/auth";
import { getUserPosts } from "@/modules/users/services/user.service";
import { successResponse, handleApiError } from "@/shared/lib/errors";
import { parsePaginationParams } from "@/shared/lib/pagination";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const auth = authenticateOptional(request);
    const { userId } = await params;
    const { searchParams } = new URL(request.url);
    const { limit, offset } = parsePaginationParams(searchParams, { limit: 10, offset: 0 });
    const posts = await getUserPosts(userId, limit, offset, auth?.userId);
    return successResponse(posts);
  } catch (error) {
    return handleApiError(error);
  }
}

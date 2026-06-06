import { NextRequest } from "next/server";
import { authenticateRequest } from "@/modules/auth/utils/auth";
import { getFeed } from "@/modules/posts/services/posts.service";
import { successResponse, handleApiError } from "@/shared/lib/errors";
import { parsePaginationParams } from "@/shared/lib/pagination";

export async function GET(request: NextRequest) {
  try {
    const { userId } = authenticateRequest(request);
    const { searchParams } = new URL(request.url);
    const { limit, offset } = parsePaginationParams(searchParams, { limit: 20, offset: 0 });
    const posts = await getFeed(userId, { limit, offset });
    return successResponse(posts);
  } catch (error) {
    return handleApiError(error);
  }
}

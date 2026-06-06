import { successResponse, handleApiError } from "@/shared/lib/errors";

export async function POST() {
  try {
    return successResponse({ message: "Logged out successfully" });
  } catch (error) {
    return handleApiError(error);
  }
}

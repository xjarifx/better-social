import { successResponse, handleApiError } from "@/lib/errors";

export async function POST() {
  try {
    return successResponse({ message: "Logged out successfully" });
  } catch (error) {
    return handleApiError(error);
  }
}

import { NextRequest } from "next/server";
import { authenticateRequest } from "@/utils/auth";
import { downgradePlan } from "@/services/billing";
import { successResponse, handleApiError } from "@/lib/errors";

export async function POST(request: NextRequest) {
  try {
    const { userId } = authenticateRequest(request);
    const result = await downgradePlan(userId);
    return successResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}

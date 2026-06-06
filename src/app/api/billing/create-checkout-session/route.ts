import { NextRequest } from "next/server";
import { authenticateRequest } from "@/modules/auth/utils/auth";
import { createCheckoutSession } from "@/modules/billing/services/billing.service";
import { successResponse, handleApiError } from "@/shared/lib/errors";

export async function POST(request: NextRequest) {
  try {
    const { userId } = authenticateRequest(request);
    const result = await createCheckoutSession(userId);
    return successResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}

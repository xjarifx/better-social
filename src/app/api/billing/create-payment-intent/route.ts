import { NextRequest } from "next/server";
import { authenticateRequest } from "@/modules/auth/utils/auth";
import { createPaymentIntent } from "@/modules/billing/services/billing.service";
import { successResponse, handleApiError } from "@/shared/lib/errors";

export async function POST(request: NextRequest) {
  try {
    const { userId } = authenticateRequest(request);
    const result = await createPaymentIntent(userId);
    return successResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}

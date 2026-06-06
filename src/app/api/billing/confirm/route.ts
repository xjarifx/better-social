import { NextRequest } from "next/server";
import { authenticateRequest } from "@/modules/auth/utils/auth";
import { confirmPayment } from "@/modules/billing/services/billing.service";
import { successResponse, handleApiError } from "@/shared/lib/errors";

export async function GET(request: NextRequest) {
  try {
    const { userId } = authenticateRequest(request);
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("session_id") || undefined;
    const paymentIntentId = searchParams.get("payment_intent_id") || undefined;
    const result = await confirmPayment(userId, sessionId, paymentIntentId);
    return successResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}

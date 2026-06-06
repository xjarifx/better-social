import { NextRequest } from "next/server";
import { handleStripeWebhook } from "@/modules/billing/services/billing.service";
import { successResponse, handleApiError } from "@/shared/lib/errors";

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("stripe-signature") || "";
    const result = await handleStripeWebhook(rawBody, signature);
    return successResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}

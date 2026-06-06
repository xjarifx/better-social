import { NextRequest } from "next/server";
import { authenticateRequest } from "@/modules/auth/utils/auth";
import { getBillingStatus } from "@/modules/billing/services/billing.service";
import { successResponse, handleApiError } from "@/shared/lib/errors";

export async function GET(request: NextRequest) {
  try {
    const { userId } = authenticateRequest(request);
    const status = await getBillingStatus(userId);
    return successResponse(status);
  } catch (error) {
    return handleApiError(error);
  }
}

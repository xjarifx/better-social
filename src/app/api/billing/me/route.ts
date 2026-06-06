import { NextRequest } from "next/server";
import { authenticateRequest } from "@/utils/auth";
import { getBillingStatus } from "@/services/billing";
import { successResponse, handleApiError } from "@/lib/errors";

export async function GET(request: NextRequest) {
  try {
    const { userId } = authenticateRequest(request);
    const status = await getBillingStatus(userId);
    return successResponse(status);
  } catch (error) {
    return handleApiError(error);
  }
}

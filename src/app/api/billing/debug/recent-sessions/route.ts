import { NextRequest } from "next/server";
import { authenticateRequest } from "@/modules/auth/utils/auth";
import { successResponse, handleApiError } from "@/shared/lib/errors";
import { prisma } from "@/shared/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { userId } = authenticateRequest(request);
    const sessions = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        stripeCustomerId: true,
        plan: true,
        planStatus: true,
        stripeCurrentPeriodEndAt: true,
        stripeSubscriptionId: true,
      },
    });
    return successResponse(sessions);
  } catch (error) {
    return handleApiError(error);
  }
}

import { describe, it, expect, beforeEach, vi } from "vitest";

const { mockFindUnique, mockFindFirst, mockUpdate, mockStripeInstance } = vi.hoisted(() => {
  const mockFindUnique = vi.fn();
  const mockFindFirst = vi.fn();
  const mockUpdate = vi.fn();

  const mockStripePricesRetrieve = vi.fn();
  const mockStripeCustomersCreate = vi.fn();
  const mockStripeCheckoutCreate = vi.fn();
  const mockStripePaymentIntentsCreate = vi.fn();
  const mockStripePaymentIntentsRetrieve = vi.fn();
  const mockStripeCheckoutRetrieve = vi.fn();
  const mockStripeSubscriptionsCancel = vi.fn();
  const mockStripeWebhooksConstructEvent = vi.fn();

  const mockStripeInstance = {
    prices: { retrieve: mockStripePricesRetrieve },
    customers: { create: mockStripeCustomersCreate },
    checkout: {
      sessions: {
        create: mockStripeCheckoutCreate,
        retrieve: mockStripeCheckoutRetrieve,
      },
    },
    paymentIntents: {
      create: mockStripePaymentIntentsCreate,
      retrieve: mockStripePaymentIntentsRetrieve,
    },
    subscriptions: { cancel: mockStripeSubscriptionsCancel },
    webhooks: { constructEvent: mockStripeWebhooksConstructEvent },
  };

  return { mockFindUnique, mockFindFirst, mockUpdate, mockStripeInstance };
});

vi.mock("stripe", () => ({
  default: function StripeMock() { return mockStripeInstance; },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: mockFindUnique,
      findFirst: mockFindFirst,
      update: mockUpdate,
    },
  },
}));

const {
  getBillingStatus,
  createCheckoutSession,
  downgradePlan,
  syncUserPlanExpiration,
  handleStripeWebhook,
} = await import("@/services/billing");

beforeEach(() => {
  vi.clearAllMocks();
  mockStripeInstance.prices.retrieve.mockResolvedValue({
    unit_amount: 999,
    currency: "usd",
    product: { metadata: { unlockDurationSeconds: "2592000" } },
  });
  process.env.STRIPE_SECRET_KEY = "sk_test_placeholder";
  process.env.STRIPE_PRO_PRICE_ID = "price_pro_monthly";
  process.env.CLIENT_URL = "http://localhost:3000";
  process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
});

describe("syncUserPlanExpiration", () => {
  it("does nothing if user is FREE", async () => {
    mockFindUnique.mockResolvedValue({
      id: "user-1",
      plan: "FREE",
      stripeCurrentPeriodEndAt: null,
    });
    const result = await syncUserPlanExpiration("user-1");
    expect(result?.plan).toBe("FREE");
  });

  it("downgrades expired PRO users", async () => {
    mockFindUnique.mockResolvedValue({
      id: "user-1",
      plan: "PRO",
      stripeCurrentPeriodEndAt: new Date(Date.now() - 86400000),
    });
    mockUpdate.mockResolvedValue({ plan: "FREE" });
    await syncUserPlanExpiration("user-1");
    expect(mockUpdate).toHaveBeenCalled();
  });
});

describe("getBillingStatus", () => {
  it("returns billing status for a user", async () => {
    mockFindUnique.mockResolvedValue({
      id: "user-1",
      email: "test@example.com",
      plan: "FREE",
      planStatus: null,
      planStartedAt: null,
      stripeCurrentPeriodEndAt: null,
      stripeSubscriptionId: null,
    });

    const result = await getBillingStatus("user-1");
    expect(result.plan).toBe("FREE");
    expect(result.proPriceAmount).toBe(999);
  });
});

describe("createCheckoutSession", () => {
  it("creates a Stripe checkout session", async () => {
    mockFindUnique.mockResolvedValue({
      id: "user-1",
      email: "test@example.com",
      firstName: "Test",
      lastName: "User",
      plan: "FREE",
      stripeCustomerId: null,
    });
    mockStripeInstance.customers.create.mockResolvedValue({ id: "cus_123" });
    mockStripeInstance.checkout.sessions.create.mockResolvedValue({
      url: "https://checkout.stripe.com/test",
    });
    mockUpdate.mockResolvedValue({});

    const result = await createCheckoutSession("user-1");
    expect(result.url).toBe("https://checkout.stripe.com/test");
  });

  it("throws if user is already PRO", async () => {
    mockFindUnique.mockResolvedValue({ id: "user-1", plan: "PRO" });
    await expect(createCheckoutSession("user-1")).rejects.toThrow(
      "You are already on the Pro plan",
    );
  });
});

describe("downgradePlan", () => {
  it("downgrades a PRO user to FREE", async () => {
    mockFindUnique.mockResolvedValue({
      id: "user-1",
      email: "test@example.com",
      plan: "PRO",
      firstName: "Test",
      lastName: "User",
      stripeSubscriptionId: "sub_123",
    });
    mockUpdate.mockResolvedValue({
      id: "user-1",
      email: "test@example.com",
      plan: "FREE",
      planStatus: null,
    });

    const result = await downgradePlan("user-1");
    expect(result.plan).toBe("FREE");
  });

  it("throws if user is already FREE", async () => {
    mockFindUnique.mockResolvedValue({ id: "user-1", plan: "FREE" });
    await expect(downgradePlan("user-1")).rejects.toThrow(
      "You are already on the Free plan",
    );
  });
});

describe("handleStripeWebhook", () => {
  it("processes checkout.session.completed event", async () => {
    mockStripeInstance.webhooks.constructEvent.mockReturnValue({
      type: "checkout.session.completed",
      data: {
        object: {
          metadata: { userId: "user-1", plan: "PRO" },
          customer: "cus_123",
          subscription: "sub_123",
        },
      },
    });
    mockUpdate.mockResolvedValue({});

    const result = await handleStripeWebhook("{}", "test_sig");
    expect(result.received).toBe(true);
  });

  it("rejects invalid webhook signatures", async () => {
    mockStripeInstance.webhooks.constructEvent.mockImplementation(() => {
      throw new Error("Invalid signature");
    });
    await expect(handleStripeWebhook("{}", "bad_sig")).rejects.toThrow(
      "Invalid webhook signature",
    );
  });
});

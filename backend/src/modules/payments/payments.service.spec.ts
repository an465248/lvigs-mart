import { Test, TestingModule } from "@nestjs/testing";
import { PaymentsService } from "./payments.service";
import { PrismaService } from "../../prisma/prisma.service";
import { ConfigService } from "@nestjs/config";

describe("PaymentsService", () => {
  let service: PaymentsService;
  let prisma: any;

  const mockPrisma = {
    order: { findUnique: jest.fn(), update: jest.fn(), updateMany: jest.fn() },
    orderPayment: { update: jest.fn() },
    orderStatusHistory: { create: jest.fn() },
    webhookEvent: { findUnique: jest.fn(), upsert: jest.fn() },
    $transaction: jest.fn(),
  };

  const mockConfig = { get: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockPrisma.$transaction.mockImplementation(async (fn: any) => fn(mockPrisma));
    mockConfig.get.mockReturnValue(undefined); // No Razorpay = dev mode

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    prisma = module.get(PrismaService);
  });

  describe("verifyPayment", () => {
    it("should return ok if already verified (idempotent)", async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: "order1",
        paymentStatus: "SUCCESS",
        payment: { status: "SUCCESS" },
      });

      const result = await service.verifyPayment("order1", {
        razorpay_order_id: "rp_order",
        razorpay_payment_id: "rp_pay",
        razorpay_signature: "sig",
      });

      expect(result.ok).toBe(true);
      // Should NOT call $transaction since already verified
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  });
});

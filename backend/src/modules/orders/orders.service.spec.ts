import { Test, TestingModule } from "@nestjs/testing";
import { OrdersService } from "./orders.service";
import { PrismaService } from "../../prisma/prisma.service";
import { CouponsService } from "../coupons/coupons.service";
import { CartService } from "../cart/cart.service";
import { NotFoundException, BadRequestException } from "@nestjs/common";

describe("OrdersService", () => {
  let service: OrdersService;
  let prisma: any;

  const mockPrisma = {
    cart: { findUnique: jest.fn() },
    userAddress: { findFirst: jest.fn(), create: jest.fn() },
    product: { findMany: jest.fn() },
    inventory: { findFirst: jest.fn(), updateMany: jest.fn() },
    order: { create: jest.fn(), findMany: jest.fn(), findFirst: jest.fn(), findUnique: jest.fn(), update: jest.fn(), updateMany: jest.fn() },
    orderItem: { createMany: jest.fn() },
    orderPayment: { create: jest.fn(), update: jest.fn() },
    orderStatusHistory: { create: jest.fn() },
    inventoryTransaction: { create: jest.fn() },
    idempotencyKey: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
    $transaction: jest.fn(),
  };

  const mockCoupons = { validate: jest.fn(), incrementUsage: jest.fn() };
  const mockCart = { clearCart: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockPrisma.$transaction.mockImplementation(async (fn: any) => fn(mockPrisma));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: CouponsService, useValue: mockCoupons },
        { provide: CartService, useValue: mockCart },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    prisma = module.get(PrismaService);
  });

  describe("placeOrder", () => {
    it("should throw if cart is empty", async () => {
      prisma.cart.findUnique.mockResolvedValue(null);
      await expect(service.placeOrder("user1", { addressId: "addr1", paymentMethod: "UPI" } as any)).rejects.toThrow(NotFoundException);
    });

    it("should return cached response for completed idempotency key", async () => {
      const cachedResponse = { id: "order-cached", shortId: "LVIGS-CACHED" };
      prisma.idempotencyKey.findUnique.mockResolvedValue({ status: "COMPLETED", response: cachedResponse });
      const result = await service.placeOrder("user1", { addressId: "addr1", paymentMethod: "UPI", idempotencyKey: "key1" } as any);
      expect(result).toEqual(cachedResponse);
    });

    it("should validate inventory before creating order", async () => {
      prisma.cart.findUnique.mockResolvedValue({
        items: [{ productId: "p1", quantity: 5, product: { title: "Test", price: 100, mrp: 150, images: [] }, variant: null }],
        couponCode: null,
      });
      prisma.userAddress.findFirst.mockResolvedValue({ id: "addr1" });
      prisma.inventory.findFirst.mockResolvedValue({ quantity: 2, reserved: 0 });

      // Should fail - requesting 5 but only 2 available
      await expect(service.placeOrder("user1", { addressId: "addr1", paymentMethod: "UPI" } as any)).rejects.toThrow();
    });
  });

  describe("cancelOrder", () => {
    it("should throw if order not found", async () => {
      prisma.order.findFirst.mockResolvedValue(null);
      await expect(service.cancelOrder("user1", "order1", "test")).rejects.toThrow(NotFoundException);
    });
  });
});

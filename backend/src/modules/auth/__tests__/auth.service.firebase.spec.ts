import { UnauthorizedException, BadRequestException } from "@nestjs/common";
import { AuthService } from "../auth.service";
import { VerifiedFirebaseUser } from "../../../common/firebase/firebase.service";

describe("AuthService - Firebase integration", () => {
  let service: AuthService;
  let prismaMock: any;
  let jwtMock: any;
  let otpMock: any;
  let configMock: any;

  const mockFirebaseUser: VerifiedFirebaseUser = {
    uid: "firebase-uid-abc",
    phone_number: "+919876543210",
    email: "user@test.com",
    email_verified: true,
  };

  const mockUser = {
    id: "user-uuid-123",
    name: "Test User",
    mobile: "9876543210",
    email: "user@test.com",
    role: "CUSTOMER",
    isBlocked: false,
    firebaseUid: null,
  };

  beforeEach(() => {
    prismaMock = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        findFirst: jest.fn(),
      },
    };
    jwtMock = {
      signAsync: jest.fn().mockResolvedValue("mock-jwt-token"),
    };
    otpMock = {};
    configMock = {
      get: jest.fn().mockReturnValue("dev-secret"),
    };

    service = new AuthService(prismaMock, jwtMock, otpMock, configMock);
  });

  describe("loginWithFirebase", () => {
    it("should login existing user found by mobile", async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.loginWithFirebase(mockFirebaseUser);

      expect(result.accessToken).toBe("mock-jwt-token");
      expect(result.user.id).toBe("user-uuid-123");
      expect(result.user.role).toBe("CUSTOMER");
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({ where: { mobile: "9876543210" } });
    });

    it("should login existing user found by firebaseUid", async () => {
      prismaMock.user.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ ...mockUser, firebaseUid: "firebase-uid-abc" });

      const result = await service.loginWithFirebase(mockFirebaseUser);

      expect(result.accessToken).toBe("mock-jwt-token");
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({ where: { firebaseUid: "firebase-uid-abc" } });
    });

    it("should link firebaseUid when user found by mobile but no firebaseUid", async () => {
      prismaMock.user.findUnique.mockResolvedValue({ ...mockUser, firebaseUid: null });
      prismaMock.user.update.mockResolvedValue({});

      await service.loginWithFirebase(mockFirebaseUser);

      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: "user-uuid-123" },
        data: { firebaseUid: "firebase-uid-abc" },
      });
    });

    it("should throw for new user (not found by mobile or firebaseUid)", async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(service.loginWithFirebase(mockFirebaseUser)).rejects.toThrow(UnauthorizedException);
      await expect(service.loginWithFirebase(mockFirebaseUser)).rejects.toThrow("Account not found. Please sign up.");
    });

    it("should throw for blocked user", async () => {
      prismaMock.user.findUnique.mockResolvedValue({ ...mockUser, isBlocked: true });

      await expect(service.loginWithFirebase(mockFirebaseUser)).rejects.toThrow("Account blocked");
    });

    it("should never allow client to choose role", async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.loginWithFirebase(mockFirebaseUser);
      expect(result.user.role).toBe("CUSTOMER");
    });

    it("should handle missing phone number from Firebase", async () => {
      const userNoPhone: VerifiedFirebaseUser = {
        uid: "firebase-uid-no-phone",
        email: "onlyemail@test.com",
        email_verified: true,
      };
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(service.loginWithFirebase(userNoPhone)).rejects.toThrow("Account not found");
    });
  });

  describe("signupWithFirebase", () => {
    it("should create new CUSTOMER user when no existing user", async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.user.create.mockResolvedValue({
        ...mockUser,
        firebaseUid: "firebase-uid-abc",
        mobileVerified: true,
      });

      const result = await service.signupWithFirebase(mockFirebaseUser, { name: "Test User" });

      expect(prismaMock.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            role: "CUSTOMER",
            firebaseUid: "firebase-uid-abc",
            mobile: "9876543210",
          }),
        }),
      );
      expect(result.user.role).toBe("CUSTOMER");
    });

    it("should always assign CUSTOMER role regardless of client input", async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.user.create.mockResolvedValue({
        ...mockUser,
        role: "CUSTOMER",
        firebaseUid: "firebase-uid-abc",
      });

      const result = await service.signupWithFirebase(mockFirebaseUser, {
        name: "Hacker",
        email: "hacker@evil.com",
      } as any);

      expect(result.user.role).toBe("CUSTOMER");
    });

    it("should return existing user if mobile already exists", async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.signupWithFirebase(mockFirebaseUser, {});
      expect(result.user.id).toBe("user-uuid-123");
      expect(prismaMock.user.create).not.toHaveBeenCalled();
    });

    it("should handle unique constraint race condition on create", async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      const raceError = new Error("Unique constraint") as any;
      raceError.code = "P2002";
      prismaMock.user.create.mockRejectedValue(raceError);
      prismaMock.user.findFirst.mockResolvedValue(mockUser);

      const result = await service.signupWithFirebase(mockFirebaseUser, {});
      expect(result.user.id).toBe("user-uuid-123");
    });

    it("should normalize Indian phone number", async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.user.create.mockResolvedValue({
        ...mockUser,
        firebaseUid: "firebase-uid-abc",
      });

      await service.signupWithFirebase(mockFirebaseUser, {});

      expect(prismaMock.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ mobile: "9876543210" }),
        }),
      );
    });
  });

  describe("buildTokens - response format", () => {
    it("should return accessToken, refreshToken, and user", async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.loginWithFirebase(mockFirebaseUser);

      expect(result).toHaveProperty("accessToken");
      expect(result).toHaveProperty("refreshToken");
      expect(result).toHaveProperty("user");
      expect(result.user).toHaveProperty("id");
      expect(result.user).toHaveProperty("name");
      expect(result.user).toHaveProperty("mobile");
      expect(result.user).toHaveProperty("email");
      expect(result.user).toHaveProperty("role");
    });
  });
});

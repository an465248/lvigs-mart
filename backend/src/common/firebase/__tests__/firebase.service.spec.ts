import { UnauthorizedException } from "@nestjs/common";
import { FirebaseService } from "../firebase.service";

// Mock firebase-admin modules
jest.mock("firebase-admin/app", () => ({
  initializeApp: jest.fn().mockReturnValue({ name: "mock-app" }),
  cert: jest.fn().mockReturnValue({}),
  getApps: jest.fn().mockReturnValue([]),
}));

jest.mock("firebase-admin/auth", () => ({
  getAuth: jest.fn().mockReturnValue({
    verifyIdToken: jest.fn(),
    revokeRefreshTokens: jest.fn(),
  }),
}));

jest.mock("fs", () => ({
  existsSync: jest.fn().mockReturnValue(false),
  readFileSync: jest.fn(),
}));

describe("FirebaseService", () => {
  let service: FirebaseService;
  let configMock: any;

  beforeEach(() => {
    jest.clearAllMocks();
    configMock = {
      get: jest.fn((key: string) => {
        const env: Record<string, string> = {
          FIREBASE_PROJECT_ID: "test-project",
          FIREBASE_CLIENT_EMAIL: "test@test.iam.gserviceaccount.com",
          FIREBASE_PRIVATE_KEY: "-----BEGIN PRIVATE KEY-----\nfake\n-----END PRIVATE KEY-----",
        };
        return env[key] || "";
      }),
    };
    service = new FirebaseService(configMock);
  });

  describe("verifyIdToken", () => {
    it("should verify a valid token", async () => {
      const { getAuth } = require("firebase-admin/auth");
      getAuth().verifyIdToken.mockResolvedValue({
        uid: "uid-123",
        phone_number: "+919876543210",
      });

      const result = await service.verifyIdToken("valid-token");
      expect(result.uid).toBe("uid-123");
      expect(getAuth().verifyIdToken).toHaveBeenCalledWith("valid-token", true);
    });

    it("should check for revoked tokens (second argument = true)", async () => {
      const { getAuth } = require("firebase-admin/auth");
      getAuth().verifyIdToken.mockResolvedValue({ uid: "uid-123" });

      await service.verifyIdToken("token");
      expect(getAuth().verifyIdToken).toHaveBeenCalledWith("token", true);
    });

    it("should throw UnauthorizedException for expired token", async () => {
      const { getAuth } = require("firebase-admin/auth");
      const error = new Error("Token expired") as any;
      error.code = "auth/id-token-expired";
      getAuth().verifyIdToken.mockRejectedValue(error);

      await expect(service.verifyIdToken("expired-token")).rejects.toThrow(UnauthorizedException);
      await expect(service.verifyIdToken("expired-token")).rejects.toThrow("Firebase token has expired");
    });

    it("should throw UnauthorizedException for revoked token", async () => {
      const { getAuth } = require("firebase-admin/auth");
      const error = new Error("Token revoked") as any;
      error.code = "auth/id-token-revoked";
      getAuth().verifyIdToken.mockRejectedValue(error);

      await expect(service.verifyIdToken("revoked-token")).rejects.toThrow(UnauthorizedException);
      await expect(service.verifyIdToken("revoked-token")).rejects.toThrow("Firebase token has been revoked");
    });

    it("should throw UnauthorizedException for invalid token", async () => {
      const { getAuth } = require("firebase-admin/auth");
      const error = new Error("Invalid token") as any;
      error.code = "auth/id-token-invalid";
      getAuth().verifyIdToken.mockRejectedValue(error);

      await expect(service.verifyIdToken("invalid-token")).rejects.toThrow(UnauthorizedException);
      await expect(service.verifyIdToken("invalid-token")).rejects.toThrow("Invalid Firebase token");
    });

    it("should throw UnauthorizedException for unknown errors", async () => {
      const { getAuth } = require("firebase-admin/auth");
      getAuth().verifyIdToken.mockRejectedValue(new Error("Network error"));

      await expect(service.verifyIdToken("any-token")).rejects.toThrow(UnauthorizedException);
      await expect(service.verifyIdToken("any-token")).rejects.toThrow("Failed to verify Firebase token");
    });
  });

  describe("verifyAndGetUser", () => {
    it("should return VerifiedFirebaseUser with uid, phone, email", async () => {
      const { getAuth } = require("firebase-admin/auth");
      getAuth().verifyIdToken.mockResolvedValue({
        uid: "uid-456",
        phone_number: "+919876543210",
        email: "test@example.com",
        email_verified: true,
      });

      const result = await service.verifyAndGetUser("token");
      expect(result).toEqual({
        uid: "uid-456",
        phone_number: "+919876543210",
        email: "test@example.com",
        email_verified: true,
      });
    });
  });

  describe("getPhoneNumber", () => {
    it("should extract phone number from decoded token", () => {
      const decoded = { phone_number: "+919876543210" } as any;
      expect(service.getPhoneNumber(decoded)).toBe("+919876543210");
    });

    it("should return undefined when no phone number", () => {
      const decoded = { uid: "uid-123" } as any;
      expect(service.getPhoneNumber(decoded)).toBeUndefined();
    });
  });
});

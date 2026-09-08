import { ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { FirebaseAuthGuard } from "../firebase-auth.guard";

// Mock the firebase-admin module before importing FirebaseService
jest.mock("firebase-admin/app", () => ({
  initializeApp: jest.fn().mockReturnValue({ name: "mock-app" }),
  cert: jest.fn().mockReturnValue({}),
  getApps: jest.fn().mockReturnValue([]),
}));

jest.mock("firebase-admin/auth", () => ({
  getAuth: jest.fn().mockReturnValue({
    verifyIdToken: jest.fn(),
  }),
}));

jest.mock("fs", () => ({
  existsSync: jest.fn().mockReturnValue(false),
  readFileSync: jest.fn(),
}));

import { FirebaseService, VerifiedFirebaseUser } from "../../firebase/firebase.service";

describe("FirebaseAuthGuard", () => {
  let guard: FirebaseAuthGuard;
  let firebaseService: FirebaseService;

  const mockFirebaseUser: VerifiedFirebaseUser = {
    uid: "firebase-uid-123",
    phone_number: "+919876543210",
    email: "test@example.com",
    email_verified: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    const configMock = {
      get: jest.fn((key: string) => {
        const env: Record<string, string> = {
          FIREBASE_PROJECT_ID: "test-project",
          FIREBASE_CLIENT_EMAIL: "test@test.iam.gserviceaccount.com",
          FIREBASE_PRIVATE_KEY: "-----BEGIN PRIVATE KEY-----\nfake\n-----END PRIVATE KEY-----",
        };
        return env[key] || "";
      }),
    };
    firebaseService = new FirebaseService(configMock as any);
    guard = new FirebaseAuthGuard(firebaseService);
  });

  function createContext(authHeader?: string) {
    const request: any = {
      headers: authHeader ? { authorization: authHeader } : {},
    };
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;
  }

  it("should allow request with valid Bearer token", async () => {
    const { getAuth } = require("firebase-admin/auth");
    getAuth().verifyIdToken.mockResolvedValue({
      uid: "firebase-uid-123",
      phone_number: "+919876543210",
    });

    const ctx = createContext("Bearer valid-firebase-token");
    const result = await guard.canActivate(ctx);
    expect(result).toBe(true);
    expect(getAuth().verifyIdToken).toHaveBeenCalledWith("valid-firebase-token", true);
  });

  it("should reject request with missing Authorization header", async () => {
    const ctx = createContext(undefined);
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it("should reject request with malformed Authorization header", async () => {
    const ctx = createContext("Basic abc123");
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it("should reject request with empty Bearer token", async () => {
    const ctx = createContext("Bearer ");
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it("should reject expired Firebase token", async () => {
    const { getAuth } = require("firebase-admin/auth");
    const error = new Error("Token expired") as any;
    error.code = "auth/id-token-expired";
    getAuth().verifyIdToken.mockRejectedValue(error);

    const ctx = createContext("Bearer expired-token");
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it("should reject revoked Firebase token", async () => {
    const { getAuth } = require("firebase-admin/auth");
    const error = new Error("Token revoked") as any;
    error.code = "auth/id-token-revoked";
    getAuth().verifyIdToken.mockRejectedValue(error);

    const ctx = createContext("Bearer revoked-token");
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it("should attach firebaseUser to request on success", async () => {
    const { getAuth } = require("firebase-admin/auth");
    getAuth().verifyIdToken.mockResolvedValue({
      uid: "firebase-uid-123",
      phone_number: "+919876543210",
      email: "test@example.com",
    });

    const request: any = { headers: { authorization: "Bearer valid-token" } };
    const ctx = {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;

    await guard.canActivate(ctx);
    expect(request.firebaseUser).toBeDefined();
    expect(request.firebaseUser.uid).toBe("firebase-uid-123");
  });

  it("should never trust client-supplied uid in body", async () => {
    const { getAuth } = require("firebase-admin/auth");
    getAuth().verifyIdToken.mockResolvedValue({
      uid: "real-firebase-uid",
      phone_number: "+919876543210",
    });

    const request: any = {
      headers: { authorization: "Bearer valid-token" },
      body: { uid: "hacker-uid", phone: "+910000000000", role: "ADMIN" },
    };
    const ctx = {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;

    await guard.canActivate(ctx);
    expect(request.firebaseUser.uid).toBe("real-firebase-uid");
    expect(request.firebaseUser.uid).not.toBe("hacker-uid");
  });
});

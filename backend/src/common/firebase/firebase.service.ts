import { Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { initializeApp, cert, getApps, type App } from "firebase-admin/app";
import { getAuth, type DecodedIdToken } from "firebase-admin/auth";
import * as fs from "fs";

export interface VerifiedFirebaseUser {
  uid: string;
  phone_number?: string;
  email?: string;
  email_verified?: boolean;
}

@Injectable()
export class FirebaseService {
  private readonly log = new Logger(FirebaseService.name);
  private app: App | null = null;

  constructor(private config: ConfigService) {
    this.initialize();
  }

  private initialize(): void {
    if (this.app) return;

    const existing = getApps();
    if (existing.length > 0) {
      this.app = existing[0];
      this.log.log("Firebase Admin using existing app instance");
      return;
    }

    const serviceAccountPath = this.config.get<string>("FIREBASE_SERVICE_ACCOUNT");

    try {
      if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
        const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf-8"));
        this.app = initializeApp({ credential: cert(serviceAccount) });
        this.log.log("Firebase Admin initialized with service account file");
        return;
      }

      const projectId = this.config.get<string>("FIREBASE_PROJECT_ID");
      const clientEmail = this.config.get<string>("FIREBASE_CLIENT_EMAIL");
      const privateKey = this.config.get<string>("FIREBASE_PRIVATE_KEY");

      if (projectId && clientEmail && privateKey) {
        this.app = initializeApp({
          credential: cert({
            projectId,
            clientEmail,
            privateKey: privateKey.replace(/\\n/g, "\n"),
          }),
        });
        this.log.log("Firebase Admin initialized with individual credentials");
        return;
      }

      this.log.warn(
        "Firebase Admin SDK not configured. Firebase auth endpoints will throw errors.",
      );
    } catch (err) {
      this.log.error(`Firebase Admin initialization failed: ${err}`);
    }
  }

  private getAuth() {
    if (!this.app) {
      throw new UnauthorizedException(
        "Firebase Admin SDK is not configured. Set FIREBASE_SERVICE_ACCOUNT or FIREBASE_PROJECT_ID/FIREBASE_CLIENT_EMAIL/FIREBASE_PRIVATE_KEY.",
      );
    }
    return getAuth(this.app);
  }

  async verifyIdToken(idToken: string): Promise<DecodedIdToken> {
    try {
      return await this.getAuth().verifyIdToken(idToken, true);
    } catch (err: any) {
      if (err.code === "auth/id-token-expired") {
        throw new UnauthorizedException("Firebase token has expired");
      }
      if (err.code === "auth/id-token-revoked") {
        throw new UnauthorizedException("Firebase token has been revoked");
      }
      if (err.code === "auth/id-token-invalid") {
        throw new UnauthorizedException("Invalid Firebase token");
      }
      throw new UnauthorizedException("Failed to verify Firebase token");
    }
  }

  async verifyAndGetUser(idToken: string): Promise<VerifiedFirebaseUser> {
    const decoded = await this.verifyIdToken(idToken);
    return {
      uid: decoded.uid,
      phone_number: decoded.phone_number,
      email: decoded.email,
      email_verified: decoded.email_verified,
    };
  }

  async revokeRefreshTokens(uid: string): Promise<void> {
    await this.getAuth().revokeRefreshTokens(uid);
  }

  getPhoneNumber(decodedToken: DecodedIdToken): string | undefined {
    return decodedToken.phone_number;
  }
}

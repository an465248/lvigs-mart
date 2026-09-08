import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { FirebaseService } from "../firebase/firebase.service";
import { Request } from "express";

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  constructor(private readonly firebase: FirebaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractBearerToken(request);

    if (!token) {
      throw new UnauthorizedException(
        "Missing or malformed Authorization header. Expected: Bearer <token>",
      );
    }

    try {
      const verified = await this.firebase.verifyAndGetUser(token);
      (request as any).firebaseUser = verified;
      return true;
    } catch {
      throw new UnauthorizedException("Invalid, expired, or revoked Firebase token");
    }
  }

  private extractBearerToken(request: Request): string | null {
    const auth = request.headers.authorization;
    if (!auth) return null;

    const parts = auth.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") return null;

    const token = parts[1].trim();
    if (!token) return null;

    return token;
  }
}

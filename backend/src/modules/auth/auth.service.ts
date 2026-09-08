import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as argon2 from "argon2";
import { PrismaService } from "../../prisma/prisma.service";
import { OtpService } from "./otp.service";
import { VerifiedFirebaseUser } from "../../common/firebase/firebase.service";
import { FirebaseSignupBodyDto } from "./dto/auth.dto";
import {
  AppleLoginDto,
  ForgotPasswordDto,
  GoogleLoginDto,
  LoginEmailDto,
  ResetPasswordDto,
  SendOtpDto,
  SignupDto,
  SignupEmailDto,
  VerifyOtpDto,
} from "./dto/auth.dto";

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private otp: OtpService,
    private config: ConfigService,
  ) {}

  async sendOtp(dto: SendOtpDto) {
    return this.otp.send(dto.mobile, "LOGIN");
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const check = await this.otp.verify(dto.mobile, dto.otp, "LOGIN");
    if (!check.ok) throw new BadRequestException(check.reason || "OTP verification failed");
    const user = await this.prisma.user.findUnique({ where: { mobile: dto.mobile } });
    if (!user) throw new UnauthorizedException("Account not found. Please sign up.");
    if (user.isBlocked) throw new UnauthorizedException("Account blocked");
    return this.buildTokens(user);
  }

  async signupWithOtp(dto: SignupDto) {
    const check = await this.otp.verify(dto.mobile, dto.otp, "LOGIN");
    if (!check.ok) throw new BadRequestException(check.reason || "OTP verification failed");
    let user = await this.prisma.user.findUnique({ where: { mobile: dto.mobile } });
    if (!user) {
      user = await this.prisma.user.create({
        data: { mobile: dto.mobile, name: dto.name, email: dto.email, mobileVerified: true, role: "CUSTOMER" },
      });
    }
    return this.buildTokens(user);
  }

  async signupEmail(dto: SignupEmailDto) {
    const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (exists) throw new BadRequestException("Email already in use");
    const passwordHash = await argon2.hash(dto.password);
    const user = await this.prisma.user.create({
      data: { email: dto.email, name: dto.name, passwordHash, emailVerified: true, role: "CUSTOMER" },
    });
    return this.buildTokens(user);
  }

  async loginEmail(dto: LoginEmailDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || !user.passwordHash) throw new UnauthorizedException("Invalid credentials");
    const ok = await argon2.verify(user.passwordHash, dto.password);
    if (!ok) throw new UnauthorizedException("Invalid credentials");
    if (user.isBlocked) throw new UnauthorizedException("Account blocked");
    return this.buildTokens(user);
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    await this.prisma.otpAttempt.create({
      data: {
        email: dto.email,
        codeHash: require("crypto").createHash("sha256").update(code).digest("hex"),
        purpose: "RESET",
        expiresAt: new Date(Date.now() + 10 * 60_000),
      },
    });
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.warn(`[DEV RESET OTP] ${dto.email} -> ${code}`);
    }
    return { ok: true };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const codeHash = require("crypto").createHash("sha256").update(dto.otp).digest("hex");
    const attempt = await this.prisma.otpAttempt.findFirst({
      where: { email: dto.email, codeHash, purpose: "RESET", consumedAt: null },
      orderBy: { createdAt: "desc" },
    });
    if (!attempt || new Date() > attempt.expiresAt) throw new BadRequestException("Invalid or expired OTP");
    const passwordHash = await argon2.hash(dto.newPassword);
    await this.prisma.user.update({ where: { email: dto.email }, data: { passwordHash } });
    await this.prisma.otpAttempt.update({ where: { id: attempt.id }, data: { consumedAt: new Date() } });
    return { ok: true };
  }

  /**
   * Login with a verified Firebase identity.
   * The firebaseUser is already verified server-side by FirebaseAuthGuard.
   * We NEVER trust client-supplied uid/phone/role.
   */
  async loginWithFirebase(firebaseUser: VerifiedFirebaseUser) {
    const mobile = this.normalizeMobile(firebaseUser.phone_number);

    let user = mobile
      ? await this.prisma.user.findUnique({ where: { mobile } })
      : null;

    if (user) {
      if (user.isBlocked) throw new UnauthorizedException("Account blocked");
      if (!user.firebaseUid) {
        await this.linkFirebaseUid(user.id, firebaseUser.uid);
      }
      return this.buildTokens(user);
    }

    user = await this.prisma.user.findUnique({
      where: { firebaseUid: firebaseUser.uid },
    });

    if (user) {
      if (user.isBlocked) throw new UnauthorizedException("Account blocked");
      return this.buildTokens(user);
    }

    throw new UnauthorizedException("Account not found. Please sign up.");
  }

  /**
   * Signup with a verified Firebase identity.
   * The firebaseUser is already verified server-side by FirebaseAuthGuard.
   * New users ALWAYS get CUSTOMER role — client can never choose a privileged role.
   */
  async signupWithFirebase(firebaseUser: VerifiedFirebaseUser, body: FirebaseSignupBodyDto) {
    const mobile = this.normalizeMobile(firebaseUser.phone_number);

    if (mobile) {
      const existingByMobile = await this.prisma.user.findUnique({ where: { mobile } });
      if (existingByMobile) {
        if (existingByMobile.isBlocked) throw new UnauthorizedException("Account blocked");
        if (!existingByMobile.firebaseUid) {
          await this.linkFirebaseUid(existingByMobile.id, firebaseUser.uid);
        }
        return this.buildTokens(existingByMobile);
      }
    }

    const existingByFirebase = await this.prisma.user.findUnique({
      where: { firebaseUid: firebaseUser.uid },
    });
    if (existingByFirebase) {
      if (existingByFirebase.isBlocked) throw new UnauthorizedException("Account blocked");
      return this.buildTokens(existingByFirebase);
    }

    try {
      const user = await this.prisma.user.create({
        data: {
          mobile,
          firebaseUid: firebaseUser.uid,
          name: body.name,
          email: firebaseUser.email,
          mobileVerified: !!mobile,
          emailVerified: firebaseUser.email_verified ?? false,
          role: "CUSTOMER",
        },
      });
      return this.buildTokens(user);
    } catch (err: any) {
      if (err.code === "P2002") {
        const existing = await this.prisma.user.findFirst({
          where: { OR: [{ firebaseUid: firebaseUser.uid }, ...(mobile ? [{ mobile }] : [])] },
        });
        if (existing) return this.buildTokens(existing);
      }
      throw err;
    }
  }

  async loginGoogle(_dto: GoogleLoginDto) {
    throw new BadRequestException("Google Sign-In requires server-side idToken verification");
  }

  async loginApple(_dto: AppleLoginDto) {
    throw new BadRequestException("Apple Sign-In requires server-side identityToken verification");
  }

  async refresh(token: string) {
    try {
      const payload = await this.jwt.verifyAsync(token, {
        secret: this.config.get("JWT_REFRESH_SECRET") || "dev-refresh-secret",
      });
      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user) throw new UnauthorizedException();
      return this.buildTokens(user);
    } catch {
      throw new UnauthorizedException("Invalid refresh token");
    }
  }

  private normalizeMobile(phone?: string): string | null {
    if (!phone) return null;
    return phone.replace(/^\+91/, "");
  }

  private async linkFirebaseUid(userId: string, firebaseUid: string): Promise<void> {
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: { firebaseUid },
      });
    } catch (err: any) {
      if (err.code === "P2002") {
        // Another user already has this firebaseUid — do not link
        return;
      }
      throw err;
    }
  }

  private async buildTokens(user: any) {
    const payload = { sub: user.id, role: user.role, mobile: user.mobile, email: user.email };
    const access = await this.jwt.signAsync(payload);
    const refresh = await this.jwt.signAsync(payload, {
      secret: this.config.get("JWT_REFRESH_SECRET") || "dev-refresh-secret",
      expiresIn: this.config.get("JWT_REFRESH_TTL") || "30d",
    });
    return {
      accessToken: access,
      refreshToken: refresh,
      user: { id: user.id, name: user.name, mobile: user.mobile, email: user.email, role: user.role },
    };
  }
}

import { Body, Controller, Post, UseGuards, UseInterceptors } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { FirebaseAuthGuard } from "../../common/guards/firebase-auth.guard";
import { FirebaseUser } from "../../common/decorators/auth.decorators";
import { VerifiedFirebaseUser } from "../../common/firebase/firebase.service";
import { RateLimitInterceptor } from "../../common/interceptors/rate-limit.interceptor";
import {
  AppleLoginDto,
  ForgotPasswordDto,
  FirebaseSignupBodyDto,
  GoogleLoginDto,
  LoginEmailDto,
  ResetPasswordDto,
  SendOtpDto,
  SignupDto,
  SignupEmailDto,
  VerifyOtpDto,
} from "./dto/auth.dto";

@Controller("auth")
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post("send-otp")
  @UseInterceptors(new RateLimitInterceptor(60_000, 5))
  sendOtp(@Body() dto: SendOtpDto) {
    return this.auth.sendOtp(dto);
  }

  @Post("verify-otp")
  @UseInterceptors(new RateLimitInterceptor(60_000, 10))
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.auth.verifyOtp(dto);
  }

  @Post("signup/otp")
  signupOtp(@Body() dto: SignupDto) {
    return this.auth.signupWithOtp(dto);
  }

  @Post("signup/email")
  signupEmail(@Body() dto: SignupEmailDto) {
    return this.auth.signupEmail(dto);
  }

  @Post("login/email")
  loginEmail(@Body() dto: LoginEmailDto) {
    return this.auth.loginEmail(dto);
  }

  @Post("forgot-password")
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.auth.forgotPassword(dto);
  }

  @Post("reset-password")
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.auth.resetPassword(dto);
  }

  @Post("firebase/login")
  @UseGuards(FirebaseAuthGuard)
  @UseInterceptors(new RateLimitInterceptor(60_000, 10))
  loginFirebase(@FirebaseUser() firebaseUser: VerifiedFirebaseUser) {
    return this.auth.loginWithFirebase(firebaseUser);
  }

  @Post("firebase/signup")
  @UseGuards(FirebaseAuthGuard)
  signupFirebase(
    @FirebaseUser() firebaseUser: VerifiedFirebaseUser,
    @Body() dto: FirebaseSignupBodyDto,
  ) {
    return this.auth.signupWithFirebase(firebaseUser, dto);
  }

  @Post("google")
  loginGoogle(@Body() dto: GoogleLoginDto) {
    return this.auth.loginGoogle(dto);
  }

  @Post("apple")
  loginApple(@Body() dto: AppleLoginDto) {
    return this.auth.loginApple(dto);
  }

  @Post("refresh")
  refresh(@Body() body: { refreshToken: string }) {
    return this.auth.refresh(body.refreshToken);
  }
}

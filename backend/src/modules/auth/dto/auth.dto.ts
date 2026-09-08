import { IsEmail, IsIn, IsOptional, IsString, Length, Matches } from "class-validator";

export class SendOtpDto {
  @IsString()
  @Matches(/^[6-9]\d{9}$/, { message: "Mobile must be a valid 10-digit Indian number" })
  mobile!: string;
}

export class VerifyOtpDto {
  @IsString()
  @Matches(/^[6-9]\d{9}$/)
  mobile!: string;

  @IsString()
  @Length(6, 6)
  otp!: string;
}

export class SignupDto {
  @IsString()
  @Matches(/^[6-9]\d{9}$/)
  mobile!: string;

  @IsString()
  @Length(6, 6)
  otp!: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}

export class LoginEmailDto {
  @IsEmail()
  email!: string;

  @IsString()
  @Length(8, 64)
  password!: string;
}

export class SignupEmailDto {
  @IsString()
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @Length(8, 64)
  password!: string;
}

export class GoogleLoginDto {
  @IsString()
  idToken!: string;
}

export class AppleLoginDto {
  @IsString()
  identityToken!: string;

  @IsString()
  @IsIn(["email", "anonymous"])
  provider!: "email" | "anonymous";

  @IsOptional()
  @IsString()
  fullName?: string;
}

export class ForgotPasswordDto {
  @IsEmail()
  email!: string;
}

export class ResetPasswordDto {
  @IsEmail()
  email!: string;

  @IsString()
  @Length(6, 6)
  otp!: string;

  @IsString()
  @Length(8, 64)
  newPassword!: string;
}

/** Body DTO for POST /auth/firebase/signup — idToken comes from Authorization header */
export class FirebaseSignupBodyDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}

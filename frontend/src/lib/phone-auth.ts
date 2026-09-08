import { ConfirmationResult, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { getFirebaseAuth } from "./firebase";

let recaptchaVerifier: RecaptchaVerifier | null = null;
let confirmationResult: ConfirmationResult | null = null;

export function initRecaptcha(buttonId: string): void {
  if (typeof window === "undefined") return;
  const auth = getFirebaseAuth();
  if (recaptchaVerifier) {
    recaptchaVerifier.clear();
  }
  recaptchaVerifier = new RecaptchaVerifier(auth, buttonId, {
    size: "invisible",
  });
}

export async function sendFirebaseOtp(
  phoneNumber: string,
  buttonId: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const auth = getFirebaseAuth();
    initRecaptcha(buttonId);
    const formattedPhone = phoneNumber.startsWith("+91")
      ? phoneNumber
      : `+91${phoneNumber}`;

    confirmationResult = await signInWithPhoneNumber(
      auth,
      formattedPhone,
      recaptchaVerifier!
    );
    return { ok: true };
  } catch (error: any) {
    console.error("Firebase send OTP error:", error);
    if (recaptchaVerifier) {
      recaptchaVerifier.clear();
      recaptchaVerifier = null;
    }
    return {
      ok: false,
      error: error.message || "Failed to send OTP. Please try again.",
    };
  }
}

export async function verifyFirebaseOtp(
  otp: string
): Promise<{ ok: boolean; idToken?: string; error?: string }> {
  try {
    if (!confirmationResult) {
      return { ok: false, error: "No OTP request pending. Please request a new code." };
    }
    const result = await confirmationResult.confirm(otp);
    const idToken = await result.user.getIdToken();
    confirmationResult = null;
    return { ok: true, idToken };
  } catch (error: any) {
    console.error("Firebase verify OTP error:", error);
    return {
      ok: false,
      error: error.message || "Invalid OTP. Please try again.",
    };
  }
}

export function cleanupRecaptcha(): void {
  if (recaptchaVerifier) {
    recaptchaVerifier.clear();
    recaptchaVerifier = null;
  }
}

export function getFirebaseErrorCode(error: string): string {
  if (error.includes("auth/invalid-verification-code")) return "Invalid OTP code.";
  if (error.includes("auth/code-expired")) return "OTP expired. Please request a new code.";
  if (error.includes("auth/too-many-requests")) return "Too many attempts. Please try later.";
  if (error.includes("auth/quota-exceeded")) return "SMS quota exceeded. Please try later.";
  if (error.includes("auth/network-request-failed")) return "Network error. Check your connection.";
  return "Something went wrong. Please try again.";
}

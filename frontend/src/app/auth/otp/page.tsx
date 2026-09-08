"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ShieldCheck, RotateCcw } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { verifyFirebaseOtp, sendFirebaseOtp, getFirebaseErrorCode, cleanupRecaptcha } from "@/lib/phone-auth";
import { firebaseLogin, firebaseSignup } from "@/lib/api";
import { useStore } from "@/state/store";
import { useToast } from "@/components/ui/Toast";

export const dynamic = "force-dynamic";

export default function OtpPage() {
  return (
    <Suspense fallback={<div className="flex min-h-dvh items-center justify-center">Loading...</div>}>
      <OtpContent />
    </Suspense>
  );
}

function OtpContent() {
  const router = useRouter();
  const params = useSearchParams();
  const mobile = params.get("mobile") || sessionStorage.getItem("lvigs_otp_mobile") || "";
  const { setUser, setAuthTokens } = useStore();
  const toast = useToast();
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState("");
  const [timer, setTimer] = useState(30);

  useEffect(() => {
    const t = setInterval(() => setTimer((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    return () => {
      cleanupRecaptcha();
    };
  }, []);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) { setError("Enter the 6-digit OTP"); return; }
    setLoading(true);
    setError("");
    try {
      const fbResult = await verifyFirebaseOtp(otp);
      if (!fbResult.ok) {
        setError(getFirebaseErrorCode(fbResult.error || ""));
        setLoading(false);
        return;
      }

      const idToken = fbResult.idToken!;

      let authRes = await firebaseLogin(idToken);
      if (!authRes.ok && authRes.reason?.includes("not found")) {
        authRes = await firebaseSignup(idToken);
      }

      if (authRes.ok && authRes.user) {
        if (authRes.accessToken && authRes.refreshToken) {
          setAuthTokens(authRes.accessToken, authRes.refreshToken);
        }
        setUser(authRes.user);
        toast.push("Logged in successfully!", "success");
        router.push("/");
      } else {
        setError(authRes.reason || "Login failed. Please try again.");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    setError("");
    try {
      const res = await sendFirebaseOtp(mobile, "resend-otp-btn");
      if (res.ok) {
        setTimer(30);
        toast.push("OTP resent successfully", "success");
      } else {
        setError(getFirebaseErrorCode(res.error || ""));
      }
    } catch {
      setError("Failed to resend OTP");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-ink-50 px-4 dark:bg-ink-900">
      <div className="w-full max-w-md">
        <Link href="/auth/login" className="mb-8 flex justify-center"><Logo /></Link>
        <div className="rounded-2xl border bg-white p-6 shadow-card dark:border-ink-700 dark:bg-ink-800">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-950/30">
              <ShieldCheck className="h-7 w-7 text-brand-600 dark:text-brand-300" />
            </div>
            <h1 className="text-xl font-bold">Verify OTP</h1>
            <p className="mt-1 text-sm text-ink-500">
              Enter the 6-digit code sent to +91 {mobile}
            </p>
          </div>
          <form onSubmit={handleVerify} className="space-y-4">
            <div className="flex justify-center gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <input
                  key={i}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={otp[i] || ""}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    const next = otp.slice(0, i) + val + otp.slice(i + 1);
                    setOtp(next.slice(0, 6));
                    if (val && e.target.nextElementSibling) {
                      (e.target.nextElementSibling as HTMLInputElement).focus?.();
                    }
                  }}
                  className="h-12 w-10 rounded-lg border bg-ink-50 text-center text-xl font-bold outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:bg-ink-700"
                  aria-label={`Digit ${i + 1}`}
                />
              ))}
            </div>
            {error && <p className="text-center text-sm text-rose-600">{error}</p>}
            <Button type="submit" block loading={loading}>Verify</Button>
          </form>
          <div className="mt-4 text-center text-sm text-ink-500">
            {timer > 0 ? (
              <span>Resend OTP in {timer}s</span>
            ) : (
              <>
                <button id="resend-otp-btn" onClick={handleResend} disabled={resendLoading} className="font-semibold text-brand-600 hover:text-brand-700">
                  <RotateCcw className="mr-1 inline h-3.5 w-3.5" /> Resend OTP
                </button>
              </>
            )}
          </div>
          <div className="mt-4 text-center">
            <Link href="/auth/login" className="text-sm text-ink-500 hover:text-brand-600">
              <ArrowLeft className="mr-1 inline h-4 w-4" /> Change number
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

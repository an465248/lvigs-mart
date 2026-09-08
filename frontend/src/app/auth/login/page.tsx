"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Smartphone } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { sendFirebaseOtp } from "@/lib/phone-auth";
import { isIndianMobile } from "@/lib/utils";

export default function LoginPage() {
  const router = useRouter();
  const [mobile, setMobile] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!isIndianMobile(mobile)) {
      setError("Enter a valid 10-digit Indian mobile number");
      return;
    }
    setLoading(true);
    try {
      const res = await sendFirebaseOtp(mobile, "send-otp-btn");
      if (res.ok) {
        sessionStorage.setItem("lvigs_otp_mobile", mobile);
        router.push(`/auth/otp?mobile=${mobile}`);
      } else {
        setError(res.error || "Failed to send OTP");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-ink-50 px-4 dark:bg-ink-900">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 flex justify-center">
          <Logo />
        </Link>
        <div className="rounded-2xl border bg-white p-6 shadow-card dark:border-ink-700 dark:bg-ink-800">
          <div className="mb-6 text-center">
            <h1 className="text-xl font-bold">Welcome to LVIGS Mart</h1>
            <p className="mt-1 text-sm text-ink-500">Sign in with your mobile number</p>
          </div>
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div className="flex gap-2">
              <div className="w-20 shrink-0">
                <Input value="+91" disabled />
              </div>
              <Input
                placeholder="Enter 10-digit mobile"
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                leftIcon={<Smartphone className="h-4 w-4" />}
                error={error}
                type="tel"
                inputMode="numeric"
              />
            </div>
            <button id="send-otp-btn" type="submit" className="hidden" aria-hidden="true" />
            <Button type="submit" block loading={loading}>
              Send OTP
            </Button>
          </form>
          <div className="mt-4 grid grid-cols-2 gap-2 text-center text-xs text-ink-500">
            <Link href="/auth/signup" className="hover:text-brand-600">Create account</Link>
            <Link href="/auth/forgot-password" className="hover:text-brand-600">Forgot password?</Link>
          </div>
          <div className="mt-4 flex justify-center">
            <Link href="/" className="flex items-center gap-1 text-sm text-ink-500 hover:text-brand-600">
              <ArrowLeft className="h-4 w-4" /> Back to home
            </Link>
          </div>
        </div>
        <p className="mt-4 text-center text-[11px] text-ink-400">
          By continuing, you agree to our{" "}
          <a href="/terms" className="underline">Terms</a> &amp;{" "}
          <a href="/privacy" className="underline">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
}

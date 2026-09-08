"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Truck, ArrowLeft } from "lucide-react";

const DELIVERY_AUTH_KEY = "lvigs_delivery_auth";

export default function DeliveryLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => { setOtpSent(true); setLoading(false); }, 1000);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      localStorage.setItem(DELIVERY_AUTH_KEY, "true");
      router.push("/delivery/dashboard");
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-ink-50 dark:bg-ink-900 px-4">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-6 inline-flex items-center gap-1 text-sm text-ink-500 hover:text-accent-600">
          <ArrowLeft className="h-4 w-4" /> Back to Store
        </Link>
        <div className="mb-6 flex flex-col items-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-950/40">
            <Truck className="h-8 w-8 text-emerald-600" />
          </div>
          <h1 className="mt-4 text-2xl font-bold">Delivery Partner Login</h1>
          <p className="text-sm text-ink-500">Login to manage your deliveries</p>
        </div>

        <div className="rounded-2xl border bg-white p-6 shadow-card dark:border-ink-700 dark:bg-ink-800">
          {!otpSent ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <Input label="Mobile Number" required value={mobile} onChange={e => setMobile(e.target.value)} placeholder="10-digit mobile" />
              <Button type="submit" block loading={loading}>Send OTP</Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <p className="text-sm text-ink-500">OTP sent to {mobile}</p>
              <Input label="Enter OTP" required value={otp} onChange={e => setOtp(e.target.value)} placeholder="6-digit OTP" />
              <Button type="submit" block loading={loading}>Verify & Login</Button>
              <button type="button" onClick={() => setOtpSent(false)} className="w-full text-center text-sm text-accent-600 hover:text-accent-700">Change Number</button>
            </form>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-ink-500">
          Not registered yet?{" "}
          <Link href="/delivery/register" className="text-accent-600 hover:text-accent-700">Become a Delivery Partner</Link>
        </p>
      </div>
    </div>
  );
}

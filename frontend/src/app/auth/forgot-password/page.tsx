"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, KeyRound, Lock } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState({ email: "", otp: "", newPassword: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || ""}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email }),
      });
      if (res.ok) setStep(2);
      else setError("Email not found");
    } catch { setError("Network error"); }
    finally { setLoading(false); }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || ""}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) { window.location.href = "/auth/login"; }
      else setError("Invalid OTP or password");
    } catch { setError("Network error"); }
    finally { setLoading(false); }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-ink-50 px-4 dark:bg-ink-900">
      <div className="w-full max-w-md">
        <Link href="/auth/login" className="mb-8 flex justify-center"><Logo /></Link>
        <div className="rounded-2xl border bg-white p-6 shadow-card dark:border-ink-700 dark:bg-ink-800">
          <div className="mb-6 text-center">
            <h1 className="text-xl font-bold">Reset Password</h1>
            <p className="mt-1 text-sm text-ink-500">{step === 1 ? "Enter your email to receive a reset code" : "Enter the OTP and your new password"}</p>
          </div>
          {step === 1 ? (
            <form onSubmit={handleSendEmail} className="space-y-4">
              <Input placeholder="Email address" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} leftIcon={<Mail className="h-4 w-4" />} />
              {error && <p className="text-center text-sm text-rose-600">{error}</p>}
              <Button type="submit" block loading={loading}>Send Reset OTP</Button>
            </form>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              <Input placeholder="6-digit OTP" value={form.otp} onChange={(e) => setForm({ ...form, otp: e.target.value })} leftIcon={<KeyRound className="h-4 w-4" />} />
              <Input placeholder="New password (min 8 chars)" type="password" value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} leftIcon={<Lock className="h-4 w-4" />} />
              {error && <p className="text-center text-sm text-rose-600">{error}</p>}
              <Button type="submit" block loading={loading}>Reset Password</Button>
            </form>
          )}
          <div className="mt-4 text-center">
            <Link href="/auth/login" className="flex items-center justify-center gap-1 text-sm text-ink-500 hover:text-brand-600"><ArrowLeft className="h-4 w-4" /> Back to login</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
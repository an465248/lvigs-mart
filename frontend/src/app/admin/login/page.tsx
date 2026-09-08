"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ShieldCheck, Mail, Lock, AlertCircle } from "lucide-react";
import { adminLogin } from "@/lib/admin-auth";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    await new Promise(r => setTimeout(r, 600));

    if (email === "admin@lvigsmart.com" && password === "admin123") {
      adminLogin();
      router.push("/admin");
    } else {
      setError("Invalid email or password");
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-gradient-to-br from-brand-50 via-white to-brand-50 px-4 dark:from-ink-900 dark:via-ink-900 dark:to-brand-950/20">
      <div className="w-full max-w-md animate-fade-in">
        <div className="mb-8 flex flex-col items-center">
          <Logo />
          <h1 className="mt-4 text-2xl font-bold text-ink-900 dark:text-white">LVIGS Mart</h1>
          <p className="text-sm text-ink-500">Admin Panel</p>
        </div>

        <div className="rounded-2xl border border-ink-200 bg-white p-8 shadow-card dark:border-ink-700 dark:bg-ink-800">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-950/40">
              <ShieldCheck className="h-7 w-7 text-brand-600 dark:text-brand-300" />
            </div>
            <h2 className="text-xl font-bold">Sign in to Admin</h2>
            <p className="mt-1 text-sm text-ink-500">Enter your credentials to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email address"
              type="email"
              required
              placeholder="admin@lvigsmart.com"
              value={email}
              onChange={e => { setEmail(e.target.value); setError(""); }}
              leftIcon={<Mail className="h-4 w-4" />}
              autoComplete="email"
            />
            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? "text" : "password"}
                required
                placeholder="Enter password"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(""); }}
                leftIcon={<Lock className="h-4 w-4" />}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[38px] text-xs text-ink-500 hover:text-brand-600"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <Button type="submit" block loading={loading} size="lg">
              Sign In
            </Button>
          </form>

          <div className="mt-6 rounded-lg bg-ink-50 p-3 dark:bg-ink-700/50">
            <p className="text-center text-xs font-medium text-ink-600 dark:text-ink-300">Demo Credentials</p>
            <p className="mt-1 text-center text-xs text-ink-500">
              <span className="font-mono">admin@lvigsmart.com</span>
              <span className="mx-1.5 text-ink-300">/</span>
              <span className="font-mono">admin123</span>
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-ink-400">
          &copy; {new Date().getFullYear()} LVIGS Commerce Pvt. Ltd.
        </p>
      </div>
    </div>
  );
}

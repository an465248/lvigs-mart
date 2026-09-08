"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Mail, Lock, User } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError("Name is required"); return; }
    if (!form.email.includes("@")) { setError("Enter a valid email"); return; }
    if (form.password.length < 8) { setError("Password must be at least 8 characters"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || ""}/api/auth/signup/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        router.push("/auth/login");
      } else {
        setError("Signup failed. Email may already be in use.");
      }
    } catch { setError("Network error"); }
    finally { setLoading(false); }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-ink-50 px-4 dark:bg-ink-900">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 flex justify-center"><Logo /></Link>
        <div className="rounded-2xl border bg-white p-6 shadow-card dark:border-ink-700 dark:bg-ink-800">
          <div className="mb-6 text-center">
            <h1 className="text-xl font-bold">Create Account</h1>
            <p className="mt-1 text-sm text-ink-500">Sign up with email and password</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} leftIcon={<User className="h-4 w-4" />} />
            <Input placeholder="Email address" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} leftIcon={<Mail className="h-4 w-4" />} />
            <Input placeholder="Password (min 8 chars)" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} leftIcon={<Lock className="h-4 w-4" />} />
            {error && <p className="text-center text-sm text-rose-600">{error}</p>}
            <Button type="submit" block loading={loading}>Create Account</Button>
          </form>
          <div className="mt-4 text-center text-sm text-ink-500">
            <Link href="/auth/login" className="font-semibold text-brand-600 hover:text-brand-700">Already have an account? Sign in</Link>
          </div>
          <div className="mt-3 text-center">
            <Link href="/" className="flex items-center justify-center gap-1 text-sm text-ink-500 hover:text-brand-600"><ArrowLeft className="h-4 w-4" /> Back to home</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { sellerLogin } from "@/lib/seller-auth";
import { Store, ArrowLeft, CheckCircle } from "lucide-react";

export default function SellerRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    storeName: "", ownerName: "", email: "", mobile: "", password: "",
    businessType: "INDIVIDUAL", panNumber: "", gstNumber: "",
    address: "", city: "", state: "Karnataka", pincode: "",
    bankName: "", accountNumber: "", ifsc: "", upi: "",
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    sellerLogin();
    router.push("/seller/dashboard");
    setLoading(false);
  };

  return (
    <div className="min-h-dvh bg-ink-50 dark:bg-ink-900">
      <div className="mx-auto max-w-lg px-4 py-8">
        <Link href="/seller/login" className="mb-6 inline-flex items-center gap-1 text-sm text-ink-500 hover:text-accent-600">
          <ArrowLeft className="h-4 w-4" /> Back to Login
        </Link>
        <div className="mb-6 flex flex-col items-center">
          <Logo />
          <h1 className="mt-4 text-2xl font-bold">Sell on LVIGS Mart</h1>
          <p className="text-sm text-ink-500">Start selling to millions of customers</p>
        </div>

        <div className="mb-6 flex items-center justify-center gap-2">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${step >= s ? "bg-accent-600 text-white" : "bg-ink-200 text-ink-500 dark:bg-ink-700"}`}>
                {step > s ? <CheckCircle className="h-4 w-4" /> : s}
              </div>
              {s < 3 && <div className={`h-0.5 w-12 ${step > s ? "bg-accent-600" : "bg-ink-200 dark:bg-ink-700"}`} />}
            </div>
          ))}
        </div>

        <div className="rounded-2xl border bg-white p-6 shadow-card dark:border-ink-700 dark:bg-ink-800">
          <form onSubmit={handleSubmit} className="space-y-4">
            {step === 1 && (
              <>
                <h3 className="font-bold">Store Details</h3>
                <Input label="Store Name" required value={form.storeName} onChange={e => set("storeName", e.target.value)} placeholder="e.g. My Electronics Store" />
                <Input label="Owner Name" required value={form.ownerName} onChange={e => set("ownerName", e.target.value)} />
                <Input label="Email" type="email" required value={form.email} onChange={e => set("email", e.target.value)} />
                <Input label="Mobile" required value={form.mobile} onChange={e => set("mobile", e.target.value)} placeholder="10-digit mobile" />
                <Input label="Password" type="password" required value={form.password} onChange={e => set("password", e.target.value)} />
                <Button type="button" block onClick={() => setStep(2)}>Next</Button>
              </>
            )}
            {step === 2 && (
              <>
                <h3 className="font-bold">Business Details</h3>
                <Select label="Business Type" value={form.businessType} onChange={e => set("businessType", e.target.value)}>
                  <option value="INDIVIDUAL">Individual / Sole Proprietor</option>
                  <option value="PARTNERSHIP">Partnership</option>
                  <option value="PRIVATE_LIMITED">Private Limited</option>
                  <option value="LLP">LLP</option>
                </Select>
                <Input label="PAN Number" required value={form.panNumber} onChange={e => set("panNumber", e.target.value)} placeholder="ABCDE1234F" />
                <Input label="GST Number" value={form.gstNumber} onChange={e => set("gstNumber", e.target.value)} placeholder="Optional" />
                <Textarea label="Business Address" required value={form.address} onChange={e => set("address", e.target.value)} />
                <div className="grid gap-4 sm:grid-cols-3">
                  <Input label="City" required value={form.city} onChange={e => set("city", e.target.value)} />
                  <Input label="State" required value={form.state} onChange={e => set("state", e.target.value)} />
                  <Input label="Pincode" required value={form.pincode} onChange={e => set("pincode", e.target.value)} />
                </div>
                <div className="flex gap-3">
                  <Button type="button" variant="outline" block onClick={() => setStep(1)}>Back</Button>
                  <Button type="button" block onClick={() => setStep(3)}>Next</Button>
                </div>
              </>
            )}
            {step === 3 && (
              <>
                <h3 className="font-bold">Bank Account</h3>
                <Input label="Account Holder Name" required value={form.bankName} onChange={e => set("bankName", e.target.value)} />
                <Input label="Account Number" required value={form.accountNumber} onChange={e => set("accountNumber", e.target.value)} />
                <Input label="IFSC Code" required value={form.ifsc} onChange={e => set("ifsc", e.target.value)} placeholder="SBIN0001234" />
                <Input label="UPI ID" value={form.upi} onChange={e => set("upi", e.target.value)} placeholder="Optional" />
                <div className="rounded-lg bg-amber-50 p-3 text-xs text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
                  By registering, you agree to LVIGS Mart&apos;s seller terms and commission policies.
                </div>
                <div className="flex gap-3">
                  <Button type="button" variant="outline" block onClick={() => setStep(2)}>Back</Button>
                  <Button type="submit" block loading={loading}>Register & Start Selling</Button>
                </div>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

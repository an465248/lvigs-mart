"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { Truck, ArrowLeft, CheckCircle } from "lucide-react";

const DELIVERY_AUTH_KEY = "lvigs_delivery_auth";

export default function DeliveryRegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: "", mobile: "", email: "",
    vehicleType: "BIKE", vehicleNumber: "",
    city: "", state: "Karnataka",
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      localStorage.setItem(DELIVERY_AUTH_KEY, "true");
      router.push("/delivery/dashboard");
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-dvh bg-ink-50 dark:bg-ink-900">
      <div className="mx-auto max-w-lg px-4 py-8">
        <Link href="/delivery/login" className="mb-6 inline-flex items-center gap-1 text-sm text-ink-500 hover:text-accent-600">
          <ArrowLeft className="h-4 w-4" /> Back to Login
        </Link>
        <div className="mb-6 flex flex-col items-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-950/40">
            <Truck className="h-8 w-8 text-emerald-600" />
          </div>
          <h1 className="mt-4 text-2xl font-bold">Become a Delivery Partner</h1>
          <p className="text-sm text-ink-500">Deliver with LVIGS Mart</p>
        </div>

        <div className="mb-6 flex items-center justify-center gap-2">
          {[1, 2].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${step >= s ? "bg-emerald-600 text-white" : "bg-ink-200 text-ink-500 dark:bg-ink-700"}`}>
                {step > s ? <CheckCircle className="h-4 w-4" /> : s}
              </div>
              {s < 2 && <div className={`h-0.5 w-12 ${step > s ? "bg-emerald-600" : "bg-ink-200 dark:bg-ink-700"}`} />}
            </div>
          ))}
        </div>

        <div className="rounded-2xl border bg-white p-6 shadow-card dark:border-ink-700 dark:bg-ink-800">
          <form onSubmit={handleSubmit} className="space-y-4">
            {step === 1 && (
              <>
                <h3 className="font-bold">Personal Details</h3>
                <Input label="Full Name" required value={form.name} onChange={e => set("name", e.target.value)} />
                <Input label="Mobile Number" required value={form.mobile} onChange={e => set("mobile", e.target.value)} placeholder="10-digit mobile" />
                <Input label="Email" type="email" value={form.email} onChange={e => set("email", e.target.value)} />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input label="City" required value={form.city} onChange={e => set("city", e.target.value)} />
                  <Input label="State" required value={form.state} onChange={e => set("state", e.target.value)} />
                </div>
                <Button type="button" block onClick={() => setStep(2)}>Next</Button>
              </>
            )}
            {step === 2 && (
              <>
                <h3 className="font-bold">Vehicle Details</h3>
                <Select label="Vehicle Type" value={form.vehicleType} onChange={e => set("vehicleType", e.target.value)}>
                  <option value="BIKE">Bike / Motorcycle</option>
                  <option value="SCOOTER">Scooter</option>
                  <option value="CAR">Car</option>
                  <option value="VAN">Van / Tempo</option>
                  <option value="TRUCK">Truck</option>
                </Select>
                <Input label="Vehicle Number" required value={form.vehicleNumber} onChange={e => set("vehicleNumber", e.target.value)} placeholder="e.g. KA01AB1234" />
                <div className="rounded-lg bg-emerald-50 p-3 text-xs text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
                  By registering, you agree to LVIGS Mart&apos;s delivery partner terms and conditions.
                </div>
                <div className="flex gap-3">
                  <Button type="button" variant="outline" block onClick={() => setStep(1)}>Back</Button>
                  <Button type="submit" block loading={loading}>Register</Button>
                </div>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

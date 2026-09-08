"use client";

import { useEffect, useState } from "react";
import { sellerMock, type SellerProfile } from "@/lib/seller-mock";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Store, Building2, CreditCard, Save } from "lucide-react";

export default function SellerSettingsPage() {
  const [profile, setProfile] = useState<SellerProfile | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ storeName: "", description: "", panNumber: "", gstNumber: "" });

  useEffect(() => {
    const p = sellerMock.getProfile();
    setProfile(p);
    setForm({ storeName: p.storeName, description: p.description, panNumber: p.panNumber, gstNumber: p.gstNumber });
  }, []);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 600));
    sellerMock.updateProfile(form);
    setSaving(false);
    alert("Profile updated!");
  };

  if (!profile) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Seller Settings</h1>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Store className="h-4 w-4" /> Store Details</CardTitle></CardHeader>
        <CardBody className="space-y-4">
          <Input label="Store Name" value={form.storeName} onChange={e => set("storeName", e.target.value)} />
          <Textarea label="Store Description" value={form.description} onChange={e => set("description", e.target.value)} />
          <div className="flex items-center gap-3">
            <img src={profile.logo} alt="" className="h-16 w-16 rounded-xl object-cover" />
            <div>
              <p className="text-sm font-medium">Store Logo</p>
              <p className="text-xs text-ink-500">100x100 recommended</p>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Building2 className="h-4 w-4" /> Business Details</CardTitle></CardHeader>
        <CardBody className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs text-ink-500">PAN Number</p>
              <p className="font-mono font-medium">{profile.panNumber}</p>
            </div>
            <div>
              <p className="text-xs text-ink-500">GST Number</p>
              <p className="font-mono font-medium">{profile.gstNumber}</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs text-ink-500">KYC Status</p>
              <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${profile.kycStatus === "APPROVED" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                {profile.kycStatus}
              </span>
            </div>
            <div>
              <p className="text-xs text-ink-500">Seller Status</p>
              <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${profile.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                {profile.status}
              </span>
            </div>
          </div>
        </CardBody>
      </Card>

      {profile.bankAccount && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><CreditCard className="h-4 w-4" /> Bank Account</CardTitle></CardHeader>
          <CardBody>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><p className="text-xs text-ink-500">Account Name</p><p className="font-medium">{profile.bankAccount.accountName}</p></div>
              <div><p className="text-xs text-ink-500">Bank</p><p className="font-medium">{profile.bankAccount.bankName}</p></div>
              <div><p className="text-xs text-ink-500">Account Number</p><p className="font-mono">{profile.bankAccount.accountNumber}</p></div>
              <div><p className="text-xs text-ink-500">IFSC</p><p className="font-mono">{profile.bankAccount.ifsc}</p></div>
            </div>
          </CardBody>
        </Card>
      )}

      <div className="flex justify-end">
        <Button onClick={handleSave} loading={saving}><Save className="mr-1 h-4 w-4" /> Save Changes</Button>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { adminMock } from "@/lib/admin-mock";
import type { Coupon } from "@/lib/types";
import { formatINR } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/Input";
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight } from "lucide-react";

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    code: "", description: "", type: "FLAT" as "FLAT" | "PERCENT", value: "",
    maxDiscount: "", minOrder: "", appliesTo: "ALL" as "ALL" | "CATEGORY" | "PRODUCT",
    expiresAt: "", usageLimit: "", firstOrderOnly: "false",
  });

  const load = () => setCoupons(adminMock.getCoupons());
  useEffect(() => { load(); }, []);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const resetForm = () => {
    setForm({ code: "", description: "", type: "FLAT", value: "", maxDiscount: "", minOrder: "", appliesTo: "ALL", expiresAt: "", usageLimit: "", firstOrderOnly: "false" });
    setEditId(null);
    setShowForm(false);
  };

  const handleEdit = (c: Coupon) => {
    setEditId(c.id);
    setForm({
      code: c.code, description: c.description, type: c.type, value: String(c.value),
      maxDiscount: String(c.maxDiscount || ""), minOrder: String(c.minOrder),
      appliesTo: c.appliesTo, expiresAt: c.expiresAt.split("T")[0],
      usageLimit: String(c.usageLimit || ""), firstOrderOnly: String(c.firstOrderOnly || "false"),
    });
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      code: form.code.toUpperCase(), description: form.description, type: form.type,
      value: Number(form.value), maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : undefined,
      minOrder: Number(form.minOrder), appliesTo: form.appliesTo, scopeIds: [],
      expiresAt: form.expiresAt || new Date(Date.now() + 90 * 86400000).toISOString(),
      usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
      firstOrderOnly: form.firstOrderOnly === "true", userSpecific: false,
    };
    if (editId) {
      adminMock.updateCoupon(editId, data);
    } else {
      adminMock.addCoupon(data);
    }
    resetForm();
    load();
  };

  const handleDelete = (id: string) => {
    if (!confirm("Delete this coupon?")) return;
    adminMock.deleteCoupon(id);
    load();
  };

  const handleToggle = (id: string, current: Coupon) => {
    const expiresAt = new Date(current.expiresAt);
    const isExpired = expiresAt < new Date();
    if (isExpired) {
      adminMock.updateCoupon(id, { expiresAt: new Date(Date.now() + 90 * 86400000).toISOString() });
    } else {
      adminMock.updateCoupon(id, { expiresAt: new Date(0).toISOString() });
    }
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Coupons</h1>
          <p className="text-sm text-ink-500">{coupons.length} coupons total</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }}><Plus className="mr-1 h-4 w-4" /> Add Coupon</Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>{editId ? "Edit Coupon" : "New Coupon"}</CardTitle></CardHeader>
          <CardBody>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Coupon Code" required value={form.code} onChange={e => set("code", e.target.value)} placeholder="e.g. SAVE100" />
                <Input label="Description" required value={form.description} onChange={e => set("description", e.target.value)} placeholder="e.g. ₹100 OFF" />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <Select label="Discount Type" value={form.type} onChange={e => set("type", e.target.value)}>
                  <option value="FLAT">Flat (₹)</option>
                  <option value="PERCENT">Percentage (%)</option>
                </Select>
                <Input label="Discount Value" type="number" required value={form.value} onChange={e => set("value", e.target.value)} />
                {form.type === "PERCENT" && <Input label="Max Discount (₹)" type="number" value={form.maxDiscount} onChange={e => set("maxDiscount", e.target.value)} />}
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <Input label="Min Order (₹)" type="number" required value={form.minOrder} onChange={e => set("minOrder", e.target.value)} />
                <Input label="Expiry Date" type="date" value={form.expiresAt} onChange={e => set("expiresAt", e.target.value)} />
                <Input label="Usage Limit" type="number" value={form.usageLimit} onChange={e => set("usageLimit", e.target.value)} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Select label="Applies To" value={form.appliesTo} onChange={e => set("appliesTo", e.target.value)}>
                  <option value="ALL">All Products</option>
                  <option value="CATEGORY">Category</option>
                  <option value="PRODUCT">Specific Product</option>
                </Select>
                <Select label="First Order Only" value={form.firstOrderOnly} onChange={e => set("firstOrderOnly", e.target.value)}>
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </Select>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" type="button" onClick={resetForm}>Cancel</Button>
                <Button type="submit">{editId ? "Save Changes" : "Create Coupon"}</Button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-ink-50 text-left text-xs font-semibold uppercase text-ink-500 dark:border-ink-700 dark:bg-ink-800">
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Discount</th>
                <th className="px-4 py-3">Min Order</th>
                <th className="px-4 py-3">Used</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Expires</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-ink-700">
              {coupons.map(c => {
                const isExpired = new Date(c.expiresAt) < new Date();
                return (
                  <tr key={c.id} className="hover:bg-ink-50 dark:hover:bg-ink-700/50 transition">
                    <td className="px-4 py-3">
                      <p className="font-mono font-bold">{c.code}</p>
                      <p className="text-xs text-ink-500 max-w-[200px] truncate">{c.description}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-brand-600">
                        {c.type === "FLAT" ? `${formatINR(c.value)} OFF` : `${c.value}% OFF`}
                      </span>
                      {c.maxDiscount && <p className="text-xs text-ink-500">Max {formatINR(c.maxDiscount)}</p>}
                    </td>
                    <td className="px-4 py-3 text-xs">{formatINR(c.minOrder)}</td>
                    <td className="px-4 py-3 text-xs">{c.usedCount}{c.usageLimit ? ` / ${c.usageLimit}` : ""}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleToggle(c.id, c)}>
                        {isExpired ? (
                          <span className="inline-block rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">Expired</span>
                        ) : (
                          <span className="inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">Active</span>
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-xs text-ink-500">{new Date(c.expiresAt).toLocaleDateString("en-IN")}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(c)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)}><Trash2 className="h-4 w-4 text-rose-500" /></Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {coupons.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-ink-500">No coupons yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

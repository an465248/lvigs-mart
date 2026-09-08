"use client";

import { useState } from "react";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { Plus, Edit2, Trash2, CreditCard } from "lucide-react";

interface CommissionConfig {
  id: string;
  name: string;
  type: string;
  targetId?: string;
  percentage: number;
  minCommission: number;
  maxCommission?: number;
  isActive: boolean;
}

const sampleCommissions: CommissionConfig[] = [
  { id: "1", name: "Global Default", type: "GLOBAL", percentage: 10, minCommission: 5, maxCommission: 5000, isActive: true },
  { id: "2", name: "Electronics", type: "CATEGORY", targetId: "cat-electronics", percentage: 8, minCommission: 10, maxCommission: 10000, isActive: true },
  { id: "3", name: "Fashion", type: "CATEGORY", targetId: "cat-fashion", percentage: 12, minCommission: 5, maxCommission: 2000, isActive: true },
  { id: "4", name: "Grocery", type: "CATEGORY", targetId: "cat-grocery", percentage: 5, minCommission: 2, maxCommission: 500, isActive: true },
  { id: "5", name: "LVIGS Official Store", type: "SELLER", targetId: "seller-1", percentage: 7, minCommission: 10, isActive: true },
];

export default function AdminCommissionsPage() {
  const [commissions, setCommissions] = useState(sampleCommissions);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<CommissionConfig | null>(null);
  const [form, setForm] = useState({ name: "", type: "GLOBAL", percentage: 10, minCommission: 0, maxCommission: "" });

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = () => {
    if (editing) {
      setCommissions(prev => prev.map(c => c.id === editing.id ? { ...c, ...form, percentage: Number(form.percentage), minCommission: Number(form.minCommission), maxCommission: form.maxCommission ? Number(form.maxCommission) : undefined } : c));
    } else {
      setCommissions(prev => [...prev, { ...form, id: Date.now().toString(), percentage: Number(form.percentage), minCommission: Number(form.minCommission), maxCommission: form.maxCommission ? Number(form.maxCommission) : undefined, isActive: true }]);
    }
    setShowForm(false);
    setEditing(null);
    setForm({ name: "", type: "GLOBAL", percentage: 10, minCommission: 0, maxCommission: "" });
  };

  const handleEdit = (c: CommissionConfig) => {
    setEditing(c);
    setForm({ name: c.name, type: c.type, percentage: c.percentage, minCommission: c.minCommission, maxCommission: c.maxCommission?.toString() || "" });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    setCommissions(prev => prev.filter(c => c.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Commission Management</h1>
          <p className="text-sm text-ink-500">Configure marketplace commission rates</p>
        </div>
        <Button onClick={() => { setShowForm(true); setEditing(null); setForm({ name: "", type: "GLOBAL", percentage: 10, minCommission: 0, maxCommission: "" }); }}>
          <Plus className="h-4 w-4 mr-1" /> Add Commission
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardBody className="space-y-4">
            <h3 className="font-bold">{editing ? "Edit Commission" : "New Commission"}</h3>
            <Input label="Name" value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Electronics Commission" />
            <Select label="Type" value={form.type} onChange={e => set("type", e.target.value)}>
              <option value="GLOBAL">Global (All sellers/categories)</option>
              <option value="CATEGORY">Category-specific</option>
              <option value="SELLER">Seller-specific</option>
            </Select>
            <div className="grid gap-4 sm:grid-cols-3">
              <Input label="Commission %" type="number" value={form.percentage} onChange={e => set("percentage", e.target.value)} />
              <Input label="Min Commission (₹)" type="number" value={form.minCommission} onChange={e => set("minCommission", e.target.value)} />
              <Input label="Max Commission (₹)" type="number" value={form.maxCommission} onChange={e => set("maxCommission", e.target.value)} placeholder="No limit" />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave}>{editing ? "Update" : "Create"}</Button>
              <Button variant="outline" onClick={() => { setShowForm(false); setEditing(null); }}>Cancel</Button>
            </div>
          </CardBody>
        </Card>
      )}

      <Card>
        <div className="px-5 pt-5 pb-3">
          <h2 className="font-bold">Commission Configurations</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b dark:border-ink-700 text-left">
                <th className="px-5 py-3 font-semibold text-ink-500">Name</th>
                <th className="px-5 py-3 font-semibold text-ink-500">Type</th>
                <th className="px-5 py-3 font-semibold text-ink-500">Commission %</th>
                <th className="px-5 py-3 font-semibold text-ink-500">Min (₹)</th>
                <th className="px-5 py-3 font-semibold text-ink-500">Max (₹)</th>
                <th className="px-5 py-3 font-semibold text-ink-500">Status</th>
                <th className="px-5 py-3 font-semibold text-ink-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {commissions.map(c => (
                <tr key={c.id} className="border-b dark:border-ink-700 hover:bg-ink-50 dark:hover:bg-ink-700/50">
                  <td className="px-5 py-3 font-medium">{c.name}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${c.type === "GLOBAL" ? "bg-blue-100 text-blue-700" : c.type === "CATEGORY" ? "bg-violet-100 text-violet-700" : "bg-emerald-100 text-emerald-700"}`}>
                      {c.type}
                    </span>
                  </td>
                  <td className="px-5 py-3 font-semibold">{c.percentage}%</td>
                  <td className="px-5 py-3">₹{c.minCommission}</td>
                  <td className="px-5 py-3">{c.maxCommission ? `₹${c.maxCommission}` : "No limit"}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${c.isActive ? "bg-emerald-100 text-emerald-700" : "bg-ink-100 text-ink-500"}`}>
                      {c.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => handleEdit(c)} className="rounded p-1 hover:bg-ink-100 dark:hover:bg-ink-700"><Edit2 className="h-4 w-4 text-ink-500" /></button>
                      <button onClick={() => handleDelete(c.id)} className="rounded p-1 hover:bg-rose-50 dark:hover:bg-rose-950/30"><Trash2 className="h-4 w-4 text-rose-500" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

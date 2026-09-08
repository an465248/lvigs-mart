"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { adminMock } from "@/lib/admin-mock";
import type { Product } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "", brand: "", categoryId: "", description: "", highlights: "",
    mrp: "", price: "", stock: "", deliveryCharge: "", freeDelivery: "true",
    fastDelivery: "false", warranty: "", returnPolicy: "", images: "",
  });

  useEffect(() => {
    const p = adminMock.getProduct(id);
    if (!p) { router.push("/admin/products"); return; }
    setForm({
      title: p.title, brand: p.brand, categoryId: p.categoryId,
      description: p.description, highlights: p.highlights.join("\n"),
      mrp: String(p.mrp), price: String(p.price), stock: String(p.stock),
      deliveryCharge: String(p.deliveryCharge),
      freeDelivery: String(p.freeDelivery), fastDelivery: String(p.fastDelivery),
      warranty: p.warranty || "", returnPolicy: p.returnPolicy || "",
      images: p.images[0] || "",
    });
  }, [id, router]);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    adminMock.updateProduct(id, {
      title: form.title, brand: form.brand, categoryId: form.categoryId,
      description: form.description,
      highlights: form.highlights.split("\n").filter(Boolean),
      mrp: Number(form.mrp), price: Number(form.price),
      stock: Number(form.stock), deliveryCharge: Number(form.deliveryCharge),
      freeDelivery: form.freeDelivery === "true",
      fastDelivery: form.fastDelivery === "true",
      warranty: form.warranty || undefined,
      returnPolicy: form.returnPolicy,
      images: [form.images],
    });
    setLoading(false);
    router.push("/admin/products");
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link href="/admin/products" className="inline-flex items-center gap-1 text-sm text-ink-500 hover:text-brand-600">
        <ArrowLeft className="h-4 w-4" /> Back to Products
      </Link>

      <Card>
        <CardHeader><CardTitle>Edit Product</CardTitle></CardHeader>
        <CardBody>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Product Title" required value={form.title} onChange={e => set("title", e.target.value)} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Brand" required value={form.brand} onChange={e => set("brand", e.target.value)} />
              <Select label="Category" value={form.categoryId} onChange={e => set("categoryId", e.target.value)}>
                <option value="mobiles">Mobiles</option>
                <option value="electronics">Electronics</option>
                <option value="fashion">Fashion</option>
                <option value="grocery">Grocery</option>
                <option value="beauty">Beauty</option>
                <option value="home-furniture">Home & Furniture</option>
              </Select>
            </div>
            <Textarea label="Description" value={form.description} onChange={e => set("description", e.target.value)} />
            <Textarea label="Highlights (one per line)" value={form.highlights} onChange={e => set("highlights", e.target.value)} />
            <div className="grid gap-4 sm:grid-cols-3">
              <Input label="MRP (₹)" type="number" required value={form.mrp} onChange={e => set("mrp", e.target.value)} />
              <Input label="Selling Price (₹)" type="number" required value={form.price} onChange={e => set("price", e.target.value)} />
              <Input label="Stock" type="number" required value={form.stock} onChange={e => set("stock", e.target.value)} />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Input label="Delivery Charge (₹)" type="number" value={form.deliveryCharge} onChange={e => set("deliveryCharge", e.target.value)} />
              <Select label="Free Delivery" value={form.freeDelivery} onChange={e => set("freeDelivery", e.target.value)}>
                <option value="true">Yes</option><option value="false">No</option>
              </Select>
              <Select label="Fast Delivery" value={form.fastDelivery} onChange={e => set("fastDelivery", e.target.value)}>
                <option value="true">Yes</option><option value="false">No</option>
              </Select>
            </div>
            <Input label="Warranty" value={form.warranty} onChange={e => set("warranty", e.target.value)} />
            <Input label="Return Policy" value={form.returnPolicy} onChange={e => set("returnPolicy", e.target.value)} />
            <Input label="Image URL" value={form.images} onChange={e => set("images", e.target.value)} />
            <div className="flex justify-end gap-3 pt-2">
              <Link href="/admin/products"><Button variant="outline" type="button">Cancel</Button></Link>
              <Button type="submit" loading={loading}>Save Changes</Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}

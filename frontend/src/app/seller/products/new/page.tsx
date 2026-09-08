"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sellerMock } from "@/lib/seller-mock";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function SellerNewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "", brand: "", categoryId: "mobiles", description: "", highlights: "",
    mrp: "", price: "", stock: "", sellerSku: "", weight: "",
    deliveryCharge: "0", freeDelivery: "true", fastDelivery: "false",
    warranty: "", returnPolicy: "7 Day Return",
    images: "https://placehold.co/600x600?text=Product",
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    sellerMock.addProduct({
      title: form.title, brand: form.brand, categoryId: form.categoryId,
      brandId: "b1", sellerId: "seller-1", sellerName: "LVIGS Official Store",
      description: form.description, highlights: form.highlights.split("\n").filter(Boolean),
      specifications: [], mrp: Number(form.mrp), price: Number(form.price),
      images: [form.images], stock: Number(form.stock),
      deliveryCharge: Number(form.deliveryCharge),
      freeDelivery: form.freeDelivery === "true", fastDelivery: form.fastDelivery === "true",
      warranty: form.warranty || undefined, returnPolicy: form.returnPolicy,
      tags: [], attributes: {}, rating: 0, ratingCount: 0, reviewCount: 0,
      sellerSku: form.sellerSku || `LVIGS-${Date.now()}`, sellerStock: Number(form.stock),
      sellerPrice: Number(form.price), sellerMrp: Number(form.mrp),
    });
    setLoading(false);
    router.push("/seller/products");
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link href="/seller/products" className="inline-flex items-center gap-1 text-sm text-ink-500 hover:text-accent-600">
        <ArrowLeft className="h-4 w-4" /> Back to Products
      </Link>
      <Card>
        <CardHeader><CardTitle>Add New Product</CardTitle></CardHeader>
        <CardBody>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Product Title" required value={form.title} onChange={e => set("title", e.target.value)} placeholder="e.g. iPhone 15 Pro Max" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Brand" required value={form.brand} onChange={e => set("brand", e.target.value)} />
              <Select label="Category" value={form.categoryId} onChange={e => set("categoryId", e.target.value)}>
                <option value="mobiles">Mobiles</option><option value="electronics">Electronics</option>
                <option value="fashion">Fashion</option><option value="grocery">Grocery</option>
                <option value="beauty">Beauty</option><option value="home-furniture">Home & Furniture</option>
              </Select>
            </div>
            <Textarea label="Description" value={form.description} onChange={e => set("description", e.target.value)} />
            <Textarea label="Highlights (one per line)" value={form.highlights} onChange={e => set("highlights", e.target.value)} placeholder="Feature 1&#10;Feature 2" />
            <div className="grid gap-4 sm:grid-cols-3">
              <Input label="MRP (₹)" type="number" required value={form.mrp} onChange={e => set("mrp", e.target.value)} />
              <Input label="Your Price (₹)" type="number" required value={form.price} onChange={e => set("price", e.target.value)} />
              <Input label="Stock" type="number" required value={form.stock} onChange={e => set("stock", e.target.value)} />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Input label="SKU" value={form.sellerSku} onChange={e => set("sellerSku", e.target.value)} placeholder="Auto-generated" />
              <Input label="Weight (g)" type="number" value={form.weight} onChange={e => set("weight", e.target.value)} />
              <Input label="Delivery Charge (₹)" type="number" value={form.deliveryCharge} onChange={e => set("deliveryCharge", e.target.value)} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Select label="Free Delivery" value={form.freeDelivery} onChange={e => set("freeDelivery", e.target.value)}>
                <option value="true">Yes</option><option value="false">No</option>
              </Select>
              <Input label="Return Policy" value={form.returnPolicy} onChange={e => set("returnPolicy", e.target.value)} />
            </div>
            <Input label="Image URL" value={form.images} onChange={e => set("images", e.target.value)} />
            <div className="flex justify-end gap-3 pt-2">
              <Link href="/seller/products"><Button variant="outline" type="button">Cancel</Button></Link>
              <Button type="submit" loading={loading}>Create Product</Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}

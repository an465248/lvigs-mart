"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminMock } from "@/lib/admin-mock";
import type { Product } from "@/lib/types";
import { formatINR, discountPercent } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Plus, Pencil, Trash2, Search, Filter } from "lucide-react";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");

  const load = () => setProducts(adminMock.getProducts());
  useEffect(() => { load(); }, []);

  const categories = Array.from(new Set(products.map(p => p.categoryId)));

  const filtered = products.filter(p => {
    const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.brand.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === "all" || p.categoryId === catFilter;
    return matchSearch && matchCat;
  });

  const handleDelete = (id: string) => {
    if (!confirm("Delete this product?")) return;
    adminMock.deleteProduct(id);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-sm text-ink-500">{products.length} products total</p>
        </div>
        <Link href="/admin/products/new">
          <Button><Plus className="mr-1 h-4 w-4" /> Add Product</Button>
        </Link>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..." className="input-base pl-10" />
        </div>
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="input-base w-auto min-w-[160px]">
          <option value="all">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-ink-50 text-left text-xs font-semibold uppercase text-ink-500 dark:border-ink-700 dark:bg-ink-800">
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Rating</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-ink-700">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-ink-50 dark:hover:bg-ink-700/50 transition">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img src={p.images[0]} alt="" className="h-10 w-10 rounded-lg object-cover" />
                      <div className="min-w-0">
                        <p className="truncate font-medium max-w-[250px]">{p.title}</p>
                        <p className="text-xs text-ink-500">{p.brand}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-500">{p.categoryId}</td>
                  <td className="px-4 py-3">
                    <p className="font-semibold">{formatINR(p.price)}</p>
                    <p className="text-xs text-ink-400 line-through">{formatINR(p.mrp)}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${p.stock > 10 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300" : p.stock > 0 ? "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300" : "bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300"}`}>
                      {p.stock} units
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs">{p.rating > 0 ? `${p.rating} ★` : "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Link href={`/admin/products/${p.id}`}>
                        <Button variant="ghost" size="icon"><Pencil className="h-4 w-4" /></Button>
                      </Link>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)}><Trash2 className="h-4 w-4 text-rose-500" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-ink-500">No products found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

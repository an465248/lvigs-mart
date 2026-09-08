"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { sellerMock, type SellerProduct } from "@/lib/seller-mock";
import { formatINR } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Plus, Pencil, Trash2, Send, Search } from "lucide-react";

const approvalColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700 dark:bg-gray-950/30 dark:text-gray-300",
  SUBMITTED: "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300",
  UNDER_REVIEW: "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300",
  APPROVED: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300",
  PUBLISHED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300",
  REJECTED: "bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300",
};

export default function SellerProductsPage() {
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const load = () => setProducts(sellerMock.getProducts());
  useEffect(() => { load(); }, []);

  const filtered = products.filter(p => {
    const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || p.approvalStatus === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleSubmit = (id: string) => { sellerMock.submitProduct(id); load(); };
  const handleDelete = (id: string) => { if (confirm("Delete this product?")) { sellerMock.deleteProduct(id); load(); } };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-sm text-ink-500">{products.length} products</p>
        </div>
        <Link href="/seller/products/new"><Button><Plus className="mr-1 h-4 w-4" /> Add Product</Button></Link>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..." className="input-base pl-10" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input-base w-auto min-w-[160px]">
          <option value="all">All Status</option>
          <option value="DRAFT">Draft</option>
          <option value="SUBMITTED">Submitted</option>
          <option value="PUBLISHED">Published</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-ink-50 text-left text-xs font-semibold uppercase text-ink-500 dark:border-ink-700 dark:bg-ink-800">
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Status</th>
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
                  <td className="px-4 py-3 font-mono text-xs">{p.sellerSku}</td>
                  <td className="px-4 py-3">
                    <p className="font-semibold">{formatINR(p.sellerPrice)}</p>
                    <p className="text-xs text-ink-400 line-through">{formatINR(p.sellerMrp)}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${p.sellerStock > 10 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300" : p.sellerStock > 0 ? "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300" : "bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300"}`}>
                      {p.sellerStock}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${approvalColors[p.approvalStatus] || ""}`}>
                      {p.approvalStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      {p.approvalStatus === "DRAFT" && (
                        <Button variant="ghost" size="icon" onClick={() => handleSubmit(p.id)} title="Submit for review"><Send className="h-4 w-4 text-blue-500" /></Button>
                      )}
                      <Link href={`/seller/products/${p.id}`}><Button variant="ghost" size="icon"><Pencil className="h-4 w-4" /></Button></Link>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)}><Trash2 className="h-4 w-4 text-rose-500" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={6} className="px-4 py-12 text-center text-ink-500">No products found</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

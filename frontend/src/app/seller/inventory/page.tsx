"use client";

import { useEffect, useState } from "react";
import { sellerMock, type SellerInventory } from "@/lib/seller-mock";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Search, AlertTriangle, Package } from "lucide-react";

export default function SellerInventoryPage() {
  const [items, setItems] = useState<SellerInventory[]>([]);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStock, setEditStock] = useState("");
  const [editReserved, setEditReserved] = useState("");

  const load = () => setItems(sellerMock.getInventory());
  useEffect(() => { load(); }, []);

  const filtered = items.filter(i => !search || i.productName.toLowerCase().includes(search.toLowerCase()) || i.sku.toLowerCase().includes(search.toLowerCase()));

  const handleSave = (id: string) => {
    sellerMock.updateInventory(id, { totalStock: Number(editStock), reserved: Number(editReserved) });
    setEditingId(null);
    load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Inventory</h1>
        <p className="text-sm text-ink-500">{items.length} products tracked</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search inventory..." className="input-base pl-10" />
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-ink-50 text-left text-xs font-semibold uppercase text-ink-500 dark:border-ink-700 dark:bg-ink-800">
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Total Stock</th>
                <th className="px-4 py-3">Reserved</th>
                <th className="px-4 py-3">Available</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-ink-700">
              {filtered.map(item => {
                const isLow = item.available <= item.lowStockThreshold;
                const isOut = item.available === 0;
                const isEditing = editingId === item.id;

                return (
                  <tr key={item.id} className="hover:bg-ink-50 dark:hover:bg-ink-700/50 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img src={item.productImage} alt="" className="h-10 w-10 rounded-lg object-cover" />
                        <p className="truncate font-medium max-w-[250px]">{item.productName}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{item.sku}</td>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <input type="number" value={editStock} onChange={e => setEditStock(e.target.value)} className="input-base h-8 w-20 text-xs" />
                      ) : item.totalStock}
                    </td>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <input type="number" value={editReserved} onChange={e => setEditReserved(e.target.value)} className="input-base h-8 w-20 text-xs" />
                      ) : item.reserved}
                    </td>
                    <td className="px-4 py-3 font-semibold">{item.available}</td>
                    <td className="px-4 py-3">
                      {isOut ? (
                        <span className="inline-block rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">Out of Stock</span>
                      ) : isLow ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
                          <AlertTriangle className="h-3 w-3" /> Low Stock
                        </span>
                      ) : (
                        <span className="inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">In Stock</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {isEditing ? (
                        <div className="flex justify-end gap-1">
                          <Button size="sm" onClick={() => handleSave(item.id)}>Save</Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                        </div>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => { setEditingId(item.id); setEditStock(String(item.totalStock)); setEditReserved(String(item.reserved)); }}>
                          Edit
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && <tr><td colSpan={7} className="px-4 py-12 text-center text-ink-500">No inventory items</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

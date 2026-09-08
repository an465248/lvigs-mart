"use client";

import { useEffect, useState } from "react";
import { adminMock } from "@/lib/admin-mock";
import type { Category } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight } from "lucide-react";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [parentId, setParentId] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const load = () => setCategories(adminMock.getCategories());
  useEffect(() => { load(); }, []);

  const topLevel = categories.filter(c => !c.parentId);
  const getChildren = (pid: string) => categories.filter(c => c.parentId === pid);

  const resetForm = () => { setName(""); setSlug(""); setParentId(""); setEditId(null); setShowForm(false); };

  const handleEdit = (cat: Category) => {
    setEditId(cat.id);
    setName(cat.name);
    setSlug(cat.slug);
    setParentId(cat.parentId || "");
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = { name, slug: slug || name.toLowerCase().replace(/\s+/g, "-"), parentId: parentId || null, icon: "", image: "" };
    if (editId) {
      adminMock.updateCategory(editId, data);
    } else {
      adminMock.addCategory(data);
    }
    resetForm();
    load();
  };

  const handleDelete = (id: string) => {
    if (!confirm("Delete this category?")) return;
    adminMock.deleteCategory(id);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Categories</h1>
          <p className="text-sm text-ink-500">{categories.length} categories total</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }}><Plus className="mr-1 h-4 w-4" /> Add Category</Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editId ? "Edit Category" : "New Category"}</CardTitle>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Category Name" required value={name} onChange={e => { setName(e.target.value); if (!editId) setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-")); }} />
                <Input label="Slug" required value={slug} onChange={e => setSlug(e.target.value)} />
              </div>
              <div className="w-full max-w-xs">
                <label className="mb-1.5 block text-sm font-medium text-ink-700 dark:text-ink-200">Parent Category</label>
                <select value={parentId} onChange={e => setParentId(e.target.value)} className="input-base">
                  <option value="">None (Top Level)</option>
                  {topLevel.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" type="button" onClick={resetForm}>Cancel</Button>
                <Button type="submit">{editId ? "Save Changes" : "Create Category"}</Button>
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
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Subcategories</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-ink-700">
              {topLevel.map(cat => {
                const children = getChildren(cat.id);
                const isExpanded = expanded[cat.id];
                return (
                  <>
                    <tr key={cat.id} className="hover:bg-ink-50 dark:hover:bg-ink-700/50 transition">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {children.length > 0 ? (
                            <button onClick={() => setExpanded(e => ({ ...e, [cat.id]: !e[cat.id] }))}>
                              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </button>
                          ) : <span className="w-4" />}
                          <span className="font-medium">{cat.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-ink-500">{cat.slug}</td>
                      <td className="px-4 py-3 text-xs text-ink-500">{children.length}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(cat)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(cat.id)}><Trash2 className="h-4 w-4 text-rose-500" /></Button>
                        </div>
                      </td>
                    </tr>
                    {isExpanded && children.map(child => (
                      <tr key={child.id} className="bg-ink-50/50 dark:bg-ink-800/50">
                        <td className="px-4 py-2 pl-12 text-sm text-ink-600">{child.name}</td>
                        <td className="px-4 py-2 text-xs text-ink-400">{child.slug}</td>
                        <td className="px-4 py-2 text-xs text-ink-400">—</td>
                        <td className="px-4 py-2 text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(child)}><Pencil className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(child.id)}><Trash2 className="h-3.5 w-3.5 text-rose-500" /></Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </>
                );
              })}
              {topLevel.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-12 text-center text-ink-500">No categories yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

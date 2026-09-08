"use client";

import { useState, useEffect } from "react";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Input";
import {
  Plus,
  Edit2,
  Trash2,
  Image,
  Eye,
  EyeOff,
  Save,
  X,
  Upload,
  GripVertical,
} from "lucide-react";

interface Banner {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  mobileImage?: string;
  type: string;
  position: number;
  sortOrder: number;
  isActive: boolean;
  startsAt?: string;
  endsAt?: string;
  startAt?: string;
  endAt?: string;
  ctaLabel?: string;
  ctaLink?: string;
  ctaText?: string;
  ctaUrl?: string;
  bg?: string;
  fg?: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("lvigs.adminToken") || localStorage.getItem("lvigs.accessToken");
}

async function apiFetch<T>(path: string, opts: { method?: string; body?: any } = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}/api${path}`, {
    method: opts.method || "GET",
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: `HTTP ${res.status}` }));
    throw new Error(err.message || `HTTP ${res.status}`);
  }
  return res.json();
}

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "",
    subtitle: "",
    image: "",
    mobileImage: "",
    type: "HOME",
    position: 0,
    sortOrder: 0,
    isActive: true,
    startsAt: "",
    endsAt: "",
    startAt: "",
    endAt: "",
    ctaLabel: "",
    ctaLink: "",
    ctaText: "",
    ctaUrl: "",
    bg: "#1d47f5",
    fg: "#ffffff",
  });

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const data = await apiFetch<any>("/banners/admin/banners");
      setBanners(data.items || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to fetch banners");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const setField = (key: string, value: any) =>
    setForm((f) => ({ ...f, [key]: value }));

  const resetForm = () => {
    setForm({
      title: "",
      subtitle: "",
      image: "",
      mobileImage: "",
      type: "HOME",
      position: 0,
      sortOrder: 0,
      isActive: true,
      startsAt: "",
      endsAt: "",
      startAt: "",
      endAt: "",
      ctaLabel: "",
      ctaLink: "",
      ctaText: "",
      ctaUrl: "",
      bg: "#1d47f5",
      fg: "#ffffff",
    });
    setEditingBanner(null);
    setShowForm(false);
  };

  const handleEdit = (banner: Banner) => {
    setForm({
      title: banner.title,
      subtitle: banner.subtitle || "",
      image: banner.image || "",
      mobileImage: banner.mobileImage || "",
      type: banner.type || "HOME",
      position: banner.position || 0,
      sortOrder: banner.sortOrder || 0,
      isActive: banner.isActive,
      startsAt: banner.startsAt || banner.startAt || "",
      endsAt: banner.endsAt || banner.endAt || "",
      startAt: banner.startAt || banner.startsAt || "",
      endAt: banner.endAt || banner.endsAt || "",
      ctaLabel: banner.ctaLabel || "",
      ctaLink: banner.ctaLink || "",
      ctaText: banner.ctaText || "",
      ctaUrl: banner.ctaUrl || "",
      bg: banner.bg || "#1d47f5",
      fg: banner.fg || "#ffffff",
    });
    setEditingBanner(banner);
    setShowForm(true);
  };

  const handleSave = async () => {
    try {
      if (editingBanner) {
        await apiFetch(`/banners/admin/banners/${editingBanner.id}`, {
          method: "PUT",
          body: form,
        });
      } else {
        await apiFetch("/banners/admin/banners", {
          method: "POST",
          body: form,
        });
      }
      resetForm();
      fetchBanners();
    } catch (err: any) {
      setError(err.message || "Failed to save banner");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this banner?")) return;
    try {
      await apiFetch(`/banners/admin/banners/${id}`, { method: "DELETE" });
      fetchBanners();
    } catch (err: any) {
      setError(err.message || "Failed to delete banner");
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await apiFetch(`/banners/admin/banners/${id}/toggle`, { method: "PATCH" });
      fetchBanners();
    } catch (err: any) {
      setError(err.message || "Failed to toggle banner");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Banners & Offers</h1>
          <p className="text-sm text-ink-500">
            Manage promotional banners and offers
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
        >
          <Plus className="h-4 w-4 mr-1" /> Add Banner
        </Button>
      </div>

      {error && (
        <div className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {showForm && (
        <Card>
          <CardBody>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {editingBanner ? "Edit Banner" : "Add Banner"}
              </h2>
              <button onClick={resetForm} className="text-ink-500 hover:text-ink-700">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Title"
                value={form.title}
                onChange={(e) => setField("title", e.target.value)}
                placeholder="Banner title"
              />
              <Input
                label="Subtitle"
                value={form.subtitle}
                onChange={(e) => setField("subtitle", e.target.value)}
                placeholder="Banner subtitle"
              />
              <Input
                label="Image URL"
                value={form.image}
                onChange={(e) => setField("image", e.target.value)}
                placeholder="https://..."
              />
              <Input
                label="Mobile Image URL"
                value={form.mobileImage}
                onChange={(e) => setField("mobileImage", e.target.value)}
                placeholder="https://..."
              />
              <div className="w-full">
                <label className="mb-1.5 block text-sm font-medium text-ink-700 dark:text-ink-200">
                  Type
                </label>
                <select
                  value={form.type}
                  onChange={(e) => setField("type", e.target.value)}
                  className="input-base appearance-none pr-8 bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2224%22 height=%2224%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%235d6a82%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><polyline points=%226 9 12 15 18 9%22></polyline></svg>')] bg-no-repeat bg-[right_0.5rem_center]"
                >
                  <option value="HOME">Home</option>
                  <option value="CATEGORY">Category</option>
                  <option value="PROMOTIONAL">Promotional</option>
                  <option value="FLASH_SALE">Flash Sale</option>
                </select>
              </div>
              <Input
                label="Sort Order"
                type="number"
                value={form.sortOrder}
                onChange={(e) => setField("sortOrder", parseInt(e.target.value) || 0)}
              />
              <Input
                label="Start Date"
                type="datetime-local"
                value={form.startAt}
                onChange={(e) => setField("startAt", e.target.value)}
              />
              <Input
                label="End Date"
                type="datetime-local"
                value={form.endAt}
                onChange={(e) => setField("endAt", e.target.value)}
              />
              <Input
                label="CTA Text"
                value={form.ctaText}
                onChange={(e) => setField("ctaText", e.target.value)}
                placeholder="Shop Now"
              />
              <Input
                label="CTA URL"
                value={form.ctaUrl}
                onChange={(e) => setField("ctaUrl", e.target.value)}
                placeholder="/category/electronics"
              />
              <Input
                label="Background Color"
                type="color"
                value={form.bg}
                onChange={(e) => setField("bg", e.target.value)}
              />
              <Input
                label="Text Color"
                type="color"
                value={form.fg}
                onChange={(e) => setField("fg", e.target.value)}
              />
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={form.isActive}
                  onChange={(e) => setField("isActive", e.target.checked)}
                  className="h-4 w-4 rounded border-ink-300"
                />
                <label htmlFor="isActive" className="text-sm font-medium">
                  Active
                </label>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-1" /> {editingBanner ? "Update" : "Create"}
              </Button>
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : banners.length === 0 ? (
        <Card>
          <CardBody>
            <div className="py-12 text-center text-ink-500">
              <Image className="mx-auto mb-3 h-12 w-12 opacity-30" />
              <p>No banners yet. Click "Add Banner" to create one.</p>
            </div>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-3">
          {banners.map((b) => (
            <Card key={b.id}>
              <CardBody>
                <div className="flex items-start gap-4">
                  <div className="flex h-24 w-48 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-ink-100 dark:bg-ink-800">
                    {b.image ? (
                      <img
                        src={b.image}
                        alt={b.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Image className="h-8 w-8 text-ink-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold">{b.title}</h3>
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          b.type === "HOME"
                            ? "bg-blue-100 text-blue-700"
                            : b.type === "CATEGORY"
                            ? "bg-violet-100 text-violet-700"
                            : b.type === "FLASH_SALE"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {b.type}
                      </span>
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          b.isActive
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-ink-100 text-ink-500"
                        }`}
                      >
                        {b.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    {b.subtitle && (
                      <p className="text-sm text-ink-500 truncate">
                        {b.subtitle}
                      </p>
                    )}
                    <p className="text-xs text-ink-400">
                      Order: {b.sortOrder}
                      {b.ctaText && ` · CTA: ${b.ctaText}`}
                      {b.startAt && ` · Starts: ${new Date(b.startAt).toLocaleDateString()}`}
                      {b.endAt && ` · Ends: ${new Date(b.endAt).toLocaleDateString()}`}
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => handleToggle(b.id)}
                      className="rounded p-1.5 hover:bg-ink-100 dark:hover:bg-ink-700"
                      title={b.isActive ? "Deactivate" : "Activate"}
                    >
                      {b.isActive ? (
                        <EyeOff className="h-4 w-4 text-ink-500" />
                      ) : (
                        <Eye className="h-4 w-4 text-ink-500" />
                      )}
                    </button>
                    <button
                      onClick={() => handleEdit(b)}
                      className="rounded p-1.5 hover:bg-ink-100 dark:hover:bg-ink-700"
                      title="Edit"
                    >
                      <Edit2 className="h-4 w-4 text-ink-500" />
                    </button>
                    <button
                      onClick={() => handleDelete(b.id)}
                      className="rounded p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4 text-rose-500" />
                    </button>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { adminMock, type AdminUser } from "@/lib/admin-mock";
import { formatINR, relativeTime } from "@/lib/utils";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Search, Shield, UserCheck, UserX } from "lucide-react";

const roleColors: Record<string, string> = {
  ADMIN: "bg-violet-100 text-violet-700 dark:bg-violet-950/30 dark:text-violet-300",
  SELLER: "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300",
  CUSTOMER: "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const load = () => setUsers(adminMock.getUsers());
  useEffect(() => { load(); }, []);

  const filtered = users.filter(u => {
    const matchSearch = !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()) || u.mobile?.includes(search);
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const handleToggleBlock = (id: string, currentBlocked: boolean) => {
    adminMock.toggleUserBlock(id, !currentBlocked);
    load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Users</h1>
        <p className="text-sm text-ink-500">{users.length} users total</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users..." className="input-base pl-10" />
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="input-base w-auto min-w-[140px]">
          <option value="all">All Roles</option>
          <option value="CUSTOMER">Customer</option>
          <option value="SELLER">Seller</option>
          <option value="ADMIN">Admin</option>
        </select>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-ink-50 text-left text-xs font-semibold uppercase text-ink-500 dark:border-ink-700 dark:bg-ink-800">
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Orders</th>
                <th className="px-4 py-3">Spent</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-ink-700">
              {filtered.map(u => (
                <tr key={u.id} className="hover:bg-ink-50 dark:hover:bg-ink-700/50 transition">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-ink-100 text-sm font-bold text-ink-600 dark:bg-ink-700 dark:text-ink-300">
                        {u.name?.[0] || "U"}
                      </div>
                      <div>
                        <p className="font-medium">{u.name}</p>
                        <p className="text-xs text-ink-500">{u.email}</p>
                        <p className="text-xs text-ink-400">{u.mobile}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${roleColors[u.role] || ""}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs">{u.orderCount}</td>
                  <td className="px-4 py-3 text-xs font-semibold">{formatINR(u.totalSpent)}</td>
                  <td className="px-4 py-3 text-xs text-ink-500">{relativeTime(u.joinedAt)}</td>
                  <td className="px-4 py-3">
                    {u.isBlocked ? (
                      <span className="inline-block rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">Blocked</span>
                    ) : (
                      <span className="inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">Active</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleToggleBlock(u.id, u.isBlocked)}>
                      {u.isBlocked ? (
                        <><UserCheck className="mr-1 h-3.5 w-3.5" /> Unblock</>
                      ) : (
                        <><UserX className="mr-1 h-3.5 w-3.5" /> Block</>
                      )}
                    </Button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-ink-500">No users found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

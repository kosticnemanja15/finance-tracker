"use client";

import { AdminGuard } from "@/components/AdminGuard";
import { useUsers } from "@/hooks/useUsers";

function AdminContent() {
  const { data: users, isLoading, error } = useUsers();

  if (isLoading) return <p className="text-ink-muted">Loading…</p>;
  if (error) return <p className="text-expense">Error: {error}</p>;
  if (users.length === 0) return <p className="text-ink-muted">No users.</p>;

  return (
    <div className="overflow-hidden rounded-card border border-line bg-surface shadow-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line text-left text-ink-muted">
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 font-medium">Email</th>
            <th className="px-4 py-3 font-medium">Role</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="border-b border-line transition-colors last:border-0 hover:bg-surface-2">
              <td className="px-4 py-3 font-medium text-ink">{user.name}</td>
              <td className="px-4 py-3 text-ink-muted">{user.email}</td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    user.role === "admin"
                      ? "border border-brand text-brand"
                      : "bg-surface-2 text-ink-muted"
                  }`}
                >
                  {user.role}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminPage() {
  return (
    <AdminGuard>
      <div className="mx-auto max-w-4xl space-y-6 p-6 sm:p-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Users</h1>
          <p className="text-sm text-ink-muted">Manage registered accounts</p>
        </div>
        <AdminContent />
      </div>
    </AdminGuard>
  );
}
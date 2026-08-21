"use client";

import { AdminGuard } from "@/components/AdminGuard";
import { useUsers } from "@/hooks/useUsers";

function AdminContent() {
  const { data: users, isLoading, error } = useUsers();

  if (isLoading) {
    return <p className="text-muted-foreground">Loading…</p>;
  }

  if (error) {
    return <p className="text-expense">Error: {error}</p>;
  }

  if (users.length === 0) {
    return <p className="text-muted-foreground">No users.</p>;
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-muted-foreground">
            <th className="px-4 py-3 font-sans font-medium">Name</th>
            <th className="px-4 py-3 font-sans font-medium">Email</th>
            <th className="px-4 py-3 font-sans font-medium">Role</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="border-b border-border last:border-0">
              <td className="px-4 py-3">{user.name}</td>
              <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
              <td className="px-4 py-3">
                <span
                  className={
                    user.role === "admin"
                      ? "text-brand font-medium"
                      : "text-muted-foreground"
                  }
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
      <div className="min-h-screen p-6 sm:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <h1 className="font-display text-2xl">Users</h1>
          <AdminContent />
        </div>
      </div>
    </AdminGuard>
  );
}
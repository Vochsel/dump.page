"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

export default function AdminPage() {
  if (process.env.NODE_ENV === "production") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Not found</p>
      </div>
    );
  }

  return <AdminDashboard />;
}

function AdminDashboard() {
  const stats = useQuery(api.admin.stats);
  const history = useQuery(api.admin.dailyHistory, {});

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-8">Admin Analytics</h1>

      {/* Live Stats */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-4">Live Stats</h2>
        {stats ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard label="Users" value={stats.totals.users} />
            <StatCard label="Boards" value={stats.totals.boards} />
            <StatCard label="Nodes" value={stats.totals.nodes} />
            <StatCard label="Memberships" value={stats.totals.memberships} />
          </div>
        ) : (
          <p className="text-zinc-500">Loading...</p>
        )}
      </section>

      {/* Daily History */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Daily History (last 90 days)</h2>
        {history === undefined ? (
          <p className="text-zinc-500">Loading...</p>
        ) : history.length === 0 ? (
          <p className="text-zinc-500">No snapshots yet. The cron will create the first one at midnight UTC.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-900 text-left">
                  <th className="px-4 py-2 font-medium">Date</th>
                  <th className="px-4 py-2 font-medium text-right">Users</th>
                  <th className="px-4 py-2 font-medium text-right">Boards</th>
                  <th className="px-4 py-2 font-medium text-right">Nodes</th>
                </tr>
              </thead>
              <tbody>
                {history.map((row) => (
                  <tr
                    key={row.date}
                    className="border-t border-zinc-200 dark:border-zinc-800"
                  >
                    <td className="px-4 py-2">{row.date}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{row.users}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{row.boards}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{row.nodes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className="text-2xl font-bold tabular-nums">{value}</p>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";

type Activity = {
  id: string;
  type: string;
  message: string;
  client_id?: string | null;
  document_id?: string | null;
  created_at: string;
};

export function RecentActivity() {
  const [rows, setRows] = useState<Activity[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/activity");
        if (!res.ok) return;
        const data = (await res.json()) as Activity[];
        setRows(data ?? []);
      } catch (e) {
        // ignore
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-4">
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No recent activity.</p>
      ) : (
        rows.map((a) => (
          <div key={a.id} className="flex items-start gap-4 pb-4 last:pb-0 last:border-0 border-b">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <span role="img" aria-label={a.type}>
                📄
              </span>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium leading-none">{a.type.replace(/\./g, " → ")}</p>
              <p className="text-sm text-muted-foreground">{a.message}</p>
              <p className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString()}</p>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

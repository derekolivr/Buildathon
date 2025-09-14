"use client";

import { Header } from "@/components/dashboard/header";
import { NotificationsProvider } from "@/components/dashboard/notifications";

export default function DashboardClientShell({ children }: { children: React.ReactNode }) {
  return (
    <NotificationsProvider>
      <Header />
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </NotificationsProvider>
  );
}

import type { Metadata } from "next";
import { Sidebar } from "@/components/dashboard/sidebar";
import DashboardClientShell from "./client-shell";

export const metadata: Metadata = {
  title: "Dashboard | Micro-Entrepreneur Suite",
  description: "Dashboard for micro-entrepreneurs to manage operational tasks",
};

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <DashboardClientShell>{children}</DashboardClientShell>
      </div>
    </div>
  );
}

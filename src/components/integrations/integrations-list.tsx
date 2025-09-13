"use client";

import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Settings, RefreshCw, Power } from "lucide-react";

interface IntegrationsListProps {
  status?: "connected" | "available";
}

export function IntegrationsList({ status = "connected" }: IntegrationsListProps) {
  const integrations = [
    {
      id: "integration-1",
      name: "Insurance Provider API",
      category: "Insurance",
      status: "connected",
      lastSync: "10 mins ago",
      dataVolume: "2.3 GB",
    },
    {
      id: "integration-2",
      name: "Payment Gateway",
      category: "Payments",
      status: "connected",
      lastSync: "1 hour ago",
      dataVolume: "1.8 GB",
    },
    {
      id: "integration-3",
      name: "Document Storage",
      category: "Storage",
      status: "connected",
      lastSync: "30 mins ago",
      dataVolume: "15.4 GB",
    },
    {
      id: "integration-4",
      name: "CRM System",
      category: "Client Management",
      status: "connected",
      lastSync: "2 hours ago",
      dataVolume: "3.2 GB",
    },
    {
      id: "integration-5",
      name: "Email Marketing Tool",
      category: "Marketing",
      status: "connected",
      lastSync: "3 hours ago",
      dataVolume: "0.8 GB",
    },
    {
      id: "integration-6",
      name: "Calendar System",
      category: "Scheduling",
      status: "connected",
      lastSync: "1 day ago",
      dataVolume: "0.3 GB",
    },
    {
      id: "integration-7",
      name: "Voice Recognition Service",
      category: "Data Entry",
      status: "connected",
      lastSync: "2 days ago",
      dataVolume: "0.7 GB",
    },
    {
      id: "integration-8",
      name: "SMS Gateway",
      category: "Communications",
      status: "connected",
      lastSync: "5 hours ago",
      dataVolume: "0.3 GB",
    },
  ].filter((integration) => integration.status === status);

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Integration Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="hidden md:table-cell">Last Sync</TableHead>
            <TableHead className="hidden md:table-cell">Data Volume</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {integrations.map((integration) => (
            <TableRow key={integration.id}>
              <TableCell className="font-medium">{integration.name}</TableCell>
              <TableCell>{integration.category}</TableCell>
              <TableCell className="hidden md:table-cell">{integration.lastSync}</TableCell>
              <TableCell className="hidden md:table-cell">{integration.dataVolume}</TableCell>
              <TableCell>
                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                  Connected
                </span>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="icon">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Settings className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Power className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

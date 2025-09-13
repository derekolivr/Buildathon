"use client";

import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { PlayCircle, PauseCircle, Settings, Copy } from "lucide-react";

export function WorkflowList() {
  const workflows = [
    {
      id: "workflow-1",
      name: "Policy Renewal Process",
      type: "Renewal",
      steps: 5,
      status: "active",
      lastRun: "12 mins ago",
      tasksAutomated: 42,
    },
    {
      id: "workflow-2",
      name: "New Client Onboarding",
      type: "Client Management",
      steps: 8,
      status: "active",
      lastRun: "1 hour ago",
      tasksAutomated: 78,
    },
    {
      id: "workflow-3",
      name: "Claim Processing",
      type: "Claims",
      steps: 6,
      status: "paused",
      lastRun: "Yesterday",
      tasksAutomated: 65,
    },
    {
      id: "workflow-4",
      name: "Payment Reminder Sequence",
      type: "Payments",
      steps: 4,
      status: "active",
      lastRun: "2 hours ago",
      tasksAutomated: 38,
    },
    {
      id: "workflow-5",
      name: "Document Approval Flow",
      type: "Documents",
      steps: 3,
      status: "paused",
      lastRun: "3 days ago",
      tasksAutomated: 25,
    },
  ];

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Workflow Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Steps</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden md:table-cell">Last Run</TableHead>
            <TableHead className="hidden md:table-cell">Tasks Automated</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {workflows.map((workflow) => (
            <TableRow key={workflow.id}>
              <TableCell className="font-medium">{workflow.name}</TableCell>
              <TableCell>{workflow.type}</TableCell>
              <TableCell>{workflow.steps}</TableCell>
              <TableCell>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    workflow.status === "active"
                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                  }`}
                >
                  {workflow.status === "active" ? "Active" : "Paused"}
                </span>
              </TableCell>
              <TableCell className="hidden md:table-cell">{workflow.lastRun}</TableCell>
              <TableCell className="hidden md:table-cell">{workflow.tasksAutomated}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="icon">
                    {workflow.status === "active" ? (
                      <PauseCircle className="h-4 w-4" />
                    ) : (
                      <PlayCircle className="h-4 w-4" />
                    )}
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Settings className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Copy className="h-4 w-4" />
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

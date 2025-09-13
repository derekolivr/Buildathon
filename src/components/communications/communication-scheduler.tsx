"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Clock, Calendar, MessageSquare, Edit, Trash2, Plus } from "lucide-react";

export function CommunicationScheduler() {
  const scheduledMessages = [
    {
      id: "schedule-1",
      name: "Policy Renewal Campaign",
      recipientCount: 28,
      template: "Policy Renewal Reminder",
      scheduledDate: "Sep 15, 2025",
      status: "Scheduled",
    },
    {
      id: "schedule-2",
      name: "Payment Due Reminders",
      recipientCount: 12,
      template: "Payment Due Notification",
      scheduledDate: "Sep 18, 2025",
      status: "Scheduled",
    },
    {
      id: "schedule-3",
      name: "Quarterly Newsletter",
      recipientCount: 145,
      template: "Quarterly Newsletter Template",
      scheduledDate: "Oct 01, 2025",
      status: "Draft",
    },
    {
      id: "schedule-4",
      name: "New Product Announcement",
      recipientCount: 87,
      template: "Product Announcement",
      scheduledDate: "Oct 05, 2025",
      status: "Draft",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Scheduled Communications</h3>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Schedule New
        </Button>
      </div>

      <div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Campaign Name</TableHead>
              <TableHead>Recipients</TableHead>
              <TableHead className="hidden md:table-cell">Template</TableHead>
              <TableHead>Schedule</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {scheduledMessages.map((schedule) => (
              <TableRow key={schedule.id}>
                <TableCell className="font-medium">{schedule.name}</TableCell>
                <TableCell>{schedule.recipientCount}</TableCell>
                <TableCell className="hidden md:table-cell">{schedule.template}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{schedule.scheduledDate}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      schedule.status === "Scheduled"
                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400"
                    }`}
                  >
                    {schedule.status}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="border rounded-md p-4 mt-6">
        <h3 className="text-lg font-medium mb-4">Schedule New Communication</h3>

        <div className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="campaign-name">Campaign Name</Label>
            <Input id="campaign-name" placeholder="Enter campaign name" />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="template-select">Select Template</Label>
            <select
              id="template-select"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Select a template</option>
              <option value="template-1">Policy Renewal Reminder</option>
              <option value="template-2">Payment Confirmation</option>
              <option value="template-3">Claim Status Update</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="scheduled-date">Scheduled Date</Label>
              <div className="relative">
                <Calendar className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input id="scheduled-date" type="date" className="pl-10" />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="scheduled-time">Scheduled Time</Label>
              <div className="relative">
                <Clock className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input id="scheduled-time" type="time" className="pl-10" />
              </div>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="recipient-group">Recipient Group</Label>
            <select
              id="recipient-group"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Select recipients</option>
              <option value="all">All Clients</option>
              <option value="renewal">Upcoming Renewals (28)</option>
              <option value="overdue">Overdue Payments (12)</option>
              <option value="new">New Clients (5)</option>
            </select>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline">Save as Draft</Button>
            <Button>Schedule</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

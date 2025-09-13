"use client";

import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { MessageSquare, Check, Clock, ArrowRightLeft } from "lucide-react";

export function MessageHistory() {
  const messages = [
    {
      id: "msg-1",
      recipient: "John Doe",
      subject: "Policy Renewal Reminder",
      type: "Email",
      status: "Delivered",
      sentDate: "Sep 12, 2025",
      openedDate: "Sep 12, 2025",
    },
    {
      id: "msg-2",
      recipient: "Jane Smith",
      subject: "Claim Status Update",
      type: "SMS",
      status: "Delivered",
      sentDate: "Sep 11, 2025",
      openedDate: "Sep 11, 2025",
    },
    {
      id: "msg-3",
      recipient: "Robert Johnson",
      subject: "Payment Receipt",
      type: "WhatsApp",
      status: "Delivered",
      sentDate: "Sep 10, 2025",
      openedDate: "Not opened",
    },
    {
      id: "msg-4",
      recipient: "Sarah Williams",
      subject: "New Policy Options",
      type: "Email",
      status: "Scheduled",
      sentDate: "Sep 15, 2025 (Scheduled)",
      openedDate: "-",
    },
    {
      id: "msg-5",
      recipient: "Michael Brown",
      subject: "Meeting Confirmation",
      type: "SMS",
      status: "Failed",
      sentDate: "Sep 09, 2025",
      openedDate: "-",
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Delivered":
        return <Check className="h-4 w-4 text-green-500" />;
      case "Scheduled":
        return <Clock className="h-4 w-4 text-blue-500" />;
      case "Failed":
        return <ArrowRightLeft className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getTypeIcon = (type: string) => {
    return <MessageSquare className="h-4 w-4" />;
  };

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Recipient</TableHead>
            <TableHead className="hidden md:table-cell">Subject</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden md:table-cell">Sent</TableHead>
            <TableHead className="hidden md:table-cell">Opened</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {messages.map((message) => (
            <TableRow key={message.id}>
              <TableCell className="font-medium">{message.recipient}</TableCell>
              <TableCell className="hidden md:table-cell">{message.subject}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {getTypeIcon(message.type)}
                  <span>{message.type}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {getStatusIcon(message.status)}
                  <span
                    className={`text-sm ${
                      message.status === "Delivered"
                        ? "text-green-600 dark:text-green-400"
                        : message.status === "Scheduled"
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {message.status}
                  </span>
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell">{message.sentDate}</TableCell>
              <TableCell className="hidden md:table-cell">{message.openedDate}</TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="sm">
                  Resend
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

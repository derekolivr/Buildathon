"use client";

import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye, Download, FileText, FileCog } from "lucide-react";

interface DocumentListProps {
  type?: "all" | "forms" | "policies" | "claims";
}

export function DocumentList({ type = "all" }: DocumentListProps) {
  const documents = [
    {
      id: "doc-1",
      name: "Insurance Claim Form - Client A",
      type: "claims",
      status: "Processed",
      date: "Sep 12, 2025",
      processingTime: "45 seconds",
    },
    {
      id: "doc-2",
      name: "Policy Renewal - Client B",
      type: "policies",
      status: "Processed",
      date: "Sep 11, 2025",
      processingTime: "32 seconds",
    },
    {
      id: "doc-3",
      name: "Client Registration Form",
      type: "forms",
      status: "Needs Review",
      date: "Sep 10, 2025",
      processingTime: "28 seconds",
    },
    {
      id: "doc-4",
      name: "Vehicle Insurance Policy",
      type: "policies",
      status: "Processed",
      date: "Sep 09, 2025",
      processingTime: "51 seconds",
    },
    {
      id: "doc-5",
      name: "Health Insurance Claim",
      type: "claims",
      status: "Processing",
      date: "Sep 08, 2025",
      processingTime: "In progress",
    },
  ].filter((doc) => type === "all" || doc.type === type);

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Document Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden md:table-cell">Date</TableHead>
            <TableHead className="hidden md:table-cell">Processing Time</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.map((doc) => (
            <TableRow key={doc.id}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  {doc.type === "claims" ? (
                    <FileText className="h-4 w-4 text-blue-500" />
                  ) : doc.type === "policies" ? (
                    <FileCog className="h-4 w-4 text-green-500" />
                  ) : (
                    <FileText className="h-4 w-4 text-gray-500" />
                  )}
                  {doc.name}
                </div>
              </TableCell>
              <TableCell>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    doc.status === "Processed"
                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                      : doc.status === "Processing"
                      ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                      : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                  }`}
                >
                  {doc.status}
                </span>
              </TableCell>
              <TableCell className="hidden md:table-cell">{doc.date}</TableCell>
              <TableCell className="hidden md:table-cell">{doc.processingTime}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="icon">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Download className="h-4 w-4" />
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

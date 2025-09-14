"use client";

import { useState, useEffect } from "react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye, Download, FileText, FileCog, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Document {
  id: string;
  file_name: string;
  storage_url: string;
  extracted_fields?: Record<string, string | number | boolean>;
  autofilled_url?: string;
  created_at: string;
}

interface DocumentListProps {
  clientId?: string;
  type?: "all" | "forms" | "policies" | "claims";
  documents?: Document[];
  onAutofill?: (docId: string) => Promise<void>;
}

export function DocumentList({ clientId, type = "all", documents: initialDocuments, onAutofill }: DocumentListProps) {
  const [documents, setDocuments] = useState<Document[]>(initialDocuments || []);
  const [loading, setLoading] = useState(!initialDocuments && !!clientId);
  const [processingDocId, setProcessingDocId] = useState<string | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);

  // Fetch documents if not provided and clientId exists
  useEffect(() => {
    const fetchDocuments = async () => {
      if (!clientId) return;

      try {
        setLoading(true);
        const res = await fetch(`/api/documents?client_id=${clientId}`);
        if (!res.ok) throw new Error("Failed to fetch documents");
        const data = await res.json();
        setDocuments(data.documents || []);
      } catch (error) {
        console.error("Error fetching documents:", error);
      } finally {
        setLoading(false);
      }
    };

    if (!initialDocuments && clientId) {
      fetchDocuments();
    }
  }, [initialDocuments, clientId]);

  const handleAutofill = async (docId: string) => {
    try {
      setProcessingDocId(docId);
      if (onAutofill) {
        await onAutofill(docId);
      } else {
        const res = await fetch("/api/autofill", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ docId }),
        });

        if (!res.ok) throw new Error("Autofill failed");

        const data = await res.json();
        // Update the document in the list
        setDocuments((docs) => docs.map((doc) => (doc.id === docId ? data.document : doc)));
      }
    } catch (error) {
      console.error("Error autofilling document:", error);
    } finally {
      setProcessingDocId(null);
    }
  };

  const viewDetails = (doc: Document) => {
    setSelectedDocument(doc);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (documents.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">No documents found</div>;
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Document Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden md:table-cell">Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.map((doc) => (
            <TableRow key={doc.id}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-500" />
                  {doc.file_name}
                </div>
              </TableCell>
              <TableCell>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    doc.autofilled_url
                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                      : doc.extracted_fields && Object.keys(doc.extracted_fields).length > 0
                      ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                      : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                  }`}
                >
                  {doc.autofilled_url
                    ? "Autofilled"
                    : doc.extracted_fields && Object.keys(doc.extracted_fields).length > 0
                    ? "Processed"
                    : "Pending"}
                </span>
              </TableCell>
              <TableCell className="hidden md:table-cell">{new Date(doc.created_at).toLocaleDateString()}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="icon" onClick={() => viewDetails(doc)}>
                    <Eye className="h-4 w-4" />
                  </Button>

                  {doc.autofilled_url ? (
                    <Button variant="ghost" size="icon" asChild>
                      <a href={doc.autofilled_url} target="_blank" rel="noopener noreferrer">
                        <Download className="h-4 w-4" />
                      </a>
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleAutofill(doc.id)}
                      disabled={processingDocId === doc.id}
                    >
                      {processingDocId === doc.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <FileCog className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={!!selectedDocument} onOpenChange={(open: boolean) => !open && setSelectedDocument(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Document Details</DialogTitle>
            <DialogDescription>{selectedDocument?.file_name}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {selectedDocument?.extracted_fields && Object.keys(selectedDocument.extracted_fields).length > 0 ? (
              <div className="border rounded-md p-4">
                <h3 className="font-medium mb-2">Extracted Fields</h3>
                <dl className="space-y-2">
                  {Object.entries(selectedDocument.extracted_fields).map(([key, value]) => (
                    <div key={key} className="grid grid-cols-3 gap-2">
                      <dt className="text-sm font-medium text-muted-foreground">{key}</dt>
                      <dd className="text-sm col-span-2">{String(value)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No fields have been extracted yet.</p>
            )}

            {selectedDocument?.autofilled_url ? (
              <div className="flex justify-center">
                <Button asChild>
                  <a href={selectedDocument.autofilled_url} target="_blank" rel="noopener noreferrer">
                    <Download className="mr-2 h-4 w-4" />
                    Download Autofilled Document
                  </a>
                </Button>
              </div>
            ) : (
              <div className="flex justify-center">
                <Button
                  onClick={() => selectedDocument && handleAutofill(selectedDocument.id)}
                  disabled={!selectedDocument || processingDocId === selectedDocument?.id}
                >
                  {processingDocId === selectedDocument?.id ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <FileCog className="mr-2 h-4 w-4" />
                      Autofill Document
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

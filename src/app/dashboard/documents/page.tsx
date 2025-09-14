"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DocumentUploader } from "@/components/documents/document-uploader";
import { DocumentList } from "@/components/documents/document-list";
import { FileText, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

interface Client {
  id: string;
  name: string;
  organization?: string;
}

interface Document {
  id: string;
  file_name: string;
  storage_url: string;
  extracted_fields?: Record<string, string | number | boolean>;
  autofilled_url?: string;
  created_at: string;
}

export default function DocumentsPage() {
  const searchParams = useSearchParams();
  const clientId = searchParams.get("clientId");
  const [client, setClient] = useState<Client | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    processed: 0,
    timeSaved: "0",
  });

  useEffect(() => {
    if (clientId) {
      fetchClient(clientId);
      fetchDocuments(clientId);
    } else {
      setIsLoading(false);
    }
  }, [clientId]);

  const fetchClient = async (id: string) => {
    try {
      const res = await fetch(`/api/clients?id=${id}`);
      if (!res.ok) throw new Error("Failed to fetch client");
      const data = await res.json();
      setClient(data);
    } catch (error) {
      console.error("Error fetching client:", error);
    }
  };

  const fetchDocuments = async (clientId: string) => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/documents?client_id=${clientId}`);
      if (!res.ok) throw new Error("Failed to fetch documents");
      const data = await res.json();
      setDocuments(data || []);

      // Update stats
      const docs = data || [];
      const processed = docs.filter(
        (doc: Document) => doc.extracted_fields && Object.keys(doc.extracted_fields).length > 0
      ).length;

      setStats({
        total: docs.length,
        processed,
        timeSaved: ((processed * 15) / 60).toFixed(1), // Assuming 15 minutes saved per processed document
      });
    } catch (error) {
      console.error("Error fetching documents:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDocumentUploaded = (document: Document) => {
    setDocuments((prev) => [document, ...prev]);
    setStats((prev) => ({
      ...prev,
      total: prev.total + 1,
    }));
  };

  const handleAutofill = async (docId: string) => {
    try {
      const res = await fetch("/api/autofill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docId }),
      });

      if (!res.ok) throw new Error("Autofill failed");

      const data = await res.json();

      // Update the document in the list
      setDocuments((docs) => docs.map((doc) => (doc.id === docId ? data : doc)));

      // Update stats
      setStats((prev) => ({
        ...prev,
        processed: prev.processed + 1,
        timeSaved: (((prev.processed + 1) * 15) / 60).toFixed(1),
      }));

      return data;
    } catch (error) {
      console.error("Error autofilling document:", error);
      throw error;
    }
  };

  if (!clientId) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <h1 className="text-2xl font-bold">No Client Selected</h1>
        <p className="text-muted-foreground">Please select a client from the clients page to view their documents.</p>
        <Button asChild>
          <Link href="/dashboard/clients">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go to Clients
          </Link>
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Loading client documents...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/clients">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Clients
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">{client ? `${client.name}'s Documents` : "Documents"}</h1>
        </div>
      </div>
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Documents</TabsTrigger>
          <TabsTrigger value="forms">Forms</TabsTrigger>
          <TabsTrigger value="policies">Policies</TabsTrigger>
          <TabsTrigger value="claims">Claims</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.total > 0 ? `For ${client?.name || "client"}` : "No documents yet"}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Processed Automatically</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.processed}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.total > 0
                    ? `${Math.round((stats.processed / stats.total) * 100)}% automation rate`
                    : "No documents processed"}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Time Saved</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.timeSaved} hrs</div>
                <p className="text-xs text-muted-foreground">This month</p>
              </CardContent>
            </Card>
          </div>
          <div className="grid gap-6 md:grid-cols-1">
            {clientId && (
              <Card>
                <CardHeader>
                  <CardTitle>Upload Document</CardTitle>
                  <CardDescription>Upload a document for AI-powered processing and form filling</CardDescription>
                </CardHeader>
                <CardContent>
                  <DocumentUploader clientId={clientId} onUploaded={handleDocumentUploaded} />
                </CardContent>
              </Card>
            )}
            <Card>
              <CardHeader>
                <CardTitle>Recent Documents</CardTitle>
                <CardDescription>Your recently processed documents</CardDescription>
              </CardHeader>
              <CardContent>
                <DocumentList clientId={clientId} documents={documents} onAutofill={handleAutofill} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="forms">
          <Card>
            <CardHeader>
              <CardTitle>Forms</CardTitle>
              <CardDescription>Manage your form documents</CardDescription>
            </CardHeader>
            <CardContent>
              <DocumentList
                clientId={clientId}
                documents={documents.filter((doc) => doc.file_name.toLowerCase().includes("form"))}
                type="forms"
                onAutofill={handleAutofill}
              />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="policies">
          <Card>
            <CardHeader>
              <CardTitle>Policies</CardTitle>
              <CardDescription>Manage your policy documents</CardDescription>
            </CardHeader>
            <CardContent>
              <DocumentList
                clientId={clientId}
                documents={documents.filter((doc) => doc.file_name.toLowerCase().includes("policy"))}
                type="policies"
                onAutofill={handleAutofill}
              />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="claims">
          <Card>
            <CardHeader>
              <CardTitle>Claims</CardTitle>
              <CardDescription>Manage your claim documents</CardDescription>
            </CardHeader>
            <CardContent>
              <DocumentList
                clientId={clientId}
                documents={documents.filter((doc) => doc.file_name.toLowerCase().includes("claim"))}
                type="claims"
                onAutofill={handleAutofill}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

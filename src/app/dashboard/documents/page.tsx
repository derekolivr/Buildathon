"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DocumentUploader } from "@/components/documents/document-uploader";
import { DocumentList } from "@/components/documents/document-list";
import { FileText } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// No longer needed for this component
// import { supabaseClient } from "@/lib/supabaseClient";

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
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    processed: 0,
    timeSaved: "0",
  });

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    if (selectedClientId) {
      fetchDocuments(selectedClientId);
    }
  }, [selectedClientId]);

  const fetchClients = async () => {
    try {
      const res = await fetch("/api/clients");
      if (!res.ok) throw new Error("Failed to fetch clients");
      const data = await res.json();
      setClients(data.clients || []);

      // Select the first client by default if available
      if (data.clients?.length > 0) {
        setSelectedClientId(data.clients[0].id);
      }
    } catch (error) {
      console.error("Error fetching clients:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async (clientId: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/documents?client_id=${clientId}`);
      if (!res.ok) throw new Error("Failed to fetch documents");
      const data = await res.json();
      setDocuments(data.documents || []);

      // Update stats
      const docs = data.documents || [];
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
      setLoading(false);
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
      setDocuments((docs) => docs.map((doc) => (doc.id === docId ? data.document : doc)));

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
        <Select value={selectedClientId} onValueChange={setSelectedClientId}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select Client" />
          </SelectTrigger>
          <SelectContent>
            {clients.map((client) => (
              <SelectItem key={client.id} value={client.id}>
                {client.name} {client.organization ? `(${client.organization})` : ""}
              </SelectItem>
            ))}
            {clients.length === 0 && (
              <SelectItem value="none" disabled>
                No clients available
              </SelectItem>
            )}
          </SelectContent>
        </Select>
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
                  {stats.total > 0 ? `For ${clients.find((c) => c.id === selectedClientId)?.name}` : "No documents yet"}
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
            {selectedClientId && (
              <Card>
                <CardHeader>
                  <CardTitle>Upload Document</CardTitle>
                  <CardDescription>Upload a document for AI-powered processing and form filling</CardDescription>
                </CardHeader>
                <CardContent>
                  <DocumentUploader clientId={selectedClientId} onUploaded={handleDocumentUploaded} />
                </CardContent>
              </Card>
            )}
            <Card>
              <CardHeader>
                <CardTitle>Recent Documents</CardTitle>
                <CardDescription>Your recently processed documents</CardDescription>
              </CardHeader>
              <CardContent>
                <DocumentList clientId={selectedClientId} documents={documents} onAutofill={handleAutofill} />
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
                clientId={selectedClientId}
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
                clientId={selectedClientId}
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
                clientId={selectedClientId}
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

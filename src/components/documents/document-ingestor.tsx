"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Loader2 } from "lucide-react";

interface IngestedClient {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  organization?: string | null;
}

interface IngestedDocument {
  id: string;
  client_id: string;
  file_name: string;
  storage_url: string;
  extracted_fields?: Record<string, string | number | boolean>;
  autofilled_url?: string | null;
  created_at: string;
}

interface DocumentIngestorProps {
  onCompleted?: (payload: { client: IngestedClient; document: IngestedDocument }) => void;
}

export function DocumentIngestor({ onCompleted }: DocumentIngestorProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleIngest = async () => {
    if (!file) return;
    try {
      setIsSubmitting(true);
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/ingest", {
        method: "POST",
        body: form,
      });
      setIsSubmitting(false);
      if (!res.ok) throw new Error("Ingest failed");
      const data: { client: IngestedClient; document: IngestedDocument } = await res.json();
      setFile(null);
      onCompleted?.(data);
    } catch (err) {
      console.error("Error ingesting document:", err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        <Input id="ingest" type="file" onChange={handleFileChange} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
        <p className="text-xs text-muted-foreground">
          Upload a document to extract client info and auto-create/update a client.
        </p>
      </div>
      <Button onClick={handleIngest} disabled={!file || isSubmitting} className="w-full">
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
          </>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" /> Ingest & Extract
          </>
        )}
      </Button>
    </div>
  );
}

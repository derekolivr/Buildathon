"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Loader2 } from "lucide-react";

interface DocumentUploaderProps {
  clientId?: string;
  onUploaded?: (document: { id: string; file_name: string; storage_url: string; created_at: string }) => void;
}

export function DocumentUploader({ clientId, onUploaded }: DocumentUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file || !clientId) return;

    try {
      setUploading(true);
      const form = new FormData();
      form.append("file", file);
      form.append("client_id", clientId);
      const res = await fetch("/api/documents", {
        method: "POST",
        body: form,
      });
      setUploading(false);
      setProcessing(true);
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setProcessing(false);
      setFile(null);
      onUploaded?.(data.document);
    } catch (error) {
      console.error("Error uploading document:", error);
      setUploading(false);
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        <Input id="document" type="file" onChange={handleFileChange} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
        <p className="text-xs text-muted-foreground">Supported formats: PDF, DOC, DOCX, JPG, PNG</p>
      </div>
      <div className="flex items-center gap-4">
        <Button onClick={handleUpload} disabled={!file || uploading || processing || !clientId} className="w-full">
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : processing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Finalizing...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Upload
            </>
          )}
        </Button>
      </div>
      <div className="text-sm text-muted-foreground">
        <p>Our AI will automatically:</p>
        <ul className="list-disc pl-5 space-y-1 mt-1">
          <li>Extract relevant information from documents</li>
          <li>Auto-fill forms based on document content</li>
          <li>Categorize document type (policy, claim, etc.)</li>
          <li>Flag any missing information or inconsistencies</li>
        </ul>
      </div>
    </div>
  );
}

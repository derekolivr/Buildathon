"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Loader2 } from "lucide-react";

export function DocumentUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    try {
      setUploading(true);
      // Simulate upload
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setUploading(false);
      setProcessing(true);
      // Simulate AI processing
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setProcessing(false);
      // Reset
      setFile(null);
      // Show success notification
      alert("Document processed successfully!");
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
        <Button onClick={handleUpload} disabled={!file || uploading || processing} className="w-full">
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : processing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing with AI...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Upload & Process
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

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();
    const body = await req.json();
    const { docId } = body || {};
    if (!docId) return NextResponse.json({ error: "Missing docId" }, { status: 400 });

    // Mock OCR/autofill service response
    const extractedFields = {
      name: "John Doe",
      policy: "POL-123456",
      address: "123 Main St, Anytown, USA",
      dateOfBirth: "1990-01-01",
      company: "Acme Insurance"
    } as Record<string, string | number | boolean>;
    const filledPdfUrl = "https://example.com/autofilled.pdf";

    // For development without auth, return mock data if docId starts with mock
    if (docId.toString().startsWith("mock-doc")) {
      const mockDocument = {
        id: docId,
        client_id: "mock-client-1",
        file_name: "Document.pdf",
        storage_url: `https://example.com/storage/document.pdf`,
        extracted_fields: extractedFields,
        autofilled_url: filledPdfUrl,
        created_at: new Date().toISOString()
      };
      return NextResponse.json({ document: mockDocument });
    }

    const { data, error } = await supabase
      .from("documents")
      .update({ extracted_fields: extractedFields, autofilled_url: filledPdfUrl })
      .eq("id", docId)
      .select("*")
      .single();

    if (error) throw error;
    return NextResponse.json({ document: data });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("Error in autofill API:", errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

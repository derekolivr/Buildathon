import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get("client_id");
    if (!clientId) return NextResponse.json({ error: "Missing client_id" }, { status: 400 });

    // For development without auth, return empty array if client_id doesn't exist
    if (clientId === "mock-client-1") {
      return NextResponse.json({ documents: [] });
    }

    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ documents: data || [] });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("Error in documents GET API:", errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();
    const formData = await req.formData();
    const clientId = formData.get("client_id") as string;
    const file = formData.get("file") as File | null;
    if (!clientId || !file) return NextResponse.json({ error: "Missing client_id or file" }, { status: 400 });

    // OPTIONAL: upload to Supabase Storage if configured (mock storage path here)
    const storage_url = `https://example.com/storage/${encodeURIComponent(file.name)}`;

    // For development without auth, return mock data if client_id is mock
    if (clientId === "mock-client-1") {
      const mockDocument = {
        id: `mock-doc-${Date.now()}`,
        client_id: clientId,
        file_name: file.name,
        storage_url,
        extracted_fields: {},
        created_at: new Date().toISOString()
      };
      return NextResponse.json({ document: mockDocument });
    }

    const { data, error } = await supabase
      .from("documents")
      .insert({
        client_id: clientId,
        file_name: file.name,
        storage_url,
        extracted_fields: {},
      })
      .select("*")
      .single();

    if (error) throw error;
    return NextResponse.json({ document: data });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("Error in documents POST API:", errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

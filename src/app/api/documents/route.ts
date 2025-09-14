import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get("client_id");
    if (!clientId) return NextResponse.json({ error: "Missing client_id" }, { status: 400 });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
    return NextResponse.json(data || []);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "An unknown error occurred";
    console.error("Error in documents GET API:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const form = await req.formData();
    const file = form.get("file") as File;
    const clientId = form.get("client_id") as string;

    if (!file || !clientId) {
      return NextResponse.json({ error: "Missing file or client_id" }, { status: 400 });
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const filePath = `${user.id}/${clientId}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from("documents").upload(filePath, file);

    // For development without auth, return mock data if client_id is mock
    if (clientId === "mock-client-1") {
      const mockDocument = {
        id: `mock-doc-${Date.now()}`,
        client_id: clientId,
        file_name: file.name,
        storage_url: `https://example.com/storage/${filePath}`, // Mock URL
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
        storage_url: `https://example.com/storage/${filePath}`, // Mock URL
        extracted_fields: {},
      })
      .select("*")
      .single();

    if (error) throw error;
    return NextResponse.json({ document: data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "An unknown error occurred";
    console.error("Error in documents POST API:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

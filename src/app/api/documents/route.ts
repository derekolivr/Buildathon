import { createServerClient } from "@supabase/ssr";
import { cookies as nextCookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

async function getServerClient() {
  const cookieStore = await nextCookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options?: Parameters<NextResponse["cookies"]["set"]>[2]) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options?: Parameters<NextResponse["cookies"]["set"]>[2]) {
          cookieStore.set({ name, value: "", ...options, maxAge: 0 });
        },
      },
    }
  );
  return { supabase } as const;
}

export async function GET(req: NextRequest) {
  try {
    const { supabase } = await getServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get("client_id");
    if (!clientId)
      return NextResponse.json(
        { error: "Missing client_id" },
        { status: 400 }
      );

    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "An unknown error occurred";
    console.error("Error in documents GET API:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { supabase } = await getServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const form = await req.formData();
    const file = form.get("file") as File;
    const clientId = form.get("client_id") as string;

    if (!file || !clientId) {
      return NextResponse.json(
        { error: "Missing file or client_id" },
        { status: 400 }
      );
    }

    const filePath = `${user.id}/${clientId}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(filePath, file);

    if (uploadError) {
      console.error("Supabase upload error:", uploadError);
      // Decide if you want to throw or continue. For now, we'll continue and log.
    }

    const { data, error } = await supabase
      .from("documents")
      .insert({
        client_id: clientId,
        file_name: file.name,
        storage_url: filePath, // Store the path, not a mock URL
        extracted_fields: {},
      })
      .select("*")
      .single();

    if (error) throw error;
    return NextResponse.json({ document: data });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "An unknown error occurred";
    console.error("Error in documents POST API:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

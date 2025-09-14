import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js";
import { cookies as nextCookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

function getAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) return null;
  // Ignore placeholder or obviously invalid keys to avoid "Invalid API key"
  if (serviceRoleKey === "your-service-role-key") return null;
  if (!serviceRoleKey.startsWith("eyJ")) return null;
  return createSupabaseAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function GET(req: NextRequest) {
  try {
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
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    const admin = getAdminClient();
    const db = admin ?? supabase;

    if (id) {
      const { data, error } = await db
        .from("clients")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();
      if (error) throw error;
      return NextResponse.json(data);
    }

    const { data, error } = await db
      .from("clients")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (error: unknown) {
    const errObj = error as unknown;
    const errorMessage =
      typeof errObj === "object" && errObj !== null && "message" in errObj
        ? String((errObj as { message: unknown }).message)
        : JSON.stringify(errObj);
    console.error("Error in clients GET API:", errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
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
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, phone, email, address, organization } = body || {};

    if (!name) {
      return NextResponse.json(
        { error: "Client name is required" },
        { status: 400 }
      );
    }

    const admin = getAdminClient();
    const db = admin ?? supabase;
    const { data, error } = await db
      .from("clients")
      .insert({ user_id: user.id, name, phone, email, address, organization })
      .select("*")
      .single();

    if (error) throw error;
    // Log activity
    await (admin ?? supabase)
      .from("activities")
      .insert({
        user_id: user.id,
        type: "client.created",
        message: `Created client ${name}`,
        client_id: data.id,
      });
    return NextResponse.json({ client: data });
  } catch (error: unknown) {
    const errObj = error as unknown;
    const errorMessage =
      typeof errObj === "object" && errObj !== null && "message" in errObj
        ? String((errObj as { message: unknown }).message)
        : JSON.stringify(errObj);
    console.error("Error in clients POST API:", errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
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
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, ...updates } = await req.json();
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const admin = getAdminClient();
    const db = admin ?? supabase;
    const { data, error } = await db
      .from("clients")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id)
      .select("*")
      .single();

    if (error) throw error;
    await (admin ?? supabase)
      .from("activities")
      .insert({
        user_id: user.id,
        type: "client.updated",
        message: `Updated client ${data.name}`,
        client_id: data.id,
        metadata: updates,
      });
    return NextResponse.json({ client: data });
  } catch (error: unknown) {
    const errObj = error as unknown;
    const errorMessage =
      typeof errObj === "object" && errObj !== null && "message" in errObj
        ? String((errObj as { message: unknown }).message)
        : JSON.stringify(errObj);
    console.error("Error in clients PUT API:", errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
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
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const admin = getAdminClient();
    const db = admin ?? supabase;
    const { error } = await db
      .from("clients")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) throw error;

    await (admin ?? supabase)
      .from("activities")
      .insert({
        user_id: user.id,
        type: "client.deleted",
        message: `Deleted client ${id}`,
        client_id: id,
      });
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const errObj = error as unknown;
    const errorMessage =
      typeof errObj === "object" && errObj !== null && "message" in errObj
        ? String((errObj as { message: unknown }).message)
        : JSON.stringify(errObj);
    console.error("Error in clients DELETE API:", errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

import { createServerClient } from "@supabase/ssr";
import { cookies as nextCookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

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
            error,
        } = await supabase.auth.getUser();
        if (error || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { data, error: qErr } = await supabase
            .from("activities")
            .select("id,type,message,client_id,document_id,created_at")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(20);
        if (qErr) throw qErr;
        return NextResponse.json(data ?? []);
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : JSON.stringify(e);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}



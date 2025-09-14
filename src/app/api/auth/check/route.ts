import { createServerClient } from "@supabase/ssr";
import { cookies as nextCookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
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

        if (error || !user) {
            return NextResponse.json({ authenticated: false }, { status: 401 });
        }

        return NextResponse.json({
            authenticated: true,
            user: {
                id: user.id,
                email: user.email,
            },
        });
    } catch (error) {
        console.error("Auth check error:", error);
        return NextResponse.json(
            { authenticated: false, error: "Authentication check failed" },
            { status: 500 }
        );
    }
}

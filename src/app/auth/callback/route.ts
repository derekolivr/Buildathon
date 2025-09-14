import { createServerClient } from "@supabase/ssr";
import { cookies as nextCookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    try {
        const requestUrl = new URL(request.url);
        const code = requestUrl.searchParams.get("code");
        const next = requestUrl.searchParams.get("next") ?? "/dashboard";

        if (code) {
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
            await supabase.auth.exchangeCodeForSession(code);
        }

        return NextResponse.redirect(new URL(next, request.url));
    } catch (error: unknown) {
        console.error("Error in auth callback:", error);
        return NextResponse.redirect(new URL("/login?error=Could not authenticate user", request.url));
    }
}
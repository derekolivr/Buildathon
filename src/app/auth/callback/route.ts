import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";  // ✅ must be from next/headers
import { NextResponse } from "next/server";
import type { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";



export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");
    const next = searchParams.get("next") ?? "/dashboard";

    if (code) {
        const cookieStore = cookies() as unknown as ReadonlyRequestCookies;

        // Create a new response to redirect to
        const redirectUrl = new URL(`${origin}${next}`);
        const response = NextResponse.redirect(redirectUrl);

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value;
                    },
                    set(name: string, value: string, options: CookieOptions) {
                        response.cookies.set({
                            name,
                            value,
                            ...options,
                            httpOnly: true,
                            secure: true,
                            sameSite: "lax",
                            path: "/",
                        });
                    },
                    remove(name: string, options: CookieOptions) {
                        response.cookies.set({
                            name,
                            value: "",
                            ...options,
                            httpOnly: true,
                            secure: true,
                            sameSite: "lax",
                            path: "/",
                        });
                    },
                },
            }
        );

        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error) {
            return response;
        }
    }

    return NextResponse.redirect(
        `${origin}/login?error=Could not authenticate user`
    );
}
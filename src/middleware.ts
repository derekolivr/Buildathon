import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
    const res = NextResponse.next();

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value;
                },
                set(name: string, value: string, options: Parameters<NextResponse["cookies"]["set"]>[2]) {
                    res.cookies.set({ name, value, ...options });
                },
                remove(name: string, options: Parameters<NextResponse["cookies"]["set"]>[2]) {
                    res.cookies.set({ name, value: "", ...options, maxAge: 0 });
                },
            },
        }
    );

    const {
        data: { session },
    } = await supabase.auth.getSession();

    const isAuthRoute =
        request.nextUrl.pathname === "/login" ||
        request.nextUrl.pathname === "/reset-password";
    const isProtectedRoute = request.nextUrl.pathname.startsWith("/dashboard");

    if (!session && isProtectedRoute) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    if (session && isAuthRoute) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return res;
}

export const config = {
    matcher: ["/dashboard/:path*", "/login", "/reset-password"],
};

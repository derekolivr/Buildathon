import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    try {
        const { searchParams, origin } = new URL(request.url);
        const code = searchParams.get("code");
        const next = searchParams.get("next") ?? "/dashboard";

        if (code) {
            // Create a new response to redirect to
            const redirectUrl = new URL(`${origin}${next}`);
            const response = NextResponse.redirect(redirectUrl);

            // Create a Supabase client using the auth-helpers-nextjs
            const supabase = createRouteHandlerClient(
                { cookies }
            );

            const { error } = await supabase.auth.exchangeCodeForSession(code);

            if (!error) {
                return response;
            }
        }
    } catch (error: unknown) {
        console.error("Error in auth callback:", error);
        const origin = new URL(request.url).origin;
        return NextResponse.redirect(
            `${origin}/login?error=Could not authenticate user`
        );
    }
}
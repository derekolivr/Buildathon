import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
    try {
        const response = NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_URL || "http://localhost:3000"));

        const supabase = createRouteHandlerClient(
            { cookies }
        );

        await supabase.auth.signOut();
        return response;
    } catch (error: unknown) {
        console.error("Error during signout:", error);
        return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_URL || "http://localhost:3000"));
    }
}

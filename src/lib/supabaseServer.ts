import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
// import { Database } from '@/lib/database.types'; // You can uncomment this if you have types generated

export function getSupabaseServerClient() {
    // For API Routes, we use createRouteHandlerClient and pass the cookies function directly.
    // This is the recommended approach for the Next.js App Router.
    // return createRouteHandlerClient<Database>({ cookies });
    return createRouteHandlerClient({ cookies });
}

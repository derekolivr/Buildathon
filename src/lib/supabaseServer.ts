import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export function getSupabaseServerClient() {
    const cookieStore = cookies();

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name) {
                    return cookieStore.get(name)?.value;
                },
                set(name, value, options) {
                    // This is a read-only client for API routes
                    cookieStore.set(name, value, options);
                },
                remove(name, options) {
                    // This is a read-only client for API routes
                    cookieStore.set(name, '', options);
                },
            },
        }
    );
}

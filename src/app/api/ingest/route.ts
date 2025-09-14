import { createServerClient } from "@supabase/ssr";
import { cookies as nextCookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

// POST /api/ingest
// Accepts multipart/form-data with `file`
// 1) Extracts client info (mocked) from the file
// 2) Finds or creates a client for the current user
// 3) Uploads the file to storage and creates a document row
// Returns: { client, document }
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

        const form = await req.formData();
        const file = form.get("file") as File | null;
        if (!file) {
            return NextResponse.json({ error: "Missing file" }, { status: 400 });
        }

        // 1) Extract client info using external service if configured, else fallback mock
        // Expected extractor response JSON example:
        // { name: string, email?: string, phone?: string, organization?: string, address?: string, extras?: object }
        type Extracted = Partial<{
            name: string;
            email: string;
            phone: string;
            organization: string;
            address: string;
        }> & Record<string, string | number | boolean>;
        let extracted: Extracted = {};
        const extractorUrl = process.env.DOCUMENT_EXTRACT_URL;
        const extractorToken = process.env.DOCUMENT_EXTRACT_BEARER;
        if (extractorUrl) {
            try {
                const forward = new FormData();
                const filename = typeof (file as File).name === "string" ? (file as File).name : "upload.bin";
                forward.append("file", file, filename);
                const headers: Record<string, string> = {};
                if (extractorToken) headers["Authorization"] = `Bearer ${extractorToken}`;
                const resp = await fetch(extractorUrl, { method: "POST", body: forward, headers });
                if (!resp.ok) {
                    const text = await resp.text();
                    throw new Error(`Extractor error ${resp.status}: ${text}`);
                }
                const json = (await resp.json()) as Record<string, unknown>;
                extracted = Object.fromEntries(
                    Object.entries(json).map(([k, v]) => [k, typeof v === "object" ? JSON.stringify(v) : String(v)])
                ) as Extracted;
            } catch (e) {
                console.error("Extractor call failed, falling back to mock:", e);
                extracted = {
                    name: "John Doe",
                    email: "john.doe@example.com",
                    phone: "555-1234",
                    organization: "Acme",
                };
            }
        } else {
            extracted = {
                name: "John Doe",
                email: "john.doe@example.com",
                phone: "555-1234",
                organization: "Acme",
            };
        }

        // 2) Find existing client by email or name for this user, else create
        let client;
        {
            const { data: byEmail } = await supabase
                .from("clients")
                .select("*")
                .eq("user_id", user.id)
                .eq("email", extracted.email)
                .maybeSingle();

            if (byEmail) {
                client = byEmail;
            } else {
                const { data: byName } = await supabase
                    .from("clients")
                    .select("*")
                    .eq("user_id", user.id)
                    .eq("name", extracted.name)
                    .maybeSingle();

                if (byName) {
                    client = byName;
                } else {
                    const { data: created, error: createError } = await supabase
                        .from("clients")
                        .insert({
                            user_id: user.id,
                            name: String(extracted.name || "Unknown"),
                            email: extracted.email ?? null,
                            phone: extracted.phone ?? null,
                            organization: extracted.organization ?? null,
                        })
                        .select("*")
                        .single();
                    if (createError) throw createError;
                    client = created;
                }
            }
        }

        // 3) Upload file to storage and create a documents row
        const filePath = `${user.id}/${client.id}/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
            .from("documents")
            .upload(filePath, file);
        if (uploadError) {
            // Continue but log the error; storage might be optional for demo
            console.error("Supabase upload error:", uploadError);
        }

        const { data: document, error: docError } = await supabase
            .from("documents")
            .insert({
                client_id: client.id,
                file_name: file.name,
                storage_url: filePath,
                extracted_fields: extracted,
            })
            .select("*")
            .single();
        if (docError) throw docError;

        // Log activity
        await supabase
            .from("activities")
            .insert({
                user_id: user.id,
                type: "document.ingested",
                message: `Ingested ${file.name}`,
                client_id: client.id,
                document_id: document.id,
                metadata: extracted,
            });

        return NextResponse.json({ client, document });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : JSON.stringify(err);
        console.error("Error in ingest API:", message);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}



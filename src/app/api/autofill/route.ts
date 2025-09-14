import { createServerClient } from "@supabase/ssr";
import { cookies as nextCookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

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

    const body = await req.json();
    const { docId } = body || {};
    if (!docId)
      return NextResponse.json({ error: "Missing docId" }, { status: 400 });

    // Mock the OCR/autofill service
    const extractedFields = {
      name: "John Doe",
      policyNumber: "POL-12345XYZ",
      effectiveDate: "2023-01-01",
      expirationDate: "2024-01-01",
      coverageAmount: 100000,
      isAuto: true,
    };
    const filledPdfUrl = `https://example.com/autofilled-${docId}.pdf`;

    const { data, error } = await supabase
      .from("documents")
      .update({
        extracted_fields: extractedFields,
        autofilled_url: filledPdfUrl,
      })
      .eq("id", docId)
      .select("*")
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Error in autofill API:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

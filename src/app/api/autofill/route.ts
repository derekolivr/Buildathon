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
    if (!docId) {
      return NextResponse.json({ error: "Missing docId" }, { status: 400 });
    }

    // 1) Load document row (and verify ownership via client)
    const { data: doc, error: docErr } = await supabase
      .from("documents")
      .select("id, client_id, file_name, storage_url, extracted_fields, autofilled_url")
      .eq("id", docId)
      .single();
    if (docErr || !doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }
    const { data: client, error: clientErr } = await supabase
      .from("clients")
      .select("id, user_id")
      .eq("id", doc.client_id as string)
      .single();
    if (clientErr || !client || client.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 2) Forward file to external filler service (if configured)
    const fillUrl = process.env.DOCUMENT_FILL_URL;
    const fillBearer = process.env.DOCUMENT_FILL_BEARER;
    const originalName = typeof doc.file_name === "string" && doc.file_name.trim().length > 0 ? doc.file_name : "upload.pdf";

    if (!fillUrl) {
      // Graceful fallback: mark as processed (no filled PDF)
      const { data: updated, error: updErr } = await supabase
        .from("documents")
        .update({ extracted_fields: { autofill: "skipped (no DOCUMENT_FILL_URL)" } })
        .eq("id", docId)
        .select("*")
        .single();
      if (updErr || !updated) {
        return NextResponse.json({ error: updErr?.message || "Failed to update document" }, { status: 500 });
      }
      await supabase.from("activities").insert({
        user_id: user.id,
        type: "document.autofill.skipped",
        message: `Autofill skipped for ${originalName}`,
        client_id: doc.client_id,
        document_id: docId,
      });
      return NextResponse.json(updated);
    }

    // 3) Download original file from Storage (only when needed)
    if (!doc.storage_url) {
      return NextResponse.json({ error: "Document has no storage_url" }, { status: 400 });
    }
    const downloadRes = await supabase.storage.from("documents").download(doc.storage_url as string);
    if (downloadRes.error || !downloadRes.data) {
      const msg = downloadRes.error?.message || "Failed to download source file";
      return NextResponse.json({ error: msg }, { status: 500 });
    }

    const forward = new FormData();
    forward.append("file", downloadRes.data as unknown as Blob, originalName);
    const headers: Record<string, string> = {};
    if (fillBearer) headers["Authorization"] = `Bearer ${fillBearer}`;

    let pdfArrayBuffer: ArrayBuffer | null = null;
    let extractedFromJson: Record<string, unknown> | null = null;
    try {
      const resp = await fetch(fillUrl, { method: "POST", body: forward, headers });
      if (!resp.ok) {
        const text = await resp.text().catch(() => "");
        throw new Error(`Filler error ${resp.status}: ${text}`);
      }

      const contentType = resp.headers.get("content-type") || "";

      if (contentType.includes("application/json") || contentType.includes("text/json")) {
        const json = (await resp.json()) as Record<string, unknown>;

        // Extract fields if provided
        // Accept: extracted_fields (object) OR matched_fields (array of { pdf_field, value }) OR fields (object)
        if (json && typeof json === "object") {
          if (json["extracted_fields"] && typeof json["extracted_fields"] === "object") {
            extractedFromJson = json["extracted_fields"] as Record<string, unknown>;
          } else if (Array.isArray(json["matched_fields"])) {
            const dict: Record<string, unknown> = {};
            for (const item of json["matched_fields"] as Array<Record<string, unknown>>) {
              const k = (item?.["pdf_field"] ?? item?.["biodata_field"]) as string | undefined;
              const v = item?.["value"];
              if (k && v !== undefined) dict[k] = v as unknown;
            }
            if (Object.keys(dict).length > 0) extractedFromJson = dict;
          } else if (json["fields"] && typeof json["fields"] === "object") {
            extractedFromJson = json["fields"] as Record<string, unknown>;
          }
        }

        // Extract PDF if provided
        // Accept: pdf_base64 (string) OR pdf (base64 string) OR pdf_url (string)
        let gotPdf = false;
        const pdfBase64 = (json["pdf_base64"] || json["pdf"]) as string | undefined;
        if (pdfBase64 && typeof pdfBase64 === "string") {
          const buf = Buffer.from(pdfBase64, "base64");
          pdfArrayBuffer = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
          gotPdf = true;
        }
        if (!gotPdf && typeof json["pdf_url"] === "string" && json["pdf_url"]) {
          const pdfResp = await fetch(json["pdf_url"] as string);
          if (!pdfResp.ok) {
            const t = await pdfResp.text().catch(() => "");
            throw new Error(`pdf_url fetch failed ${pdfResp.status}: ${t}`);
          }
          pdfArrayBuffer = await pdfResp.arrayBuffer();
          gotPdf = true;
        }

        // If JSON but no PDF present, continue with fields-only update below
        if (!gotPdf) {
          pdfArrayBuffer = null;
        }
      } else {
        // Default: treat as PDF stream
        pdfArrayBuffer = await resp.arrayBuffer();
      }
    } catch (e: unknown) {
      // Fallback: mark extracted_fields with error and return
      const fallbackFields = { autofill_error: e instanceof Error ? e.message : "Unknown filler error" } as const;
      const { data: updated, error: updErr } = await supabase
        .from("documents")
        .update({ extracted_fields: fallbackFields })
        .eq("id", docId)
        .select("*")
        .single();
      if (updErr || !updated) {
        return NextResponse.json({ error: updErr?.message || "Failed to update document" }, { status: 500 });
      }
      await supabase.from("activities").insert({
        user_id: user.id,
        type: "document.autofill.failed",
        message: `Autofill failed for ${originalName}`,
        client_id: doc.client_id,
        document_id: docId,
      });
      return NextResponse.json(updated);
    }

    // 4) Upload PDF to Storage if present and prepare signed URL
    let signedUrl: string | null = null;
    if (pdfArrayBuffer) {
      const filledBlob = new Blob([pdfArrayBuffer], { type: "application/pdf" });
      const basePath = `${user.id}/${doc.client_id}`;
      const filledName = originalName.toLowerCase().endsWith(".pdf")
        ? originalName.replace(/\.pdf$/i, `_${Date.now()}_filled.pdf`)
        : `${originalName}_${Date.now()}_filled.pdf`;
      const filledPath = `${basePath}/${filledName}`;

      const uploadRes = await supabase.storage
        .from("documents")
        .upload(filledPath, filledBlob, { contentType: "application/pdf" });
      if (uploadRes.error) {
        return NextResponse.json({ error: `Upload failed: ${uploadRes.error.message}` }, { status: 500 });
      }

      const signed = await supabase.storage.from("documents").createSignedUrl(filledPath, 60 * 60 * 24 * 7);
      if (signed.error || !signed.data?.signedUrl) {
        return NextResponse.json({ error: `Failed to create signed URL: ${signed.error?.message}` }, { status: 500 });
      }
      signedUrl = signed.data.signedUrl;
    }

    // 5) Update document row with any extracted fields and optional autofilled_url
    const updatePayload: Record<string, unknown> = {};
    if (signedUrl) updatePayload.autofilled_url = signedUrl;
    if (extractedFromJson && Object.keys(extractedFromJson).length > 0) {
      updatePayload.extracted_fields = extractedFromJson;
    }

    const { data: updated, error: updErr } = await supabase
      .from("documents")
      .update(updatePayload)
      .eq("id", docId)
      .select("*")
      .single();
    if (updErr || !updated) {
      return NextResponse.json({ error: updErr?.message || "Failed to update document" }, { status: 500 });
    }

    // Log activity
    await supabase
      .from("activities")
      .insert({
        user_id: user.id,
        type: "document.autofilled",
        message: `Autofilled ${originalName}`,
        client_id: doc.client_id,
        document_id: docId,
      });

    return NextResponse.json(updated);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Error in autofill API:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const scriptUrl = typeof body?.scriptUrl === "string" ? body.scriptUrl.trim() : "";
    const report = body?.report;

    if (!scriptUrl) {
      return NextResponse.json({ success: false, error: "URL Google Apps Script belum diisi." }, { status: 400 });
    }

    let parsed: URL;
    try {
      parsed = new URL(scriptUrl);
    } catch {
      return NextResponse.json({ success: false, error: "URL Google Apps Script tidak valid." }, { status: 400 });
    }

    if (parsed.protocol !== "https:" || parsed.hostname !== "script.google.com" || !parsed.pathname.startsWith("/macros/s/")) {
      return NextResponse.json({ success: false, error: "URL harus berupa Web App Google Apps Script (script.google.com/macros/s/...)." }, { status: 400 });
    }

    if (!report || typeof report !== "object") {
      return NextResponse.json({ success: false, error: "Data Performance tidak ditemukan." }, { status: 400 });
    }

    const upstream = await fetch(parsed.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({ action: "export_performance_slides", report }),
      redirect: "follow",
      cache: "no-store"
    });

    const text = await upstream.text();
    let result: Record<string, unknown>;
    try {
      result = JSON.parse(text);
    } catch {
      result = { success: false, error: text || `Google Apps Script mengembalikan HTTP ${upstream.status}.` };
    }

    if (!upstream.ok || result.success !== true) {
      return NextResponse.json({ success: false, error: String(result.error || `Export gagal (HTTP ${upstream.status}).`) }, { status: 502 });
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Gagal menghubungi Google Apps Script." }, { status: 500 });
  }
}

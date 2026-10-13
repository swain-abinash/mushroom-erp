import path from "node:path";
import { MIME_BY_EXT, readUpload } from "@/lib/storage";

export async function GET(_request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const segments = (await params).path;
  const mime =
    MIME_BY_EXT[
      path
        .extname(segments.at(-1) ?? "")
        .slice(1)
        .toLowerCase()
    ];
  const file = mime ? await readUpload(segments) : null;
  if (!file) return new Response("Not found", { status: 404 });

  return new Response(new Uint8Array(file), {
    headers: {
      "Content-Type": mime,
      // File names are random UUIDs and never reused, so they can be cached forever.
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

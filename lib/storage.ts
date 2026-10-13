import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { ServiceError } from "@/lib/errors";

// Uploaded files live outside `public/` because `next start` only serves files that existed in
// `public/` at build time. They are served by `app/uploads/[...path]/route.ts`.
export const UPLOAD_ROOT = path.join(process.cwd(), "storage", "uploads");
export const UPLOAD_URL_PREFIX = "/uploads/";

export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
export const MAX_IMAGES_PER_UPLOAD = 5;

const IMAGE_SIGNATURES: Array<{ ext: string; mime: string; matches: (b: Buffer) => boolean }> = [
  {
    ext: "jpg",
    mime: "image/jpeg",
    matches: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  {
    ext: "png",
    mime: "image/png",
    matches: (b) =>
      b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  },
  {
    ext: "webp",
    mime: "image/webp",
    matches: (b) => b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP",
  },
  {
    ext: "avif",
    mime: "image/avif",
    matches: (b) =>
      b.toString("ascii", 4, 8) === "ftyp" && b.toString("ascii", 8, 12).startsWith("avi"),
  },
];

export const MIME_BY_EXT: Record<string, string> = Object.fromEntries(
  IMAGE_SIGNATURES.map((signature) => [signature.ext, signature.mime]),
);

/** Validates the file by its content (not the client-supplied type) and stores it. Returns its URL. */
export async function saveImage(file: File, folder: "products" | "categories"): Promise<string> {
  if (file.size > MAX_IMAGE_BYTES) {
    throw new ServiceError("IMAGE_TOO_LARGE", `"${file.name}" is larger than 4 MB.`, 413, "images");
  }
  const bytes = Buffer.from(await file.arrayBuffer());
  const type = IMAGE_SIGNATURES.find((signature) => signature.matches(bytes));
  if (!type) {
    throw new ServiceError(
      "UNSUPPORTED_IMAGE",
      `"${file.name}" must be a JPEG, PNG, WebP or AVIF image.`,
      415,
      "images",
    );
  }

  const fileName = `${randomUUID()}.${type.ext}`;
  await mkdir(path.join(UPLOAD_ROOT, folder), { recursive: true });
  await writeFile(path.join(UPLOAD_ROOT, folder, fileName), bytes);
  return `${UPLOAD_URL_PREFIX}${folder}/${fileName}`;
}

/** Resolves an `/uploads/...` URL to a file path inside UPLOAD_ROOT, or null if it escapes it. */
export function resolveUploadPath(segments: string[]): string | null {
  const resolved = path.resolve(UPLOAD_ROOT, ...segments);
  return resolved.startsWith(UPLOAD_ROOT + path.sep) ? resolved : null;
}

export async function readUpload(segments: string[]): Promise<Buffer | null> {
  const filePath = resolveUploadPath(segments);
  if (!filePath) return null;
  return readFile(filePath).catch(() => null);
}

/** Best-effort delete of a previously uploaded file; external URLs are ignored. */
export async function deleteUpload(url: string): Promise<void> {
  if (!url.startsWith(UPLOAD_URL_PREFIX)) return;
  const filePath = resolveUploadPath(url.slice(UPLOAD_URL_PREFIX.length).split("/"));
  if (filePath) await unlink(filePath).catch(() => undefined);
}

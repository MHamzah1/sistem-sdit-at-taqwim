import { upload } from "@vercel/blob/client";
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export async function api<T>(
  path: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  const response = await fetch("/api/" + path, {
    method,
    credentials: "same-origin",
    headers: body === undefined ? {} : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const value = await response
    .json()
    .catch(() => ({ error: "Respons server tidak valid" }));
  if (!response.ok)
    throw new ApiError(
      response.status,
      value.error +
        (value.details
          ? ": " +
            value.details
              .map(
                (d: { path: string; message: string }) =>
                  `${d.path}: ${d.message}`,
              )
              .join("; ")
          : ""),
    );
  return value as T;
}
export async function uploadProof(file: File, userId: string) {
  const extensions: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "application/pdf": "pdf",
  };
  const ext = extensions[file.type];
  if (!ext || file.size <= 0 || file.size > 5 * 1024 * 1024)
    throw new Error("Pilih JPG, PNG, PDF maksimal 5 MB");
  const blob = await upload(
    `proofs/${userId}/${crypto.randomUUID()}.${ext}`,
    file,
    {
      access: "private",
      handleUploadUrl: "/api/files/upload",
      contentType: file.type,
    },
  );
  return api<{ id: string }>("files", "POST", { pathname: blob.pathname });
}
export async function downloadProof(proof: {
  id: string;
  filename: string;
  size: number;
  mimeType: string;
}) {
  const chunks: ArrayBuffer[] = [];
  for (let start = 0; start < proof.size; start += 2 * 1024 * 1024) {
    const response = await fetch(`/api/files/${proof.id}`, {
      headers: {
        Range: `bytes=${start}-${Math.min(start + 2 * 1024 * 1024 - 1, proof.size - 1)}`,
      },
    });
    if (response.status !== 206) throw new Error("Bukti tidak dapat diunduh");
    chunks.push(await response.arrayBuffer());
  }
  saveFile(new Blob(chunks, { type: proof.mimeType }), proof.filename);
}
export async function uploadStudentDocument(
  file: File,
  userId: string,
  studentId: string,
  docType: string,
  docName: string,
) {
  const extensions: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "application/pdf": "pdf",
    "image/webp": "webp",
  };
  const ext = extensions[file.type];
  if (!ext || file.size <= 0 || file.size > 5 * 1024 * 1024)
    throw new Error("Pilih berkas JPG, PNG, PDF, atau WebP maksimal 5 MB");
  const blob = await upload(
    `student-documents/${userId}/${crypto.randomUUID()}.${ext}`,
    file,
    {
      access: "private",
      handleUploadUrl: "/api/files/upload",
      contentType: file.type,
    },
  );
  return api<any>(`students/${studentId}/documents`, "POST", {
    documentType: docType,
    documentName: docName,
    storagePath: blob.pathname,
    originalFilename: file.name,
    mimeType: file.type,
    fileSize: file.size,
  });
}
export async function downloadStudentDocumentContent(doc: {
  id: string;
  originalFilename: string;
  fileSize?: number;
  mimeType?: string;
}) {
  const response = await fetch(`/api/student-documents/${doc.id}/content`);
  if (!response.ok) throw new Error("Dokumen tidak dapat diunduh");
  const blob = await response.blob();
  saveFile(blob, doc.originalFilename);
}
export function saveFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function csvCell(value: unknown) {
  let text = String(value ?? "");
  if (/^[\s]*[=+@-]/.test(text)) text = "'" + text;
  return '"' + text.replaceAll('"', '""') + '"';
}

export function getStudentPhotoUrl(
  student?: { id?: string; photoUrl?: string | null } | null,
): string | null {
  if (!student?.photoUrl) return null;
  const p = student.photoUrl.trim();
  if (
    p.startsWith("data:") ||
    p.startsWith("blob:") ||
    p.startsWith("http://") ||
    p.startsWith("https://")
  ) {
    return p;
  }
  return `/api/students/${student.id}/photo`;
}


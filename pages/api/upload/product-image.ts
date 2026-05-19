import { mkdir, writeFile } from "fs/promises";
import path from "path";
import type { NextApiResponse } from "next";
import { Role } from "@prisma/client";
import { requireRole, withAuth } from "@/services/auth";
import type { AuthenticatedNextApiRequest } from "@/types/api";

// Allow up to 5 MB JSON body for base64 image
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "5mb",
    },
  },
};

async function handler(req: AuthenticatedNextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  if (!requireRole(req, res, [Role.ADMIN])) return;

  const { imageBase64, filename } = req.body as { imageBase64?: unknown; filename?: unknown };

  if (!imageBase64 || typeof imageBase64 !== "string") {
    return res.status(400).json({ error: "imageBase64 es requerido." });
  }

  const match = imageBase64.match(/^data:(image\/(jpeg|jpg|png|webp));base64,(.+)$/);
  if (!match) {
    return res.status(400).json({ error: "Formato no válido. Usá JPEG, PNG o WebP (máx. 5 MB)." });
  }

  const rawExt = match[2];
  const ext = rawExt === "jpeg" ? "jpg" : rawExt;
  const base64Data = match[3];

  const safeSlug =
    typeof filename === "string"
      ? filename.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase().slice(0, 40)
      : "producto";

  const uniqueName = `${safeSlug}-${Date.now()}.${ext}`;
  const uploadsDir = path.join(process.cwd(), "public", "uploads", "products");

  await mkdir(uploadsDir, { recursive: true });
  await writeFile(path.join(uploadsDir, uniqueName), Buffer.from(base64Data, "base64"));

  return res.status(200).json({ url: `/uploads/products/${uniqueName}` });
}

export default withAuth(handler);

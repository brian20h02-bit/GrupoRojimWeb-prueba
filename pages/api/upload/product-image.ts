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

  const supabaseUrl = (process.env.SUPABASE_URL ?? "").replace(/\/$/, "");
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Supabase Storage not configured: missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    return res.status(503).json({ error: "Almacenamiento no configurado en el servidor." });
  }

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
  const mimeType = match[1];
  const base64Data = match[3];

  const safeSlug =
    typeof filename === "string"
      ? filename.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase().slice(0, 40)
      : "producto";

  const uniqueName = `${safeSlug}-${Date.now()}.${ext}`;
  const buffer = Buffer.from(base64Data, "base64");

  try {
    const uploadUrl = `${supabaseUrl}/storage/v1/object/product-images/${uniqueName}`;
    console.log("Uploading to Supabase Storage:", uploadUrl);
    const uploadResponse = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${supabaseServiceKey}`,
        "Content-Type": mimeType,
        "x-upsert": "true",
      },
      body: buffer,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error("Supabase Storage error:", uploadResponse.status, errorText);
      return res.status(500).json({ error: `No se pudo subir la imagen: ${uploadResponse.status}` });
    }

    const publicUrl = `${supabaseUrl}/storage/v1/object/public/product-images/${uniqueName}`;
    console.log("Upload success:", publicUrl);
    return res.status(200).json({ url: publicUrl });
  } catch (err) {
    console.error("Upload error:", err);
    return res.status(500).json({ error: "Error interno al subir la imagen." });
  }
}

export default withAuth(handler);

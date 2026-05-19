import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/public/brands
 *
 * Returns a sorted list of distinct brand names from active+catalog-visible products.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed." });
  }

  try {
    const rows = await prisma.product.findMany({
      where: { active: true, catalogVisible: true },
      select: { brand: true },
      distinct: ["brand"],
      orderBy: { brand: "asc" },
    });

    const brands = rows.map((r) => r.brand).filter(Boolean);

    return res.status(200).json({ brands });
  } catch {
    return res.status(500).json({ error: "Error al obtener marcas." });
  }
}

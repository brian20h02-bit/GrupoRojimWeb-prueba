import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/public/categories
 *
 * Returns all categories with their active+catalog-visible product count.
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
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        iconSlug: true,
        sortOrder: true,
        _count: {
          select: {
            products: {
              where: { active: true, catalogVisible: true },
            },
          },
        },
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });

    return res.status(200).json({ categories });
  } catch {
    return res.status(500).json({ error: "Error al obtener categorías." });
  }
}

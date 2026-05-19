import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/public/products
 *
 * Query params:
 *   q        – full-text search (name, code, brand, subcategory)
 *   category – category slug
 *   brand    – exact brand name (case-insensitive)
 *   featured – "true" to return only featured products
 *   page     – page number (default 1)
 *   limit    – items per page (default 24, max 100)
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed." });
  }

  const { q, category, brand, featured, page = "1", limit = "24" } = req.query;

  const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(String(limit), 10) || 24));

  // Only show active, catalog-visible products
  const where: Record<string, unknown> = {
    active: true,
    catalogVisible: true,
  };

  if (q && typeof q === "string" && q.trim()) {
    const term = q.trim();
    where.OR = [
      { name: { contains: term, mode: "insensitive" } },
      { code: { contains: term, mode: "insensitive" } },
      { brand: { contains: term, mode: "insensitive" } },
      { subcategory: { contains: term, mode: "insensitive" } },
      { description: { contains: term, mode: "insensitive" } },
    ];
  }

  if (category && typeof category === "string" && category !== "all") {
    where.category = { slug: category };
  }

  if (brand && typeof brand === "string") {
    where.brand = { equals: brand, mode: "insensitive" };
  }

  if (featured === "true") {
    where.featured = true;
  }

  try {
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        select: {
          id: true,
          code: true,
          slug: true,
          name: true,
          description: true,
          price: true,
          brand: true,
          unitPerBox: true,
          featured: true,
          imageUrl: true,
          subcategory: true,
          category: { select: { id: true, name: true, slug: true, iconSlug: true } },
        },
        orderBy: [{ featured: "desc" }, { name: "asc" }],
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
      prisma.product.count({ where }),
    ]);

    return res.status(200).json({
      products: products.map((p) => ({ ...p, price: p.price.toString() })),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch {
    return res.status(500).json({ error: "Error al obtener productos." });
  }
}

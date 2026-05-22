import type { NextApiResponse } from "next";
import { Prisma, Role } from "@prisma/client";
import { requireRole, withAuth } from "@/services/auth";
import { createCategory, listCategories } from "@/services/categories";
import type { AuthenticatedNextApiRequest } from "@/types/api";
import { createCategorySchema } from "@/validation/categories";

async function handler(req: AuthenticatedNextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    try {
      const categories = await listCategories();
      return res.status(200).json({ categories });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "No se pudieron cargar las categorías." });
    }
  }

  if (req.method === "POST") {
    if (!requireRole(req, res, [Role.ADMIN])) {
      return;
    }

    const parsedBody = createCategorySchema.safeParse(req.body);

    if (!parsedBody.success) {
      return res.status(400).json({
        error: "Invalid request body.",
        details: parsedBody.error.flatten(),
      });
    }

    try {
      const category = await createCategory(parsedBody.data);
      return res.status(201).json({ category });
    } catch (error) {
      return handleCategoryMutationError(error, res, "Unable to create category.");
    }
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ error: "Method not allowed." });
}

export function handleCategoryMutationError(
  error: unknown,
  res: NextApiResponse,
  fallbackMessage: string,
) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return res.status(409).json({ error: "A category with this slug already exists." });
    }

    if (error.code === "P2025") {
      return res.status(404).json({ error: "Category not found." });
    }

    if (error.code === "P2003") {
      return res.status(409).json({ error: "This category is linked to products." });
    }
  }

  console.error(error);
  return res.status(500).json({ error: fallbackMessage });
}

export default withAuth(handler);

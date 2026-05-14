import type { NextApiResponse } from "next";
import { Role } from "@prisma/client";
import { requireRole, withAuth } from "@/services/auth";
import {
  deleteCategory,
  getCategoryById,
  updateCategory,
} from "@/services/categories";
import type { AuthenticatedNextApiRequest } from "@/types/api";
import { categoryIdSchema, updateCategorySchema } from "@/validation/categories";
import { handleCategoryMutationError } from "./index";

async function handler(req: AuthenticatedNextApiRequest, res: NextApiResponse) {
  const parsedQuery = categoryIdSchema.safeParse(req.query);

  if (!parsedQuery.success) {
    return res.status(400).json({
      error: "Invalid category id.",
      details: parsedQuery.error.flatten(),
    });
  }

  const { id } = parsedQuery.data;

  if (req.method === "GET") {
    const category = await getCategoryById(id);

    if (!category) {
      return res.status(404).json({ error: "Category not found." });
    }

    return res.status(200).json({ category });
  }

  if (req.method === "PUT") {
    if (!requireRole(req, res, [Role.ADMIN])) {
      return;
    }

    const parsedBody = updateCategorySchema.safeParse(req.body);

    if (!parsedBody.success) {
      return res.status(400).json({
        error: "Invalid request body.",
        details: parsedBody.error.flatten(),
      });
    }

    try {
      const category = await updateCategory(id, parsedBody.data);
      return res.status(200).json({ category });
    } catch (error) {
      return handleCategoryMutationError(error, res, "Unable to update category.");
    }
  }

  if (req.method === "DELETE") {
    if (!requireRole(req, res, [Role.ADMIN])) {
      return;
    }

    try {
      const category = await deleteCategory(id);
      return res.status(200).json({ category });
    } catch (error) {
      return handleCategoryMutationError(error, res, "Unable to delete category.");
    }
  }

  res.setHeader("Allow", "GET, PUT, DELETE");
  return res.status(405).json({ error: "Method not allowed." });
}

export default withAuth(handler);

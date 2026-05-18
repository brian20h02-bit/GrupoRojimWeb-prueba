import type { NextApiResponse } from "next";
import { Role } from "@prisma/client";
import { requireRole, withAuth } from "@/services/auth";
import { deactivateProduct, getProductById, updateProduct } from "@/services/products";
import type { AuthenticatedNextApiRequest } from "@/types/api";
import { productIdSchema, updateProductSchema } from "@/validation/products";
import { handleProductMutationError } from "./index";

async function handler(req: AuthenticatedNextApiRequest, res: NextApiResponse) {
  const parsedQuery = productIdSchema.safeParse(req.query);

  if (!parsedQuery.success) {
    return res.status(400).json({
      error: "Invalid product id.",
      details: parsedQuery.error.flatten(),
    });
  }

  const { id } = parsedQuery.data;

  if (req.method === "GET") {
    const product = await getProductById(id);

    if (!product) {
      return res.status(404).json({ error: "Product not found." });
    }

    return res.status(200).json({ product });
  }

  if (req.method === "PUT") {
    if (!requireRole(req, res, [Role.ADMIN])) {
      return;
    }

    const parsedBody = updateProductSchema.safeParse(req.body);

    if (!parsedBody.success) {
      return res.status(400).json({
        error: "Invalid request body.",
        details: parsedBody.error.flatten(),
      });
    }

    try {
      const product = await updateProduct(id, parsedBody.data);
      return res.status(200).json({ product });
    } catch (error) {
      return handleProductMutationError(error, res, "Unable to update product.");
    }
  }

  if (req.method === "DELETE") {
    if (!requireRole(req, res, [Role.ADMIN])) {
      return;
    }

    try {
      const product = await deactivateProduct(id);
      return res.status(200).json({ product });
    } catch (error) {
      return handleProductMutationError(error, res, "Unable to deactivate product.");
    }
  }

  res.setHeader("Allow", "GET, PUT, DELETE");
  return res.status(405).json({ error: "Method not allowed." });
}

export default withAuth(handler);

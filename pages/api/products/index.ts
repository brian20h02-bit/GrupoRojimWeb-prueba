import type { NextApiResponse } from "next";
import { Prisma, Role } from "@prisma/client";
import { requireRole, withAuth } from "@/services/auth";
import { createProduct, listProducts } from "@/services/products";
import type { AuthenticatedNextApiRequest } from "@/types/api";
import { createProductSchema, listProductsQuerySchema } from "@/validation/products";

async function handler(req: AuthenticatedNextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    const parsedQuery = listProductsQuerySchema.safeParse(req.query);

    if (!parsedQuery.success) {
      return res.status(400).json({
        error: "Invalid query params.",
        details: parsedQuery.error.flatten(),
      });
    }

    try {
      const result = await listProducts(parsedQuery.data);
      return res.status(200).json(result);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "No se pudieron cargar los productos." });
    }
  }

  if (req.method === "POST") {
    if (!requireRole(req, res, [Role.ADMIN])) {
      return;
    }

    const parsedBody = createProductSchema.safeParse(req.body);

    if (!parsedBody.success) {
      return res.status(400).json({
        error: "Invalid request body.",
        details: parsedBody.error.flatten(),
      });
    }

    try {
      const product = await createProduct(parsedBody.data, req.user.id);
      return res.status(201).json({ product });
    } catch (error) {
      return handleProductMutationError(error, res, "Unable to create product.");
    }
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ error: "Method not allowed." });
}

export function handleProductMutationError(
  error: unknown,
  res: NextApiResponse,
  fallbackMessage: string,
) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return res.status(409).json({ error: "A product with this code already exists." });
    }

    if (error.code === "P2025") {
      return res.status(404).json({ error: "Product not found." });
    }

    if (error.code === "P2003") {
      return res.status(409).json({ error: "The selected category does not exist." });
    }
  }

  console.error(error);
  return res.status(500).json({ error: fallbackMessage });
}

export default withAuth(handler);

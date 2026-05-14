import type { NextApiResponse } from "next";
import { Prisma } from "@prisma/client";
import { withAuth } from "@/services/auth";
import { recordStockEntry } from "@/services/stock";
import type { AuthenticatedNextApiRequest } from "@/types/api";
import { stockMovementBodySchema } from "@/validation/stock";

async function handler(req: AuthenticatedNextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  const parsedBody = stockMovementBodySchema.safeParse(req.body);

  if (!parsedBody.success) {
    return res.status(400).json({
      error: "Invalid request body.",
      details: parsedBody.error.flatten(),
    });
  }

  try {
    const movement = await recordStockEntry(parsedBody.data, req.user.id);
    return res.status(201).json({ movement });
  } catch (error) {
    return handleStockMutationError(error, res, "Unable to record stock entry.");
  }
}

export function handleStockMutationError(
  error: unknown,
  res: NextApiResponse,
  fallbackMessage: string,
) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2003") {
      return res.status(404).json({ error: "Product or user not found." });
    }
  }

  console.error(error);
  return res.status(500).json({ error: fallbackMessage });
}

export default withAuth(handler);

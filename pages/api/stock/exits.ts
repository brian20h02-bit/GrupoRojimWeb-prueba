import type { NextApiResponse } from "next";
import { withAuth } from "@/services/auth";
import {
  InsufficientStockError,
  recordStockExit,
  StockProductNotFoundError,
} from "@/services/stock";
import type { AuthenticatedNextApiRequest } from "@/types/api";
import { stockMovementBodySchema } from "@/validation/stock";
import { handleStockMutationError } from "./entries";

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
    const movement = await recordStockExit(parsedBody.data, req.user.id);
    return res.status(201).json({ movement });
  } catch (error) {
    if (error instanceof InsufficientStockError) {
      return res.status(400).json({
        error: "Insufficient stock for this exit.",
        currentStock: error.currentStock,
      });
    }

    if (error instanceof StockProductNotFoundError) {
      return res.status(404).json({ error: "Product or user not found." });
    }

    return handleStockMutationError(error, res, "Unable to record stock exit.");
  }
}

export default withAuth(handler);

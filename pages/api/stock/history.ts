import type { NextApiResponse } from "next";
import { withAuth } from "@/services/auth";
import { listStockHistory } from "@/services/stock";
import type { AuthenticatedNextApiRequest } from "@/types/api";
import { stockHistoryQuerySchema } from "@/validation/stock";

async function handler(req: AuthenticatedNextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed." });
  }

  const parsedQuery = stockHistoryQuerySchema.safeParse(req.query);

  if (!parsedQuery.success) {
    return res.status(400).json({
      error: "Invalid query params.",
      details: parsedQuery.error.flatten(),
    });
  }

  const result = await listStockHistory(parsedQuery.data);
  return res.status(200).json(result);
}

export default withAuth(handler);

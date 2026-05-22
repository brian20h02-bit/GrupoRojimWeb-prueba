import type { NextApiResponse } from "next";
import { withAuth } from "@/services/auth";
import { getStockSummary } from "@/services/stock";
import type { AuthenticatedNextApiRequest } from "@/types/api";

async function handler(req: AuthenticatedNextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed." });
  }

  try {
    const summary = await getStockSummary();
    return res.status(200).json(summary);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "No se pudo cargar el resumen de stock." });
  }
}

export default withAuth(handler);

import type { NextApiRequest, NextApiResponse } from "next";

// Self-registration is disabled. Users are created exclusively by admins via /api/users.
export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  return res.status(404).json({ error: "Not found." });
}

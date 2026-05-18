import type { NextApiRequest, NextApiResponse } from "next";
import { signAuthToken, validateLoginCredentials } from "@/services/auth";
import { loginSchema } from "@/validation/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  const parsedBody = loginSchema.safeParse(req.body);

  if (!parsedBody.success) {
    return res.status(400).json({
      error: "Invalid request body.",
      details: parsedBody.error.flatten(),
    });
  }

  try {
    const user = await validateLoginCredentials(parsedBody.data.email, parsedBody.data.password);

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const token = signAuthToken({ id: user.id, role: user.role });

    return res.status(200).json({ user, token });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Unable to log in." });
  }
}

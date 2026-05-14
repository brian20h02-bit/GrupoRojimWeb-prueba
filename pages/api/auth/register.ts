import type { NextApiRequest, NextApiResponse } from "next";
import { Prisma } from "@prisma/client";
import { createUser, signAuthToken } from "@/services/auth";
import { registerSchema } from "@/validation/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  const parsedBody = registerSchema.safeParse(req.body);

  if (!parsedBody.success) {
    return res.status(400).json({
      error: "Invalid request body.",
      details: parsedBody.error.flatten(),
    });
  }

  try {
    const user = await createUser(parsedBody.data);
    const token = signAuthToken({ id: user.id, role: user.role });

    return res.status(201).json({ user, token });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return res.status(409).json({ error: "A user with this email already exists." });
    }

    console.error(error);
    return res.status(500).json({ error: "Unable to register user." });
  }
}

import type { NextApiResponse } from "next";
import { Prisma, Role } from "@prisma/client";
import { requireRole, withAuth } from "@/services/auth";
import {
  createManagedUser,
  deleteManagedUser,
  listUsers,
  updateManagedUser,
} from "@/services/users";
import type { AuthenticatedNextApiRequest } from "@/types/api";
import { createUserSchema, deleteUserSchema, updateUserSchema } from "@/validation/users";

async function handler(req: AuthenticatedNextApiRequest, res: NextApiResponse) {
  if (!requireRole(req, res, [Role.ADMIN])) {
    return;
  }

  if (req.method === "GET") {
    const users = await listUsers();
    return res.status(200).json({ users });
  }

  if (req.method === "POST") {
    const parsedBody = createUserSchema.safeParse(req.body);

    if (!parsedBody.success) {
      return res.status(400).json({
        error: "Invalid request body.",
        details: parsedBody.error.flatten(),
      });
    }

    try {
      const user = await createManagedUser(parsedBody.data);
      return res.status(201).json({ user });
    } catch (error) {
      return handleUserMutationError(error, res, "Unable to create user.");
    }
  }

  if (req.method === "PUT") {
    const parsedBody = updateUserSchema.safeParse(req.body);

    if (!parsedBody.success) {
      return res.status(400).json({
        error: "Invalid request body.",
        details: parsedBody.error.flatten(),
      });
    }

    try {
      const user = await updateManagedUser(parsedBody.data);
      return res.status(200).json({ user });
    } catch (error) {
      return handleUserMutationError(error, res, "Unable to update user.");
    }
  }

  if (req.method === "DELETE") {
    const parsedBody = deleteUserSchema.safeParse(req.body);

    if (!parsedBody.success) {
      return res.status(400).json({
        error: "Invalid request body.",
        details: parsedBody.error.flatten(),
      });
    }

    if (parsedBody.data.id === req.user.id) {
      return res.status(400).json({ error: "Admins cannot delete their own account." });
    }

    try {
      const user = await deleteManagedUser(parsedBody.data.id);
      return res.status(200).json({ user });
    } catch (error) {
      return handleUserMutationError(error, res, "Unable to delete user.");
    }
  }

  res.setHeader("Allow", "GET, POST, PUT, DELETE");
  return res.status(405).json({ error: "Method not allowed." });
}

function handleUserMutationError(error: unknown, res: NextApiResponse, fallbackMessage: string) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return res.status(409).json({ error: "A user with this email already exists." });
    }

    if (error.code === "P2025") {
      return res.status(404).json({ error: "User not found." });
    }

    if (error.code === "P2003") {
      return res.status(409).json({ error: "This user is linked to stock movements." });
    }
  }

  console.error(error);
  return res.status(500).json({ error: fallbackMessage });
}

export default withAuth(handler);

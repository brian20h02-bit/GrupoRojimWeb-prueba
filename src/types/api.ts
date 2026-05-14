import type { NextApiRequest } from "next";
import type { Role } from "@prisma/client";

export type AuthenticatedUser = {
  id: string;
  role: Role;
};

export type AuthenticatedNextApiRequest = NextApiRequest & {
  user: AuthenticatedUser;
};

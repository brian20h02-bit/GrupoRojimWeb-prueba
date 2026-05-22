import type { NextApiResponse } from "next";
import type { Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import type { AuthenticatedNextApiRequest, AuthenticatedUser } from "@/types/api";

const SALT_ROUNDS = 12;
const TOKEN_EXPIRES_IN = "8h";

type JwtPayload = {
  sub: string;
  role: Role;
};

type AuthenticatedNextApiHandler = (
  req: AuthenticatedNextApiRequest,
  res: NextApiResponse,
) => unknown | Promise<unknown>;

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not configured.");
  }

  return secret;
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

export function signAuthToken(user: AuthenticatedUser) {
  return jwt.sign(
    {
      role: user.role,
    },
    getJwtSecret(),
    {
      subject: user.id,
      expiresIn: TOKEN_EXPIRES_IN,
    },
  );
}

export function verifyAuthToken(token: string): AuthenticatedUser {
  const payload = jwt.verify(token, getJwtSecret()) as JwtPayload & jwt.JwtPayload;

  if (!payload.sub || !payload.role) {
    throw new Error("Invalid token payload.");
  }

  return {
    id: payload.sub,
    role: payload.role,
  };
}

export function getBearerToken(authorizationHeader?: string) {
  if (!authorizationHeader) {
    return null;
  }

  const [scheme, token] = authorizationHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return null;
  }

  return token;
}

export async function createUser(input: {
  name: string;
  email: string;
  password: string;
  role: Role;
}) {
  const passwordHash = await hashPassword(input.password);

  return prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash,
      role: input.role,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });
}

export async function validateLoginCredentials(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return null;
  }

  const isValidPassword = await verifyPassword(password, user.passwordHash);

  if (!isValidPassword) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  };
}

export function withAuth(handler: AuthenticatedNextApiHandler) {
  return async function authenticatedHandler(req: AuthenticatedNextApiRequest, res: NextApiResponse) {
    try {
      const token = getBearerToken(req.headers.authorization);

      if (!token) {
        return res.status(401).json({ error: "Authorization token is required." });
      }

      req.user = verifyAuthToken(token);

      return handler(req, res);
    } catch {
      return res.status(401).json({ error: "Invalid or expired authorization token." });
    }
  };
}

export function requireRole(req: AuthenticatedNextApiRequest, res: NextApiResponse, roles: Role[]) {
  if (!roles.includes(req.user.role)) {
    res.status(403).json({ error: "You do not have permission to perform this action." });
    return false;
  }

  return true;
}

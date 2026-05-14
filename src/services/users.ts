import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/services/auth";
import type { CreateUserInput, UpdateUserInput } from "@/validation/users";

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

export function listUsers() {
  return prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: userSelect,
  });
}

export async function createManagedUser(input: CreateUserInput) {
  const passwordHash = await hashPassword(input.password);

  return prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash,
      role: input.role,
    },
    select: userSelect,
  });
}

export async function updateManagedUser(input: UpdateUserInput) {
  const data: Prisma.UserUpdateInput = {};

  if (input.name !== undefined) {
    data.name = input.name;
  }

  if (input.email !== undefined) {
    data.email = input.email;
  }

  if (input.role !== undefined) {
    data.role = input.role;
  }

  if (input.password !== undefined) {
    data.passwordHash = await hashPassword(input.password);
  }

  return prisma.user.update({
    where: { id: input.id },
    data,
    select: userSelect,
  });
}

export function deleteManagedUser(id: string) {
  return prisma.user.delete({
    where: { id },
    select: userSelect,
  });
}

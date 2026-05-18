import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { CreateCategoryInput, UpdateCategoryInput } from "@/validation/categories";

const categorySelect = {
  id: true,
  name: true,
  slug: true,
  createdAt: true,
  _count: {
    select: {
      products: true,
    },
  },
} satisfies Prisma.CategorySelect;

export function slugifyCategoryName(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function listCategories() {
  return prisma.category.findMany({
    orderBy: { name: "asc" },
    select: categorySelect,
  });
}

export function getCategoryById(id: string) {
  return prisma.category.findUnique({
    where: { id },
    select: {
      ...categorySelect,
      products: {
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          code: true,
          active: true,
          price: true,
          brand: true,
        },
      },
    },
  });
}

export function createCategory(input: CreateCategoryInput) {
  const slug = input.slug ?? slugifyCategoryName(input.name);

  return prisma.category.create({
    data: {
      name: input.name,
      slug,
    },
    select: categorySelect,
  });
}

export function updateCategory(id: string, input: UpdateCategoryInput) {
  return prisma.category.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.slug !== undefined ? { slug: input.slug } : {}),
    },
    select: categorySelect,
  });
}

export function deleteCategory(id: string) {
  return prisma.category.delete({
    where: { id },
    select: categorySelect,
  });
}

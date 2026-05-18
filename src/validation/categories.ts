import { z } from "zod";

const slugSchema = z
  .string()
  .trim()
  .min(2, "El slug debe tener al menos 2 caracteres.")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "El slug solo puede usar minusculas, numeros y guiones.");

export const categoryIdSchema = z.object({
  id: z.string().uuid("El id de la categoria no es valido."),
});

export const createCategorySchema = z.object({
  name: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres."),
  slug: slugSchema.optional(),
});

export const updateCategorySchema = z
  .object({
    name: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres.").optional(),
    slug: slugSchema.optional(),
  })
  .refine(({ name, slug }) => name || slug, {
    message: "Debe enviar al menos un campo para actualizar.",
  });

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

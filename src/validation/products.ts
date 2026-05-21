import { z } from "zod";

const decimalStringSchema = z
  .union([z.string(), z.number()])
  .transform((value) => String(value))
  .refine((value) => /^\d+(\.\d{1,2})?$/.test(value), {
    message: "El precio debe ser un numero positivo con hasta 2 decimales.",
  });

const positiveIntSchema = z.coerce.number().int().positive();
const nonNegativeIntSchema = z.coerce.number().int().min(0);

export const productIdSchema = z.object({
  id: z.string().uuid("El id del producto no es valido."),
});

export const listProductsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().trim().optional(),
});

export const createProductSchema = z.object({
  name: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres."),
  code: z.string().trim().min(2, "El codigo debe tener al menos 2 caracteres."),
  description: z.string().trim().min(1).optional(),
  price: decimalStringSchema,
  brand: z.string().trim().min(2, "La marca debe tener al menos 2 caracteres."),
  unitPerBox: positiveIntSchema,
  stockMin: nonNegativeIntSchema.default(0),
  active: z.boolean().optional(),
  imageUrl: z.string().min(1).nullable().optional(),
  categoryId: z.string().uuid("El id de la categoria no es valido."),
});

export const updateProductSchema = z
  .object({
    name: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres.").optional(),
    code: z.string().trim().min(2, "El codigo debe tener al menos 2 caracteres.").optional(),
    description: z.string().trim().min(1).nullable().optional(),
    price: decimalStringSchema.optional(),
    brand: z.string().trim().min(2, "La marca debe tener al menos 2 caracteres.").optional(),
    unitPerBox: positiveIntSchema.optional(),
    stockMin: nonNegativeIntSchema.optional(),
    active: z.boolean().optional(),
    imageUrl: z.string().min(1).nullable().optional(),
    categoryId: z.string().uuid("El id de la categoria no es valido.").optional(),
  })
  .refine(
    ({ name, code, description, price, brand, unitPerBox, stockMin, active, imageUrl, categoryId }) =>
      name !== undefined ||
      code !== undefined ||
      description !== undefined ||
      price !== undefined ||
      brand !== undefined ||
      unitPerBox !== undefined ||
      stockMin !== undefined ||
      active !== undefined ||
      imageUrl !== undefined ||
      categoryId !== undefined,
    {
      message: "Debe enviar al menos un campo para actualizar.",
    },
  );

export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;

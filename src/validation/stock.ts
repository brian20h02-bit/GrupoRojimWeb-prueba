import { z } from "zod";

const dateSchema = z
  .string()
  .datetime("La fecha debe estar en formato ISO.")
  .optional();

export const stockMovementBodySchema = z.object({
  productId: z.string().uuid("El id del producto no es valido."),
  quantity: z.coerce.number().int().positive("La cantidad debe ser mayor a 0."),
  reason: z.string().trim().min(1).optional(),
  reference: z.string().trim().min(1).optional(),
  notes: z.string().trim().min(1).optional(),
});

export const stockHistoryQuerySchema = z
  .object({
    productId: z.string().uuid("El id del producto no es valido.").optional(),
    userId: z.string().uuid("El id del usuario no es valido.").optional(),
    from: dateSchema,
    to: dateSchema,
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(50),
  })
  .refine(
    ({ from, to }) => {
      if (!from || !to) {
        return true;
      }

      return new Date(from) <= new Date(to);
    },
    {
      message: "La fecha desde no puede ser posterior a la fecha hasta.",
    },
  );

export type StockMovementBody = z.infer<typeof stockMovementBodySchema>;
export type StockHistoryQuery = z.infer<typeof stockHistoryQuerySchema>;

import { Role } from "@prisma/client";
import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres."),
  email: z.string().trim().email("El email no es valido.").toLowerCase(),
  password: z.string().min(8, "La contrasena debe tener al menos 8 caracteres."),
  role: z.nativeEnum(Role),
});

export const updateUserSchema = z
  .object({
    id: z.string().uuid("El id del usuario no es valido."),
    name: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres.").optional(),
    email: z.string().trim().email("El email no es valido.").toLowerCase().optional(),
    password: z.string().min(8, "La contrasena debe tener al menos 8 caracteres.").optional(),
    role: z.nativeEnum(Role).optional(),
  })
  .refine(({ name, email, password, role }) => name || email || password || role, {
    message: "Debe enviar al menos un campo para actualizar.",
  });

export const deleteUserSchema = z.object({
  id: z.string().uuid("El id del usuario no es valido."),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type DeleteUserInput = z.infer<typeof deleteUserSchema>;

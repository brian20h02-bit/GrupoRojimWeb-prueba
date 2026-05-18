import { Role } from "@prisma/client";
import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres."),
  email: z.string().trim().email("El email no es valido.").toLowerCase(),
  password: z.string().min(8, "La contrasena debe tener al menos 8 caracteres."),
  role: z.nativeEnum(Role),
});

export const loginSchema = z.object({
  email: z.string().trim().email("El email no es valido.").toLowerCase(),
  password: z.string().min(1, "La contrasena es obligatoria."),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

import type { FormEvent } from "react";
import { useState } from "react";
import type { Role, UserRecord } from "@/types/auth";

export type UserFormValues = {
  name: string;
  email: string;
  password?: string;
  role: Role;
};

type UserFormModalProps = {
  user?: UserRecord;
  error: string;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (values: UserFormValues) => void;
};

const roles: Role[] = ["ADMIN", "RECEPCIONISTA", "VENDEDOR"];

export function UserFormModal({
  user,
  error,
  isSubmitting,
  onClose,
  onSubmit,
}: UserFormModalProps) {
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>(user?.role ?? "VENDEDOR");
  const [localError, setLocalError] = useState("");
  const isEditing = Boolean(user);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLocalError("");

    if (!name.trim() || !email.trim()) {
      setLocalError("Completa nombre y email.");
      return;
    }

    if (!isEditing && password.length < 8) {
      setLocalError("La contrasena debe tener al menos 8 caracteres.");
      return;
    }

    if (isEditing && password && password.length < 8) {
      setLocalError("La nueva contrasena debe tener al menos 8 caracteres.");
      return;
    }

    onSubmit({
      name: name.trim(),
      email: email.trim(),
      password: password || undefined,
      role,
    });
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-4 py-6">
      <section className="w-full max-w-xl rounded-lg bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">{isEditing ? "Editar usuario" : "Crear usuario"}</h2>
            <p className="mt-1 text-sm text-luminoa-muted">
              Define los datos de acceso y el rol dentro del panel.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-luminoa-line px-3 py-1.5 text-sm text-slate-700"
          >
            Cerrar
          </button>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <FormField label="Nombre">
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded-md border border-luminoa-line px-3 py-2 text-sm outline-none focus:border-luminoa-teal focus:ring-2 focus:ring-luminoa-teal/20"
            />
          </FormField>

          <FormField label="Email">
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-md border border-luminoa-line px-3 py-2 text-sm outline-none focus:border-luminoa-teal focus:ring-2 focus:ring-luminoa-teal/20"
            />
          </FormField>

          <FormField label={isEditing ? "Nueva contrasena opcional" : "Contrasena"}>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-md border border-luminoa-line px-3 py-2 text-sm outline-none focus:border-luminoa-teal focus:ring-2 focus:ring-luminoa-teal/20"
            />
          </FormField>

          <FormField label="Rol">
            <select
              value={role}
              onChange={(event) => setRole(event.target.value as Role)}
              className="w-full rounded-md border border-luminoa-line px-3 py-2 text-sm outline-none focus:border-luminoa-teal focus:ring-2 focus:ring-luminoa-teal/20"
            >
              {roles.map((roleOption) => (
                <option key={roleOption} value={roleOption}>
                  {roleOption}
                </option>
              ))}
            </select>
          </FormField>

          {localError || error ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {localError || error}
            </div>
          ) : null}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-luminoa-line px-4 py-2 text-sm font-medium text-slate-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-luminoa-teal px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:opacity-70"
            >
              {isSubmitting ? "Guardando..." : "Guardar usuario"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm font-medium text-slate-800">
      {label}
      <span className="mt-2 block">{children}</span>
    </label>
  );
}

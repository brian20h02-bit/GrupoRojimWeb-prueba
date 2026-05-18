import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { ApiError, apiFetch } from "@/lib/api";
import { clearSession, getStoredUser } from "@/lib/frontend-auth";
import type { UserRecord } from "@/types/auth";
import { UserFormModal, type UserFormValues } from "./UserFormModal";

type UsersResponse = {
  users: UserRecord[];
};

type UserResponse = {
  user: UserRecord;
};

export function UserManagement() {
  const router = useRouter();
  const currentUser = getStoredUser();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadUsers() {
      setIsLoading(true);
      setError("");

      try {
        const response = await apiFetch<UsersResponse>("/api/users");

        if (isMounted) {
          setUsers(response.users);
        }
      } catch (usersError) {
        if (!isMounted) {
          return;
        }

        if (usersError instanceof ApiError && usersError.status === 401) {
          clearSession();
          void router.replace("/login");
          return;
        }

        setError("No se pudieron cargar los usuarios.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadUsers();

    return () => {
      isMounted = false;
    };
  }, [router]);

  async function handleSubmit(values: UserFormValues) {
    setIsSubmitting(true);
    setFormError("");

    try {
      if (editingUser) {
        const payload = {
          id: editingUser.id,
          name: values.name,
          email: values.email,
          role: values.role,
          ...(values.password ? { password: values.password } : {}),
        };

        const response = await apiFetch<UserResponse>("/api/users", {
          method: "PUT",
          body: JSON.stringify(payload),
        });

        setUsers((current) =>
          current.map((user) => (user.id === response.user.id ? response.user : user)),
        );
      } else {
        const response = await apiFetch<UserResponse>("/api/users", {
          method: "POST",
          body: JSON.stringify(values),
        });

        setUsers((current) => [response.user, ...current]);
      }

      setIsModalOpen(false);
      setEditingUser(null);
    } catch (submitError) {
      if (submitError instanceof ApiError) {
        setFormError(submitError.message);
      } else {
        setFormError("No se pudo guardar el usuario.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(user: UserRecord) {
    const confirmed = window.confirm(`Eliminar usuario ${user.name}?`);

    if (!confirmed) {
      return;
    }

    try {
      const response = await apiFetch<UserResponse>("/api/users", {
        method: "DELETE",
        body: JSON.stringify({ id: user.id }),
      });

      setUsers((current) => current.filter((item) => item.id !== response.user.id));
    } catch (deleteError) {
      if (deleteError instanceof ApiError) {
        setError(deleteError.message);
      } else {
        setError("No se pudo eliminar el usuario.");
      }
    }
  }

  function openCreateModal() {
    setEditingUser(null);
    setFormError("");
    setIsModalOpen(true);
  }

  function openEditModal(user: UserRecord) {
    setEditingUser(user);
    setFormError("");
    setIsModalOpen(true);
  }

  return (
    <div className="space-y-5">
      <section className="flex flex-col gap-3 rounded-lg border border-luminoa-line bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Usuarios</h2>
          <p className="mt-1 text-sm text-luminoa-muted">Administra accesos y roles del panel.</p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="rounded-md bg-luminoa-teal px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800"
        >
          Crear usuario
        </button>
      </section>

      {error ? (
        <section className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </section>
      ) : null}

      {isLoading ? (
        <UsersSkeleton />
      ) : (
        <section className="overflow-hidden rounded-lg border border-luminoa-line bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-luminoa-line text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-luminoa-muted">
                <tr>
                  <th className="px-4 py-3 font-semibold">Nombre</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Rol</th>
                  <th className="px-4 py-3 font-semibold">Creado</th>
                  <th className="px-4 py-3 font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-luminoa-line">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">{user.name}</td>
                    <td className="whitespace-nowrap px-4 py-3">{user.email}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                        {user.role}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-luminoa-muted">
                      {new Intl.DateTimeFormat("es-AR", { dateStyle: "short" }).format(
                        new Date(user.createdAt),
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(user)}
                          className="rounded-md border border-luminoa-line px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(user)}
                          disabled={currentUser?.id === user.id}
                          className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {isModalOpen ? (
        <UserFormModal
          user={editingUser ?? undefined}
          error={formError}
          isSubmitting={isSubmitting}
          onClose={() => {
            setIsModalOpen(false);
            setEditingUser(null);
          }}
          onSubmit={handleSubmit}
        />
      ) : null}
    </div>
  );
}

function UsersSkeleton() {
  return (
    <div className="space-y-3 rounded-lg border border-luminoa-line bg-white p-4">
      {[0, 1, 2, 3].map((item) => (
        <div key={item} className="grid animate-pulse gap-3 md:grid-cols-5">
          <div className="h-5 rounded bg-slate-200" />
          <div className="h-5 rounded bg-slate-200 md:col-span-2" />
          <div className="h-5 rounded bg-slate-200" />
          <div className="h-5 rounded bg-slate-200" />
        </div>
      ))}
    </div>
  );
}

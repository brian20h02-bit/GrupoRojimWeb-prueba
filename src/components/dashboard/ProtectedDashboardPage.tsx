import { useRouter } from "next/router";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { getStoredToken, getStoredUser, isRoleAllowed } from "@/lib/frontend-auth";
import type { CurrentUser, Role } from "@/types/auth";
import { DashboardLayout } from "./DashboardLayout";

type ProtectedDashboardPageProps = {
  title: string;
  allowedRoles?: Role[];
  children: ReactNode;
};

const DEFAULT_ALLOWED_ROLES: Role[] = ["ADMIN", "RECEPCIONISTA", "VENDEDOR"];

export function ProtectedDashboardPage({
  title,
  allowedRoles = DEFAULT_ALLOWED_ROLES,
  children,
}: ProtectedDashboardPageProps) {
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [status, setStatus] = useState<"checking" | "ready" | "forbidden">("checking");

  const canRender = useMemo(() => status === "ready" && user !== null, [status, user]);
  const allowedRoleKey = allowedRoles.join("|");

  useEffect(() => {
    const token = getStoredToken();
    const storedUser = getStoredUser();

    if (!token || !storedUser) {
      void router.replace("/login");
      return;
    }

    if (!isRoleAllowed(storedUser.role, allowedRoles)) {
      setUser(storedUser);
      setStatus("forbidden");
      return;
    }

    setUser(storedUser);
    setStatus("ready");
  }, [allowedRoleKey, allowedRoles, router]);

  if (status === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-luminoa-panel px-4 text-sm text-luminoa-muted">
        Verificando sesion...
      </div>
    );
  }

  if (status === "forbidden" && user) {
    return (
      <DashboardLayout title="Acceso restringido" user={user}>
        <section className="rounded-lg border border-luminoa-line bg-white p-6">
          <h2 className="text-lg font-semibold">No tenes permisos para ver esta seccion.</h2>
          <p className="mt-2 text-sm text-luminoa-muted">
            Tu rol actual no tiene acceso a esta ruta del panel.
          </p>
        </section>
      </DashboardLayout>
    );
  }

  if (!canRender || !user) {
    return null;
  }

  return (
    <DashboardLayout title={title} user={user}>
      {children}
    </DashboardLayout>
  );
}

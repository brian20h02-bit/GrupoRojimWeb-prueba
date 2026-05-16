import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { ApiError, apiFetch } from "@/lib/api";
import { clearSession, getStoredUser } from "@/lib/frontend-auth";
import type { Role } from "@/types/auth";
import type { StockHistoryResponse, StockMovement, StockSummaryResponse } from "@/types/inventory";
import { SummaryCard } from "./SummaryCard";

const quickActionsByRole: Record<Role, Array<{ label: string; href: string; description: string }>> = {
  ADMIN: [
    { label: "Nueva entrada", href: "/dashboard/entradas", description: "Registrar ingreso de mercaderia." },
    { label: "Nueva salida", href: "/dashboard/salidas", description: "Registrar retiro o venta." },
    { label: "Ver productos", href: "/dashboard/productos", description: "Consultar catalogo interno." },
    { label: "Gestionar usuarios", href: "/dashboard/usuarios", description: "Administrar accesos y roles." },
  ],
  RECEPCIONISTA: [
    { label: "Nueva entrada", href: "/dashboard/entradas", description: "Registrar mercaderia recibida." },
    { label: "Ver stock", href: "/dashboard/stock", description: "Controlar disponibilidad." },
    { label: "Ver historial", href: "/dashboard/historial", description: "Consultar movimientos." },
  ],
  VENDEDOR: [
    { label: "Nueva salida", href: "/dashboard/salidas", description: "Registrar una salida por venta." },
    { label: "Ver productos", href: "/dashboard/productos", description: "Buscar articulos disponibles." },
    { label: "Ver stock", href: "/dashboard/stock", description: "Revisar niveles actuales." },
  ],
};

export function DashboardHome() {
  const router = useRouter();
  const [summary, setSummary] = useState<StockSummaryResponse | null>(null);
  const [history, setHistory] = useState<StockMovement[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const user = getStoredUser();

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      setIsLoading(true);
      setError("");

      try {
        const [summaryResponse, historyResponse] = await Promise.all([
          apiFetch<StockSummaryResponse>("/api/stock/summary"),
          apiFetch<StockHistoryResponse>("/api/stock/history?limit=5"),
        ]);

        if (!isMounted) {
          return;
        }

        setSummary(summaryResponse);
        setHistory(historyResponse.movements);
      } catch (dashboardError) {
        if (!isMounted) {
          return;
        }

        if (dashboardError instanceof ApiError && dashboardError.status === 401) {
          clearSession();
          void router.replace("/login");
          return;
        }

        setError("No se pudo cargar el resumen del panel.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadDashboard();

    return () => {
      isMounted = false;
    };
  }, [router]);

  const metrics = useMemo(() => {
    const products = summary?.products ?? [];
    const totalStock = products.reduce((total, product) => total + product.stock, 0);
    const outOfStock = products.filter((product) => product.stock === 0).length;

    return {
      totalProducts: products.length,
      belowMinimum: summary?.belowMinimum.length ?? 0,
      outOfStock,
      totalStock,
    };
  }, [summary]);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <section className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm text-red-700">
        {error}
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Total de productos"
          value={metrics.totalProducts}
          detail="Productos activos en inventario"
        />
        <SummaryCard
          label="Bajo stock"
          value={metrics.belowMinimum}
          detail="Productos debajo del minimo"
        />
        <SummaryCard
          label="Sin stock"
          value={metrics.outOfStock}
          detail="Productos con stock actual cero"
        />
        <SummaryCard
          label="Stock total"
          value={metrics.totalStock}
          detail="Unidades disponibles"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
        <div className="rounded-lg border border-luminoa-line bg-white p-5">
          <h2 className="text-lg font-semibold">Accesos rapidos</h2>
          <div className="mt-4 grid gap-3">
            {(user ? quickActionsByRole[user.role] : []).map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="rounded-md border border-luminoa-line p-4 transition hover:border-luminoa-teal hover:bg-teal-50"
              >
                <p className="font-medium text-luminoa-ink">{action.label}</p>
                <p className="mt-1 text-sm text-luminoa-muted">{action.description}</p>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-luminoa-line bg-white p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Ultimos movimientos</h2>
            <Link href="/dashboard/historial" className="text-sm font-medium text-luminoa-teal">
              Ver historial
            </Link>
          </div>

          <div className="mt-4 divide-y divide-luminoa-line">
            {history.length > 0 ? (
              history.map((movement) => <MovementRow key={movement.id} movement={movement} />)
            ) : (
              <p className="py-6 text-sm text-luminoa-muted">Todavia no hay movimientos registrados.</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function MovementRow({ movement }: { movement: StockMovement }) {
  const isEntry = movement.type === "ENTRADA";

  return (
    <div className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-medium text-slate-800">{movement.product.name}</p>
        <p className="text-sm text-luminoa-muted">
          {movement.product.code} · {movement.user.name}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
            isEntry ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
          }`}
        >
          {isEntry ? "Entrada" : "Salida"}
        </span>
        <span className="text-sm font-semibold text-slate-800">
          {isEntry ? "+" : ""}
          {movement.quantity}
        </span>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="h-32 animate-pulse rounded-lg border border-luminoa-line bg-white p-5">
            <div className="h-4 w-28 rounded bg-slate-200" />
            <div className="mt-5 h-8 w-16 rounded bg-slate-200" />
            <div className="mt-4 h-4 w-36 rounded bg-slate-200" />
          </div>
        ))}
      </section>
      <div className="h-64 animate-pulse rounded-lg border border-luminoa-line bg-white" />
    </div>
  );
}

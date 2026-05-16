import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { ApiError, apiFetch } from "@/lib/api";
import { clearSession, getStoredUser } from "@/lib/frontend-auth";
import type {
  ProductListResponse,
  ProductSummary,
  StockHistoryResponse,
  StockMovement,
} from "@/types/inventory";
import type { CurrentUser } from "@/types/auth";

type MovementTypeFilter = "" | "ENTRADA" | "SALIDA";

type UsersResponse = {
  users: CurrentUser[];
};

export function MovementHistory() {
  const router = useRouter();
  const currentUser = getStoredUser();
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [users, setUsers] = useState<CurrentUser[]>([]);
  const [productId, setProductId] = useState("");
  const [userId, setUserId] = useState("");
  const [type, setType] = useState<MovementTypeFilter>("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<StockHistoryResponse["pagination"] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const canFilterUsers = currentUser?.role === "ADMIN";

  const historyQuery = useMemo(() => {
    const params = new URLSearchParams({
      page: String(page),
      limit: "20",
    });

    if (productId) {
      params.set("productId", productId);
    }

    if (type) {
      params.set("type", type);
    }

    if (canFilterUsers && userId) {
      params.set("userId", userId);
    }

    if (fromDate) {
      params.set("from", `${fromDate}T00:00:00.000Z`);
    }

    if (toDate) {
      params.set("to", `${toDate}T23:59:59.999Z`);
    }

    return params.toString();
  }, [canFilterUsers, fromDate, page, productId, toDate, type, userId]);

  useEffect(() => {
    let isMounted = true;

    async function loadFilters() {
      try {
        const productsResponse = await apiFetch<ProductListResponse>("/api/products?limit=100");

        if (!isMounted) {
          return;
        }

        setProducts(productsResponse.products);

        if (canFilterUsers) {
          const usersResponse = await apiFetch<UsersResponse>("/api/users");

          if (isMounted) {
            setUsers(usersResponse.users);
          }
        }
      } catch (filtersError) {
        if (filtersError instanceof ApiError && filtersError.status === 401) {
          clearSession();
          void router.replace("/login");
        }
      }
    }

    void loadFilters();

    return () => {
      isMounted = false;
    };
  }, [canFilterUsers, router]);

  useEffect(() => {
    let isMounted = true;

    async function loadHistory() {
      setIsLoading(true);
      setError("");

      try {
        const response = await apiFetch<StockHistoryResponse>(`/api/stock/history?${historyQuery}`);

        if (!isMounted) {
          return;
        }

        setMovements(response.movements);
        setPagination(response.pagination);
      } catch (historyError) {
        if (!isMounted) {
          return;
        }

        if (historyError instanceof ApiError && historyError.status === 401) {
          clearSession();
          void router.replace("/login");
          return;
        }

        setError("No se pudo cargar el historial de movimientos.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadHistory();

    return () => {
      isMounted = false;
    };
  }, [historyQuery, router]);

  function resetFilters() {
    setProductId("");
    setUserId("");
    setType("");
    setFromDate("");
    setToDate("");
    setPage(1);
  }

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-luminoa-line bg-white p-4">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <FilterField label="Producto">
            <select
              value={productId}
              onChange={(event) => {
                setProductId(event.target.value);
                setPage(1);
              }}
              className="w-full rounded-md border border-luminoa-line px-3 py-2 text-sm outline-none focus:border-luminoa-teal focus:ring-2 focus:ring-luminoa-teal/20"
            >
              <option value="">Todos</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.code} - {product.name}
                </option>
              ))}
            </select>
          </FilterField>

          <FilterField label="Tipo">
            <select
              value={type}
              onChange={(event) => {
                setType(event.target.value as MovementTypeFilter);
                setPage(1);
              }}
              className="w-full rounded-md border border-luminoa-line px-3 py-2 text-sm outline-none focus:border-luminoa-teal focus:ring-2 focus:ring-luminoa-teal/20"
            >
              <option value="">Todos</option>
              <option value="ENTRADA">Entrada</option>
              <option value="SALIDA">Salida</option>
            </select>
          </FilterField>

          <FilterField label="Desde">
            <input
              type="date"
              value={fromDate}
              onChange={(event) => {
                setFromDate(event.target.value);
                setPage(1);
              }}
              className="w-full rounded-md border border-luminoa-line px-3 py-2 text-sm outline-none focus:border-luminoa-teal focus:ring-2 focus:ring-luminoa-teal/20"
            />
          </FilterField>

          <FilterField label="Hasta">
            <input
              type="date"
              value={toDate}
              onChange={(event) => {
                setToDate(event.target.value);
                setPage(1);
              }}
              className="w-full rounded-md border border-luminoa-line px-3 py-2 text-sm outline-none focus:border-luminoa-teal focus:ring-2 focus:ring-luminoa-teal/20"
            />
          </FilterField>

          {canFilterUsers ? (
            <FilterField label="Usuario">
              <select
                value={userId}
                onChange={(event) => {
                  setUserId(event.target.value);
                  setPage(1);
                }}
                className="w-full rounded-md border border-luminoa-line px-3 py-2 text-sm outline-none focus:border-luminoa-teal focus:ring-2 focus:ring-luminoa-teal/20"
              >
                <option value="">Todos</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </FilterField>
          ) : null}

          <div className="flex items-end">
            <button
              type="button"
              onClick={resetFilters}
              className="w-full rounded-md border border-luminoa-line px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Limpiar
            </button>
          </div>
        </div>
      </section>

      {error ? (
        <section className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </section>
      ) : null}

      {isLoading ? (
        <HistorySkeleton />
      ) : (
        <section className="overflow-hidden rounded-lg border border-luminoa-line bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-luminoa-line text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-luminoa-muted">
                <tr>
                  <th className="px-4 py-3 font-semibold">Fecha</th>
                  <th className="px-4 py-3 font-semibold">Producto</th>
                  <th className="px-4 py-3 font-semibold">Codigo</th>
                  <th className="px-4 py-3 font-semibold">Tipo</th>
                  <th className="px-4 py-3 font-semibold">Cantidad</th>
                  <th className="px-4 py-3 font-semibold">Usuario</th>
                  <th className="px-4 py-3 font-semibold">Motivo</th>
                  <th className="px-4 py-3 font-semibold">Referencia</th>
                  <th className="px-4 py-3 font-semibold">Observaciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-luminoa-line">
                {movements.length > 0 ? (
                  movements.map((movement) => (
                    <MovementRow key={movement.id} movement={movement} />
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-luminoa-muted">
                      No hay movimientos para los filtros seleccionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {pagination ? (
        <div className="flex flex-col gap-3 rounded-lg border border-luminoa-line bg-white p-4 text-sm text-luminoa-muted sm:flex-row sm:items-center sm:justify-between">
          <span>
            Pagina {pagination.page} de {Math.max(pagination.pages, 1)} · {pagination.total} movimientos
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(current - 1, 1))}
              disabled={pagination.page <= 1 || isLoading}
              className="rounded-md border border-luminoa-line px-3 py-2 font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Anterior
            </button>
            <button
              type="button"
              onClick={() => setPage((current) => current + 1)}
              disabled={pagination.page >= pagination.pages || isLoading}
              className="rounded-md border border-luminoa-line px-3 py-2 font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MovementRow({ movement }: { movement: StockMovement }) {
  const isEntry = movement.type === "ENTRADA";

  return (
    <tr>
      <td className="whitespace-nowrap px-4 py-3 text-luminoa-muted">
        {new Intl.DateTimeFormat("es-AR", {
          dateStyle: "short",
          timeStyle: "short",
        }).format(new Date(movement.createdAt))}
      </td>
      <td className="min-w-52 px-4 py-3 font-medium text-slate-900">{movement.product.name}</td>
      <td className="whitespace-nowrap px-4 py-3">{movement.product.code}</td>
      <td className="whitespace-nowrap px-4 py-3">
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
            isEntry ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
          }`}
        >
          {isEntry ? "Entrada" : "Salida"}
        </span>
      </td>
      <td className={`whitespace-nowrap px-4 py-3 font-semibold ${isEntry ? "text-green-700" : "text-orange-700"}`}>
        {isEntry ? "+" : ""}
        {movement.quantity}
      </td>
      <td className="whitespace-nowrap px-4 py-3">{movement.user.name}</td>
      <td className="min-w-36 px-4 py-3">{movement.reason ?? "-"}</td>
      <td className="min-w-36 px-4 py-3">{movement.reference ?? "-"}</td>
      <td className="min-w-48 px-4 py-3">{movement.notes ?? "-"}</td>
    </tr>
  );
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm font-medium text-slate-800">
      {label}
      <span className="mt-2 block">{children}</span>
    </label>
  );
}

function HistorySkeleton() {
  return (
    <div className="space-y-3 rounded-lg border border-luminoa-line bg-white p-4">
      {[0, 1, 2, 3, 4, 5].map((item) => (
        <div key={item} className="grid animate-pulse gap-3 md:grid-cols-6">
          <div className="h-5 rounded bg-slate-200" />
          <div className="h-5 rounded bg-slate-200 md:col-span-2" />
          <div className="h-5 rounded bg-slate-200" />
          <div className="h-5 rounded bg-slate-200" />
          <div className="h-5 rounded bg-slate-200" />
        </div>
      ))}
    </div>
  );
}

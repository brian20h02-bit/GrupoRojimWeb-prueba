import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { ApiError, apiFetch } from "@/lib/api";
import { clearSession } from "@/lib/frontend-auth";
import type { ProductSummary, StockSummaryResponse } from "@/types/inventory";
import { StockBadge } from "@/components/products/StockBadge";
import { SummaryCard } from "@/components/dashboard/SummaryCard";

type StockFilter = "all" | "below-minimum" | "empty";

export function StockOverview() {
  const router = useRouter();
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [belowMinimumCount, setBelowMinimumCount] = useState(0);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<StockFilter>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadStock() {
      setIsLoading(true);
      setError("");

      try {
        const response = await apiFetch<StockSummaryResponse>("/api/stock/summary");

        if (!isMounted) {
          return;
        }

        setProducts(response.products);
        setBelowMinimumCount(response.belowMinimum.length);
      } catch (stockError) {
        if (!isMounted) {
          return;
        }

        if (stockError instanceof ApiError && stockError.status === 401) {
          clearSession();
          void router.replace("/login");
          return;
        }

        setError("No se pudo cargar el resumen de stock.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadStock();

    return () => {
      isMounted = false;
    };
  }, [router]);

  const metrics = useMemo(() => {
    const totalStock = products.reduce((total, product) => total + product.stock, 0);
    const emptyStock = products.filter((product) => product.stock === 0).length;

    return {
      totalProducts: products.length,
      totalStock,
      belowMinimum: belowMinimumCount,
      emptyStock,
    };
  }, [belowMinimumCount, products]);

  const filteredProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch =
        !normalizedSearch ||
        product.name.toLowerCase().includes(normalizedSearch) ||
        product.code.toLowerCase().includes(normalizedSearch) ||
        product.brand.toLowerCase().includes(normalizedSearch);

      const matchesFilter =
        filter === "all" ||
        (filter === "below-minimum" && product.stock > 0 && product.stock < product.stockMin) ||
        (filter === "empty" && product.stock === 0);

      return matchesSearch && matchesFilter;
    });
  }, [filter, products, search]);

  if (isLoading) {
    return <StockSkeleton />;
  }

  if (error) {
    return (
      <section className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error}
      </section>
    );
  }

  return (
    <div className="space-y-5">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Productos activos" value={metrics.totalProducts} detail="Incluidos en stock" />
        <SummaryCard label="Stock total" value={metrics.totalStock} detail="Unidades disponibles" />
        <SummaryCard label="Bajo stock" value={metrics.belowMinimum} detail="Debajo del minimo" />
        <SummaryCard label="Sin stock" value={metrics.emptyStock} detail="Stock actual en cero" />
      </section>

      <section className="rounded-lg border border-luminoa-line bg-white p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="w-full lg:max-w-md">
            <label htmlFor="stock-search" className="block text-sm font-medium text-slate-800">
              Buscar
            </label>
            <input
              id="stock-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="mt-2 block w-full rounded-md border border-luminoa-line px-3 py-2 text-sm outline-none transition focus:border-luminoa-teal focus:ring-2 focus:ring-luminoa-teal/20"
              placeholder="Codigo, producto o marca"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <FilterButton active={filter === "all"} onClick={() => setFilter("all")}>
              Todos
            </FilterButton>
            <FilterButton active={filter === "below-minimum"} onClick={() => setFilter("below-minimum")}>
              Bajo stock
            </FilterButton>
            <FilterButton active={filter === "empty"} onClick={() => setFilter("empty")}>
              Sin stock
            </FilterButton>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-luminoa-line bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-luminoa-line text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-luminoa-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">Codigo</th>
                <th className="px-4 py-3 font-semibold">Producto</th>
                <th className="px-4 py-3 font-semibold">Categoria</th>
                <th className="px-4 py-3 font-semibold">Stock actual</th>
                <th className="px-4 py-3 font-semibold">Stock minimo</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-luminoa-line">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <tr key={product.id}>
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-800">{product.code}</td>
                    <td className="min-w-56 px-4 py-3">
                      <p className="font-medium text-slate-900">{product.name}</p>
                      <p className="mt-1 text-xs text-luminoa-muted">{product.brand}</p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">{product.category.name}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-base font-semibold text-slate-900">
                      {product.stock}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">{product.stockMin}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <StockBadge stock={product.stock} stockMin={product.stockMin} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-luminoa-muted">
                    No hay productos que coincidan con los filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md px-3 py-2 text-sm font-medium transition ${
        active
          ? "bg-luminoa-teal text-white"
          : "border border-luminoa-line bg-white text-slate-700 hover:bg-slate-100"
      }`}
    >
      {children}
    </button>
  );
}

function StockSkeleton() {
  return (
    <div className="space-y-5">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="h-32 animate-pulse rounded-lg border border-luminoa-line bg-white p-5">
            <div className="h-4 w-28 rounded bg-slate-200" />
            <div className="mt-5 h-8 w-16 rounded bg-slate-200" />
            <div className="mt-4 h-4 w-36 rounded bg-slate-200" />
          </div>
        ))}
      </section>
      <div className="h-96 animate-pulse rounded-lg border border-luminoa-line bg-white" />
    </div>
  );
}

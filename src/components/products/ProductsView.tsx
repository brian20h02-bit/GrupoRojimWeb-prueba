import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { ApiError, apiFetch } from "@/lib/api";
import { clearSession, getStoredUser } from "@/lib/frontend-auth";
import type {
  CategoryListResponse,
  CategorySummary,
  ProductListResponse,
  ProductSummary,
} from "@/types/inventory";
import { ProductFilters } from "./ProductFilters";
import { ProductFormModal, type ProductFormValues } from "./ProductFormModal";
import { ProductTable } from "./ProductTable";

export function ProductsView() {
  const router = useRouter();
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [pagination, setPagination] = useState<ProductListResponse["pagination"] | null>(null);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductSummary | null>(null);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const user = getStoredUser();
  const canManage = user?.role === "ADMIN";

  const query = useMemo(() => {
    const params = new URLSearchParams({
      page: String(page),
      limit: "10",
    });

    if (appliedSearch) {
      params.set("search", appliedSearch);
    }

    return params.toString();
  }, [appliedSearch, page]);

  useEffect(() => {
    let isMounted = true;

    async function loadProducts() {
      setIsLoading(true);
      setError("");

      try {
        const [productsResponse, categoriesResponse] = await Promise.all([
          apiFetch<ProductListResponse>(`/api/products?${query}`),
          apiFetch<CategoryListResponse>("/api/categories"),
        ]);

        if (!isMounted) {
          return;
        }

        setProducts(productsResponse.products);
        setPagination(productsResponse.pagination);
        setCategories(categoriesResponse.categories);
      } catch (productsError) {
        if (!isMounted) {
          return;
        }

        if (productsError instanceof ApiError && productsError.status === 401) {
          clearSession();
          void router.replace("/login");
          return;
        }

        setError("No se pudieron cargar los productos.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadProducts();

    return () => {
      isMounted = false;
    };
  }, [query, router]);

  function handleSearchSubmit() {
    setPage(1);
    setAppliedSearch(search.trim());
  }

  function handleOpenCreate() {
    setEditingProduct(null);
    setFormError("");
    setIsModalOpen(true);
  }

  function handleOpenEdit(product: ProductSummary) {
    setEditingProduct(product);
    setFormError("");
    setIsModalOpen(true);
  }

  function handleCloseModal() {
    setIsModalOpen(false);
    setEditingProduct(null);
  }

  async function handleCreateProduct(values: ProductFormValues) {
    setIsSubmitting(true);
    setFormError("");

    try {
      await apiFetch<{ product: ProductSummary }>("/api/products", {
        method: "POST",
        body: JSON.stringify(values),
      });

      setIsModalOpen(false);
      setEditingProduct(null);
      setPage(1);
      setAppliedSearch("");
      setSearch("");
    } catch (createError) {
      if (createError instanceof ApiError) {
        setFormError(createError.message);
      } else {
        setFormError("No se pudo crear el producto.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleEditProduct(values: ProductFormValues) {
    if (!editingProduct) return;
    setIsSubmitting(true);
    setFormError("");

    try {
      const updated = await apiFetch<{ product: ProductSummary }>(`/api/products/${editingProduct.id}`, {
        method: "PUT",
        body: JSON.stringify(values),
      });

      setProducts((current) =>
        current.map((item) => (item.id === editingProduct.id ? updated.product : item)),
      );
      setIsModalOpen(false);
      setEditingProduct(null);
    } catch (editError) {
      if (editError instanceof ApiError) {
        setFormError(editError.message);
      } else {
        setFormError("No se pudo actualizar el producto.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeactivateProduct(product: ProductSummary) {
    const shouldDeactivate = window.confirm(`¿Deshabilitar ${product.name}?`);

    if (!shouldDeactivate) {
      return;
    }

    try {
      await apiFetch<{ product: ProductSummary }>(`/api/products/${product.id}`, {
        method: "PUT",
        body: JSON.stringify({ active: false }),
      });

      setProducts((current) =>
        current.map((item) => (item.id === product.id ? { ...item, active: false } : item)),
      );
    } catch (deactivateError) {
      if (deactivateError instanceof ApiError) {
        setError(deactivateError.message);
      } else {
        setError("No se pudo deshabilitar el producto.");
      }
    }
  }

  async function handleReactivateProduct(product: ProductSummary) {
    const shouldReactivate = window.confirm(`¿Habilitar ${product.name} nuevamente?`);

    if (!shouldReactivate) {
      return;
    }

    try {
      const data = await apiFetch<{ product: ProductSummary }>(`/api/products/${product.id}`, {
        method: "PATCH",
      });

      setProducts((current) =>
        current.map((item) => (item.id === product.id ? data.product : item)),
      );
    } catch (reactivateError) {
      if (reactivateError instanceof ApiError) {
        setError(reactivateError.message);
      } else {
        setError("No se pudo habilitar el producto.");
      }
    }
  }

  async function handleDeleteProduct(product: ProductSummary) {
    const confirmed = window.confirm(
      `¿Eliminar permanentemente ${product.name}?\nEsta acción no se puede deshacer y borrará todo el historial de stock.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await apiFetch(`/api/products/${product.id}`, {
        method: "DELETE",
      });

      setProducts((current) => current.filter((item) => item.id !== product.id));
    } catch (deleteError) {
      if (deleteError instanceof ApiError) {
        setError(deleteError.message);
      } else {
        setError("No se pudo eliminar el producto.");
      }
    }
  }

  return (
    <div className="space-y-5">
      <ProductFilters
        search={search}
        onSearchChange={setSearch}
        onSubmit={handleSearchSubmit}
        canCreate={Boolean(canManage)}
        onCreate={handleOpenCreate}
      />

      {error ? (
        <section className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </section>
      ) : null}

      {isLoading ? <ProductsSkeleton /> : <ProductTable products={products} canManage={Boolean(canManage)} onEdit={handleOpenEdit} onDeactivate={handleDeactivateProduct} onReactivate={handleReactivateProduct} onDelete={handleDeleteProduct} />}

      {pagination ? (
        <div className="flex flex-col gap-3 rounded-lg border border-luminoa-line bg-white p-4 text-sm text-luminoa-muted sm:flex-row sm:items-center sm:justify-between">
          <span>
            Pagina {pagination.page} de {Math.max(pagination.pages, 1)} · {pagination.total} productos
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

      {isModalOpen ? (
        <ProductFormModal
          categories={categories}
          isSubmitting={isSubmitting}
          error={formError}
          initialProduct={editingProduct ?? undefined}
          onClose={handleCloseModal}
          onSubmit={editingProduct ? handleEditProduct : handleCreateProduct}
        />
      ) : null}
    </div>
  );
}

function ProductsSkeleton() {
  return (
    <div className="space-y-3 rounded-lg border border-luminoa-line bg-white p-4">
      {[0, 1, 2, 3, 4].map((item) => (
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

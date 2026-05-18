import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { ApiError, apiFetch } from "@/lib/api";
import { clearSession } from "@/lib/frontend-auth";
import type { ProductListResponse, ProductSummary, StockMovement } from "@/types/inventory";
import { StockBadge } from "@/components/products/StockBadge";

export function StockExitForm() {
  const router = useRouter();
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [search, setSearch] = useState("");
  const [quantity, setQuantity] = useState("");
  const [customer, setCustomer] = useState("");
  const [reason, setReason] = useState("VENTA");
  const [notes, setNotes] = useState("");
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === selectedProductId) ?? null,
    [products, selectedProductId],
  );

  const parsedQuantity = Number(quantity);
  const validQuantity = Number.isFinite(parsedQuantity) && parsedQuantity > 0 ? parsedQuantity : 0;
  const resultingStock = selectedProduct ? selectedProduct.stock - validQuantity : 0;
  const exceedsStock = Boolean(selectedProduct && validQuantity > selectedProduct.stock);
  const willBeBelowMinimum = Boolean(
    selectedProduct && resultingStock >= 0 && resultingStock < selectedProduct.stockMin,
  );

  useEffect(() => {
    let isMounted = true;

    async function loadProducts() {
      setIsLoadingProducts(true);
      setError("");

      try {
        const response = await apiFetch<ProductListResponse>("/api/products?limit=100");

        if (!isMounted) {
          return;
        }

        setProducts(response.products.filter((product) => product.active));
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
          setIsLoadingProducts(false);
        }
      }
    }

    void loadProducts();

    return () => {
      isMounted = false;
    };
  }, [router]);

  const filteredProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
      return products;
    }

    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(normalizedSearch) ||
        product.code.toLowerCase().includes(normalizedSearch),
    );
  }, [products, search]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!selectedProduct) {
      setError("Selecciona un producto.");
      return;
    }

    if (!validQuantity) {
      setError("Ingresa una cantidad mayor a 0.");
      return;
    }

    if (exceedsStock) {
      setError("La cantidad supera el stock disponible.");
      return;
    }

    setIsSubmitting(true);

    try {
      await apiFetch<{ movement: StockMovement }>("/api/stock/exits", {
        method: "POST",
        body: JSON.stringify({
          productId: selectedProduct.id,
          quantity: validQuantity,
          reason: reason.trim() || "VENTA",
          reference: customer.trim() || undefined,
          notes: notes.trim() || undefined,
        }),
      });

      setSuccess(`Salida registrada para ${selectedProduct.name}.`);
      setProducts((current) =>
        current.map((product) =>
          product.id === selectedProduct.id
            ? { ...product, stock: product.stock - validQuantity }
            : product,
        ),
      );
      setSelectedProductId("");
      setSearch("");
      setQuantity("");
      setCustomer("");
      setReason("VENTA");
      setNotes("");
    } catch (exitError) {
      if (exitError instanceof ApiError) {
        setError(
          exitError.status === 400
            ? "No hay stock suficiente para registrar esta salida."
            : exitError.message,
        );
      } else {
        setError("No se pudo registrar la salida.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
      <section className="rounded-lg border border-luminoa-line bg-white p-5">
        <h2 className="text-lg font-semibold">Registrar salida</h2>
        <p className="mt-1 text-sm text-luminoa-muted">
          Registra una salida de mercaderia sin facturacion ni comprobantes.
        </p>

        <form className="mt-5 space-y-5" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="exit-search" className="block text-sm font-medium text-slate-800">
              Producto
            </label>
            <input
              id="exit-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="mt-2 block w-full rounded-md border border-luminoa-line px-3 py-2 text-sm outline-none transition focus:border-luminoa-teal focus:ring-2 focus:ring-luminoa-teal/20"
              placeholder="Buscar por codigo o nombre"
            />
            <div className="mt-3 max-h-72 overflow-y-auto rounded-md border border-luminoa-line">
              {isLoadingProducts ? (
                <p className="p-4 text-sm text-luminoa-muted">Cargando productos...</p>
              ) : filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => {
                      setSelectedProductId(product.id);
                      setSearch(`${product.code} - ${product.name}`);
                    }}
                    className={`block w-full border-b border-luminoa-line px-4 py-3 text-left text-sm last:border-b-0 hover:bg-slate-50 ${
                      selectedProductId === product.id ? "bg-teal-50" : "bg-white"
                    }`}
                  >
                    <span className="font-medium text-slate-900">{product.code}</span>
                    <span className="ml-2 text-slate-700">{product.name}</span>
                    <span className="ml-2 text-xs text-luminoa-muted">Stock {product.stock}</span>
                  </button>
                ))
              ) : (
                <p className="p-4 text-sm text-luminoa-muted">No hay productos para esa busqueda.</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Cantidad">
              <input
                type="number"
                min="1"
                step="1"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                className="w-full rounded-md border border-luminoa-line px-3 py-2 text-sm outline-none transition focus:border-luminoa-teal focus:ring-2 focus:ring-luminoa-teal/20"
              />
            </FormField>

            <FormField label="Cliente opcional">
              <input
                value={customer}
                onChange={(event) => setCustomer(event.target.value)}
                className="w-full rounded-md border border-luminoa-line px-3 py-2 text-sm outline-none transition focus:border-luminoa-teal focus:ring-2 focus:ring-luminoa-teal/20"
              />
            </FormField>

            <FormField label="Motivo">
              <input
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                className="w-full rounded-md border border-luminoa-line px-3 py-2 text-sm outline-none transition focus:border-luminoa-teal focus:ring-2 focus:ring-luminoa-teal/20"
              />
            </FormField>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-800">Observaciones</label>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={3}
                className="mt-2 w-full rounded-md border border-luminoa-line px-3 py-2 text-sm outline-none transition focus:border-luminoa-teal focus:ring-2 focus:ring-luminoa-teal/20"
              />
            </div>
          </div>

          {exceedsStock ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              La cantidad supera el stock disponible.
            </div>
          ) : null}

          {willBeBelowMinimum ? (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Esta salida dejara el producto por debajo del stock minimo.
            </div>
          ) : null}

          {error ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {success ? (
            <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
              {success}{" "}
              <Link href="/dashboard/historial" className="font-semibold underline">
                Ver historial
              </Link>
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting || exceedsStock}
            className="rounded-md bg-luminoa-teal px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Registrando..." : "Registrar salida"}
          </button>
        </form>
      </section>

      <aside className="rounded-lg border border-luminoa-line bg-white p-5">
        <h2 className="text-lg font-semibold">Confirmacion</h2>
        {selectedProduct ? (
          <div className="mt-5 space-y-4">
            <div>
              <p className="text-sm text-luminoa-muted">Producto</p>
              <p className="font-semibold text-slate-900">{selectedProduct.name}</p>
              <p className="text-sm text-luminoa-muted">{selectedProduct.code}</p>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <StockValue label="Stock actual" value={selectedProduct.stock} />
              <StockValue label="Salida" value={validQuantity} />
              <StockValue label="Resultado" value={Math.max(resultingStock, 0)} />
            </div>
            <StockBadge stock={Math.max(resultingStock, 0)} stockMin={selectedProduct.stockMin} />
          </div>
        ) : (
          <p className="mt-3 text-sm text-luminoa-muted">
            Selecciona un producto para ver stock actual y stock resultante.
          </p>
        )}
      </aside>
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

function StockValue({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-luminoa-line p-3">
      <p className="text-xs text-luminoa-muted">{label}</p>
      <p className="mt-1 text-xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

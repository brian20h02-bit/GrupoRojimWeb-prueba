import type { ProductSummary } from "@/types/inventory";
import { StockBadge } from "./StockBadge";

type ProductTableProps = {
  products: ProductSummary[];
  canManage: boolean;
  onEdit: (product: ProductSummary) => void;
  onDeactivate: (product: ProductSummary) => void;
};

export function ProductTable({ products, canManage, onEdit, onDeactivate }: ProductTableProps) {
  if (products.length === 0) {
    return (
      <section className="rounded-lg border border-luminoa-line bg-white p-8 text-center text-sm text-luminoa-muted">
        No se encontraron productos.
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-lg border border-luminoa-line bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-luminoa-line text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-luminoa-muted">
            <tr>
              <th className="px-4 py-3 font-semibold">Codigo</th>
              <th className="px-4 py-3 font-semibold">Producto</th>
              <th className="px-4 py-3 font-semibold">Marca</th>
              <th className="px-4 py-3 font-semibold">Categoria</th>
              <th className="px-4 py-3 font-semibold">Precio</th>
              <th className="px-4 py-3 font-semibold">Stock</th>
              <th className="px-4 py-3 font-semibold">Estado</th>
              {canManage ? <th className="px-4 py-3 font-semibold">Acciones</th> : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-luminoa-line">
            {products.map((product) => (
              <tr key={product.id} className={!product.active ? "bg-slate-50 text-slate-400" : undefined}>
                <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-800">
                  {product.code}
                </td>
                <td className="min-w-56 px-4 py-3">
                  <p className="font-medium text-slate-900">{product.name}</p>
                  {product.description ? (
                    <p className="mt-1 line-clamp-1 text-xs text-luminoa-muted">{product.description}</p>
                  ) : null}
                </td>
                <td className="whitespace-nowrap px-4 py-3">{product.brand}</td>
                <td className="whitespace-nowrap px-4 py-3">{product.category.name}</td>
                <td className="whitespace-nowrap px-4 py-3">${product.price}</td>
                <td className="whitespace-nowrap px-4 py-3">
                  <span className="font-semibold text-slate-900">{product.stock}</span>
                  <span className="ml-1 text-xs text-luminoa-muted">min {product.stockMin}</span>
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <StockBadge stock={product.stock} stockMin={product.stockMin} />
                </td>
                {canManage ? (
                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => onEdit(product)}
                        className="rounded-md border border-luminoa-line px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeactivate(product)}
                        disabled={!product.active}
                        className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Desactivar
                      </button>
                    </div>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

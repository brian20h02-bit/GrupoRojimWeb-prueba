import type { FormEvent } from "react";
import { useState } from "react";
import type { CategorySummary } from "@/types/inventory";

export type ProductFormValues = {
  name: string;
  code: string;
  description?: string;
  price: string;
  brand: string;
  unitPerBox: number;
  stockMin: number;
  categoryId: string;
};

type ProductFormModalProps = {
  categories: CategorySummary[];
  isSubmitting: boolean;
  error: string;
  onClose: () => void;
  onSubmit: (values: ProductFormValues) => void;
};

const initialValues = {
  name: "",
  code: "",
  description: "",
  price: "",
  brand: "",
  unitPerBox: 1,
  stockMin: 0,
  categoryId: "",
};

export function ProductFormModal({
  categories,
  isSubmitting,
  error,
  onClose,
  onSubmit,
}: ProductFormModalProps) {
  const [values, setValues] = useState<ProductFormValues>(initialValues);
  const [localError, setLocalError] = useState("");

  function updateValue<Key extends keyof ProductFormValues>(key: Key, value: ProductFormValues[Key]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLocalError("");

    if (!values.name.trim() || !values.code.trim() || !values.brand.trim() || !values.price || !values.categoryId) {
      setLocalError("Completa nombre, codigo, marca, precio y categoria.");
      return;
    }

    if (values.unitPerBox <= 0) {
      setLocalError("Las unidades por caja deben ser mayores a 0.");
      return;
    }

    if (values.stockMin < 0) {
      setLocalError("El stock minimo no puede ser negativo.");
      return;
    }

    onSubmit({
      ...values,
      name: values.name.trim(),
      code: values.code.trim(),
      brand: values.brand.trim(),
      description: values.description?.trim() || undefined,
    });
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-4 py-6">
      <section className="max-h-full w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Crear producto</h2>
            <p className="mt-1 text-sm text-luminoa-muted">Carga inicial de datos comerciales y stock minimo.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-luminoa-line px-3 py-1.5 text-sm text-slate-700"
          >
            Cerrar
          </button>
        </div>

        <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
          <FormField label="Nombre">
            <input
              value={values.name}
              onChange={(event) => updateValue("name", event.target.value)}
              className="w-full rounded-md border border-luminoa-line px-3 py-2 text-sm outline-none focus:border-luminoa-teal focus:ring-2 focus:ring-luminoa-teal/20"
            />
          </FormField>

          <FormField label="Codigo">
            <input
              value={values.code}
              onChange={(event) => updateValue("code", event.target.value)}
              className="w-full rounded-md border border-luminoa-line px-3 py-2 text-sm outline-none focus:border-luminoa-teal focus:ring-2 focus:ring-luminoa-teal/20"
            />
          </FormField>

          <FormField label="Marca">
            <input
              value={values.brand}
              onChange={(event) => updateValue("brand", event.target.value)}
              className="w-full rounded-md border border-luminoa-line px-3 py-2 text-sm outline-none focus:border-luminoa-teal focus:ring-2 focus:ring-luminoa-teal/20"
            />
          </FormField>

          <FormField label="Categoria">
            <select
              value={values.categoryId}
              onChange={(event) => updateValue("categoryId", event.target.value)}
              className="w-full rounded-md border border-luminoa-line px-3 py-2 text-sm outline-none focus:border-luminoa-teal focus:ring-2 focus:ring-luminoa-teal/20"
            >
              <option value="">Seleccionar</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Precio">
            <input
              type="number"
              min="0"
              step="0.01"
              value={values.price}
              onChange={(event) => updateValue("price", event.target.value)}
              className="w-full rounded-md border border-luminoa-line px-3 py-2 text-sm outline-none focus:border-luminoa-teal focus:ring-2 focus:ring-luminoa-teal/20"
            />
          </FormField>

          <FormField label="Unidades por caja">
            <input
              type="number"
              min="1"
              value={values.unitPerBox}
              onChange={(event) => updateValue("unitPerBox", Number(event.target.value))}
              className="w-full rounded-md border border-luminoa-line px-3 py-2 text-sm outline-none focus:border-luminoa-teal focus:ring-2 focus:ring-luminoa-teal/20"
            />
          </FormField>

          <FormField label="Stock minimo">
            <input
              type="number"
              min="0"
              value={values.stockMin}
              onChange={(event) => updateValue("stockMin", Number(event.target.value))}
              className="w-full rounded-md border border-luminoa-line px-3 py-2 text-sm outline-none focus:border-luminoa-teal focus:ring-2 focus:ring-luminoa-teal/20"
            />
          </FormField>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-800">Descripcion</label>
            <textarea
              value={values.description}
              onChange={(event) => updateValue("description", event.target.value)}
              rows={3}
              className="mt-2 w-full rounded-md border border-luminoa-line px-3 py-2 text-sm outline-none focus:border-luminoa-teal focus:ring-2 focus:ring-luminoa-teal/20"
            />
          </div>

          {localError || error ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 sm:col-span-2">
              {localError || error}
            </div>
          ) : null}

          <div className="flex justify-end gap-2 sm:col-span-2">
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
              {isSubmitting ? "Creando..." : "Crear producto"}
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

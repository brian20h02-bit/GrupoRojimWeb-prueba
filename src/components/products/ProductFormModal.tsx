import type { FormEvent } from "react";
import { useRef, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { CategorySummary, ProductSummary } from "@/types/inventory";

export type ProductFormValues = {
  name: string;
  code: string;
  description?: string;
  price: string;
  brand: string;
  unitPerBox: number;
  stockMin: number;
  categoryId: string;
  imageUrl?: string | null;
};

type ProductFormModalProps = {
  categories: CategorySummary[];
  isSubmitting: boolean;
  error: string;
  initialProduct?: ProductSummary;
  onClose: () => void;
  onSubmit: (values: ProductFormValues) => void;
};

const initialValues: ProductFormValues = {
  name: "",
  code: "",
  description: "",
  price: "",
  brand: "",
  unitPerBox: 1,
  stockMin: 0,
  categoryId: "",
  imageUrl: null,
};

export function ProductFormModal({
  categories,
  isSubmitting,
  error,
  initialProduct,
  onClose,
  onSubmit,
}: ProductFormModalProps) {
  const isEditMode = Boolean(initialProduct);
  const [values, setValues] = useState<ProductFormValues>(
    initialProduct
      ? {
          name: initialProduct.name,
          code: initialProduct.code,
          description: initialProduct.description ?? "",
          price: initialProduct.price,
          brand: initialProduct.brand,
          unitPerBox: initialProduct.unitPerBox,
          stockMin: initialProduct.stockMin,
          categoryId: initialProduct.categoryId,
          imageUrl: initialProduct.imageUrl ?? null,
        }
      : initialValues,
  );
  const [localError, setLocalError] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    initialProduct?.imageUrl ?? null,
  );
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function updateValue<Key extends keyof ProductFormValues>(key: Key, value: ProductFormValues[Key]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setLocalError("Solo se permiten archivos de imagen (JPEG, PNG, WebP).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setLocalError("La imagen no puede superar los 5 MB.");
      return;
    }
    setLocalError("");
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function handleRemoveImage() {
    setImageFile(null);
    setImagePreview(null);
    updateValue("imageUrl", null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
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

    let finalImageUrl = values.imageUrl ?? null;

    if (imageFile) {
      setIsUploading(true);
      try {
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(imageFile);
        });
        const { url } = await apiFetch<{ url: string }>("/api/upload/product-image", {
          method: "POST",
          body: JSON.stringify({ imageBase64: base64, filename: values.code }),
        });
        finalImageUrl = url;
      } catch {
        setLocalError("No se pudo subir la imagen. Intentá de nuevo.");
        setIsUploading(false);
        return;
      } finally {
        setIsUploading(false);
      }
    }

    onSubmit({
      ...values,
      name: values.name.trim(),
      code: values.code.trim(),
      brand: values.brand.trim(),
      description: values.description?.trim() || undefined,
      imageUrl: finalImageUrl,
    });
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-4 py-6">
      <section className="max-h-full w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">{isEditMode ? "Editar producto" : "Crear producto"}</h2>
            <p className="mt-1 text-sm text-luminoa-muted">{isEditMode ? "Modificá los datos del producto." : "Carga inicial de datos comerciales y stock minimo."}</p>
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
            <p className="mb-2 block text-sm font-medium text-slate-800">Imagen del producto</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFileChange}
            />
            {imagePreview ? (
              <div className="flex items-start gap-3">
                <img
                  src={imagePreview}
                  alt="Vista previa"
                  className="h-24 w-24 rounded-md border border-luminoa-line object-cover"
                />
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-md border border-luminoa-line px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Cambiar imagen
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                  >
                    Quitar imagen
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-luminoa-line bg-slate-50 px-4 py-6 text-sm text-luminoa-muted transition hover:bg-slate-100"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                Subir imagen (JPEG, PNG, WebP · máx. 5 MB)
              </button>
            )}
          </div>

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
              disabled={isSubmitting || isUploading}
              className="rounded-md bg-luminoa-teal px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:opacity-70"
            >
              {isSubmitting || isUploading
                ? isEditMode
                  ? "Guardando..."
                  : "Creando..."
                : isEditMode
                  ? "Guardar cambios"
                  : "Crear producto"}
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

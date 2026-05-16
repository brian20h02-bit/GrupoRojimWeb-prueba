type ProductFiltersProps = {
  search: string;
  onSearchChange: (value: string) => void;
  onSubmit: () => void;
  onCreate?: () => void;
  canCreate: boolean;
};

export function ProductFilters({
  search,
  onSearchChange,
  onSubmit,
  onCreate,
  canCreate,
}: ProductFiltersProps) {
  return (
    <section className="rounded-lg border border-luminoa-line bg-white p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="w-full md:max-w-md">
          <label htmlFor="product-search" className="block text-sm font-medium text-slate-800">
            Buscar producto
          </label>
          <div className="mt-2 flex gap-2">
            <input
              id="product-search"
              type="search"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  onSubmit();
                }
              }}
              className="block w-full rounded-md border border-luminoa-line px-3 py-2 text-sm outline-none transition focus:border-luminoa-teal focus:ring-2 focus:ring-luminoa-teal/20"
              placeholder="Codigo o nombre"
            />
            <button
              type="button"
              onClick={onSubmit}
              className="rounded-md border border-luminoa-line px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Buscar
            </button>
          </div>
        </div>

        {canCreate ? (
          <button
            type="button"
            onClick={onCreate}
            className="rounded-md bg-luminoa-teal px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800"
          >
            Crear producto
          </button>
        ) : null}
      </div>
    </section>
  );
}

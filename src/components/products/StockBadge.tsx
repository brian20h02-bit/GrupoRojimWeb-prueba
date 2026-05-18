type StockBadgeProps = {
  stock: number;
  stockMin: number;
};

export function StockBadge({ stock, stockMin }: StockBadgeProps) {
  if (stock <= 0) {
    return (
      <span className="inline-flex rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">
        Sin stock
      </span>
    );
  }

  if (stock < stockMin) {
    return (
      <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
        Bajo stock
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
      Disponible
    </span>
  );
}

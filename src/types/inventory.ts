import type { CurrentUser } from "@/types/auth";

export type ProductSummary = {
  id: string;
  name: string;
  code: string;
  description: string | null;
  price: string;
  brand: string;
  unitPerBox: number;
  stockMin: number;
  active: boolean;
  imageUrl: string | null;
  categoryId: string;
  createdAt: string;
  updatedAt: string;
  stock: number;
  belowMinStock: boolean;
  category: {
    id: string;
    name: string;
    slug: string;
  };
};

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  pages: number;
};

export type ProductListResponse = {
  products: ProductSummary[];
  pagination: Pagination;
};

export type CategorySummary = {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  _count?: {
    products: number;
  };
};

export type CategoryListResponse = {
  categories: CategorySummary[];
};

export type StockSummaryResponse = {
  products: ProductSummary[];
  belowMinimum: ProductSummary[];
};

export type StockMovement = {
  id: string;
  productId: string;
  type: "ENTRADA" | "SALIDA";
  quantity: number;
  userId: string;
  reason: string | null;
  reference: string | null;
  notes: string | null;
  createdAt: string;
  product: {
    id: string;
    name: string;
    code: string;
  };
  user: CurrentUser;
};

export type StockHistoryResponse = {
  movements: StockMovement[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
};

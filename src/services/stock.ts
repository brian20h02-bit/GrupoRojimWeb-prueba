import { Prisma, StockMovementType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getStockByProductId, serializeProduct } from "@/services/products";
import type { StockHistoryQuery, StockMovementBody } from "@/validation/stock";

const movementSelect = {
  id: true,
  productId: true,
  type: true,
  quantity: true,
  userId: true,
  reason: true,
  reference: true,
  notes: true,
  createdAt: true,
  product: {
    select: {
      id: true,
      name: true,
      code: true,
    },
  },
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  },
} satisfies Prisma.StockMovementSelect;

const stockSummaryProductSelect = {
  id: true,
  name: true,
  code: true,
  description: true,
  price: true,
  brand: true,
  unitPerBox: true,
  stockMin: true,
  active: true,
  categoryId: true,
  createdAt: true,
  updatedAt: true,
  category: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
} satisfies Prisma.ProductSelect;

export class InsufficientStockError extends Error {
  constructor(public readonly currentStock: number) {
    super("Insufficient stock.");
  }
}

export class StockProductNotFoundError extends Error {
  constructor() {
    super("Product not found.");
  }
}

export async function getCurrentStock(productId: string) {
  const stockByProductId = await getStockByProductId([productId]);
  return stockByProductId.get(productId) ?? 0;
}

export async function recordStockEntry(input: StockMovementBody, userId: string) {
  return prisma.stockMovement.create({
    data: {
      productId: input.productId,
      type: StockMovementType.ENTRADA,
      quantity: input.quantity,
      userId,
      reason: input.reason,
      reference: input.reference,
      notes: input.notes,
    },
    select: movementSelect,
  });
}

export async function recordStockExit(input: StockMovementBody, userId: string) {
  return prisma.$transaction(
    async (tx) => {
      const products = await tx.$queryRaw<Array<{ id: string }>>`
        SELECT id
        FROM "Product"
        WHERE id = ${input.productId}
        FOR UPDATE
      `;

      if (products.length === 0) {
        throw new StockProductNotFoundError();
      }

      const stock = await tx.stockMovement.aggregate({
        where: {
          productId: input.productId,
        },
        _sum: {
          quantity: true,
        },
      });

      const currentStock = stock._sum.quantity ?? 0;

      if (currentStock < input.quantity) {
        throw new InsufficientStockError(currentStock);
      }

      return tx.stockMovement.create({
        data: {
          productId: input.productId,
          type: StockMovementType.SALIDA,
          quantity: -input.quantity,
          userId,
          reason: input.reason,
          reference: input.reference,
          notes: input.notes,
        },
        select: movementSelect,
      });
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    },
  );
}

export async function listStockHistory(query: StockHistoryQuery) {
  const where: Prisma.StockMovementWhereInput = {
    ...(query.productId ? { productId: query.productId } : {}),
    ...(query.userId ? { userId: query.userId } : {}),
    ...(query.from || query.to
      ? {
          createdAt: {
            ...(query.from ? { gte: new Date(query.from) } : {}),
            ...(query.to ? { lte: new Date(query.to) } : {}),
          },
        }
      : {}),
  };

  const skip = (query.page - 1) * query.limit;

  const [movements, total] = await prisma.$transaction([
    prisma.stockMovement.findMany({
      where,
      skip,
      take: query.limit,
      orderBy: { createdAt: "desc" },
      select: movementSelect,
    }),
    prisma.stockMovement.count({ where }),
  ]);

  return {
    movements,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      pages: Math.ceil(total / query.limit),
    },
  };
}

export async function getStockSummary() {
  const products = await prisma.product.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
    select: stockSummaryProductSelect,
  });

  const stockByProductId = await getStockByProductId(products.map((product) => product.id));
  const summary = products.map((product) =>
    serializeProduct(product, stockByProductId.get(product.id) ?? 0),
  );

  return {
    products: summary,
    belowMinimum: summary.filter((product) => product.belowMinStock),
  };
}

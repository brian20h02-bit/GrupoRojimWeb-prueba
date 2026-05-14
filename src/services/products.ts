import type { Prisma } from "@prisma/client";
import { Prisma as PrismaNamespace } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type {
  CreateProductInput,
  ListProductsQuery,
  UpdateProductInput,
} from "@/validation/products";

const productSelect = {
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

type ProductWithCategory = Prisma.ProductGetPayload<{
  select: typeof productSelect;
}>;

export function serializeProduct(product: ProductWithCategory, stock = 0) {
  return {
    ...product,
    price: product.price.toString(),
    stock,
    belowMinStock: stock < product.stockMin,
  };
}

export async function getStockByProductId(productIds: string[]) {
  if (productIds.length === 0) {
    return new Map<string, number>();
  }

  const groupedMovements = await prisma.stockMovement.groupBy({
    by: ["productId"],
    where: {
      productId: {
        in: productIds,
      },
    },
    _sum: {
      quantity: true,
    },
  });

  return new Map(
    groupedMovements.map((movement) => [movement.productId, movement._sum.quantity ?? 0]),
  );
}

function buildProductWhere(query: ListProductsQuery): Prisma.ProductWhereInput {
  const search = query.search?.trim();

  if (!search) {
    return {};
  }

  return {
    OR: [
      {
        code: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        name: {
          contains: search,
          mode: "insensitive",
        },
      },
    ],
  };
}

export async function listProducts(query: ListProductsQuery) {
  const where = buildProductWhere(query);
  const skip = (query.page - 1) * query.limit;

  const [products, total] = await prisma.$transaction([
    prisma.product.findMany({
      where,
      skip,
      take: query.limit,
      orderBy: { createdAt: "desc" },
      select: productSelect,
    }),
    prisma.product.count({ where }),
  ]);

  const stockByProductId = await getStockByProductId(products.map((product) => product.id));

  return {
    products: products.map((product) => serializeProduct(product, stockByProductId.get(product.id) ?? 0)),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      pages: Math.ceil(total / query.limit),
    },
  };
}

export async function getProductById(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    select: productSelect,
  });

  if (!product) {
    return null;
  }

  const stockByProductId = await getStockByProductId([product.id]);

  return serializeProduct(product, stockByProductId.get(product.id) ?? 0);
}

export function createProduct(input: CreateProductInput) {
  return prisma.product
    .create({
      data: {
        name: input.name,
        code: input.code,
        description: input.description,
        price: new PrismaNamespace.Decimal(input.price),
        brand: input.brand,
        unitPerBox: input.unitPerBox,
        stockMin: input.stockMin,
        active: input.active ?? true,
        categoryId: input.categoryId,
      },
      select: productSelect,
    })
    .then((product) => serializeProduct(product, 0));
}

export function updateProduct(id: string, input: UpdateProductInput) {
  return prisma.product
    .update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.code !== undefined ? { code: input.code } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.price !== undefined ? { price: new PrismaNamespace.Decimal(input.price) } : {}),
        ...(input.brand !== undefined ? { brand: input.brand } : {}),
        ...(input.unitPerBox !== undefined ? { unitPerBox: input.unitPerBox } : {}),
        ...(input.stockMin !== undefined ? { stockMin: input.stockMin } : {}),
        ...(input.active !== undefined ? { active: input.active } : {}),
        ...(input.categoryId !== undefined ? { categoryId: input.categoryId } : {}),
      },
      select: productSelect,
    })
    .then(async (product) => {
      const stockByProductId = await getStockByProductId([product.id]);
      return serializeProduct(product, stockByProductId.get(product.id) ?? 0);
    });
}

export function deactivateProduct(id: string) {
  return updateProduct(id, { active: false });
}

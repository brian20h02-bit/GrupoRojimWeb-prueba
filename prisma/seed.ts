import bcrypt from "bcrypt";
import { PrismaClient, Role, StockMovementType } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("Admin123!", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@luminoa.local" },
    update: {
      name: "Luminoa Admin",
      passwordHash,
      role: Role.ADMIN,
    },
    create: {
      name: "Luminoa Admin",
      email: "admin@luminoa.local",
      passwordHash,
      role: Role.ADMIN,
    },
  });

  const lighting = await prisma.category.upsert({
    where: { slug: "iluminacion" },
    update: { name: "Iluminacion" },
    create: { name: "Iluminacion", slug: "iluminacion" },
  });

  const electrical = await prisma.category.upsert({
    where: { slug: "electricidad" },
    update: { name: "Electricidad" },
    create: { name: "Electricidad", slug: "electricidad" },
  });

  const products = [
    {
      code: "LUM-LED-9W",
      name: "Lampara LED 9W",
      description: "Lampara LED de bajo consumo, luz fria.",
      price: "3500.00",
      brand: "Luminoa",
      unitPerBox: 20,
      stockMin: 15,
      categoryId: lighting.id,
      initialStock: 80,
    },
    {
      code: "LUM-PANEL-18W",
      name: "Panel LED 18W",
      description: "Panel embutido redondo para cielorraso.",
      price: "8900.00",
      brand: "Luminoa",
      unitPerBox: 10,
      stockMin: 10,
      categoryId: lighting.id,
      initialStock: 35,
    },
    {
      code: "ELEC-CABLE-25",
      name: "Cable unipolar 2.5mm",
      description: "Rollo de cable unipolar normalizado.",
      price: "28500.00",
      brand: "Electra",
      unitPerBox: 1,
      stockMin: 5,
      categoryId: electrical.id,
      initialStock: 12,
    },
  ];

  for (const productData of products) {
    const { initialStock, ...productFields } = productData;

    const product = await prisma.product.upsert({
      where: { code: productFields.code },
      update: productFields,
      create: productFields,
    });

    const existingSeedMovement = await prisma.stockMovement.findFirst({
      where: {
        productId: product.id,
        reference: "seed-initial-stock",
      },
    });

    if (!existingSeedMovement) {
      await prisma.stockMovement.create({
        data: {
          productId: product.id,
          type: StockMovementType.ENTRADA,
          quantity: initialStock,
          userId: admin.id,
          reason: "Stock inicial",
          reference: "seed-initial-stock",
          notes: "Movimiento generado por el seed inicial.",
        },
      });
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });

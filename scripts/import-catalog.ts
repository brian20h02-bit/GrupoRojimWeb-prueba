/**
 * ============================================================
 * GRUPO ROJIM — Catalog Importer
 * ============================================================
 *
 * Reads the JSON output from parse-catalog.ts and upserts
 * categories and products into the PostgreSQL database.
 *
 * Usage:
 *   npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/import-catalog.ts [ruta-json]
 *
 * Default JSON path: scripts/catalog-output.json
 *
 * Flags:
 *   --dry-run    Preview changes without writing to DB
 *   --featured   Mark all imported products as featured=true
 * ============================================================
 */

import fs from "fs";
import path from "path";
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

// ─── Types ───────────────────────────────────────────────────────────────────

interface CatalogProduct {
  code: string;
  name: string;
  slug?: string;
  brand: string;
  categorySlug: string;
  categoryName: string;
  subcategory?: string;
  price?: number;
  unitPerBox?: number;
}

interface CatalogCategory {
  slug: string;
  name: string;
}

interface CatalogFile {
  meta: { sourceFile: string; parsedAt: string };
  categories: CatalogCategory[];
  products: CatalogProduct[];
}

// ─── Category icon map ────────────────────────────────────────────────────────

const CATEGORY_ICON_MAP: Record<string, string> = {
  conductores: "conductores",
  tableros: "tableros",
  interruptores: "interruptores",
  protecciones: "protecciones",
  iluminacion: "iluminacion",
  canalizaciones: "canalizaciones",
  herramientas: "herramientas",
  cintas: "cintas",
  otros: "otros",
};

const CATEGORY_SORT_ORDER: Record<string, number> = {
  conductores: 1,
  tableros: 2,
  interruptores: 3,
  protecciones: 4,
  iluminacion: 5,
  canalizaciones: 6,
  herramientas: 7,
  cintas: 8,
  otros: 9,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function slugify(code: string, name: string): string {
  return `${code}-${name}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

function toDecimal(value: number | undefined): Prisma.Decimal {
  return new Prisma.Decimal(value ?? 0);
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const jsonPath =
    process.argv[2] || path.join(__dirname, "catalog-output.json");
  const isDryRun = process.argv.includes("--dry-run");
  const markFeatured = process.argv.includes("--featured");

  if (!fs.existsSync(jsonPath)) {
    console.error(`❌ No se encontró: ${jsonPath}`);
    console.error(
      "   Primero corré parse-catalog.ts para generar el archivo JSON."
    );
    process.exit(1);
  }

  const catalog: CatalogFile = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));

  console.log(`📁 Importando: ${jsonPath}`);
  console.log(`📅 Generado el: ${catalog.meta.parsedAt}`);
  console.log(`📦 Productos a importar: ${catalog.products.length}`);
  if (isDryRun) console.log("🔍 MODO DRY-RUN — no se escribirá nada en la BD\n");

  // ── Step 1: Upsert categories ──────────────────────────────────────────────
  console.log("📂 Procesando categorías...");
  const categoryIdMap = new Map<string, string>();

  for (const cat of catalog.categories) {
    if (isDryRun) {
      console.log(`  [DRY] Upsert category: ${cat.slug} — ${cat.name}`);
      categoryIdMap.set(cat.slug, `dry-${cat.slug}`);
      continue;
    }

    const record = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {
        name: cat.name,
        iconSlug: CATEGORY_ICON_MAP[cat.slug] ?? null,
        sortOrder: CATEGORY_SORT_ORDER[cat.slug] ?? 99,
      },
      create: {
        name: cat.name,
        slug: cat.slug,
        iconSlug: CATEGORY_ICON_MAP[cat.slug] ?? null,
        sortOrder: CATEGORY_SORT_ORDER[cat.slug] ?? 99,
      },
    });
    categoryIdMap.set(cat.slug, record.id);
    console.log(`  ✓ ${cat.name} (${cat.slug})`);
  }

  // ── Step 2: Upsert products ────────────────────────────────────────────────
  console.log(`\n📦 Procesando ${catalog.products.length} productos...`);

  let created = 0;
  let updated = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const prod of catalog.products) {
    const categoryId = categoryIdMap.get(prod.categorySlug);
    if (!categoryId) {
      errors.push(`Sin categoría para "${prod.code}" (slug: ${prod.categorySlug})`);
      skipped++;
      continue;
    }

    const productSlug = prod.slug || slugify(prod.code, prod.name);

    if (isDryRun) {
      console.log(`  [DRY] ${prod.code} — ${prod.name} [${prod.brand}]`);
      continue;
    }

    try {
      const existing = await prisma.product.findUnique({ where: { code: prod.code } });

      if (existing) {
        await prisma.product.update({
          where: { code: prod.code },
          data: {
            name: prod.name,
            brand: prod.brand,
            categoryId,
            subcategory: prod.subcategory ?? null,
            price: toDecimal(prod.price),
            unitPerBox: prod.unitPerBox ?? 1,
            catalogVisible: true,
            featured: markFeatured || existing.featured,
            // Regenerate slug only if it changed
            slug: productSlug,
          },
        });
        updated++;
      } else {
        await prisma.product.create({
          data: {
            code: prod.code,
            name: prod.name,
            slug: productSlug,
            brand: prod.brand,
            categoryId,
            subcategory: prod.subcategory ?? null,
            price: toDecimal(prod.price),
            unitPerBox: prod.unitPerBox ?? 1,
            stockMin: 0,
            active: true,
            catalogVisible: true,
            featured: markFeatured,
          },
        });
        created++;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`Error en "${prod.code}": ${msg}`);
      skipped++;
    }
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log("\n✅ Importación completada:");
  if (!isDryRun) {
    console.log(`   Creados:     ${created}`);
    console.log(`   Actualizados: ${updated}`);
    console.log(`   Omitidos:    ${skipped}`);
  }

  if (errors.length > 0) {
    console.log(`\n⚠️  ${errors.length} errores:`);
    errors.forEach((e) => console.log(`   - ${e}`));
  }

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error("❌ Error fatal:", err.message);
  await prisma.$disconnect();
  process.exit(1);
});

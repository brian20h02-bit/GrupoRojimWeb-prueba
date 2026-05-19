/**
 * import-excel.ts
 * Lee catalogo_completo_luminoa_2026.xlsx e importa productos a PostgreSQL.
 *
 * Uso:
 *   $env:TS_NODE_COMPILER_OPTIONS='{"module":"CommonJS"}'
 *   npx ts-node scripts/import-excel.ts [--dry-run] [ruta-al-xlsx]
 */

import * as path from "path";
import * as fs from "fs";
import { PrismaClient, Prisma } from "@prisma/client";

const XLSX = require("xlsx");

const prisma = new PrismaClient();
const isDryRun = process.argv.includes("--dry-run");

// ── Ruta por defecto al Excel ──────────────────────────────────────────────
const DEFAULT_XLSX = path.resolve(
  "C:/Users/Usuario/OneDrive/Escritorio/ppp/imagenes Proy juan/Informacion/catalogo_completo_luminoa_2026.xlsx"
);
const xlsxPath = process.argv.filter((a) => a.endsWith(".xlsx"))[0] || DEFAULT_XLSX;

// ── Definición de categorías ───────────────────────────────────────────────
const CATEGORIES: Record<string, { name: string; iconSlug: string; sortOrder: number }> = {
  iluminacion:   { name: "Iluminación",                   iconSlug: "iluminacion",   sortOrder: 1 },
  interruptores: { name: "Interruptores y Tomacorrientes", iconSlug: "interruptores", sortOrder: 2 },
  canalizaciones:{ name: "Canalizaciones",                 iconSlug: "canalizaciones",sortOrder: 3 },
  tableros:      { name: "Tableros",                       iconSlug: "tableros",      sortOrder: 4 },
  cintas:        { name: "Cintas y Materiales",            iconSlug: "cintas",        sortOrder: 5 },
  otros:         { name: "Otros",                          iconSlug: "otros",         sortOrder: 9 },
};

// ── Mapeo marca → categoría (default) ─────────────────────────────────────
const BRAND_CATEGORY: Record<string, string> = {
  Candela:     "iluminacion",
  Sixelectric: "iluminacion",
  Jeluz:       "interruptores",
  Richi:       "interruptores",
  MIG:         "interruptores",
  Eveready:    "otros",
  Tacsa:       "cintas",
  Kalop:       "canalizaciones", // overridden by keyword below
};

// ── Overrides por keyword en el nombre de producto ────────────────────────
function detectCategory(brand: string, name: string): string {
  const n = name.toUpperCase();
  // Iluminación
  if (n.includes("LAMPARA") || n.includes("PLAFON") || n.includes("PROYECTOR") ||
      n.includes("TORTUGA") || n.includes("FOTOCELULA") || n.includes("EMERGENCIA") ||
      n.includes("DICRO") || n.includes("TUBO LED") || n.includes("LISTON") ||
      (n.includes("LED") && !n.includes("CABLECANAL"))) return "iluminacion";
  // Interruptores / enchufes
  if (n.includes("INTERRUPTOR") || n.includes("TOMACORRIENTE") || n.includes("TOMA CORRIENTE") ||
      n.includes("FICHA") || n.includes("TOMA ") || n.includes("TOMAS ") || n.includes("BOX EXTERIOR")) return "interruptores";
  // Canalizaciones (caños, cablecanal, corrugado)
  if (n.includes("CABLECANAL") || n.includes("CAÑO") || n.includes("CONDUIT") ||
      n.includes("CORRUGADO") || n.includes("PIRAMIDAL") || n.includes("GRAMPA")) return "canalizaciones";
  // Tableros
  if (n.includes("CAJA PARA TERMICAS") || n.includes("TABLERO")) return "tableros";
  // Cintas y materiales
  if (n.includes("CINTA") || n.includes("TEFLON") || n.includes("PRECINTO")) return "cintas";
  // Otros: pilas, selladores, adhesivos, timbres, cajas
  if (n.includes("PILA") || n.includes("BATERIA") || n.includes("SELLADOR") ||
      n.includes("SILICONA") || n.includes("ADHESIVO") || n.includes("TIMBRE") ||
      n.includes("CAJA RECTANGULAR") || n.includes("CAJA OCTOGONAL")) return "otros";
  return BRAND_CATEGORY[brand] || "otros";
}

// ── Utilidades ─────────────────────────────────────────────────────────────
function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 80);
}

function generateCode(brand: string, name: string, index: number): string {
  const b = brand.substring(0, 3).toUpperCase();
  const n = slugify(name).substring(0, 12).replace(/-/g, "").toUpperCase();
  return `${b}-${n}-${index}`;
}

// ── Lectura del Excel ──────────────────────────────────────────────────────
interface ExcelRow {
  brand: string;
  code: string;
  name: string;
  price: number;
  unitPerBox: number;
}

function readExcel(filePath: string): ExcelRow[] {
  if (!fs.existsSync(filePath)) {
    console.error(`❌ No se encontró el archivo: ${filePath}`);
    process.exit(1);
  }
  const wb = XLSX.readFile(filePath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const raw: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

  return raw
    .slice(1) // skip header
    .filter((r: any[]) => r[0] && r[2]) // needs brand + name
    .map((r: any[], i: number) => ({
      brand:      String(r[0]).trim(),
      code:       r[1] ? String(r[1]).trim() : "",
      name:       String(r[2]).trim(),
      price:      Number(r[3]) || 0,
      unitPerBox: Number(r[4]) || 1,
    }));
}

// ── Importación principal ──────────────────────────────────────────────────
async function main() {
  console.log(`\n📊 Leyendo Excel: ${path.basename(xlsxPath)}`);
  if (isDryRun) console.log("🔍 MODO DRY-RUN — no se escribirá en la base de datos\n");

  const rows = readExcel(xlsxPath);
  console.log(`   Filas encontradas: ${rows.length}`);

  // ── 1. Upsert categorías ────────────────────────────────────────────────
  console.log("\n📁 Procesando categorías...");
  const categoryIds: Record<string, string> = {};

  for (const [slug, meta] of Object.entries(CATEGORIES)) {
    if (!isDryRun) {
      const cat = await prisma.category.upsert({
        where:  { slug },
        update: { name: meta.name, iconSlug: meta.iconSlug, sortOrder: meta.sortOrder },
        create: { name: meta.name, slug, iconSlug: meta.iconSlug, sortOrder: meta.sortOrder },
      });
      categoryIds[slug] = cat.id;
    } else {
      categoryIds[slug] = `[dry-run-${slug}]`;
    }
    console.log(`   ✓ ${meta.name} (${slug})`);
  }

  // ── 2. Upsert productos ─────────────────────────────────────────────────
  console.log("\n📦 Procesando productos...");

  let created = 0, updated = 0, skipped = 0;
  const codeCount: Record<string, number> = {};

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    // Generate code if missing
    let code = row.code;
    if (!code) {
      code = generateCode(row.brand, row.name, i);
    }

    // Deduplicate codes (in case of duplicates in Excel)
    codeCount[code] = (codeCount[code] || 0) + 1;
    if (codeCount[code] > 1) {
      code = `${code}-${codeCount[code]}`;
    }

    const catSlug = detectCategory(row.brand, row.name);
    const catId = categoryIds[catSlug];
    const slug = slugify(`${row.brand}-${code}`);

    const productData = {
      name:           row.name,
      code,
      slug,
      price:          new Prisma.Decimal(row.price),
      brand:          row.brand,
      unitPerBox:     row.unitPerBox,
      catalogVisible: true,
      active:         true,
      categoryId:     catId,
    };

    if (isDryRun) {
      console.log(`   [${catSlug}] ${row.brand} | ${code} | ${row.name} | $${row.price}`);
      created++;
      continue;
    }

    try {
      const existing = await prisma.product.findUnique({ where: { code } });
      if (existing) {
        await prisma.product.update({ where: { code }, data: productData });
        updated++;
      } else {
        await prisma.product.create({ data: productData });
        created++;
      }
    } catch (err: any) {
      console.warn(`   ⚠️  ${code} (${row.name}): ${err.message}`);
      skipped++;
    }
  }

  // ── Resumen ─────────────────────────────────────────────────────────────
  console.log("\n" + "─".repeat(50));
  console.log(`✅ Importación completada:`);
  console.log(`   Creados:      ${created}`);
  console.log(`   Actualizados: ${updated}`);
  console.log(`   Con errores:  ${skipped}`);
  console.log(`   Total:        ${rows.length}`);
  console.log("─".repeat(50) + "\n");

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});

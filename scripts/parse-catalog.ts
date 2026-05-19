/**
 * ============================================================
 * GRUPO ROJIM — Catalog PDF Parser
 * ============================================================
 *
 * Extracts product data from a PDF catalog and outputs a
 * structured JSON file ready for import-catalog.ts.
 *
 * Usage:
 *   npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/parse-catalog.ts <ruta-al-pdf> [salida.json]
 *
 * Example:
 *   npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/parse-catalog.ts C:\Users\Usuario\Desktop\catalogo.pdf scripts/catalog-output.json
 *
 * If the PDF has a non-standard layout, adjust the regex patterns
 * in PATTERNS and CATEGORY_MAP below.
 * ============================================================
 */

import fs from "fs";
import path from "path";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse");

// ─── Types ───────────────────────────────────────────────────────────────────

interface ParsedProduct {
  code: string;
  name: string;
  brand: string;
  categorySlug: string;
  categoryName: string;
  subcategory?: string;
  price?: number;
  unitPerBox?: number;
  rawLine: string;
}

interface ParseStats {
  totalLines: number;
  matchedLines: number;
  skippedLines: number;
  categoryChanges: number;
}

// ─── Configuration ───────────────────────────────────────────────────────────

/**
 * Maps keywords found in section headers to category slugs.
 * Add/remove keywords as needed based on your PDF's structure.
 */
const CATEGORY_MAP: Record<string, { slug: string; name: string }> = {
  CONDUCTOR: { slug: "conductores", name: "Conductores" },
  CABLE: { slug: "conductores", name: "Conductores" },
  TABLERO: { slug: "tableros", name: "Cajas y Tableros" },
  "CAJA Y TABLERO": { slug: "tableros", name: "Cajas y Tableros" },
  INTERRUPTOR: { slug: "interruptores", name: "Interruptores y Tomas" },
  TOMA: { slug: "interruptores", name: "Interruptores y Tomas" },
  PROTECCION: { slug: "protecciones", name: "Protecciones" },
  DISYUNTOR: { slug: "protecciones", name: "Protecciones" },
  TERMOMAGNETIC: { slug: "protecciones", name: "Protecciones" },
  ILUMINACION: { slug: "iluminacion", name: "Iluminación" },
  ILUMINACIÓN: { slug: "iluminacion", name: "Iluminación" },
  LUMINARIA: { slug: "iluminacion", name: "Iluminación" },
  LAMPARA: { slug: "iluminacion", name: "Iluminación" },
  LÁMPARA: { slug: "iluminacion", name: "Iluminación" },
  LED: { slug: "iluminacion", name: "Iluminación" },
  CANALIZACION: { slug: "canalizaciones", name: "Canalizaciones" },
  CANALIZACIÓN: { slug: "canalizaciones", name: "Canalizaciones" },
  CONDUIT: { slug: "canalizaciones", name: "Canalizaciones" },
  HERRAMIENTA: { slug: "herramientas", name: "Herramientas" },
  CINTA: { slug: "cintas", name: "Cintas y Accesorios" },
  ACCESORIO: { slug: "cintas", name: "Cintas y Accesorios" },
};

/** Known brands — used to extract brand from product name or dedicated column */
const KNOWN_BRANDS = [
  "JELUZ",
  "CANDELA",
  "RICHI",
  "MIG",
  "SIXELECTRIC",
  "TACSA",
  "KALOP",
  "OSRAM",
  "PHILIPS",
  "SICA",
  "INDUSTRIAS SICA",
  "PREIBISCH",
  "LEVITON",
  "GEWISS",
  "ABB",
  "SCHNEIDER",
  "LEGRAND",
];

/**
 * Regex patterns tried in order to parse a product line.
 *
 * Named capture groups:
 *   code     – product code (4-7 digit numeric or alphanumeric)
 *   name     – product description / name
 *   price    – price (optional, may use comma or dot as decimal)
 *   brand    – brand name (optional if extracted from name)
 *   unit     – units per box (optional)
 *
 * PATTERN 1: Code | Name | Price | Brand | UnitPerBox (tab or multi-space separated)
 * PATTERN 2: Code | Name | UnitPerBox | Price (no explicit brand column)
 * PATTERN 3: Code at start of line, rest is name
 */
const PATTERNS = [
  // Pattern 1: "40051  Interruptor simple 10A    $617,00    JELUZ    50"
  /^(?<code>[A-Z0-9]{3,10})\s{2,}(?<name>.+?)\s{2,}\$?(?<price>[\d.,]+)\s{2,}(?<brand>[A-Z][A-Z\s]+?)\s{2,}(?<unit>\d+)\s*$/i,

  // Pattern 2: "40051  Interruptor simple 10A JELUZ  $617,00  50"
  /^(?<code>[A-Z0-9]{3,10})\s{2,}(?<name>.+?)\s+(?<brand>JELUZ|CANDELA|RICHI|MIG|SIXELECTRIC|TACSA|KALOP|OSRAM|PHILIPS|SICA|PREIBISCH|LEVITON|ABB|SCHNEIDER|LEGRAND)\s+\$?(?<price>[\d.,]+)\s+(?<unit>\d+)\s*$/i,

  // Pattern 3: Code + name only (no price/brand column)
  /^(?<code>[A-Z0-9]{3,10})\s{2,}(?<name>[A-ZÁÉÍÓÚÑ][^$\n]{5,}?)(?:\s{2,}\$?(?<price>[\d.,]+))?(?:\s+(?<unit>\d{1,4}))?\s*$/i,
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parsePrice(raw: string | undefined): number | undefined {
  if (!raw) return undefined;
  // Handle formats: "617,00" → 617.00  or  "1.234,56" → 1234.56
  const normalized = raw.replace(/\./g, "").replace(",", ".");
  const value = parseFloat(normalized);
  return isNaN(value) ? undefined : value;
}

function extractBrandFromName(name: string): { name: string; brand: string } {
  const upper = name.toUpperCase();
  for (const brand of KNOWN_BRANDS) {
    if (upper.includes(brand)) {
      return {
        brand,
        name: name.replace(new RegExp(brand, "gi"), "").replace(/\s{2,}/g, " ").trim(),
      };
    }
  }
  return { name, brand: "Sin marca" };
}

function detectCategory(line: string): { slug: string; name: string } | null {
  const upper = line.toUpperCase().trim();
  for (const [keyword, cat] of Object.entries(CATEGORY_MAP)) {
    if (upper.includes(keyword)) return cat;
  }
  return null;
}

function isSectionHeader(line: string): boolean {
  // Headers are usually short, all-caps lines without price-like content
  const trimmed = line.trim();
  if (trimmed.length < 3 || trimmed.length > 80) return false;
  const isAllCaps = trimmed === trimmed.toUpperCase();
  const hasNumbers = /\d{4,}/.test(trimmed); // long digit sequences = code, not header
  return isAllCaps && !hasNumbers;
}

function slugify(code: string, name: string): string {
  const base = `${code}-${name}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
  return base;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const pdfPath = process.argv[2];
  const outputPath = process.argv[3] || path.join(__dirname, "catalog-output.json");

  if (!pdfPath) {
    console.error("❌ Falta la ruta del PDF.");
    console.error(
      "   Uso: npx ts-node --compiler-options '{\"module\":\"CommonJS\"}' scripts/parse-catalog.ts <ruta-pdf> [salida.json]",
    );
    process.exit(1);
  }

  if (!fs.existsSync(pdfPath)) {
    console.error(`❌ No se encontró el archivo: ${pdfPath}`);
    process.exit(1);
  }

  console.log(`📄 Leyendo PDF: ${pdfPath}`);
  const buffer = fs.readFileSync(pdfPath);
  const data = await pdfParse(buffer);

  const lines = data.text.split("\n").map((l: string) => l.trim()).filter(Boolean);
  console.log(`📋 Total de líneas extraídas: ${lines.length}`);

  const products: ParsedProduct[] = [];
  const stats: ParseStats = {
    totalLines: lines.length,
    matchedLines: 0,
    skippedLines: 0,
    categoryChanges: 0,
  };

  let currentCategory: { slug: string; name: string } = { slug: "otros", name: "Otros" };
  let currentSubcategory: string | undefined = undefined;

  for (const line of lines) {
    // Detect category section headers
    if (isSectionHeader(line)) {
      const cat = detectCategory(line);
      if (cat) {
        currentCategory = cat;
        currentSubcategory = undefined;
        stats.categoryChanges++;
        console.log(`  📂 Categoría detectada: ${cat.name}`);
        continue;
      }
    }

    // Try each pattern
    let matched = false;
    for (const pattern of PATTERNS) {
      const m = line.match(pattern);
      if (!m?.groups) continue;

      const { code, name: rawName, price: rawPrice, brand: rawBrand, unit } = m.groups;

      if (!code || !rawName) continue;

      let finalName = rawName.trim();
      let finalBrand = (rawBrand || "").trim().toUpperCase();

      // If brand not captured by pattern, try to extract from name
      if (!finalBrand || finalBrand === "SIN MARCA") {
        const extracted = extractBrandFromName(finalName);
        finalName = extracted.name;
        finalBrand = extracted.brand;
      }

      products.push({
        code: code.toUpperCase().trim(),
        name: finalName,
        brand: finalBrand || "Sin marca",
        categorySlug: currentCategory.slug,
        categoryName: currentCategory.name,
        subcategory: currentSubcategory,
        price: parsePrice(rawPrice),
        unitPerBox: unit ? parseInt(unit, 10) : undefined,
        rawLine: line,
      });

      stats.matchedLines++;
      matched = true;
      break;
    }

    if (!matched) {
      stats.skippedLines++;
    }
  }

  // Deduplicate by code (last wins, so use a Map)
  const dedupMap = new Map<string, ParsedProduct>();
  for (const p of products) {
    dedupMap.set(p.code, p);
  }
  const deduped = Array.from(dedupMap.values());

  // Add slug to each product
  const withSlugs = deduped.map((p) => ({
    ...p,
    slug: slugify(p.code, p.name),
  }));

  // ─── Output ───
  const output = {
    meta: {
      parsedAt: new Date().toISOString(),
      sourceFile: path.basename(pdfPath),
      totalPages: data.numpages,
    },
    stats: {
      ...stats,
      parsedProducts: products.length,
      uniqueProducts: withSlugs.length,
    },
    categories: [...new Set(withSlugs.map((p) => p.categorySlug))].map((slug) => ({
      slug,
      name: withSlugs.find((p) => p.categorySlug === slug)!.categoryName,
    })),
    products: withSlugs,
  };

  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), "utf-8");

  console.log("\n✅ Parseo completado:");
  console.log(`   Líneas totales:    ${stats.totalLines}`);
  console.log(`   Líneas parseadas:  ${stats.matchedLines}`);
  console.log(`   Líneas omitidas:   ${stats.skippedLines}`);
  console.log(`   Productos únicos:  ${withSlugs.length}`);
  console.log(`   Categorías:        ${output.categories.length}`);
  console.log(`\n📁 Salida guardada en: ${outputPath}`);
  console.log("\n⚠️  IMPORTANTE: Revisá el JSON generado antes de importar.");
  console.log("   Si los precios o nombres quedaron mal, ajustá los patrones PATTERNS en el script.");
}

main().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});

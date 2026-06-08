import { readdir, readFile, writeFile } from "node:fs/promises";
import { basename, dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import { toIndexEntry, validateEntry } from "./validate-entry.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..");
const CHANGELOGS_DIR = join(REPO_ROOT, "changelogs");
const INDEX_PATH = join(REPO_ROOT, "index.json");

const checkOnly = process.argv.includes("--check-only");

/**
 * @param {string} dir
 * @returns {Promise<string[]>}
 */
async function findMarkdownFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await findMarkdownFiles(fullPath)));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      files.push(fullPath);
    }
  }

  return files.sort();
}

/**
 * @param {Map<string, object[]>} products
 * @returns {object}
 */
function buildIndex(products) {
  const sortedProducts = {};

  for (const [product, entries] of [...products.entries()].sort(([a], [b]) =>
    a.localeCompare(b),
  )) {
    sortedProducts[product] = [...entries].sort((a, b) =>
      b.publishedAt.localeCompare(a.publishedAt),
    );
  }

  return {
    products: sortedProducts,
    lastUpdated: new Date().toISOString(),
  };
}

async function main() {
  const markdownFiles = await findMarkdownFiles(CHANGELOGS_DIR);
  const products = new Map();
  const slugsByProduct = new Map();
  const errors = [];

  for (const filePath of markdownFiles) {
    const relativePath = relative(REPO_ROOT, filePath);
    const raw = await readFile(filePath, "utf8");
    const parsed = matter(raw);
    const product = String(parsed.data.product ?? basename(dirname(filePath)));

    if (!slugsByProduct.has(product)) {
      slugsByProduct.set(product, new Set());
    }

    errors.push(
      ...validateEntry(relativePath, parsed, slugsByProduct.get(product)),
    );
  }

  if (errors.length > 0) {
    console.error("Changelog validation failed:\n");
    console.error(errors.join("\n"));
    process.exit(1);
  }

  for (const filePath of markdownFiles) {
    const relativePath = relative(REPO_ROOT, filePath);
    const raw = await readFile(filePath, "utf8");
    const parsed = matter(raw);
    const entry = toIndexEntry(relativePath, parsed);

    if (!entry) {
      continue;
    }

    const { product } = entry;
    if (!products.has(product)) {
      products.set(product, []);
    }
    products.get(product).push(entry);
  }

  const index = buildIndex(products);
  const json = `${JSON.stringify(index, null, 2)}\n`;

  if (checkOnly) {
    console.log("Validation passed.");
    return;
  }

  await writeFile(INDEX_PATH, json, "utf8");
  console.log(`Wrote ${relative(REPO_ROOT, INDEX_PATH)}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

import { basename, dirname } from "node:path";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const REQUIRED_FIELDS = ["slug", "title", "version", "product", "publishedAt"];

/**
 * @param {string} filePath
 * @param {import('gray-matter').GrayMatterFile<string>} parsed
 * @param {Set<string>} [seenSlugs]
 * @returns {string[]}
 */
export function validateEntry(filePath, parsed, seenSlugs = new Set()) {
  const errors = [];
  const { data: frontmatter } = parsed;
  const filename = basename(filePath);
  const parentFolder = basename(dirname(filePath));

  if (Object.keys(frontmatter).length === 0) {
    errors.push(`${filePath}: missing YAML frontmatter block (expected --- delimiters)`);
    return errors;
  }

  for (const field of REQUIRED_FIELDS) {
    const value = frontmatter[field];
    if (value === undefined || value === null || String(value).trim() === "") {
      errors.push(`${filePath}: missing required field "${field}"`);
    }
  }

  if (errors.length > 0) {
    return errors;
  }

  const slug = String(frontmatter.slug);
  const product = String(frontmatter.product);
  const publishedAt = String(frontmatter.publishedAt);
  const expectedFilename = `${slug}.md`;

  if (filename !== expectedFilename) {
    errors.push(
      `${filePath}: filename must be "${expectedFilename}" (slug is "${slug}")`,
    );
  }

  if (parentFolder !== product) {
    errors.push(
      `${filePath}: product "${product}" does not match parent folder "${parentFolder}"`,
    );
  }

  if (!DATE_RE.test(publishedAt)) {
    errors.push(
      `${filePath}: publishedAt must be YYYY-MM-DD (got "${publishedAt}")`,
    );
  } else {
    const [year, month, day] = publishedAt.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    if (
      date.getUTCFullYear() !== year ||
      date.getUTCMonth() !== month - 1 ||
      date.getUTCDate() !== day
    ) {
      errors.push(`${filePath}: publishedAt is not a valid date ("${publishedAt}")`);
    }
  }

  if (seenSlugs.has(slug)) {
    errors.push(`${filePath}: duplicate slug "${slug}" in product "${product}"`);
  } else {
    seenSlugs.add(slug);
  }

  return errors;
}

/**
 * @param {string} filePath
 * @param {import('gray-matter').GrayMatterFile<string>} parsed
 * @returns {object | null}
 */
export function toIndexEntry(filePath, parsed) {
  const { data: frontmatter } = parsed;

  if (frontmatter.draft === true) {
    return null;
  }

  const entry = {
    slug: String(frontmatter.slug),
    title: String(frontmatter.title),
    version: String(frontmatter.version),
    product: String(frontmatter.product),
    publishedAt: String(frontmatter.publishedAt),
  };

  if (frontmatter.summary !== undefined && frontmatter.summary !== null) {
    entry.summary = String(frontmatter.summary);
  }

  return entry;
}

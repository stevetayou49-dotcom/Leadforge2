import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEMOS_DIR = path.join(__dirname, 'data', 'demos');
const INDEX_FILE = path.join(DEMOS_DIR, '_index.json');

async function ensureDir() {
  await fs.mkdir(DEMOS_DIR, { recursive: true });
  try {
    await fs.access(INDEX_FILE);
  } catch {
    await fs.writeFile(INDEX_FILE, '[]', 'utf-8');
  }
}

async function readIndex() {
  await ensureDir();
  try {
    return JSON.parse(await fs.readFile(INDEX_FILE, 'utf-8'));
  } catch {
    return [];
  }
}

async function writeIndex(list) {
  await ensureDir();
  await fs.writeFile(INDEX_FILE, JSON.stringify(list, null, 2), 'utf-8');
}

function makeSlug(businessName) {
  const base = String(businessName || 'demo')
    .toLowerCase()
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '') // Umlaute etc. entfernen
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'demo';
  return `${base}-${Math.random().toString(36).slice(2, 7)}`;
}

// pages: [{ filename, html }], css: string
export async function createDemo({ businessName, pages, css }) {
  await ensureDir();
  if (!Array.isArray(pages) || pages.length === 0) {
    throw new Error('Keine Seiten übergeben.');
  }
  const slug = makeSlug(businessName);
  const dir = path.join(DEMOS_DIR, slug);
  await fs.mkdir(dir, { recursive: true });

  await fs.writeFile(path.join(dir, 'style.css'), css || '', 'utf-8');
  for (const page of pages) {
    const filename = path.basename(String(page.filename || 'index.html'));
    await fs.writeFile(path.join(dir, filename), String(page.html || ''), 'utf-8');
  }

  const list = await readIndex();
  list.unshift({ slug, businessName: businessName || 'Demo', createdAt: new Date().toISOString() });
  await writeIndex(list);

  return { slug };
}

export async function listDemos() {
  return readIndex();
}

export async function deleteDemo(slug) {
  const safeSlug = path.basename(String(slug || ''));
  const dir = path.join(DEMOS_DIR, safeSlug);
  await fs.rm(dir, { recursive: true, force: true });
  const list = await readIndex();
  const next = list.filter((d) => d.slug !== safeSlug);
  await writeIndex(next);
  return next.length !== list.length;
}

export function demoFilePath(slug, file) {
  const safeSlug = path.basename(String(slug || ''));
  const safeFile = path.basename(String(file || 'index.html'));
  return path.join(DEMOS_DIR, safeSlug, safeFile);
}

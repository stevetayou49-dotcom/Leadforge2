import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'anfragen.json');

async function ensureFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, '[]', 'utf-8');
  }
}

export async function readAll() {
  await ensureFile();
  const raw = await fs.readFile(DATA_FILE, 'utf-8');
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function writeAll(list) {
  await ensureFile();
  await fs.writeFile(DATA_FILE, JSON.stringify(list, null, 2), 'utf-8');
}

export async function addAnfrage(data) {
  const list = await readAll();
  const entry = {
    id: `anf-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: String(data.name || '').slice(0, 200),
    email: String(data.email || '').slice(0, 200),
    paket: String(data.paket || '').slice(0, 100),
    nachricht: String(data.nachricht || '').slice(0, 4000),
    status: 'Neu',
    createdAt: new Date().toISOString(),
  };
  list.unshift(entry);
  await writeAll(list);
  return entry;
}

export async function updateStatus(id, status) {
  const list = await readAll();
  const idx = list.findIndex((a) => a.id === id);
  if (idx === -1) return null;
  list[idx].status = status;
  list[idx].updatedAt = new Date().toISOString();
  await writeAll(list);
  return list[idx];
}

export async function removeAnfrage(id) {
  const list = await readAll();
  const next = list.filter((a) => a.id !== id);
  await writeAll(next);
  return next.length !== list.length;
}

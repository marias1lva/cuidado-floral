import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import type { ManagedUser } from "../src/admin/types";
import { buildSeedData, type AppData, type StoredUser } from "./mock-data";

const DATA_FILE_PATH = resolve(process.cwd(), "server/data/app-data.json");

async function ensureDataFile(): Promise<void> {
  await mkdir(dirname(DATA_FILE_PATH), { recursive: true });

  try {
    await readFile(DATA_FILE_PATH, "utf-8");
  } catch {
    await writeFile(DATA_FILE_PATH, JSON.stringify(buildSeedData(), null, 2));
  }
}

export async function readStore(): Promise<AppData> {
  await ensureDataFile();
  const raw = await readFile(DATA_FILE_PATH, "utf-8");
  return JSON.parse(raw) as AppData;
}

export async function writeStore(data: AppData): Promise<AppData> {
  await ensureDataFile();
  await writeFile(DATA_FILE_PATH, JSON.stringify(data, null, 2));
  return data;
}

export async function resetStore(): Promise<AppData> {
  return writeStore(buildSeedData());
}

export function toManagedUsers(users: StoredUser[]): ManagedUser[] {
  return users.map(({ password: _password, ...user }) => user);
}

/** Small, dependency-free helpers shared across packages. */

import { mkdir, readFile, writeFile, appendFile } from "node:fs/promises";
import { dirname } from "node:path";

/** Turn an arbitrary label into a stable, filesystem-safe slug. */
export function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64) || "target";
}

/** Ensure the directory containing `filePath` exists. */
export async function ensureParentDir(filePath: string): Promise<void> {
  await mkdir(dirname(filePath), { recursive: true });
}

/** Read and parse a JSON file. */
export async function readJson<T>(filePath: string): Promise<T> {
  return JSON.parse(await readFile(filePath, "utf8")) as T;
}

/** Serialise `data` as pretty JSON, creating parent directories as needed. */
export async function writeJson(filePath: string, data: unknown): Promise<void> {
  await ensureParentDir(filePath);
  await writeFile(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
}

/** Write text to a file, creating parent directories as needed. */
export async function writeText(filePath: string, text: string): Promise<void> {
  await ensureParentDir(filePath);
  await writeFile(filePath, text, "utf8");
}

/** Append one object as a JSON line, creating parent directories as needed. */
export async function appendJsonl(filePath: string, obj: unknown): Promise<void> {
  await ensureParentDir(filePath);
  await appendFile(filePath, JSON.stringify(obj) + "\n", "utf8");
}

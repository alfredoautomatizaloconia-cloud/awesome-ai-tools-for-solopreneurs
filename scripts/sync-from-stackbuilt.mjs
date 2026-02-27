import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const run = promisify(execFile);

const DEFAULT_SOURCE = "https://stackbuilt.co/exports/stackbuilt-ai-tools-list.json";
const LOCAL_FALLBACK = "/Users/nunoformiga/software_and_tools/stackbuilt.co/public/exports/stackbuilt-ai-tools-list.json";
const OUTPUT_PATH = path.resolve("data/tools.json");

function parseSourceArg() {
  const arg = process.argv.find((value) => value.startsWith("--source="));
  return arg ? arg.slice("--source=".length) : DEFAULT_SOURCE;
}

function isHttpUrl(value) {
  return value.startsWith("http://") || value.startsWith("https://");
}

async function readSource(source) {
  if (isHttpUrl(source)) {
    const response = await fetch(source);
    if (!response.ok) {
      throw new Error(`Could not fetch ${source} (${response.status})`);
    }
    return response.text();
  }

  return fs.readFile(source, "utf8");
}

function validatePayload(payload) {
  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid payload: expected object");
  }

  if (!Array.isArray(payload.entries) || payload.entries.length === 0) {
    throw new Error("Invalid payload: entries missing or empty");
  }

  return payload;
}

async function writeData(raw) {
  const parsed = validatePayload(JSON.parse(raw));
  await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await fs.writeFile(OUTPUT_PATH, JSON.stringify(parsed, null, 2), "utf8");
  return parsed;
}

async function rebuildReadme() {
  await run("node", ["scripts/build-readme.mjs"], { maxBuffer: 10 * 1024 * 1024 });
}

async function main() {
  const source = parseSourceArg();
  let raw;

  try {
    raw = await readSource(source);
  } catch (error) {
    if (source !== DEFAULT_SOURCE) {
      throw error;
    }

    console.warn(`Primary source unavailable. Falling back to local file: ${LOCAL_FALLBACK}`);
    raw = await readSource(LOCAL_FALLBACK);
  }

  const data = await writeData(raw);
  await rebuildReadme();

  console.log(`Synced ${data.entries.length} tools from source.`);
  console.log(`Data path: ${OUTPUT_PATH}`);
}

main().catch((error) => {
  console.error("Sync failed:", error);
  process.exit(1);
});

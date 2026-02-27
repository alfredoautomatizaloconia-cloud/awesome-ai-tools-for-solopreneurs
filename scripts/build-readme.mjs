import fs from "node:fs/promises";
import path from "node:path";

const DATA_PATH = path.resolve("data/tools.json");
const README_PATH = path.resolve("README.md");

function anchor(text) {
  return text.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-");
}

function prettyCategory(label) {
  const normalized = String(label || "").trim();
  const upperMap = new Map([
    ["Crm", "CRM"],
    ["Seo", "SEO"],
    ["Rpa", "RPA"],
    ["Ml", "ML"],
    ["Bi", "BI"],
  ]);

  return upperMap.get(normalized) || normalized;
}

function toCategoryOrder(entries) {
  const counts = new Map();
  for (const item of entries) {
    counts.set(item.categoryLabel, (counts.get(item.categoryLabel) || 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      return a[0].localeCompare(b[0]);
    })
    .map(([label]) => label);
}

function groupByCategory(entries) {
  const grouped = new Map();
  for (const item of entries) {
    if (!grouped.has(item.categoryLabel)) grouped.set(item.categoryLabel, []);
    grouped.get(item.categoryLabel).push(item);
  }
  return grouped;
}

function buildReadme(data) {
  const entries = data.entries || [];
  const categories = toCategoryOrder(entries);
  const grouped = groupByCategory(entries);

  const lines = [];
  lines.push("# Awesome AI Tools for Solopreneurs");
  lines.push("");
  lines.push("[![Awesome](https://awesome.re/badge.svg)](https://awesome.re)");
  lines.push("");
  lines.push("Curated operator-first AI tools for solopreneurs: practical picks, real pricing, and clear use cases.");
  lines.push("");
  lines.push("Maintained by [StackBuilt](https://stackbuilt.co).");
  lines.push("Use StackBuilt for implementation guides and ROI-driven tool decisions.");
  lines.push("");
  lines.push("## Policy");
  lines.push("- This list is curated for practical usage and business outcomes.");
  lines.push("- Links in this repository are non-affiliate.");
  lines.push("- Affiliate links and disclosures stay on stackbuilt.co.");
  lines.push("");
  lines.push("## Snapshot");
  lines.push(`- Tools: ${data.total}`);
  lines.push(`- Free tools: ${data.freeTools}`);
  lines.push(`- Founder-tested picks: ${data.founderTools}`);
  lines.push(`- Last sync: ${data.generatedAt}`);
  lines.push("");
  lines.push("## Contents");
  for (const category of categories) {
    const list = grouped.get(category) || [];
    const displayCategory = prettyCategory(category);
    lines.push(`- [${displayCategory}](#${anchor(displayCategory)}) (${list.length})`);
  }
  lines.push("");

  for (const category of categories) {
    const list = grouped.get(category) || [];
    const displayCategory = prettyCategory(category);
    lines.push(`## ${displayCategory}`);
    lines.push("");
    for (const item of list) {
      const price = item.priceText ? ` Price: ${item.priceText}.` : "";
      const desc = item.oneLiner ? ` - ${item.oneLiner}.` : "";
      lines.push(`- [${item.name}](${item.githubUrl})${desc}${price}`);
    }
    lines.push("");
  }

  lines.push("## Contributing");
  lines.push("- Read [CONTRIBUTING.md](CONTRIBUTING.md).");
  lines.push("- Open a PR using the provided template.");
  lines.push("");
  lines.push("## Related");
  lines.push("- [StackBuilt AI Tools Directory](https://stackbuilt.co/ai-tools-directory)");
  lines.push("- [Best Tools for Solopreneurs](https://stackbuilt.co/solopreneur-tools)");
  lines.push("- [Best Tools for Indie Hackers](https://stackbuilt.co/indie-hacker-tools)");
  lines.push("");
  lines.push("---");
  lines.push("This README is generated from `data/tools.json`.");

  return `${lines.join("\n")}\n`;
}

async function main() {
  const raw = await fs.readFile(DATA_PATH, "utf8");
  const data = JSON.parse(raw);
  const readme = buildReadme(data);
  await fs.writeFile(README_PATH, readme, "utf8");
  console.log(`README generated: ${README_PATH}`);
}

main().catch((error) => {
  console.error("Failed to build README:", error);
  process.exit(1);
});

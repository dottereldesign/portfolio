import { readdirSync } from "node:fs";
import { extname, join, relative } from "node:path";
import { spawnSync } from "node:child_process";

const repositoryRoot = new URL("../", import.meta.url);
const sourceDirectories = ["src/js", "scripts", "tests"];
const sourceFiles = ["script.js", "playwright.config.js"];

const collectJavaScript = (directory) => {
  const absoluteDirectory = new URL(`${directory}/`, repositoryRoot);
  return readdirSync(absoluteDirectory, { withFileTypes: true }).flatMap((entry) => {
    const child = join(directory, entry.name);
    if (entry.isDirectory()) return collectJavaScript(child);
    return [".js", ".mjs"].includes(extname(entry.name)) ? [child] : [];
  });
};

sourceDirectories.forEach((directory) => sourceFiles.push(...collectJavaScript(directory)));

for (const file of sourceFiles) {
  const result = spawnSync(process.execPath, ["--check", file], {
    cwd: repositoryRoot,
    encoding: "utf8",
  });

  if (result.status !== 0) {
    process.stderr.write(result.stderr || result.stdout);
    process.exit(result.status || 1);
  }

  process.stdout.write(`✓ ${relative(".", file)}\n`);
}

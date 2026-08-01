import { spawnSync } from "node:child_process";

await import("./check-syntax.mjs");

const unitTests = [
  "tests/unit/theme-state.test.js",
  "tests/unit/motion.test.js",
  "tests/unit/site-content.test.js",
];
const result = spawnSync(process.execPath, ["--test", ...unitTests], { stdio: "inherit" });

if (result.status !== 0) process.exit(result.status || 1);

import { spawnSync } from "node:child_process";

const commands = [
  ["--test", "tests/unit/theme-state.test.js", "tests/unit/motion.test.js", "tests/unit/site-content.test.js"],
  ["node_modules/@playwright/test/cli.js", "test"],
];

for (const argumentsList of commands) {
  const result = spawnSync(process.execPath, argumentsList, { stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status || 1);
}

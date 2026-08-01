import test from "node:test";
import assert from "node:assert/strict";

import { clamp01, getLoopPoint, invertMoveToken, smoothStep } from "../../src/js/lib/motion.js";

test("motion interpolation stays inside the expected range", () => {
  assert.equal(clamp01(-2), 0);
  assert.equal(clamp01(0.4), 0.4);
  assert.equal(clamp01(3), 1);
  assert.equal(smoothStep(0), 0);
  assert.equal(smoothStep(0.5), 0.5);
  assert.equal(smoothStep(1), 1);
});

test("loop points repeat exactly after one phase", () => {
  const start = getLoopPoint(0, 800, 400);
  const end = getLoopPoint(1, 800, 400);
  const quarter = getLoopPoint(0.25, 800, 400);

  assert.ok(Math.abs(start.x - end.x) < 1e-9);
  assert.ok(Math.abs(start.y - end.y) < 1e-9);
  assert.ok(Math.abs(quarter.x - 688) < 1e-9);
  assert.ok(Math.abs(quarter.y - 200) < 1e-9);
});

test("cube move tokens invert without changing double turns", () => {
  assert.equal(invertMoveToken("R"), "R'");
  assert.equal(invertMoveToken("F'"), "F");
  assert.equal(invertMoveToken("L2"), "L2");
});

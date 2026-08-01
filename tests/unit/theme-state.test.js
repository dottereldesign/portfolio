import test from "node:test";
import assert from "node:assert/strict";

import { getNextTheme, getThemeColour, normaliseTheme } from "../../src/js/lib/theme-state.js";

test("normaliseTheme accepts light and defaults every other value to dark", () => {
  assert.equal(normaliseTheme("light"), "light");
  assert.equal(normaliseTheme("dark"), "dark");
  assert.equal(normaliseTheme("system"), "dark");
  assert.equal(normaliseTheme(undefined), "dark");
});

test("theme helpers return the next state and matching browser colour", () => {
  assert.equal(getNextTheme("dark"), "light");
  assert.equal(getNextTheme("light"), "dark");
  assert.equal(getThemeColour("dark"), "#10110f");
  assert.equal(getThemeColour("light"), "#efebe2");
});

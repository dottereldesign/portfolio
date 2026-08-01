import { getNextTheme, getThemeColour, normaliseTheme } from "./lib/theme-state.js";

const root = document.documentElement;
const themeToggle = document.querySelector("[data-theme-toggle]");
const themeColorMeta = document.querySelector('meta[name="theme-color"]');
const themeMotionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
const themeViewTransitionPreference = window.matchMedia("(min-width: 801px) and (pointer: fine)");
const themeStorageKey = "jw-theme";

const storeValue = (key, value) => {
  try {
    window.localStorage.setItem(key, value);
  } catch {}
};

const applyTheme = (theme, { persist = true } = {}) => {
  const nextTheme = normaliseTheme(theme);
  const isDark = nextTheme === "dark";

  root.dataset.theme = nextTheme;
  root.style.colorScheme = nextTheme;
  themeToggle?.setAttribute("aria-pressed", String(isDark));
  themeToggle?.setAttribute("aria-label", isDark ? "Switch to light theme" : "Switch to dark theme");
  if (themeColorMeta) themeColorMeta.content = getThemeColour(nextTheme);
  if (persist) storeValue(themeStorageKey, nextTheme);
};

try {
  window.localStorage.removeItem("jw-theme-colors");
  window.localStorage.removeItem("jw-theme-toggle-size");
} catch {}

applyTheme(root.dataset.theme, { persist: false });

themeToggle?.addEventListener("click", () => {
  const nextTheme = getNextTheme(root.dataset.theme);
  const updateTheme = () => applyTheme(nextTheme);

  if (document.startViewTransition && !themeMotionPreference.matches && themeViewTransitionPreference.matches) {
    document.startViewTransition(updateTheme);
  } else {
    updateTheme();
  }
});

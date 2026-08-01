import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
});

test("homepage renders the positioning and navigates to the internal case study", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle("Jamie Wilson | Christchurch Web Developer");
  await expect(page.getByRole("heading", { level: 1, name: "Jamie Wilson" })).toBeVisible();
  await expect(page.locator(".capabilities__lede")).toContainText("Christchurch-based web developer");

  await page.getByRole("link", { name: /bewriteback/i }).click();
  await expect(page).toHaveURL(/\/projects\/bewriteback\/$/);
  await expect(page.getByRole("heading", { level: 1, name: "BeWriteBack" })).toBeVisible();
});

test("theme state is announced and persists across a reload", async ({ page }) => {
  await page.goto("/");
  const toggle = page.getByRole("button", { name: "Switch to light theme" });

  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  await toggle.click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(page.getByRole("button", { name: "Switch to dark theme" })).toHaveAttribute("aria-pressed", "false");

  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});

test("WebGL scenes initialise through the split rendering modules", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator(".hero__model")).toHaveClass(/hero__model--ready/, { timeout: 15_000 });
  await page.waitForTimeout(800);
  await expect(page.locator(".is-unavailable")).toHaveCount(0);
});

test("mobile quick links support keyboard dismissal without page overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  const toggle = page.locator("[data-quick-links-toggle]");
  await page.getByRole("button", { name: "Open portfolio links" }).click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Escape");
  await expect(toggle).toHaveAttribute("aria-expanded", "false");

  const widths = await page.evaluate(() => ({
    client: document.documentElement.clientWidth,
    scroll: document.documentElement.scrollWidth,
  }));
  expect(widths.scroll).toBe(widths.client);
});

test("crawl files are publicly reachable from the local build", async ({ request }) => {
  const [robots, sitemap, caseStudy] = await Promise.all([
    request.get("/robots.txt"),
    request.get("/sitemap.xml"),
    request.get("/projects/bewriteback/"),
  ]);

  expect(robots.ok()).toBeTruthy();
  expect(await robots.text()).toContain("Sitemap: https://dottereldesign.github.io/portfolio/sitemap.xml");
  expect(sitemap.ok()).toBeTruthy();
  expect(await sitemap.text()).toContain("projects/bewriteback/");
  expect(caseStudy.ok()).toBeTruthy();
});

for (const route of ["/", "/projects/bewriteback/"]) {
  test(`@accessibility ${route} has no serious WCAG regressions`, async ({ page }) => {
    await page.goto(route);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    const seriousViolations = results.violations.filter(({ impact }) => ["critical", "serious"].includes(impact));

    expect(seriousViolations, JSON.stringify(seriousViolations, null, 2)).toEqual([]);
  });
}

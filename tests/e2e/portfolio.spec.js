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

test("the toolkit carousel sits before GitHub activity, loops and pauses on hover", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");

  const toolkit = page.locator("#toolkit");
  await toolkit.scrollIntoViewIfNeeded();
  await expect(toolkit.locator(".toolkit-carousel__item:not([aria-hidden='true'])")).toHaveCount(25);
  await expect(toolkit.locator(".toolkit-carousel__item[aria-hidden='true']")).toHaveCount(25);
  await expect(toolkit.getByRole("button")).toHaveCount(0);
  await expect(page.locator("#cv")).toHaveCount(0);
  const toolkitBeforeGitHub = await toolkit.evaluate((element) => (
    element.compareDocumentPosition(document.querySelector("[data-github-activity]")) & Node.DOCUMENT_POSITION_FOLLOWING
  ));
  expect(toolkitBeforeGitHub).toBeTruthy();

  const viewport = toolkit.locator("[data-toolkit-viewport]");
  const movePointerOutsideToolkit = async () => {
    const [box, pageSize] = await Promise.all([toolkit.boundingBox(), page.viewportSize()]);
    if (!box || !pageSize) throw new Error("Toolkit geometry is unavailable");

    const corners = [
      { x: 1, y: 1 },
      { x: pageSize.width - 1, y: 1 },
      { x: 1, y: pageSize.height - 1 },
      { x: pageSize.width - 1, y: pageSize.height - 1 },
    ];
    const point = corners.find(({ x, y }) => (
      x < box.x || x > box.x + box.width || y < box.y || y > box.y + box.height
    ));

    if (!point) throw new Error("No pointer position outside the toolkit was found");
    await page.mouse.move(point.x, point.y);
  };

  await movePointerOutsideToolkit();
  await expect.poll(() => viewport.evaluate((element) => element.scrollLeft)).toBeGreaterThan(4);

  await toolkit.hover();
  const pausedPosition = await viewport.evaluate((element) => element.scrollLeft);
  await page.waitForTimeout(350);
  const positionAfterHover = await viewport.evaluate((element) => element.scrollLeft);
  expect(Math.abs(positionAfterHover - pausedPosition)).toBeLessThan(1);

  await movePointerOutsideToolkit();
  await expect.poll(() => viewport.evaluate((element) => element.scrollLeft)).toBeGreaterThan(pausedPosition + 3);
  await expect(page.getByRole("link", { name: "Current CV", exact: true })).toHaveAttribute("href", "assets/Jamie-Wilson-CV.pdf");
  await expect(page.getByRole("link", { name: /cv #2/i })).toHaveAttribute("href", "assets/Jamie-Wilson-CV-v2.pdf");
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

test("the real WebGL laptop loads automatically without a placeholder", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator(".hero__model-poster")).toHaveCount(0);
  await expect(page.locator(".hero__model")).toHaveClass(/hero__model--ready/, { timeout: 15_000 });
  await page.locator("[data-motion-study]").scrollIntoViewIfNeeded();
  await page.waitForTimeout(1_000);
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

test("the toolkit remains tidy without mobile overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.locator("#toolkit").scrollIntoViewIfNeeded();

  const widths = await page.evaluate(() => ({
    client: document.documentElement.clientWidth,
    scroll: document.documentElement.scrollWidth,
  }));

  expect(widths.scroll).toBe(widths.client);
  const viewport = page.locator("#toolkit [data-toolkit-viewport]");
  const carouselWidths = await viewport.evaluate((element) => ({ client: element.clientWidth, scroll: element.scrollWidth }));
  expect(carouselWidths.scroll).toBeGreaterThan(carouselWidths.client);
  await expect(page.locator("#toolkit .toolkit-carousel__item").first()).toBeVisible();
});

test("crawl files are publicly reachable from the local build", async ({ request }) => {
  const [robots, sitemap, caseStudy, actionPlan, reviewCv] = await Promise.all([
    request.get("/robots.txt"),
    request.get("/sitemap.xml"),
    request.get("/projects/bewriteback/"),
    request.get("/action-plan/"),
    request.get("/assets/Jamie-Wilson-CV-v2.pdf"),
  ]);

  expect(robots.ok()).toBeTruthy();
  expect(await robots.text()).toContain("Sitemap: https://dottereldesign.github.io/portfolio/sitemap.xml");
  expect(sitemap.ok()).toBeTruthy();
  expect(await sitemap.text()).toContain("projects/bewriteback/");
  expect(caseStudy.ok()).toBeTruthy();
  expect(actionPlan.ok()).toBeTruthy();
  expect(reviewCv.ok()).toBeTruthy();
  expect(reviewCv.headers()["content-type"]).toContain("application/pdf");
});

test("action plan is static, organised and linked from the footer", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: /action plan/i }).click();

  await expect(page).toHaveURL(/\/action-plan\/$/);
  await expect(page).toHaveTitle("Portfolio Action Plan | Jamie Wilson");
  await expect(page.getByRole("heading", { level: 1, name: "Portfolio & job-search action plan" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "Start here" })).toBeVisible();
  await expect(page.locator('input[type="checkbox"]')).toHaveCount(0);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex,follow");
});

test("action plan remains readable without mobile overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/action-plan/");

  const widths = await page.evaluate(() => ({
    client: document.documentElement.clientWidth,
    scroll: document.documentElement.scrollWidth,
  }));

  expect(widths.scroll).toBe(widths.client);
  await expect(page.getByRole("heading", { level: 2, name: "Start here" })).toBeVisible();
  await expect(page.getByText("Jade Software", { exact: true })).toBeVisible();
});

for (const route of ["/", "/projects/bewriteback/", "/action-plan/"]) {
  test(`@accessibility ${route} has no serious WCAG regressions`, async ({ page }) => {
    await page.goto(route);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    const seriousViolations = results.violations.filter(({ impact }) => ["critical", "serious"].includes(impact));

    expect(seriousViolations, JSON.stringify(seriousViolations, null, 2)).toEqual([]);
  });
}

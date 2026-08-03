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

test("the toolkit carousel sits directly after education and keeps looping on hover", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");

  const toolkit = page.locator("#toolkit");
  await toolkit.scrollIntoViewIfNeeded();
  await expect(toolkit.locator(".toolkit-carousel__item:not([aria-hidden='true'])")).toHaveCount(25);
  await expect(toolkit.locator(".toolkit-carousel__item[aria-hidden='true']")).toHaveCount(25);
  await expect(toolkit.getByRole("button")).toHaveCount(0);
  await expect(page.locator("#cv")).toHaveCount(0);
  const placement = await toolkit.evaluate((element) => ({
    followsHero: Boolean(document.querySelector(".hero").compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING),
    precedesCapabilities: Boolean(element.compareDocumentPosition(document.querySelector(".capabilities")) & Node.DOCUMENT_POSITION_FOLLOWING),
    previousElement: element.previousElementSibling?.className,
  }));
  expect(placement).toEqual({ followsHero: true, precedesCapabilities: true, previousElement: "hero" });

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
  const track = toolkit.locator("[data-toolkit-track]");
  const motionEngine = await track.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      animationName: style.animationName,
      duration: Number.parseFloat(style.animationDuration),
      willChange: style.willChange,
    };
  });
  expect(motionEngine.animationName).toBe("toolkit-carousel-loop");
  expect(motionEngine.duration).toBeGreaterThan(30);
  expect(motionEngine.willChange).toContain("transform");

  const getTrackOffset = () => track.evaluate((element) => {
    const transform = getComputedStyle(element).transform;
    if (transform === "none") return 0;
    const values = transform.slice(transform.indexOf("(") + 1, -1).split(",").map(Number);
    return transform.startsWith("matrix3d") ? values[12] : values[4];
  });
  await expect.poll(getTrackOffset).toBeLessThan(-3);
  expect(await viewport.evaluate((element) => element.scrollLeft)).toBe(0);

  await toolkit.hover();
  const hoveredPosition = await getTrackOffset();
  await page.waitForTimeout(350);
  const positionAfterHover = await getTrackOffset();
  expect(positionAfterHover).toBeLessThan(hoveredPosition - 3);
  expect(await track.evaluate((element) => getComputedStyle(element).animationPlayState)).toBe("running");

  await movePointerOutsideToolkit();
  await expect.poll(getTrackOffset).toBeLessThan(positionAfterHover - 3);
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

test("the hero uses one front-facing laptop with a covered webcam and compact dock", async ({ page }) => {
  await page.goto("/");

  const laptop = page.locator(".hero__model--static");
  const artwork = laptop.locator(".hero__static-laptop-art img");
  const dockItems = laptop.locator(".hero__dock-item");

  await expect(laptop).toBeVisible();
  await expect(page.locator("[data-laptop-picker], [data-laptop-option], .hero__laptop-controls")).toHaveCount(0);
  await expect(artwork).toBeVisible();
  await expect(dockItems).toHaveCount(11);
  await expect(page.locator(".hero__model-canvas")).toHaveCount(0);
  await expect(artwork).toHaveJSProperty("complete", true);
  expect(await artwork.evaluate((image) => image.currentSrc)).toMatch(/laptop-portrait-01\.(avif|webp)$/);

  const dockScale = await laptop.locator("[data-laptop-dock]").evaluate((element) => {
    const matrix = new DOMMatrix(getComputedStyle(element).transform);
    return {
      x: Math.hypot(matrix.m11, matrix.m12),
      y: Math.hypot(matrix.m21, matrix.m22),
    };
  });
  expect(dockScale.x).toBeCloseTo(1, 3);
  expect(dockScale.y).toBeCloseTo(1, 3);

  const crop = await laptop.evaluate((element) => {
    const box = element.getBoundingClientRect();
    return (box.right - window.innerWidth) / box.width;
  });
  expect(crop).toBeGreaterThan(0.15);
  expect(crop).toBeLessThan(0.3);

  const figma = laptop.locator('.hero__dock-item[data-label="Figma"]');
  const figmaScale = await figma.evaluate((element) => {
    const itemWidth = Number.parseFloat(getComputedStyle(element).width);
    const imageWidth = Number.parseFloat(getComputedStyle(element.querySelector("img")).width);
    return imageWidth / itemWidth;
  });
  expect(figmaScale).toBeCloseTo(0.7, 2);
  await figma.hover();
  expect(await figma.evaluate((element) => getComputedStyle(element).transform)).not.toBe("none");
  await expect.poll(() => figma.evaluate((element) => getComputedStyle(element, "::after").opacity)).toBe("1");

  const heroResources = await page.evaluate(() => performance.getEntriesByType("resource").map(({ name }) => name));
  expect(heroResources.some((name) => /macbook\.glb|laptop-runtime/.test(name))).toBeFalsy();
});

test("display headings protect descenders and body copy has readable leading", async ({ page }) => {
  await page.goto("/");
  const heading = page.locator("#capabilities-title em");
  await heading.scrollIntoViewIfNeeded();

  const typography = await page.evaluate(() => {
    const headingElement = document.querySelector("#capabilities-title em");
    const paragraph = document.querySelector(".capabilities__lede");
    const headingStyle = getComputedStyle(headingElement);
    const paragraphStyle = getComputedStyle(paragraph);
    return {
      headingBoxRatio: headingElement.getBoundingClientRect().height / Number.parseFloat(headingStyle.fontSize),
      paragraphLineRatio: Number.parseFloat(paragraphStyle.lineHeight) / Number.parseFloat(paragraphStyle.fontSize),
    };
  });

  expect(typography.headingBoxRatio).toBeGreaterThan(1);
  expect(typography.paragraphLineRatio).toBeGreaterThanOrEqual(1.65);
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
  const reducedMotionState = await page.locator("#toolkit [data-toolkit-track]").evaluate((element) => {
    const style = getComputedStyle(element);
    return { animationName: style.animationName, transform: style.transform, willChange: style.willChange };
  });
  expect(reducedMotionState).toEqual({ animationName: "none", transform: "none", willChange: "auto" });
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

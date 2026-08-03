import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir, stat } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const read = (file) => readFile(new URL(`../../${file}`, import.meta.url), "utf8");

test("homepage retains its recruiter-focused SEO and project content", async () => {
  const html = await read("index.html");
  const projectCards = html.match(/<a class="project-card(?:\s[^\"]*)?"/g) || [];

  assert.match(html, /<title>Jamie Wilson \| Christchurch Web Developer<\/title>/);
  assert.match(html, /<link rel="canonical" href="https:\/\/dottereldesign\.github\.io\/portfolio\/"/);
  assert.match(html, /"@type": "ProfilePage"/);
  assert.match(html, /"@type": "Person"/);
  assert.match(html, /href="projects\/bewriteback\/"/);
  assert.equal(projectCards.length, 10);
});

test("crawl files and the first-party case study remain present", async () => {
  const [robots, sitemap, caseStudy, actionPlan] = await Promise.all([
    read("robots.txt"),
    read("sitemap.xml"),
    read("projects/bewriteback/index.html"),
    read("action-plan/index.html"),
  ]);

  assert.match(robots, /Sitemap: https:\/\/dottereldesign\.github\.io\/portfolio\/sitemap\.xml/);
  assert.match(sitemap, /projects\/bewriteback\//);
  assert.match(caseStudy, /<title>BeWriteBack Case Study \| Jamie Wilson<\/title>/);
  assert.match(caseStudy, /href="\.\.\/\.\.\/action-plan\//);
  assert.match(actionPlan, /<title>Portfolio Action Plan \| Jamie Wilson<\/title>/);
  assert.match(actionPlan, /<meta name="robots" content="noindex,follow"/);
  assert.match(actionPlan, /No boxes are interactive/);
  assert.match(actionPlan, /Jade Software/);
  assert.doesNotMatch(actionPlan, /type="checkbox"/);
});

test("homepage footer links to the action plan", async () => {
  const html = await read("index.html");
  assert.match(html, /href="action-plan\/">Action plan/);
  assert.match(html, /href="assets\/Jamie-Wilson-CV\.pdf"[^>]*>Current CV/);
  assert.match(html, /href="assets\/Jamie-Wilson-CV-v2\.pdf"[^>]*>CV #2 \(review\)/);
});

test("homepage places a minimalist automatic toolkit carousel before GitHub activity", async () => {
  const html = await read("index.html");
  const carouselScript = await read("src/js/toolkit-carousel.js");
  const sectionsCss = await read("styles/sections.css");
  const toolkitItems = html.match(/class="toolkit-carousel__item"/g) || [];
  const toolkitPosition = html.indexOf('id="toolkit"');
  const githubPosition = html.indexOf('data-github-activity');

  assert.doesNotMatch(html, /id="cv"/);
  assert.match(html, /id="toolkit"/);
  assert.match(html, /data-toolkit-track/);
  assert.match(html, /Automatically scrolling tools and technologies\. Keeps moving on hover; focus to pause\./);
  assert.doesNotMatch(html, /Toolkit \/ 25 tools/);
  assert.doesNotMatch(html, /Design, development, CMS, delivery and AI\./);
  assert.doesNotMatch(html, /data-toolkit-previous/);
  assert.doesNotMatch(html, /data-toolkit-next/);
  assert.doesNotMatch(html, /class="toolkit-section"/);
  assert.ok(toolkitPosition > 0 && toolkitPosition < githubPosition, "toolkit carousel should sit before GitHub activity");
  assert.equal(toolkitItems.length, 25);
  assert.doesNotMatch(carouselScript, /scrollLeft\s*\+=/);
  assert.match(sectionsCss, /@keyframes toolkit-carousel-loop/);
  assert.match(sectionsCss, /animation-play-state:\s*paused/);
  assert.doesNotMatch(sectionsCss, /\.toolkit-carousel:hover/);

  for (const label of [
    "Figma", "HTML", "CSS", "JavaScript", "TypeScript", "PHP", "React",
    "WordPress", "Hail CMS", "Gutenberg", "Divi", "Elementor", "Avada",
    "Git", "GitHub", "VS Code", "LocalWP", "WP-CLI", "Cloudways", "WPStaq", "DNS",
    "Notion", "HelpScout", "Codex", "AI-assisted development",
  ]) {
    assert.match(html, new RegExp(`<span>${label}<\\/span>`));
  }
});

test("the former career journey is removed and the action plan reflects current priorities", async () => {
  const [html, actionPlan, cv] = await Promise.all([
    read("index.html"),
    read("action-plan/index.html"),
    stat(new URL("../../assets/Jamie-Wilson-CV-v2.pdf", import.meta.url)),
  ]);

  assert.doesNotMatch(html, /id="journey"/);
  assert.doesNotMatch(html, /class="career-path"/);
  assert.doesNotMatch(html, /The path so far/);
  assert.doesNotMatch(html, /From study/);
  assert.doesNotMatch(actionPlan, /Add ownership metadata/i);
  assert.doesNotMatch(actionPlan, /Draft the Waikato/i);
  assert.doesNotMatch(actionPlan, /Draft one more client/i);
  assert.ok(cv.size > 5_000, "CV #2 should be a populated PDF");
});

test("the hero uses one laptop with five optimised portrait treatments and a compact dock", async () => {
  const [html, manifest, styles] = await Promise.all([
    read("index.html"),
    read("script.js"),
    read("styles/base.css"),
  ]);

  const dockItems = html.match(/class="hero__dock-item"/g) || [];

  assert.match(html, /data-static-laptop/);
  assert.match(html, /data-laptop-picker/);
  assert.equal((html.match(/data-laptop-option/g) || []).length, 5);
  assert.equal(new Set(html.match(/laptop-portrait-0[1-5]\.avif/g) || []).size, 5);
  assert.equal(dockItems.length, 11);
  assert.doesNotMatch(html, /laptop-0[1-7]\.(?:avif|webp)/);
  assert.doesNotMatch(html, /perspective|high angle|top-down pair/i);
  assert.doesNotMatch(html, /hero__model-canvas/);
  assert.doesNotMatch(html, /data-laptop-enhancement/);
  assert.doesNotMatch(html, /rel="modulepreload"[^>]*laptop-runtime/);
  assert.doesNotMatch(html, /rel="preload"[^>]*macbook\.glb/);
  assert.doesNotMatch(manifest, /laptop-loader\.js/);
  assert.match(manifest, /laptop-picker\.js/);
  assert.match(manifest, /motion-lab\/loader\.js/);
  assert.doesNotMatch(styles, /scaleY\(var\(--dock-scale-y\)\)/);
  assert.match(html, /--dock-width: 43%/);
  assert.match(styles, /hero__dock-item img \{[^}]*width: 88%; height: 88%;/);
  assert.match(styles, /hero__dock-item\[data-label="Figma"\] img \{ width: 70%; height: 70%; \}/);
});

test("source files stay divided by responsibility", async () => {
  const rootEntry = await read("script.js");
  const sourceRoot = fileURLToPath(new URL("../../src/js/", import.meta.url));
  const sourceFiles = [];
  const stylesheetFiles = ["base.css", "sections.css", "themes.css", "responsive.css"];

  const collect = async (directory) => {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) await collect(path);
      else if (entry.name.endsWith(".js")) sourceFiles.push(path);
    }
  };

  await collect(sourceRoot);
  assert.ok(rootEntry.trim().split(/\r?\n/).length <= 12, "script.js should remain a small module manifest");

  for (const file of sourceFiles) {
    const contents = await readFile(file, "utf8");
    const lineCount = contents.split(/\r?\n/).length;
    assert.ok(lineCount <= 800, `${file} has grown beyond the 800-line module limit`);
  }

  for (const file of stylesheetFiles) {
    const contents = await read(`styles/${file}`);
    const lineCount = contents.split(/\r?\n/).length;
    assert.ok(lineCount <= 900, `${file} has grown beyond the 900-line stylesheet limit`);
  }

  await assert.rejects(stat(new URL("../../motion-lab.js", import.meta.url)));
  await assert.rejects(stat(new URL("../../styles.css", import.meta.url)));
});

test("README describes the live work instead of promising future projects", async () => {
  const readme = await read("README.md");
  assert.doesNotMatch(readme, /Projects and case studies will be added/i);
  assert.match(readme, /BeWriteBack/i);
  assert.match(readme, /npm run test/i);
});

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

test("every portfolio page uses the rounded Logo 08 favicons", async () => {
  const [homepage, actionPlan, logoOptions, caseStudy, lightIcon, darkIcon, touchIcon, legacyIcon] = await Promise.all([
    read("index.html"),
    read("action-plan/index.html"),
    read("logo-options/index.html"),
    read("projects/bewriteback/index.html"),
    stat(new URL("../../assets/favicons/favicon-light.png", import.meta.url)),
    stat(new URL("../../assets/favicons/favicon-dark.png", import.meta.url)),
    stat(new URL("../../assets/favicons/apple-touch-icon.png", import.meta.url)),
    stat(new URL("../../favicon.ico", import.meta.url)),
  ]);

  assert.match(homepage, /href="assets\/favicons\/favicon-light\.png"/);
  assert.match(homepage, /href="assets\/favicons\/favicon-dark\.png" media="\(prefers-color-scheme: dark\)"/);
  assert.match(actionPlan, /href="\.\.\/assets\/favicons\/favicon-dark\.png"/);
  assert.match(logoOptions, /href="\.\.\/assets\/favicons\/favicon-dark\.png"/);
  assert.match(caseStudy, /href="\.\.\/\.\.\/assets\/favicons\/favicon-dark\.png"/);
  assert.doesNotMatch(`${homepage}${caseStudy}`, /data:image\/svg\+xml/);
  [lightIcon, darkIcon, touchIcon, legacyIcon].forEach(({ size }) => assert.ok(size > 1_000 && size < 30_000));
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
  assert.match(html, /href="logo-options\/">Logo options/);
  assert.match(html, /href="assets\/Jamie-Wilson-CV\.pdf"[^>]*>Current CV/);
  assert.match(html, /href="assets\/Jamie-Wilson-CV-v2\.pdf"[^>]*>CV #2 \(review\)/);
});

test("homepage includes the South Island Christchurch location study", async () => {
  const html = await read("index.html");
  const studies = html.match(/class="location-study location-study--/g) || [];
  const markers = html.match(/class="location-study__marker"/g) || [];
  const assetStats = await Promise.all([
    "south-island-architecture-cutout.webp",
  ].map((file) => stat(new URL(`../../assets/location-studies/${file}`, import.meta.url))));

  assert.equal(studies.length, 1);
  assert.equal(markers.length, 1);
  assert.equal((html.match(/How I work \/ 0\d/g) || []).length, 1);
  assert.doesNotMatch(html, /01 \/ South Island|Architectural study/);
  assert.equal((html.match(/<strong>Christchurch, NZ<\/strong>/g) || []).length, 1);
  assert.doesNotMatch(html, /43\.5321|172\.6362/);
  assert.match(html, /assets\/location-studies\/south-island-architecture-cutout\.webp/);
  assert.doesNotMatch(html, /assets\/location-studies\/(?:canterbury-topography|christchurch-globe)\.webp/);
  assert.equal((html.match(/fetchpriority="low"/g) || []).length, 1);
  assetStats.forEach(({ size }) => assert.ok(size < 400_000, "location artwork should remain web-optimised"));
});

test("logo options page presents three generated 3x3 navbar concept sheets", async () => {
  const [html, homepage, actionPlan, caseStudy] = await Promise.all([
    read("logo-options/index.html"),
    read("index.html"),
    read("action-plan/index.html"),
    read("projects/bewriteback/index.html"),
  ]);
  const sheets = html.match(/class="concept-sheet__numbers"/g) || [];
  const labels = html.match(/<span(?: class="is-active")?>(?:0[1-9]|1[0-8]|02[A-I])<\/span>/g) || [];

  assert.equal(sheets.length, 3);
  assert.equal(labels.length, 27);
  assert.match(html, /Twenty-seven ways to sign the work/);
  assert.match(html, /Option 08 is active/);
  assert.match(html, /assets\/logo-options\/jw-logo-concepts\.png/);
  assert.match(html, /assets\/logo-options\/jw-logo-concepts-new-directions\.png/);
  assert.match(html, /assets\/logo-options\/jw-logo-concept-02-variations\.png/);
  assert.match(html, /width="1254" height="1254"/);
  assert.doesNotMatch(html, /<svg\b/);

  assert.match(homepage, /src="assets\/logo-options\/jw-logo-08\.png"/);
  assert.match(actionPlan, /src="\.\.\/assets\/logo-options\/jw-logo-08\.png"/);
  assert.match(caseStudy, /src="\.\.\/\.\.\/assets\/logo-options\/jw-logo-08\.png"/);
  assert.match(html, /src="\.\.\/assets\/logo-options\/jw-logo-08\.png"/);
});

test("homepage places an icon-only theme-aware toolkit carousel directly after education", async () => {
  const html = await read("index.html");
  const carouselScript = await read("src/js/toolkit-carousel.js");
  const sectionsCss = await read("styles/sections.css");
  const themesCss = await read("styles/themes.css");
  const toolkitItems = html.match(/class="toolkit-carousel__item"/g) || [];
  const toolkitPosition = html.indexOf('id="toolkit"');
  const heroEndPosition = html.indexOf("</main>");
  const capabilitiesPosition = html.indexOf('<section class="capabilities"');
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
  assert.ok(heroEndPosition < toolkitPosition && toolkitPosition < capabilitiesPosition, "toolkit carousel should sit immediately after the hero education strip");
  assert.ok(toolkitPosition < githubPosition, "toolkit carousel should remain before GitHub activity");
  assert.match(html, /toolkit-carousel toolkit-carousel--after-study/);
  assert.equal(toolkitItems.length, 25);
  assert.doesNotMatch(carouselScript, /scrollLeft\s*\+=/);
  assert.match(sectionsCss, /@keyframes toolkit-carousel-loop/);
  assert.match(sectionsCss, /@keyframes toolkit-item-reveal/);
  assert.match(sectionsCss, /animation-play-state:\s*paused/);
  assert.doesNotMatch(sectionsCss, /\.toolkit-carousel:hover/);
  assert.doesNotMatch(sectionsCss, /\.toolkit-carousel--after-study\s*\{[^}]*border-bottom/);
  assert.match(themesCss, /html\[data-theme="light"\] \.toolkit-carousel--after-study/);
  assert.match(carouselScript, /--toolkit-reveal-index/);
  assert.match(carouselScript, /toolkit-carousel--revealed/);

  for (const label of [
    "Figma", "HTML", "CSS", "JavaScript", "TypeScript", "PHP", "React",
    "WordPress", "Hail CMS", "Gutenberg", "Divi", "Elementor", "Avada",
    "Git", "GitHub", "VS Code", "LocalWP", "WP-CLI", "Cloudways", "WPStaq", "DNS",
    "Notion", "HelpScout", "Codex", "AI-assisted development",
  ]) {
    assert.match(html, new RegExp(`aria-label="${label}"`));
    assert.doesNotMatch(html, new RegExp(`<span>${label}<\\/span>`));
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

test("the hero uses one optimised laptop image with a covered webcam and compact dock", async () => {
  const [html, manifest, styles, sourceNotes] = await Promise.all([
    read("index.html"),
    read("script.js"),
    read("styles/base.css"),
    read("assets/laptop/options/SOURCE.md"),
  ]);

  const dockItems = html.match(/class="hero__dock-item"/g) || [];

  assert.match(html, /data-static-laptop/);
  assert.doesNotMatch(html, /data-laptop-picker|data-laptop-option|hero__laptop-controls/);
  assert.equal(new Set(html.match(/laptop-portrait-01\.avif/g) || []).size, 1);
  assert.doesNotMatch(html, /laptop-portrait-0[2-5]\.(?:avif|webp)/);
  assert.equal(dockItems.length, 11);
  assert.doesNotMatch(html, /laptop-0[1-7]\.(?:avif|webp)/);
  assert.doesNotMatch(html, /perspective|high angle|top-down pair/i);
  assert.doesNotMatch(html, /hero__model-canvas/);
  assert.doesNotMatch(html, /data-laptop-enhancement/);
  assert.doesNotMatch(html, /rel="modulepreload"[^>]*laptop-runtime/);
  assert.doesNotMatch(html, /rel="preload"[^>]*macbook\.glb/);
  assert.doesNotMatch(manifest, /laptop-loader\.js/);
  assert.match(manifest, /motion-lab\/loader\.js/);
  assert.doesNotMatch(styles, /scaleY\(var\(--dock-scale-y\)\)/);
  assert.match(html, /--dock-width: 43%/);
  assert.match(styles, /hero__dock-item img \{[^}]*width: 88%; height: 88%;/);
  assert.match(styles, /hero__dock-item\[data-label="Figma"\] img \{ width: 70%; height: 70%; \}/);
  assert.doesNotMatch(manifest, /laptop-picker\.js/);
  assert.match(sourceNotes, /matte webcam cover/i);
});

test("homepage display headings and body copy have safe vertical spacing", async () => {
  const [baseStyles, sectionStyles] = await Promise.all([
    read("styles/base.css"),
    read("styles/sections.css"),
  ]);

  assert.match(baseStyles, /\.hero__intro \{[^}]*line-height: 1\.7;/);
  assert.match(sectionStyles, /\.capabilities h2 \{[^}]*line-height: 0\.98;/);
  assert.match(sectionStyles, /padding-block: 0\.06em 0\.13em/);
  assert.match(sectionStyles, /\.capabilities__lede \{[^}]*line-height: 1\.7;/);
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

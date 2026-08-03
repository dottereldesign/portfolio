# Jamie Wilson — Portfolio

[![Quality](https://github.com/dottereldesign/portfolio/actions/workflows/quality.yml/badge.svg)](https://github.com/dottereldesign/portfolio/actions/workflows/quality.yml)

The source for [Jamie Wilson’s portfolio](https://dottereldesign.github.io/portfolio/), a static, responsive website aimed at technology recruiters and employers in Christchurch and remote-first teams across New Zealand.

I’m a Christchurch-based web developer with commercial experience delivering WordPress and CMS websites across New Zealand and Australia. My work spans UI, front-end implementation, integrations, QA and launch support.

## Featured work

The portfolio currently presents ten projects across commercial delivery, product development and front-end experimentation:

- Waikato Diocesan School for Girls
- [BeWriteBack](https://dottereldesign.github.io/portfolio/projects/bewriteback/) — first-party React and TypeScript PWA case study
- Schooled’s Election Pilot
- Wairarapa Cobham Intermediate
- Darfield High School
- Human vs the World
- Day/Night Toggle
- Southern Health School
- Pepa Kutikuti Kōura
- Christchurch Girls’ High School — Past, Present, Future

## Architecture

The site is served directly by GitHub Pages without an application build step. Browser behaviour is organised as native ES modules:

```text
script.js                       Module entry point
src/js/
├── theme.js                    Theme state and persistence
├── navigation.js               Header and quick-link navigation
├── text-scramble.js            Hero text animation
├── section-reveals.js          Intersection-based section animation
├── github-activity.js          GitHub contribution data loading
├── hero-laptop.js              Laptop scene orchestration
├── laptop-artwork.js           Generated laptop textures and artwork
├── laptop-screen.js            Interactive screen and dock rendering
├── lib/                        Tested, side-effect-free helpers
└── motion-lab/
    ├── controller.js           Animation lifecycle and rendering loop
    └── scenes.js               Three.js scene construction

styles/
├── base.css                    Foundations, header and hero
├── sections.css                Capabilities, work, journey, toolkit and footer
├── themes.css                  Light-theme overrides
└── responsive.css              Keyframes, breakpoints and reduced motion
```

The bundled Three.js exports used by the WebGL scenes are generated from `src/laptop-runtime.js` and committed at `assets/vendor/laptop-runtime.min.js` so the deployed site has no package-manager dependency.

## Development

Install dependencies and run the local test server:

```sh
npm install
node tests/server.mjs
```

Then open `http://127.0.0.1:4174`.

If the Three.js version or exported runtime symbols change, rebuild the committed browser bundle:

```sh
npm run build:laptop-runtime
```

If the modular stylesheets change, rebuild the committed minified homepage bundle:

```sh
npm run build:css
```

## Testing

```sh
npm run check               # Syntax checks and Node unit tests
npm run test:unit           # Theme, motion, content and architecture tests
npm run test:e2e            # Chromium interaction and route tests
npm run test:accessibility  # Axe WCAG regression checks
npm test                    # Unit, browser and accessibility suite
```

The Playwright suite covers recruiter-facing content, the visual toolkit, internal case-study navigation, persistent theme state, split WebGL initialisation, responsive quick links, crawl files and horizontal overflow. Axe checks the homepage, BeWriteBack case study and action plan for serious WCAG regressions.

GitHub Actions runs the full quality suite on every push to `main` and on pull requests. It also rebuilds the laptop runtime and fails if the committed bundle is out of date.

## Search and sharing

The repository includes canonical URLs, Open Graph and social-card metadata, `ProfilePage` and `Person` structured data, a sitemap, a robots file and a dedicated portfolio preview image.

## Contact

For full-time web development opportunities in Christchurch or remote roles across New Zealand, use the contact links on the [live portfolio](https://dottereldesign.github.io/portfolio/).

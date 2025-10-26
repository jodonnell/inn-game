# Repository Guidelines

The inn-game project renders Pixi.js scenes via Vite. Use this guide to keep contributions aligned, reviewable, and deployable.

## Project Structure & Module Organization
- `src/` holds source modules; `src/draw/test.js` bootstraps the Pixi renderer consumed by `main.js`.
- `assets/` stores deployable fonts and spritesheets; avoid committing oversized binaries unless required.
- `test/logic/` contains Jest specs for gameplay logic; mirror the source path when adding new suites.
- `scripts/deploy.sh` automates the GitHub Pages workflow and assumes promotion from `main` to `deploy`.

## Build, Test, and Development Commands
- `npm run dev`: Launches the Vite dev server with hot reload at `http://localhost:5173/`.
- `npm run build`: Produces the optimized `dist/` bundle used for deployments.
- `npm run preview`: Serves the production build locally; run before shipping.
- `npm run lint`: Runs ESLint on `src/**/*.js` and `test/**/*.js`.
- `npm run prettier`: Formats JS files in `src/` and `test/`.
- `npm run test`: Executes the Jest suite (ESM mode) under `test/`.
- `npm run test:e2e`: Starts Vite and runs Playwright across Chromium, Firefox, and WebKit.
- `npm run test:e2e:headed`: Equivalent to the above but keeps browser windows visible for debugging.

## Coding Style & Naming Conventions
- Follow Prettier defaults (2-space indent, double quotes, trailing semicolons) and keep files ESM (`import`/`export`).
- Name modules with lowercase-dash directories (`draw/`); use PascalCase for exported classes and camelCase for functions or constants.
- Access shared roots via the Vite alias `@/` pointing to the repository root.
- Create a modular codebase.  I like books authors like Sandi Metz, Robert Martin, Martin Fowler and Kent Beck.

## Testing Guidelines
- Write Jest specs beside their logical area (e.g., `test/logic/board.test.js`); suffix files with `.test.js`.
- Target edge conditions and rendering hooks; stub Pixi APIs when the suite cannot mimic the browser.
- Run the test suites liberally to keep a tight feedback loop; quick iterations help catch regressions early.
- Run `npm run test` before pushing and add snapshots only when they stabilize behavior.
- Run `npm run test:e2e` frequently to exercise canvas flows end-to-end and keep parity with manual playtests.
- Use Playwright (`tests/e2e/`) for canvas or input flows; keep e2e specs deterministic by leveraging locators instead of timing sleeps.
- Use behavior driven testing, i dont want to test the implementation.

## Commit & Pull Request Guidelines
- Keep commit subjects in the imperative mood, mirroring the existing `Initial commit`.
- Scope commits narrowly; include rationale in the body when behavior changes.
- PRs should describe user-facing outcomes, link issues, and include screenshots or GIFs for visual updates.
- Highlight asset or deployment changes so reviewers can rerun `scripts/deploy.sh`.

## Deployment & Asset Notes
- `scripts/deploy.sh` rewrites `index.html` and overlays `assets/`; run from a clean tree to avoid accidental deletions.
- When adding sprites or fonts, update `assets/` and ensure `src/draw/test.js` references the correct paths under the `@/assets/` alias.

## Game notes
- this game will be somewhat like stardew valley

# Repository Guidelines

## Project Structure & Module Organization
- `main.ts` → plugin entry (source); `main.js` → generated bundle (do not edit).
- `manifest.json`, `styles.css`, `styles-mobile.css` → Obsidian plugin metadata and styles.
- `src/` (DDD-style layers): `application/`, `domain/`, `infrastructure/`, `presentation/`, `shared/`.
- `tests/` → Jest unit/integration/e2e; mocks in `tests/__mocks__/`.
- `features/` → Cucumber BDD `.feature` files and step definitions.
- `docs/`, `examples/` → reference and usage materials.

## Build, Test, and Development Commands
- `npm run dev` — start esbuild in watch mode; rebuilds `main.js` on change.
- `npm run build` — type-check (`tsc`) then production bundle via esbuild.
- `npm test` | `npm run test:watch` | `npm run test:coverage` — run Jest (jsdom env, TS via ts-jest).
- `npm run test:bdd` — run Cucumber; profiles: `test:bdd:smoke`, `test:bdd:ci`.
- `npm run test:all` — run Jest then Cucumber.
- `npm run version` — bump versions and stage `manifest.json` and `versions.json`.

## Coding Style & Naming Conventions
- Language: TypeScript (strict null checks). Target ES2018/CJS bundle.
- Files/dirs: kebab-case for files (e.g., `modal.test.ts`), lowercase dirs; PascalCase classes; camelCase functions.
- Module layout follows DDD layers; keep domain logic in `src/domain`, UI in `src/presentation`.
- Generated artifacts: never edit `main.js`; change TS sources and rebuild.

## Testing Guidelines
- Framework: Jest with `jsdom`; tests live in `tests/` and match `*.test.ts|*.spec.ts`.
- Coverage: global thresholds at 70% (branches, functions, lines, statements). Use `npm run test:coverage`.
- BDD: Cucumber features in `features/`; step files in `features/**/*.steps.ts`.
  - Env: `OBSIDIAN_PATH` (defaults to `/Applications/Obsidian.app`), `TEST_VAULT_PATH` (`./test-vault`).
  - Reports: `test-results/` (HTML/JSON; JUnit in CI profile).

## Commit & Pull Request Guidelines
- Commit style: Conventional Commits (`feat:`, `fix:`, `docs:`) as seen in history.
- PRs: clear description, linked issue, test updates, and screenshots/GIFs for UI changes.
- Keep changes scoped to a layer; include rationale and migration notes if refactoring.

## Security & Configuration Tips
- Do not commit secrets or local vault contents. Avoid absolute, user-specific paths.
- Validate `manifest.json` coherence with `package.json` version via `npm run version` before release.

## Run in Obsidian Vault
- Folder: plugin directory must equal manifest `id` (`exocortex-obsidian-plugin`). Path: `<VAULT>/.obsidian/plugins/exocortex-obsidian-plugin/`.
- Build: `npm run dev` (watch) or `npm run build` (prod) to generate `main.js`.
- Copy (macOS/Linux): `mkdir -p "$VAULT/.obsidian/plugins/exocortex-obsidian-plugin" && cp manifest.json main.js styles.css styles-mobile.css "$VAULT/.obsidian/plugins/exocortex-obsidian-plugin/"`.
- Or symlink files: `ln -sf "$(pwd)"/{manifest.json,main.js,styles.css,styles-mobile.css} "$VAULT/.obsidian/plugins/exocortex-obsidian-plugin/"`.
- Enable: Obsidian → Settings → Community plugins → enable “Exocortex”; toggle the plugin or use “Reload app”/“Reload plugins” for changes.

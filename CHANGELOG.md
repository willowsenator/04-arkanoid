# Changelog

All notable changes to this project will be documented in this file.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

#### Gameplay
- Core Arkanoid game loop: paddle, ball, and brick grid with wall, paddle, and brick collision resolution, lives tracking, and win/game-over states.
- Canvas rendering of the paddle, ball, and brick grid, with a heart-icon lives indicator.
- Keyboard (arrow keys and A/D) and mouse control of the paddle, plus a restart button.

#### Tooling
- `.github/copilot-instructions.md` and `.github/instructions/code-review.instructions.md` documenting the project architecture and review rules for automated code review.

### Changed

#### Tooling
- Migrated all `js/` modules from UMD wrappers (dual CommonJS/browser-global) to native ES modules (`import`/`export`); `index.html` now loads a single `<script type="module" src="js/main.js">` and the browser's import graph resolves dependency order.
- Converted the test suite from `tests/*.test.js` to TypeScript (`tests/*.test.ts`), run directly by Node's native TypeScript support (type stripping) — no build step, no `ts-node`.
- Added a minimal `package.json` and `tsconfig.json` for optional `npx tsc --noEmit` type-checking of the test suite; neither is required to run the game or the tests.
- **Breaking for local use:** `index.html` can no longer be opened directly via `file://` — ES module scripts are blocked by browser CORS on the `file://` origin. Serve the directory with a local static server instead (e.g. `python3 -m http.server`).

[Unreleased]: https://github.com/willowsenator/04-arkanoid/compare/cc8b2cd...HEAD

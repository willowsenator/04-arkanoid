# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A vanilla-JS Arkanoid/breakout clone rendered on an HTML5 canvas. No build step, no bundler — `index.html` loads a single `<script type="module" src="js/main.js">`, and every module in `js/` is a native ES module (`import`/`export`) that Node and the browser both load directly with no transpilation. `package.json` exists only to pull in `@types/node` and `typescript` as `devDependencies` for editor/`tsc --noEmit` type-checking of the TypeScript test suite — it declares no `scripts` and is never required to run the game or the tests.

## Commands

Run all tests:

```
node --test 'tests/*.test.ts'
```

(A bare `node --test tests/` directory path does not reliably work across Node versions —
use the glob form above, or run bare `node --test` from the project root.)

Run a single test file:

```
node --test tests/ball.test.ts
```

Tests are TypeScript (`tests/*.test.ts`), run directly by Node's native TypeScript support
(type stripping) — no `tsc` compile step and no `ts-node`. This requires a Node version with
unflagged native TypeScript support (verified on v24.11.1); `npx tsc --noEmit` optionally
type-checks the test suite using the `@types/node` devDependency in `package.json`, but
that check is never required to run the tests or the game.

There is no lint/build command and no npm `scripts` — don't assume any exist. Running the
game or the tests needs nothing installed; `npm install` is only a one-time prerequisite for
the optional `npx tsc --noEmit` type-check, to pull in the `@types/node` and `typescript`
devDependencies it needs.

To view the game itself, serve the directory statically (e.g. `python3 -m http.server`) and
open it in a browser — `index.html` loads `js/main.js` as an ES module, and module scripts
are blocked by CORS when opened directly via `file://` in current browsers, so a local
server is required (there's still no dev server beyond that).

## Architecture

Each module in `js/` is a native ES module:

```js
import * as Other from './other.js';

export function thing() { ... }
```

Both Node (via `tests/*.test.ts`, using native TypeScript type stripping) and the browser
(via `index.html`'s single `<script type="module" src="js/main.js">`) load these files
directly with no transpilation — the browser's import graph resolves dependency order on
its own. When adding a new module, `export` its public API and `import` whatever sibling
modules it needs; no `<script>` tag or dependency-order bookkeeping in `index.html` is
required for anything but `main.js` itself.

Module responsibilities (dependency order — each imports only what's listed as a
dependency; only `main.js` is loaded directly by `index.html`, as an ES module):

1. **`geometry.js`** — pure math: `clamp`, `circleRectCollision` (circle-vs-rect hit test with side detection), `reflect` (flip vx/vy by hit side), `paddleBounceVelocity` (angle the ball off paddle-hit position, preserving speed). No dependencies.
2. **`restart.js`** — pure restart-trigger logic: `isRestartKey(key)` (true for Enter/Space) and `canRestart(status)` (true for `'gameover'`/`'win'`). No dependencies.
3. **`paddle.js`** — paddle entity: position, clamped `moveBy`/`setX`, `getBounds`. Depends on `geometry.js` for clamping.
4. **`ball.js`** — ball entity: `update(dt)` (position integration), `bounceOffWalls`, `reset`. No dependencies.
5. **`bricks.js`** — brick grid: `createGrid(options)` builds a row/col grid of brick rects, each carrying a 0-indexed `row` (top to bottom) used to look up its point value, `findCollidingBrick` (first non-destroyed brick colliding with the ball), `allCleared`. Depends on `geometry.js` for collision.
6. **`game.js`** — orchestrator: `Game.create(options)` builds the full game state (paddle, ball, bricks, lives, status, score, livesLost) and owns `update(dt)`, which each frame moves the ball, checks wall/paddle/brick/floor collisions, decrements lives or ends the game (`status`: `'playing'` | `'paused'` | `'paddle-destroying'` | `'gameover'` | `'win'`), and exposes `movePaddleBy`, `setPaddleX`, `reset`, `pause`, `resume`. Accepts an injectable `options.random` used for the life-loss score penalty. Depends on all four modules above. All game constants (paddle size, ball speed, brick grid layout) are defined here, not in the entities.
7. **`main.js`** — the only file with DOM/canvas code: wires `Game` to the `<canvas>`, draws paddle/ball/bricks/heart-icon lives indicator/score HUD, draws the "Game Over"/"You Win!" message directly on the canvas when `game.state.status` is `'gameover'`/`'win'`, and draws a "Paused" message the same way when the status is `'paused'`, drives the `requestAnimationFrame` loop, and binds keyboard (arrow keys / A-D to move, Enter/Space to restart when the game has ended, `P` to pause/resume gameplay), mouse, for input. Also owns all procedurally-generated Web Audio sound effects (brick-break, life-lost, paddle-destroy, game-over, win) and a looping background music track that plays only while the game is in the `'playing'` status. Not required by tests — it runs only in the browser.

State flows one way: input handlers (`main.js`) call `game.movePaddleBy`/`setPaddleX`, the RAF loop calls `game.update(dt)` each frame, and `main.js` reads `game.state` afterward to render. Entities (`paddle`, `ball`, `bricks`) never reach back into `game` or `main`.

Tests mirror this structure 1:1 (`tests/<module>.test.ts` per `js/<module>.js`), using `node:test` + `node:assert/strict`, no mocking framework.

# Copilot Instructions

## Project

A vanilla-JS Arkanoid/breakout clone rendered on an HTML5 canvas. No build step, no bundler. `index.html` loads a single `<script type="module" src="js/main.js">`; every module in `js/` is a native ES module (`import`/`export`) that both Node and the browser load directly with no transpilation. `package.json` exists only to pull in `@types/node` and `typescript` as `devDependencies` for optional `tsc --noEmit` type-checking of the TypeScript test suite — it declares no `scripts` and is never required to run the game or the tests. `index.html` must be opened through a local static server (e.g. `python3 -m http.server`), not directly via `file://` — module scripts are blocked by browser CORS on the `file://` origin.

## Architecture

Each module in `js/` is a native ES module that `export`s its public API and `import`s whatever sibling modules it needs. The browser's import graph resolves dependency order on its own, so only `main.js` needs a `<script>` tag in `index.html`.

Module map, in dependency order (each depends only on modules earlier in this list):

1. **`geometry.js`** — pure math, no dependencies: `clamp`, `circleRectCollision` (circle-vs-rect hit test that also reports which side was hit), `reflect` (flip vx or vy based on hit side), `paddleBounceVelocity` (angle the ball off paddle-hit position while preserving speed).
2. **`restart.js`** — pure restart-trigger logic, no dependencies: `isRestartKey(key)` (true for Enter/Space), `canRestart(status)` (true for `'gameover'`/`'win'`).
3. **`paddle.js`** — paddle entity: position, clamped movement (`moveBy`, `setX`), `getBounds`. Uses `geometry.js` for clamping.
4. **`ball.js`** — ball entity: `update(dt)` position integration, `bounceOffWalls`, `reset`. No dependencies.
5. **`bricks.js`** — brick grid: `createGrid` builds a row/col grid of brick rects from layout config, each carrying a 0-indexed `row` used to look up its point value; `findCollidingBrick` returns the first non-destroyed brick overlapping the ball; `allCleared` tracks grid state. Uses `geometry.js` for collision.
6. **`game.js`** — the orchestrator. Owns all game constants (paddle size, ball speed, brick grid layout) and the `update(dt)` loop: moves the ball, resolves wall/paddle/brick/floor collisions in that order, decrements lives or flips `status` to `'gameover'`/`'win'`. Exposes `movePaddleBy`, `setPaddleX`, `reset`, `pause`, `resume`. Accepts an injectable `options.random` used for the life-loss score penalty. Depends on all modules above.
7. **`main.js`** — the only file that touches the DOM or canvas. Wires `Game` to the `<canvas>`, renders paddle/ball/bricks/heart-icon lives indicator/score HUD each frame, draws "Game Over"/"You Win!"/"Paused" messages on the canvas, drives the `requestAnimationFrame` loop, and binds keyboard (arrow keys, A/D, Enter/Space to restart, `P` to pause/resume) and mouse input. Also owns procedurally-generated Web Audio sound effects and looping background music. Not required by any test.

State flows one way: input handlers in `main.js` call into `game`, the render loop calls `game.update(dt)` then reads `game.state` to draw. Entities (`paddle`, `ball`, `bricks`) never call back into `game` or `main` — they are passive data structures with methods, not observers.

## Test Coverage

Tests mirror the module map 1:1 under `tests/*.test.ts`, run directly by Node's native TypeScript type stripping (no `tsc` compile step, no `ts-node`), using `node:test` and `node:assert/strict` — no mocking framework, no test doubles.

- `geometry.test.ts` — clamp bounds, circle-rect collision (miss, top-side hit, left-side hit), reflect on each axis, paddle-bounce angle at center and edge hits.
- `restart.test.ts` — `isRestartKey` for Enter/Space/other keys, `canRestart` for each status value.
- `paddle.test.ts` — moveBy shifting and clamping at both edges, setX clamping, getBounds shape.
- `ball.test.ts` — position integration, wall bounce + clamp on all four walls, no-op when away from walls, reset.
- `bricks.test.ts` — grid layout count, row-indexed point values, findCollidingBrick hit and destroyed-brick exclusion, allCleared.
- `game.test.ts` — initial state, paddle movement, ball movement with no collisions, paddle bounce (including a same-frame vertical-band case that must not cost a life), floor miss costing a life and resetting the ball, game-over on last life, win on clearing all bricks, pause/resume, full no-op once the game has ended, reset restoring initial state.

`main.js` has no tests — it is pure DOM/canvas/audio wiring with no logic to unit test in isolation.

## Intentional Patterns (Do NOT Flag)

- **No dev server / no build tooling beyond optional type-checking** — the game and tests run with nothing installed; `package.json`/`tsconfig.json` exist solely for an optional `tsc --noEmit` pass over the tests. Do not suggest adding a bundler or transpiler unless a new capability actually needs one.
- **Native ES module `import`/`export` at the top of every `js/*.js` file, with no UMD/CommonJS fallback** — the game no longer supports being `require()`'d; tests import the same `.js` files the browser loads, via Node's native TypeScript+ESM support.
- **Game constants live only in `game.js`**, not in the entity modules (`paddle.js`, `ball.js`, `bricks.js`) — entities are meant to be generic and reusable; only the orchestrator knows the specific game's tuning values.
- **`game.update` returns early after a floor miss or after `status` leaves `'playing'`** — this is intentional short-circuiting to make each frame's collision resolution order well-defined (ball never bounces off a brick in the same frame it was already reset for losing a life).
- **Tests are TypeScript (`tests/*.test.ts`) while all game source stays plain JavaScript (`js/*.js`)** — this split is deliberate; do not suggest converting `js/` to TypeScript or the tests back to `.js`.

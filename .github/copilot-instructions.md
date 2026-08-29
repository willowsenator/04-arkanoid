# Copilot Instructions

## Project

A vanilla-JS Arkanoid/breakout clone rendered on an HTML5 canvas. No build step, no bundler, no `package.json`. `index.html` loads each module as a plain `<script>` tag in dependency order and runs off a single `window.Arkanoid` namespace.

## Architecture

Each module in `js/` is a dual CommonJS/browser-global UMD wrapper: it calls `require()` on its dependencies when `module.exports` exists (Node, for tests) and otherwise reads/writes properties on a shared `root.Arkanoid` global (browser). This lets the test suite `require()` the exact same files `index.html` loads as `<script>` tags, with no transpilation step and no test-only mocks of the module system.

Module map, in `index.html` load order (each depends only on modules earlier in this list):

1. **`geometry.js`** — pure math, no dependencies: `clamp`, `circleRectCollision` (circle-vs-rect hit test that also reports which side was hit), `reflect` (flip vx or vy based on hit side), `paddleBounceVelocity` (angle the ball off paddle-hit position while preserving speed).
2. **`paddle.js`** — paddle entity: position, clamped movement (`moveBy`, `setX`), `getBounds`. Uses `geometry.js` for clamping.
3. **`ball.js`** — ball entity: `update(dt)` position integration, `bounceOffWalls`, `reset`. No dependencies.
4. **`bricks.js`** — brick grid: `createGrid` builds a row/col grid of brick rects from layout config, `findCollidingBrick` returns the first non-destroyed brick overlapping the ball, `allCleared`/`remainingCount` track grid state. Uses `geometry.js` for collision.
5. **`game.js`** — the orchestrator. Owns all game constants (paddle size, ball speed, brick grid layout) and the `update(dt)` loop: moves the ball, resolves wall/paddle/brick/floor collisions in that order, decrements lives or flips `status` to `'gameover'`/`'win'`. Exposes `movePaddleBy`, `setPaddleX`, `reset`. Depends on all four modules above.
6. **`main.js`** — the only file that touches the DOM or canvas. Wires `Game` to the `<canvas>`, renders paddle/ball/bricks/heart-icon lives indicator each frame, drives the `requestAnimationFrame` loop, and binds keyboard (arrow keys and A/D), mouse movement, and the restart button. Not required by any test.

State flows one way: input handlers in `main.js` call into `game`, the render loop calls `game.update(dt)` then reads `game.state` to draw. Entities (`paddle`, `ball`, `bricks`) never call back into `game` or `main` — they are passive data structures with methods, not observers.

## Test Coverage

Tests mirror the module map 1:1 under `tests/`, using Node's built-in `node:test` and `node:assert/strict` — no mocking framework, no test doubles.

- `geometry.test.js` — clamp bounds, circle-rect collision (miss, top-side hit, left-side hit), reflect on each axis, paddle-bounce angle at center and edge hits.
- `paddle.test.js` — moveBy shifting and clamping at both edges, setX clamping, getBounds shape.
- `ball.test.js` — position integration, wall bounce + clamp on all four walls, no-op when away from walls, reset.
- `bricks.test.js` — grid layout count, remainingCount/allCleared bookkeeping, findCollidingBrick hit and destroyed-brick exclusion.
- `game.test.js` — initial state, paddle movement, ball movement with no collisions, paddle bounce (including a same-frame vertical-band case that must not cost a life), floor miss costing a life and resetting the ball, game-over on last life, win on clearing all bricks, full no-op once the game has ended, reset restoring initial state.

`main.js` has no tests — it is pure DOM wiring with no logic to unit test in isolation.

## Intentional Patterns (Do NOT Flag)

- **No `package.json` / build tooling** — this is deliberate; the project runs directly in a browser and tests directly under Node via `node --test`. Do not suggest adding a bundler, transpiler, or `package.json` unless a new capability actually needs one.
- **UMD wrapper boilerplate at the top of every `js/*.js` file** — required for the dual Node/browser loading described above, not accidental duplication.
- **Game constants live only in `game.js`**, not in the entity modules (`paddle.js`, `ball.js`, `bricks.js`) — entities are meant to be generic and reusable; only the orchestrator knows the specific game's tuning values.
- **`game.update` returns early after a floor miss or after `status` leaves `'playing'`** — this is intentional short-circuiting to make each frame's collision resolution order well-defined (ball never bounces off a brick in the same frame it was already reset for losing a life).

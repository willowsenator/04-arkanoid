# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A vanilla-JS Arkanoid/breakout clone rendered on an HTML5 canvas. No build step, no bundler, no package.json — `index.html` loads each module as a plain `<script>` tag in dependency order and runs off `window.Arkanoid`.

## Commands

Run all tests:

```
node --test tests/
```

Run a single test file:

```
node --test tests/ball.test.js
```

There is no lint/build command and no `package.json` — don't assume npm scripts exist.

To view the game itself, open `index.html` directly in a browser (or serve the directory statically); there's no dev server.

## Architecture

Each module in `js/` is a dual CommonJS/browser-global UMD wrapper:

```js
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./other.js'));   // Node (tests)
  } else {
    root.Arkanoid = root.Arkanoid || {};
    root.Arkanoid.Thing = factory(root.Arkanoid.Other); // Browser global
  }
})(typeof self !== 'undefined' ? self : this, function (Other) { ... });
```

This lets `tests/*.test.js` `require()` the same files `index.html` loads as scripts, with no transpilation. When adding a new module, follow this exact wrapper and add its `<script>` tag to `index.html` in dependency order (dependencies before dependents), and require it explicitly in any module/factory that needs it.

Module responsibilities, load order in `index.html`:

1. **`geometry.js`** — pure math: `clamp`, `circleRectCollision` (circle-vs-rect hit test with side detection), `reflect` (flip vx/vy by hit side), `paddleBounceVelocity` (angle the ball off paddle-hit position, preserving speed). No dependencies.
2. **`restart.js`** — pure restart-trigger logic: `isRestartKey(key)` (true for Enter/Space) and `canRestart(status)` (true for `'gameover'`/`'win'`). No dependencies.
3. **`paddle.js`** — paddle entity: position, clamped `moveBy`/`setX`, `getBounds`. Depends on `geometry.js` for clamping.
4. **`ball.js`** — ball entity: `update(dt)` (position integration), `bounceOffWalls`, `reset`. No dependencies.
5. **`bricks.js`** — brick grid: `createGrid(options)` builds a row/col grid of brick rects, each carrying a 0-indexed `row` (top to bottom) used to look up its point value, `findCollidingBrick` (first non-destroyed brick colliding with the ball), `allCleared`. Depends on `geometry.js` for collision.
6. **`game.js`** — orchestrator: `Game.create(options)` builds the full game state (paddle, ball, bricks, lives, status, score, livesLost) and owns `update(dt)`, which each frame moves the ball, checks wall/paddle/brick/floor collisions, decrements lives or ends the game (`status`: `'playing'` | `'paused'` | `'paddle-destroying'` | `'gameover'` | `'win'`), and exposes `movePaddleBy`, `setPaddleX`, `reset`, `pause`, `resume`. Accepts an injectable `options.random` used for the life-loss score penalty. Depends on all four modules above. All game constants (paddle size, ball speed, brick grid layout) are defined here, not in the entities.
7. **`main.js`** — the only file with DOM/canvas code: wires `Game` to the `<canvas>`, draws paddle/ball/bricks/heart-icon lives indicator/score HUD, draws the "Game Over"/"You Win!" message directly on the canvas when `game.state.status` is `'gameover'`/`'win'`, and draws a "Paused" message the same way when the status is `'paused'`, drives the `requestAnimationFrame` loop, and binds keyboard (arrow keys / A-D to move, Enter/Space to restart when the game has ended, `P` to pause/resume gameplay), mouse, for input. Also owns all procedurally-generated Web Audio sound effects (brick-break, life-lost, paddle-destroy, game-over, win) and a looping background music track that plays only while the game is in the `'playing'` status. Not required by tests — it runs only in the browser.

State flows one way: input handlers (`main.js`) call `game.movePaddleBy`/`setPaddleX`, the RAF loop calls `game.update(dt)` each frame, and `main.js` reads `game.state` afterward to render. Entities (`paddle`, `ball`, `bricks`) never reach back into `game` or `main`.

Tests mirror this structure 1:1 (`tests/<module>.test.js` per `js/<module>.js`), using `node:test` + `node:assert/strict`, no mocking framework.

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
2. **`paddle.js`** — paddle entity: position, clamped `moveBy`/`setX`, `getBounds`. Depends on `geometry.js` for clamping.
3. **`ball.js`** — ball entity: `update(dt)` (position integration), `bounceOffWalls`, `reset`. No dependencies.
4. **`bricks.js`** — brick grid: `createGrid(options)` builds a row/col grid of brick rects, `findCollidingBrick` (first non-destroyed brick colliding with the ball), `allCleared`. Depends on `geometry.js` for collision.
5. **`game.js`** — orchestrator: `Game.create(options)` builds the full game state (paddle, ball, bricks, lives, status) and owns `update(dt)`, which each frame moves the ball, checks wall/paddle/brick/floor collisions, decrements lives or ends the game (`status`: `'playing'` | `'gameover'` | `'win'`), and exposes `movePaddleBy`, `setPaddleX`, `reset`. Depends on all four modules above. All game constants (paddle size, ball speed, brick grid layout) are defined here, not in the entities.
6. **`main.js`** — the only file with DOM/canvas code: wires `Game` to the `<canvas>`, draws paddle/ball/bricks/heart-icon lives indicator, drives the `requestAnimationFrame` loop, and binds keyboard (arrow keys / A-D), mouse, and the restart button. Not required by tests — it runs only in the browser.

State flows one way: input handlers (`main.js`) call `game.movePaddleBy`/`setPaddleX`, the RAF loop calls `game.update(dt)` each frame, and `main.js` reads `game.state` afterward to render. Entities (`paddle`, `ball`, `bricks`) never reach back into `game` or `main`.

Tests mirror this structure 1:1 (`tests/<module>.test.js` per `js/<module>.js`), using `node:test` + `node:assert/strict`, no mocking framework.

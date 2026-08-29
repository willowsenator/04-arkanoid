---
applyTo: "**/*.js,**/*.html"
---

# Code Review Instructions

Supplements `.github/copilot-instructions.md` (architecture, module map, intentional patterns) — read that first. This file is about HOW to review, not what the project is.

## Architecture

- Preserve the one-way UMD dependency chain: `geometry` → `paddle`/`bricks` → `game` ← `ball`, with `main.js` as the sole DOM/canvas consumer. A change that has `geometry.js`, `paddle.js`, `ball.js`, or `bricks.js` `require()` `game.js` (or reach into `window.Arkanoid.Game`) is a layering violation.
- Any new module must follow the existing dual CommonJS/browser-global UMD wrapper exactly (see any file in `js/` for the template) and be added to `index.html` as a `<script>` tag placed after its dependencies.
- Game-specific constants (speeds, sizes, layout numbers) belong in `game.js`, not in entity modules — entities should stay generic and configurable via the options object passed to `create()`.

## Clean Code

- Flag functions doing more than one collision/state transition per call; `game.update` intentionally resolves collisions in a fixed order (wall → floor-miss → paddle → brick → win-check) with early returns — don't collapse that into nested conditionals that obscure the order.
- No dead code paths in entity modules — since they have no external callers besides `game.js` and tests, an added method with no caller in either place is dead.
- Comments should explain non-obvious *why* (e.g. a clamp preventing a specific edge case), never restate what a well-named function already does.

## JavaScript-Specific

- No `var` — existing code is entirely `const`/`function` declarations; new code should match.
- No unhandled promise rejections or async code — the codebase is fully synchronous (frame-driven via `requestAnimationFrame`/`setInterval`); introducing `async`/`await` or `fetch` should be questioned unless the task actually requires network or I/O.
- Mutation is done through explicit methods on entity objects (`moveBy`, `setX`, `update`, `reset`), not by reassigning entity fields directly from `game.js` or `main.js` — new call sites should follow the same convention.
- Numeric literals used more than once (canvas dimensions, speeds) should be named constants at the top of the owning module, matching the existing `BALL_SPEED`/`PADDLE_WIDTH`-style constants in `game.js`.

## Security

- `main.js` is the only file touching the DOM; any new code writing to `innerHTML` or otherwise inserting unsanitized strings into the page should be flagged — the current code only uses `textContent` and canvas drawing APIs.
- No dynamic `require()` or `eval` — module loading is static and enumerated in `index.html`.

## Testing

- Every new or changed function in `js/*.js` (except `main.js`, which is untested DOM wiring by design) needs a corresponding `node:test` case in the matching `tests/*.test.js` file, following the existing flat `test('description', () => { ... })` style with `node:assert/strict` — no new test framework or mocking library.
- New collision or state-transition logic in `game.js` should get a same-frame edge case test (see `game.test.js`'s "vertical band" and "no-op after game ends" cases) if the change affects collision ordering.
- Run `node --test tests/` before considering a change complete; there is no separate lint step.

## Performance

- The render/update loop runs every animation frame — avoid allocating new objects (arrays, closures) inside `game.update`, `render`, or the RAF `loop` function in `main.js`; reuse existing state objects instead, matching current code.
- `Bricks.findCollidingBrick` and similar per-frame scans over the full brick/entity list are acceptable at this game's scale (a few dozen bricks) — don't flag them for needing spatial partitioning unless the grid size is changing by an order of magnitude.

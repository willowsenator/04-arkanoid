import * as Geometry from './geometry.js';

/**
 * @typedef {{
 *   x: number,
 *   y: number,
 *   width: number,
 *   height: number,
 *   destroyed: boolean,
 *   row: number
 * }} Brick
 */

/**
 * @param {{rows: number, cols: number, brickWidth: number, brickHeight: number, padding: number, offsetTop: number, offsetLeft: number}} options
 * @returns {Brick[]}
 */
export function createGrid(options) {
  const bricks = [];
  for (let row = 0; row < options.rows; row++) {
    for (let col = 0; col < options.cols; col++) {
      bricks.push({
        x: options.offsetLeft + col * (options.brickWidth + options.padding),
        y: options.offsetTop + row * (options.brickHeight + options.padding),
        width: options.brickWidth,
        height: options.brickHeight,
        destroyed: false,
        row: row
      });
    }
  }
  return bricks;
}

/**
 * @param {Brick[]} bricks
 * @returns {number}
 */
export function remainingCount(bricks) {
  return bricks.filter(function (b) { return !b.destroyed; }).length;
}

/**
 * @param {Brick[]} bricks
 * @returns {boolean}
 */
export function allCleared(bricks) {
  return remainingCount(bricks) === 0;
}

/**
 * @param {Brick[]} bricks
 * @param {{x: number, y: number, radius: number}} ball
 * @returns {Brick | null}
 */
export function findCollidingBrick(bricks, ball) {
  for (let i = 0; i < bricks.length; i++) {
    const brick = bricks[i];
    if (brick.destroyed) continue;
    if (Geometry.circleRectCollision(ball, brick).hit) {
      return brick;
    }
  }
  return null;
}

import * as Geometry from './geometry.js';

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

export function remainingCount(bricks) {
  return bricks.filter(function (b) { return !b.destroyed; }).length;
}

export function allCleared(bricks) {
  return remainingCount(bricks) === 0;
}

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

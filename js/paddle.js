import * as Geometry from './geometry.js';

/**
 * @typedef {{
 *   x: number,
 *   y: number,
 *   width: number,
 *   height: number,
 *   canvasWidth: number,
 *   destroyed: boolean,
 *   setX: (x: number) => void,
 *   moveBy: (dx: number) => void,
 *   getBounds: () => {x: number, y: number, width: number, height: number}
 * }} Paddle
 */

/**
 * @param {{x: number, y: number, width: number, height: number, canvasWidth: number}} options
 * @returns {Paddle}
 */
export function create(options) {
  const paddle = {
    x: options.x,
    y: options.y,
    width: options.width,
    height: options.height,
    canvasWidth: options.canvasWidth,
    destroyed: false
  };

  paddle.setX = function (x) {
    paddle.x = Geometry.clamp(x, 0, paddle.canvasWidth - paddle.width);
  };

  paddle.moveBy = function (dx) {
    paddle.setX(paddle.x + dx);
  };

  paddle.getBounds = function () {
    return { x: paddle.x, y: paddle.y, width: paddle.width, height: paddle.height };
  };

  return paddle;
}

// tests/paddle.test.js
const { test } = require('node:test');
const assert = require('node:assert/strict');
const Paddle = require('../js/paddle.js');

function makePaddle() {
  return Paddle.create({ x: 280, y: 450, width: 80, height: 10, canvasWidth: 640 });
}

test('moveBy shifts the paddle position', () => {
  const paddle = makePaddle();
  paddle.moveBy(10);
  assert.equal(paddle.x, 290);
});

test('moveBy clamps at the left edge', () => {
  const paddle = makePaddle();
  paddle.moveBy(-500);
  assert.equal(paddle.x, 0);
});

test('moveBy clamps at the right edge', () => {
  const paddle = makePaddle();
  paddle.moveBy(1000);
  assert.equal(paddle.x, 640 - 80);
});

test('setX clamps out-of-range values', () => {
  const paddle = makePaddle();
  paddle.setX(-50);
  assert.equal(paddle.x, 0);
  paddle.setX(10000);
  assert.equal(paddle.x, 640 - 80);
});

test('getBounds returns the current rect', () => {
  const paddle = makePaddle();
  assert.deepEqual(paddle.getBounds(), { x: 280, y: 450, width: 80, height: 10 });
});

test('a newly created paddle is not destroyed', () => {
  const paddle = makePaddle();
  assert.equal(paddle.destroyed, false);
});

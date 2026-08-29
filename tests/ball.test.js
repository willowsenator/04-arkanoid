// tests/ball.test.js
const { test } = require('node:test');
const assert = require('node:assert/strict');
const Ball = require('../js/ball.js');

test('update moves the ball by velocity * dt', () => {
  const ball = Ball.create({ x: 320, y: 470, radius: 6, vx: 0, vy: -240 });
  ball.update(0.1);
  assert.equal(ball.x, 320);
  assert.equal(ball.y, 446);
});

test('bounceOffWalls reflects off the left wall and clamps position', () => {
  const ball = Ball.create({ x: 2, y: 200, radius: 6, vx: -100, vy: 0 });
  ball.bounceOffWalls(640);
  assert.equal(ball.vx, 100);
  assert.equal(ball.x, 6);
});

test('bounceOffWalls reflects off the right wall and clamps position', () => {
  const ball = Ball.create({ x: 638, y: 200, radius: 6, vx: 100, vy: 0 });
  ball.bounceOffWalls(640);
  assert.equal(ball.vx, -100);
  assert.equal(ball.x, 634);
});

test('bounceOffWalls reflects off the top wall and clamps position', () => {
  const ball = Ball.create({ x: 320, y: 3, radius: 6, vx: 0, vy: -50 });
  ball.bounceOffWalls(640);
  assert.equal(ball.vy, 50);
  assert.equal(ball.y, 6);
});

test('bounceOffWalls does nothing away from any wall', () => {
  const ball = Ball.create({ x: 320, y: 240, radius: 6, vx: 10, vy: 20 });
  ball.bounceOffWalls(640);
  assert.equal(ball.vx, 10);
  assert.equal(ball.vy, 20);
});

test('reset restores position and velocity', () => {
  const ball = Ball.create({ x: 0, y: 0, radius: 6, vx: 5, vy: 5 });
  ball.reset(320, 440, 0, -240);
  assert.equal(ball.x, 320);
  assert.equal(ball.y, 440);
  assert.equal(ball.vx, 0);
  assert.equal(ball.vy, -240);
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as Geometry from '../js/geometry.js';

test('clamp bounds a value within min/max', () => {
  assert.equal(Geometry.clamp(5, 0, 10), 5);
  assert.equal(Geometry.clamp(-1, 0, 10), 0);
  assert.equal(Geometry.clamp(15, 0, 10), 10);
});

test('circleRectCollision reports no hit when far away', () => {
  const circle = { x: 0, y: 0, radius: 5 };
  const rect = { x: 100, y: 100, width: 20, height: 20 };
  const result = Geometry.circleRectCollision(circle, rect);
  assert.equal(result.hit, false);
  assert.equal(result.side, null);
});

test('circleRectCollision detects a top-side hit', () => {
  const circle = { x: 50, y: 96, radius: 5 };
  const rect = { x: 40, y: 100, width: 20, height: 20 };
  const result = Geometry.circleRectCollision(circle, rect);
  assert.equal(result.hit, true);
  assert.equal(result.side, 'top');
});

test('circleRectCollision detects a left-side hit', () => {
  const circle = { x: 36, y: 110, radius: 5 };
  const rect = { x: 40, y: 100, width: 20, height: 20 };
  const result = Geometry.circleRectCollision(circle, rect);
  assert.equal(result.hit, true);
  assert.equal(result.side, 'left');
});

test('reflect flips vy on top/bottom, vx on left/right', () => {
  assert.deepEqual(Geometry.reflect(3, -4, 'top'), { vx: 3, vy: 4 });
  assert.deepEqual(Geometry.reflect(3, -4, 'bottom'), { vx: 3, vy: 4 });
  assert.deepEqual(Geometry.reflect(3, -4, 'left'), { vx: -3, vy: -4 });
  assert.deepEqual(Geometry.reflect(3, -4, 'right'), { vx: -3, vy: -4 });
});

test('paddleBounceVelocity sends the ball straight up on a center hit', () => {
  const { vx, vy } = Geometry.paddleBounceVelocity(340, 300, 80, 240);
  assert.ok(Math.abs(vx) < 1e-9);
  assert.equal(vy, -240);
});

test('paddleBounceVelocity angles the ball on an edge hit, preserving speed', () => {
  const { vx, vy } = Geometry.paddleBounceVelocity(380, 300, 80, 240);
  assert.ok(vx > 0);
  assert.ok(vy < 0);
  const magnitude = Math.sqrt(vx * vx + vy * vy);
  assert.ok(Math.abs(magnitude - 240) < 1e-9);
});

const { test } = require('node:test');
const assert = require('node:assert/strict');
const Bricks = require('../js/bricks.js');

function makeGrid() {
  return Bricks.createGrid({
    rows: 2, cols: 2, brickWidth: 50, brickHeight: 20,
    padding: 5, offsetTop: 10, offsetLeft: 10
  });
}

test('createGrid lays out the expected number of non-destroyed bricks', () => {
  const bricks = makeGrid();
  assert.equal(bricks.length, 4);
  assert.ok(bricks.every(function (b) { return b.destroyed === false; }));
  assert.deepEqual(bricks[0], { x: 10, y: 10, width: 50, height: 20, destroyed: false, row: 0 });
  assert.deepEqual(bricks[1], { x: 65, y: 10, width: 50, height: 20, destroyed: false, row: 0 });
  assert.deepEqual(bricks[2], { x: 10, y: 35, width: 50, height: 20, destroyed: false, row: 1 });
});

test('remainingCount only counts non-destroyed bricks', () => {
  const bricks = makeGrid();
  bricks[0].destroyed = true;
  assert.equal(Bricks.remainingCount(bricks), 3);
});

test('allCleared is true only once every brick is destroyed', () => {
  const bricks = makeGrid();
  assert.equal(Bricks.allCleared(bricks), false);
  bricks.forEach(function (b) { b.destroyed = true; });
  assert.equal(Bricks.allCleared(bricks), true);
});

test('findCollidingBrick returns the overlapping non-destroyed brick', () => {
  const bricks = makeGrid();
  const ball = { x: 15, y: 15, radius: 6 };
  const hit = Bricks.findCollidingBrick(bricks, ball);
  assert.equal(hit, bricks[0]);
});

test('findCollidingBrick ignores destroyed bricks', () => {
  const bricks = makeGrid();
  bricks[0].destroyed = true;
  const ball = { x: 15, y: 15, radius: 6 };
  const hit = Bricks.findCollidingBrick(bricks, ball);
  assert.equal(hit, null);
});

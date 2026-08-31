const { test } = require('node:test');
const assert = require('node:assert/strict');
const Game = require('../js/game.js');

function makeGame() {
  return Game.create({ canvasWidth: 640, canvasHeight: 480, lives: 3 });
}

test('starts in playing status with configured lives and a non-empty brick grid', () => {
  const game = makeGame();
  assert.equal(game.state.status, 'playing');
  assert.equal(game.state.lives, 3);
  assert.ok(game.state.bricks.length > 0);
});

test('movePaddleBy moves the paddle by the requested distance', () => {
  const game = makeGame();
  const before = game.state.paddle.x;
  game.movePaddleBy(20);
  assert.equal(game.state.paddle.x, before + 20);
});

test('movePaddleBy and setPaddleX are ignored when the game is not playing', () => {
  const game = makeGame();
  game.state.status = 'gameover';
  const before = game.state.paddle.x;
  game.movePaddleBy(20);
  assert.equal(game.state.paddle.x, before);
  game.setPaddleX(before + 50);
  assert.equal(game.state.paddle.x, before);
});

test('movePaddleBy and setPaddleX are ignored while the paddle is destroying', () => {
  const game = makeGame();
  game.state.status = 'paddle-destroying';
  const before = game.state.paddle.x;
  game.movePaddleBy(20);
  assert.equal(game.state.paddle.x, before);
  game.setPaddleX(before + 50);
  assert.equal(game.state.paddle.x, before);
});

test('update moves the ball and leaves status playing with no collisions', () => {
  const game = makeGame();
  const startY = game.state.ball.y;
  game.update(0.01);
  assert.notEqual(game.state.ball.y, startY);
  assert.equal(game.state.status, 'playing');
});

test('ball approaching the paddle from above bounces upward and is repositioned', () => {
  const game = makeGame();
  const paddle = game.state.paddle;
  const ball = game.state.ball;
  ball.x = paddle.x + paddle.width / 2;
  ball.y = paddle.y - ball.radius - 1;
  ball.vx = 0;
  ball.vy = 100;
  game.update(0.02);
  assert.ok(ball.vy < 0);
  assert.equal(ball.y, paddle.y - ball.radius);
});

test('ball colliding inside the paddle vertical band bounces without losing a life', () => {
  const game = makeGame();
  const paddle = game.state.paddle;
  const ball = game.state.ball;
  ball.x = paddle.x + paddle.width / 2;
  ball.y = paddle.y + paddle.height / 2;
  ball.vx = 0;
  ball.vy = 100;
  game.update(0);
  assert.equal(game.state.lives, 3);
  assert.ok(ball.vy < 0);
  assert.equal(ball.y, paddle.y - ball.radius);
});

test('update is a complete no-op after the game ends', () => {
  const game = makeGame();
  const ball = game.state.ball;
  const paddle = game.state.paddle;
  const brickStates = game.state.bricks.map(function (brick) { return brick.destroyed; });
  const before = {
    ballX: ball.x,
    ballY: ball.y,
    ballVx: ball.vx,
    ballVy: ball.vy,
    paddleX: paddle.x
  };
  game.state.status = 'gameover';
  game.update(1);
  assert.deepEqual({
    ballX: ball.x,
    ballY: ball.y,
    ballVx: ball.vx,
    ballVy: ball.vy,
    paddleX: paddle.x
  }, before);
  assert.deepEqual(
    game.state.bricks.map(function (brick) { return brick.destroyed; }),
    brickStates
  );
});

test('ball passing below the paddle costs a life and resets the ball', () => {
  const game = makeGame();
  const paddle = game.state.paddle;
  game.state.ball.x = paddle.x + paddle.width / 2;
  game.state.ball.y = paddle.y + paddle.height + 1;
  game.state.ball.vx = 0;
  game.state.ball.vy = 50;
  game.update(0.001);
  assert.equal(game.state.lives, 2);
  assert.equal(game.state.status, 'playing');
  assert.ok(game.state.ball.y < paddle.y);
  assert.equal(game.state.paddle.destroyed, false);
  assert.deepEqual(game.state.paddleFragments, []);
});

test('losing the last life starts the paddle-destroying animation instead of ending immediately', () => {
  const game = makeGame();
  game.state.lives = 1;
  const paddle = game.state.paddle;
  game.state.ball.x = paddle.x + paddle.width / 2;
  game.state.ball.y = paddle.y + paddle.height + 1;
  game.state.ball.vx = 0;
  game.state.ball.vy = 50;
  game.update(0.001);
  assert.equal(game.state.lives, 0);
  assert.equal(game.state.status, 'paddle-destroying');
  assert.equal(paddle.destroyed, true);
  assert.equal(game.state.paddleFragments.length, 4);
});

test('update freezes the ball and paddle while the paddle is destroying', () => {
  const game = makeGame();
  game.state.status = 'paddle-destroying';
  game.state.destroyTimer = 0.6;
  game.state.paddleFragments = [];
  const ball = game.state.ball;
  const before = { x: ball.x, y: ball.y, vx: ball.vx, vy: ball.vy };
  game.update(0.1);
  assert.deepEqual({ x: ball.x, y: ball.y, vx: ball.vx, vy: ball.vy }, before);
});

test('update advances paddle fragments outward while destroying', () => {
  const game = makeGame();
  game.state.status = 'paddle-destroying';
  game.state.destroyTimer = 0.6;
  game.state.paddleFragments = [{ x: 100, y: 200, width: 20, height: 10, vx: 30, vy: -50 }];
  game.update(0.1);
  const fragment = game.state.paddleFragments[0];
  assert.equal(fragment.x, 103);
  assert.equal(Math.round(fragment.y * 10) / 10, 195);
});

test('the destruction animation ends after its fixed duration and reaches gameover', () => {
  const game = makeGame();
  game.state.status = 'paddle-destroying';
  game.state.destroyTimer = 0.6;
  game.state.paddleFragments = [];
  game.update(0.5);
  assert.equal(game.state.status, 'paddle-destroying');
  game.update(0.2);
  assert.equal(game.state.status, 'gameover');
  assert.equal(game.state.paddle.destroyed, true);
});

test('reset clears the destroyed paddle and fragments', () => {
  const game = makeGame();
  game.state.lives = 1;
  const paddle = game.state.paddle;
  game.state.ball.x = paddle.x + paddle.width / 2;
  game.state.ball.y = paddle.y + paddle.height + 1;
  game.state.ball.vx = 0;
  game.state.ball.vy = 50;
  game.update(0.001);
  game.reset();
  assert.equal(game.state.status, 'playing');
  assert.equal(game.state.paddle.destroyed, false);
  assert.deepEqual(game.state.paddleFragments, []);
});

test('clearing every brick wins the game', () => {
  const game = makeGame();
  game.state.bricks.forEach(function (b) { b.destroyed = true; });
  game.update(0.001);
  assert.equal(game.state.status, 'win');
});

test('reset restores initial lives, bricks, and playing status', () => {
  const game = makeGame();
  game.state.lives = 1;
  game.state.bricks.forEach(function (b) { b.destroyed = true; });
  game.state.status = 'gameover';
  game.reset();
  assert.equal(game.state.status, 'playing');
  assert.equal(game.state.lives, 3);
  assert.ok(game.state.bricks.every(function (b) { return b.destroyed === false; }));
});

test('starts with a score of 0', () => {
  const game = makeGame();
  assert.equal(game.state.score, 0);
});

test('destroying a top-row brick awards 40 points', () => {
  const game = makeGame();
  const brick = game.state.bricks.find(function (b) { return b.row === 0; });
  const ball = game.state.ball;
  ball.x = brick.x + brick.width / 2;
  ball.y = brick.y + brick.height / 2;
  ball.vx = 0;
  ball.vy = -10;
  game.update(0);
  assert.equal(brick.destroyed, true);
  assert.equal(game.state.score, 40);
});

test('destroying a bottom-row brick awards 10 points', () => {
  const game = makeGame();
  const brick = game.state.bricks.find(function (b) { return b.row === 3; });
  const ball = game.state.ball;
  ball.x = brick.x + brick.width / 2;
  ball.y = brick.y + brick.height / 2;
  ball.vx = 0;
  ball.vy = -10;
  game.update(0);
  assert.equal(brick.destroyed, true);
  assert.equal(game.state.score, 10);
});

function loseOneLife(game) {
  const paddle = game.state.paddle;
  game.state.ball.x = paddle.x + paddle.width / 2;
  game.state.ball.y = paddle.y + paddle.height + 1;
  game.state.ball.vx = 0;
  game.state.ball.vy = 50;
  game.update(0.001);
}

test('losing a life deducts a penalty from the range for the first loss', () => {
  const game = Game.create({
    canvasWidth: 640, canvasHeight: 480, lives: 3,
    random: function () { return 0; }
  });
  game.state.score = 100;
  loseOneLife(game);
  assert.equal(game.state.score, 90);
});

test('the penalty range grows by 10 for each life already lost this game', () => {
  const game = Game.create({
    canvasWidth: 640, canvasHeight: 480, lives: 3,
    random: function () { return 0; }
  });
  game.state.score = 200;
  loseOneLife(game);
  assert.equal(game.state.score, 190);
  loseOneLife(game);
  assert.equal(game.state.score, 170);
});

test('score never drops below zero from a penalty', () => {
  const game = Game.create({
    canvasWidth: 640, canvasHeight: 480, lives: 3,
    random: function () { return 0.5; }
  });
  game.state.score = 5;
  loseOneLife(game);
  assert.equal(game.state.score, 0);
});

test('penalty falls within the expected first-loss range using the default random source', () => {
  const game = makeGame();
  game.state.score = 1000;
  loseOneLife(game);
  const penalty = 1000 - game.state.score;
  assert.ok(penalty >= 10 && penalty <= 30);
});

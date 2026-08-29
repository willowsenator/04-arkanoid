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
});

test('losing the last life ends the game', () => {
  const game = makeGame();
  game.state.lives = 1;
  const paddle = game.state.paddle;
  game.state.ball.x = paddle.x + paddle.width / 2;
  game.state.ball.y = paddle.y + paddle.height + 1;
  game.state.ball.vx = 0;
  game.state.ball.vy = 50;
  game.update(0.001);
  assert.equal(game.state.lives, 0);
  assert.equal(game.state.status, 'gameover');
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

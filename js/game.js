import * as Geometry from './geometry.js';
import * as Paddle from './paddle.js';
import * as Ball from './ball.js';
import * as Bricks from './bricks.js';

const BALL_SPEED = 240;
const PADDLE_WIDTH = 80;
const PADDLE_HEIGHT = 10;
const BALL_RADIUS = 6;
const BRICK_CONFIG = {
  rows: 4,
  cols: 8,
  brickWidth: 68,
  brickHeight: 20,
  padding: 8,
  offsetTop: 40,
  offsetLeft: 20
};
const PADDLE_DESTROY_DURATION = 0.6;
const FRAGMENT_COLS = 4;
const FRAGMENT_OUTWARD_SPEED = 3;
const FRAGMENT_RISE_SPEED = 100;
const ROW_VALUES = [40, 30, 20, 10];

function createPaddleFragments(paddle) {
  const fragmentWidth = paddle.width / FRAGMENT_COLS;
  const centerX = paddle.x + paddle.width / 2;
  const fragments = [];
  for (let i = 0; i < FRAGMENT_COLS; i++) {
    const x = paddle.x + i * fragmentWidth;
    const offsetFromCenter = (x + fragmentWidth / 2) - centerX;
    fragments.push({
      x: x,
      y: paddle.y,
      width: fragmentWidth,
      height: paddle.height,
      vx: offsetFromCenter * FRAGMENT_OUTWARD_SPEED,
      vy: -FRAGMENT_RISE_SPEED
    });
  }
  return fragments;
}

function randomPenalty(livesAlreadyLost, randomFn) {
  const min = 10 + 10 * livesAlreadyLost;
  const max = 30 + 10 * livesAlreadyLost;
  return min + Math.floor(randomFn() * (max - min + 1));
}

export function create(options) {
  const game = {};
  const randomFn = options.random || Math.random;

  function createInitialState() {
    const paddle = Paddle.create({
      x: (options.canvasWidth - PADDLE_WIDTH) / 2,
      y: options.canvasHeight - 30,
      width: PADDLE_WIDTH,
      height: PADDLE_HEIGHT,
      canvasWidth: options.canvasWidth
    });
    const ball = Ball.create({
      x: paddle.x + paddle.width / 2,
      y: paddle.y - BALL_RADIUS,
      radius: BALL_RADIUS,
      vx: 0,
      vy: -BALL_SPEED
    });

    return {
      status: 'playing',
      lives: options.lives,
      score: 0,
      livesLost: 0,
      paddle: paddle,
      ball: ball,
      bricks: Bricks.createGrid(BRICK_CONFIG),
      paddleFragments: [],
      destroyTimer: 0
    };
  }

  game.state = createInitialState();

  game.movePaddleBy = function (dx) {
    if (game.state.status !== 'playing') return;
    game.state.paddle.moveBy(dx);
  };

  game.setPaddleX = function (x) {
    if (game.state.status !== 'playing') return;
    game.state.paddle.setX(x);
  };

  game.pause = function () {
    if (game.state.status !== 'playing') return;
    game.state.status = 'paused';
  };

  game.resume = function () {
    if (game.state.status !== 'paused') return;
    game.state.status = 'playing';
  };

  game.update = function (dt) {
    const state = game.state;

    if (state.status === 'paddle-destroying') {
      state.paddle.destroyed = true;
      state.destroyTimer -= dt;
      state.paddleFragments.forEach(function (fragment) {
        fragment.x += fragment.vx * dt;
        fragment.y += fragment.vy * dt;
      });
      if (state.destroyTimer <= 0) {
        state.status = 'gameover';
      }
      return;
    }

    if (state.status !== 'playing') return;

    const ball = state.ball;
    const paddle = state.paddle;

    ball.update(dt);
    ball.bounceOffWalls(options.canvasWidth);

    if (ball.y > paddle.y + paddle.height) {
      state.lives -= 1;
      const penalty = randomPenalty(state.livesLost, randomFn);
      state.score = Math.max(0, state.score - penalty);
      state.livesLost += 1;
      if (state.lives <= 0) {
        paddle.destroyed = true;
        state.paddleFragments = createPaddleFragments(paddle);
        state.status = 'paddle-destroying';
        state.destroyTimer = PADDLE_DESTROY_DURATION;
      } else {
        ball.reset(
          paddle.x + paddle.width / 2,
          paddle.y - ball.radius,
          0,
          -BALL_SPEED
        );
      }
      return;
    }

    const paddleCollision = Geometry.circleRectCollision(ball, paddle.getBounds());
    if (paddleCollision.hit) {
      const velocity = Geometry.paddleBounceVelocity(
        ball.x,
        paddle.x,
        paddle.width,
        BALL_SPEED
      );
      ball.vx = velocity.vx;
      ball.vy = velocity.vy;
      ball.y = paddle.y - ball.radius;
    }

    const brick = Bricks.findCollidingBrick(state.bricks, ball);
    if (brick) {
      brick.destroyed = true;
      state.score += ROW_VALUES[brick.row] || 0;
      const collision = Geometry.circleRectCollision(ball, brick);
      const velocity = Geometry.reflect(ball.vx, ball.vy, collision.side);
      ball.vx = velocity.vx;
      ball.vy = velocity.vy;
    }

    if (Bricks.allCleared(state.bricks)) {
      state.status = 'win';
    }
  };

  game.reset = function () {
    game.state = createInitialState();
  };

  return game;
}

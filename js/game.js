(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(
      require('./geometry.js'),
      require('./paddle.js'),
      require('./ball.js'),
      require('./bricks.js')
    );
  } else {
    root.Arkanoid = root.Arkanoid || {};
    root.Arkanoid.Game = factory(
      root.Arkanoid.Geometry,
      root.Arkanoid.Paddle,
      root.Arkanoid.Ball,
      root.Arkanoid.Bricks
    );
  }
})(typeof self !== 'undefined' ? self : this, function (Geometry, Paddle, Ball, Bricks) {
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

  function create(options) {
    const game = {};

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
        paddle: paddle,
        ball: ball,
        bricks: Bricks.createGrid(BRICK_CONFIG)
      };
    }

    game.state = createInitialState();

    game.movePaddleBy = function (dx) {
      game.state.paddle.moveBy(dx);
    };

    game.setPaddleX = function (x) {
      game.state.paddle.setX(x);
    };

    game.update = function (dt) {
      const state = game.state;
      const ball = state.ball;
      const paddle = state.paddle;

      if (state.status !== 'playing') return;

      ball.update(dt);
      ball.bounceOffWalls(options.canvasWidth);

      if (ball.y > paddle.y + paddle.height) {
        state.lives -= 1;
        if (state.lives <= 0) {
          state.status = 'gameover';
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

  return { create: create };
});

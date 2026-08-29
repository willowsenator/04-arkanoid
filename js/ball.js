(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.Arkanoid = root.Arkanoid || {};
    root.Arkanoid.Ball = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  function create(options) {
    const ball = {
      x: options.x,
      y: options.y,
      radius: options.radius,
      vx: options.vx,
      vy: options.vy
    };

    ball.update = function (dt) {
      ball.x += ball.vx * dt;
      ball.y += ball.vy * dt;
    };

    ball.bounceOffWalls = function (canvasWidth) {
      if (ball.x - ball.radius < 0) {
        ball.x = ball.radius;
        ball.vx = Math.abs(ball.vx);
      } else if (ball.x + ball.radius > canvasWidth) {
        ball.x = canvasWidth - ball.radius;
        ball.vx = -Math.abs(ball.vx);
      }

      if (ball.y - ball.radius < 0) {
        ball.y = ball.radius;
        ball.vy = Math.abs(ball.vy);
      }
    };

    ball.reset = function (x, y, vx, vy) {
      ball.x = x;
      ball.y = y;
      ball.vx = vx;
      ball.vy = vy;
    };

    return ball;
  }

  return { create: create };
});

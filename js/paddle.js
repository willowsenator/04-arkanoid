(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./geometry.js'));
  } else {
    root.Arkanoid = root.Arkanoid || {};
    root.Arkanoid.Paddle = factory(root.Arkanoid.Geometry);
  }
})(typeof self !== 'undefined' ? self : this, function (Geometry) {
  function create(options) {
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

  return { create: create };
});

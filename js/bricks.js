(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./geometry.js'));
  } else {
    root.Arkanoid = root.Arkanoid || {};
    root.Arkanoid.Bricks = factory(root.Arkanoid.Geometry);
  }
})(typeof self !== 'undefined' ? self : this, function (Geometry) {
  function createGrid(options) {
    const bricks = [];
    for (let row = 0; row < options.rows; row++) {
      for (let col = 0; col < options.cols; col++) {
        bricks.push({
          x: options.offsetLeft + col * (options.brickWidth + options.padding),
          y: options.offsetTop + row * (options.brickHeight + options.padding),
          width: options.brickWidth,
          height: options.brickHeight,
          destroyed: false
        });
      }
    }
    return bricks;
  }

  function remainingCount(bricks) {
    return bricks.filter(function (b) { return !b.destroyed; }).length;
  }

  function allCleared(bricks) {
    return remainingCount(bricks) === 0;
  }

  function findCollidingBrick(bricks, ball) {
    for (let i = 0; i < bricks.length; i++) {
      const brick = bricks[i];
      if (brick.destroyed) continue;
      if (Geometry.circleRectCollision(ball, brick).hit) {
        return brick;
      }
    }
    return null;
  }

  return {
    createGrid: createGrid,
    remainingCount: remainingCount,
    allCleared: allCleared,
    findCollidingBrick: findCollidingBrick
  };
});

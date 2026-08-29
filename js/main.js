(function () {
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  const overlay = document.getElementById('overlay');
  const restartButton = document.getElementById('restart');

  const game = window.Arkanoid.Game.create({
    canvasWidth: canvas.width,
    canvasHeight: canvas.height,
    lives: 3
  });

  function drawHeart(cx, cy, size) {
    ctx.beginPath();
    ctx.moveTo(cx, cy + size * 0.3);
    ctx.bezierCurveTo(cx, cy, cx - size / 2, cy, cx - size / 2, cy + size * 0.3);
    ctx.bezierCurveTo(cx - size / 2, cy + size * 0.7, cx, cy + size, cx, cy + size * 1.2);
    ctx.bezierCurveTo(cx, cy + size, cx + size / 2, cy + size * 0.7, cx + size / 2, cy + size * 0.3);
    ctx.bezierCurveTo(cx + size / 2, cy, cx, cy, cx, cy + size * 0.3);
    ctx.closePath();
    ctx.fill();
  }

  function drawLives(lives) {
    ctx.fillStyle = '#e33';
    const size = 14;
    const spacing = 20;
    for (let i = 0; i < lives; i++) {
      drawHeart(16 + i * spacing, 8, size);
    }
  }

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const paddle = game.state.paddle;
    ctx.fillStyle = '#0af';
    if (!paddle.destroyed) {
      ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
    }
    if (game.state.status === 'paddle-destroying') {
      game.state.paddleFragments.forEach(function (fragment) {
        ctx.fillRect(fragment.x, fragment.y, fragment.width, fragment.height);
      });
    }

    const ball = game.state.ball;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();

    game.state.bricks.forEach(function (brick) {
      if (brick.destroyed) return;
      ctx.fillStyle = '#e33';
      ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
    });

    drawLives(game.state.lives);

    if (game.state.status === 'gameover') {
      overlay.textContent = 'Game Over';
      restartButton.style.display = 'inline-block';
    } else if (game.state.status === 'win') {
      overlay.textContent = 'You Win!';
      restartButton.style.display = 'inline-block';
    } else {
      overlay.textContent = '';
      restartButton.style.display = 'none';
    }
  }

  let lastTime = null;
  function loop(timestamp) {
    if (lastTime === null) lastTime = timestamp;
    const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
    lastTime = timestamp;

    game.update(dt);
    render();

    requestAnimationFrame(loop);
  }

  const keyState = { left: false, right: false };
  const PADDLE_KEY_SPEED = 400;

  document.addEventListener('keydown', function (event) {
    if (event.key === 'ArrowLeft' || event.key === 'a' || event.key === 'A') keyState.left = true;
    if (event.key === 'ArrowRight' || event.key === 'd' || event.key === 'D') keyState.right = true;
  });

  document.addEventListener('keyup', function (event) {
    if (event.key === 'ArrowLeft' || event.key === 'a' || event.key === 'A') keyState.left = false;
    if (event.key === 'ArrowRight' || event.key === 'd' || event.key === 'D') keyState.right = false;
  });

  canvas.addEventListener('mousemove', function (event) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    game.setPaddleX(mouseX - game.state.paddle.width / 2);
  });

  restartButton.addEventListener('click', function () {
    game.reset();
  });

  const keyLoopInterval = 1000 / 60;
  setInterval(function () {
    if (keyState.left) game.movePaddleBy(-PADDLE_KEY_SPEED / 60);
    if (keyState.right) game.movePaddleBy(PADDLE_KEY_SPEED / 60);
  }, keyLoopInterval);

  requestAnimationFrame(loop);
})();

(function () {
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');

  const game = window.Arkanoid.Game.create({
    canvasWidth: canvas.width,
    canvasHeight: canvas.height,
    lives: 3
  });

  let audioCtx = null;
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (Ctx) audioCtx = new Ctx();
  } catch (err) {
    audioCtx = null;
  }

  function playTone(frequency, duration, options) {
    if (!audioCtx) return 0;
    options = options || {};
    const type = options.type || 'sine';
    const startTime = audioCtx.currentTime + (options.delay || 0);
    const peakGain = options.gain || 0.2;

    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, startTime);
    if (options.sweepTo) {
      oscillator.frequency.linearRampToValueAtTime(options.sweepTo, startTime + duration);
    }

    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(peakGain, startTime + 0.01);
    gainNode.gain.linearRampToValueAtTime(0, startTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.start(startTime);
    oscillator.stop(startTime + duration);

    return duration;
  }

  function playChord(frequencies, noteDuration) {
    frequencies.forEach(function (freq, i) {
      playTone(freq, noteDuration, { delay: i * noteDuration, type: 'sine', gain: 0.15 });
    });
  }

  function playBrickSound() {
    playTone(880, 0.08, { type: 'square', gain: 0.15 });
  }

  function playLifeLostSound(delay) {
    const duration = 0.25;
    playTone(220, duration, { type: 'sawtooth', sweepTo: 110, gain: 0.2, delay: delay || 0 });
    return duration;
  }

  function playPaddleDestroySound(delay) {
    playTone(150, 0.5, { type: 'square', sweepTo: 40, gain: 0.25, delay: delay || 0 });
  }

  function playGameOverSound() {
    playChord([392, 329.63, 261.63], 0.18);
  }

  function playWinSound() {
    playChord([523.25, 659.25, 783.99], 0.15);
  }

  const MUSIC_NOTES = [220, 261.63, 246.94, 196];
  const MUSIC_STEP_SECONDS = 0.35;
  let musicTimer = null;
  let musicStep = 0;

  function scheduleMusicStep() {
    const freq = MUSIC_NOTES[musicStep % MUSIC_NOTES.length];
    playTone(freq, MUSIC_STEP_SECONDS * 0.9, { type: 'triangle', gain: 0.08 });
    musicStep += 1;
    musicTimer = setTimeout(scheduleMusicStep, MUSIC_STEP_SECONDS * 1000);
  }

  function startMusic() {
    if (!audioCtx) return;
    if (musicTimer !== null) return;
    musicStep = 0;
    scheduleMusicStep();
  }

  function stopMusic() {
    if (musicTimer !== null) {
      clearTimeout(musicTimer);
      musicTimer = null;
    }
  }

  function resumeAudioIfSuspended() {
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function countDestroyedBricks(bricks) {
    return bricks.reduce(function (count, brick) {
      return brick.destroyed ? count + 1 : count;
    }, 0);
  }

  let prevStatus = game.state.status;
  let prevLivesLost = game.state.livesLost;
  let prevDestroyedCount = countDestroyedBricks(game.state.bricks);

  function checkAudioEvents() {
    const state = game.state;
    const destroyedCount = countDestroyedBricks(state.bricks);
    if (destroyedCount > prevDestroyedCount) {
      playBrickSound();
    }

    let nextDelay = 0;
    if (state.livesLost > prevLivesLost) {
      nextDelay = playLifeLostSound(0);
    }

    if (state.status !== prevStatus) {
      if (state.status === 'paddle-destroying') {
        playPaddleDestroySound(nextDelay);
      } else if (state.status === 'gameover') {
        playGameOverSound();
      } else if (state.status === 'win') {
        playWinSound();
      }

      const wasPlaying = prevStatus === 'playing';
      const isPlaying = state.status === 'playing';
      if (wasPlaying && !isPlaying) {
        stopMusic();
      } else if (isPlaying && !wasPlaying) {
        startMusic();
      }
    }

    prevDestroyedCount = destroyedCount;
    prevLivesLost = state.livesLost;
    prevStatus = state.status;
  }

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

  function drawScore(score) {
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText('Score: ' + score, canvas.width - 12, 8);
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
    drawScore(game.state.score);

    if (game.state.status === 'gameover' || game.state.status === 'win' || game.state.status === 'paused') {
      const message = game.state.status === 'gameover'
        ? 'Game Over'
        : game.state.status === 'win' ? 'You Win!' : 'Paused';
      const submessage = game.state.status === 'paused'
        ? 'Press P to resume'
        : 'Press Enter or Space to restart';

      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(0, canvas.height / 2 - 40, canvas.width, 80);

      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      ctx.font = 'bold 28px sans-serif';
      ctx.fillText(message, canvas.width / 2, canvas.height / 2 - 10);

      ctx.font = '16px sans-serif';
      ctx.fillText(submessage, canvas.width / 2, canvas.height / 2 + 20);
    }
  }

  let lastTime = null;
  function loop(timestamp) {
    if (lastTime === null) lastTime = timestamp;
    const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
    lastTime = timestamp;

    game.update(dt);
    checkAudioEvents();
    render();

    requestAnimationFrame(loop);
  }

  const keyState = { left: false, right: false };
  const PADDLE_KEY_SPEED = 400;

  document.addEventListener('keydown', function (event) {
    resumeAudioIfSuspended();
    if (window.Arkanoid.Restart.canRestart(game.state.status) && window.Arkanoid.Restart.isRestartKey(event.key)) {
      event.preventDefault();
      game.reset();
      return;
    }
    if (event.key === 'p' || event.key === 'P') {
      if (game.state.status === 'playing') {
        game.pause();
      } else if (game.state.status === 'paused') {
        game.resume();
      }
      return;
    }
    if (event.key === 'ArrowLeft' || event.key === 'a' || event.key === 'A') keyState.left = true;
    if (event.key === 'ArrowRight' || event.key === 'd' || event.key === 'D') keyState.right = true;
  });

  document.addEventListener('keyup', function (event) {
    if (event.key === 'ArrowLeft' || event.key === 'a' || event.key === 'A') keyState.left = false;
    if (event.key === 'ArrowRight' || event.key === 'd' || event.key === 'D') keyState.right = false;
  });

  canvas.addEventListener('mousemove', function (event) {
    resumeAudioIfSuspended();
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    game.setPaddleX(mouseX - game.state.paddle.width / 2);
  });

  const keyLoopInterval = 1000 / 60;
  setInterval(function () {
    if (keyState.left) game.movePaddleBy(-PADDLE_KEY_SPEED / 60);
    if (keyState.right) game.movePaddleBy(PADDLE_KEY_SPEED / 60);
  }, keyLoopInterval);

  startMusic();
  requestAnimationFrame(loop);
})();

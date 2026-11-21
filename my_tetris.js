window.addEventListener('load', () => {
  const playfieldCanvas = document.getElementById('playfield');
  const holdCanvas = document.getElementById('hold-canvas');
  const nextCanvas = document.getElementById('next-canvas');
  const screenEl = document.getElementById('screen');
  const cabinet = document.getElementById('cabinet');
  const startScreen = document.getElementById('start-screen');
  const startBtn = document.getElementById('start-btn');
  const gameoverHint = document.getElementById('gameover-hint');
  const scoreEl = document.getElementById('score');
  const levelEl = document.getElementById('level');

  const game = new TetrisGame();
  const renderer = new Renderer(playfieldCanvas, holdCanvas, nextCanvas);
  const controller = new Controller(game);

  const sounds = new SoundEngine();
  game.sounds = sounds;
  sounds.load();
  game.started = false;
  game.showCopyright = false;

  function fit() {
    const w = cabinet.offsetWidth;
    const h = cabinet.offsetHeight;
    const scale = Math.min(
      window.innerWidth / (w + 56),
      window.innerHeight / (h + 40),
      1.05
    );
    cabinet.style.transform = 'scale(' + scale + ')';
  }

  fit();
  window.addEventListener('resize', fit);

  function replayAnimation(el, className, duration) {
    el.classList.remove(className);
    void el.offsetWidth;
    el.classList.add(className);
    setTimeout(() => el.classList.remove(className), duration);
  }

  function shake(kind) {
    replayAnimation(screenEl, kind, 500);
  }

  function flash() {
    replayAnimation(screenEl, 'is-flashing', 460);
  }

  function pop(el) {
    replayAnimation(el, 'pop', 380);
  }

  game.onEvent = (type, value) => {
    if (type === 'harddrop') {
      shake('shake-hard');
    } else if (type === 'clear') {
      shake('shake-clear');
      flash();
      pop(scoreEl);
      pop(levelEl);
    } else if (type === 'gameover') {
      gameoverHint.classList.add('is-visible');
      sounds.stopMusic();
    }
  };

  function startGame() {
    if (game.started || game.gameOver) {
      return;
    }

    game.started = true;
    startScreen.classList.add('is-hidden');
    setTimeout(() => {
      startScreen.style.display = 'none';
    }, 520);
    replayAnimation(screenEl, 'is-powering', 620);

    sounds.startMusic();
    game.spawnPiece();
  }

  startBtn.addEventListener('click', (event) => {
    event.stopPropagation();
    startGame();
  });

  startScreen.addEventListener('click', startGame);

  window.addEventListener('keydown', (event) => {
    if (event.code !== 'Enter' && event.code !== 'NumpadEnter') {
      return;
    }

    event.preventDefault();

    if (game.gameOver) {
      window.location.reload();
      return;
    }

    startGame();
  });

  window.game = game;

  let lastTime = 0;

  function loop(time) {
    const delta = Math.min(time - lastTime, 100);
    lastTime = time;

    if (game.started) {
      if (game.paused) {
        game.updatePause(delta);
      } else if (!game.gameOver) {
        game.update(delta);
      }
    }

    renderer.render(game);
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
});

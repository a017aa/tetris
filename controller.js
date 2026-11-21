class Controller {
  constructor(game) {
    this.game = game;
    this.bindKeys();
  }

  bindKeys() {
    document.addEventListener('keydown', (e) => this.handleKey(e));
  }

  handleKey(e) {
    if (!this.game.started) return;

    if (this.game.gameOver) return;

    if (this.game.paused && e.code !== 'Escape' && e.code !== 'F1' && e.code !== 'KeyM') return;

    switch (e.code) {
      case 'ArrowLeft':
        this.game.moveLeft();
        break;
      case 'ArrowRight':
        this.game.moveRight();
        break;
      case 'ArrowDown':
        this.game.softDrop();
        break;
      case 'ArrowUp':
      case 'KeyX':
        this.game.rotateCW();
        break;
      case 'KeyZ':
      case 'ControlLeft':
        this.game.rotateCCW();
        break;
      case 'Space':
        this.game.hardDrop();
        break;
      case 'ShiftLeft':
      case 'KeyC':
        this.game.holdPiece();
        break;
      case 'KeyM':
        if (this.game.sounds) {
          this.game.sounds.toggle();
        }
        break;
      case 'Escape':
      case 'F1':
        if (this.game.paused) {
          this.game.countdown = 3;
        } else {
          this.game.paused = true;

          if (this.game.sounds) {
            this.game.sounds.pauseMusic();
          }
        }
        break;
    }
    e.preventDefault();
  }
}

class Renderer {
  constructor(playfieldCanvas, holdCanvas, nextCanvas) {
    this.ctx = playfieldCanvas.getContext('2d');
    this.holdCtx = holdCanvas.getContext('2d');
    this.nextCtx = nextCanvas.getContext('2d');
    this.cellSize = playfieldCanvas.width / 10;
  }

  drawBlock(ctx, px, py, size, color) {
    const pad = Math.max(1, Math.round(size * 0.06));
    const inner = size - pad * 2;
    const edge = Math.max(2, Math.round(size * 0.15));

    ctx.fillStyle = color;
    ctx.fillRect(px + pad, py + pad, inner, inner);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.32)';
    ctx.fillRect(px + pad, py + pad, inner, edge);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.30)';
    ctx.fillRect(px + pad, py + pad + inner - edge, inner, edge);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.10)';
    ctx.fillRect(px + pad, py + pad, edge, inner);
  }

  drawBoard(game) {
    const size = this.cellSize;

    for (let i = 0; i < 20; i++) {
      const boardRow = i + HIDDEN_ROWS;

      for (let j = 0; j < 10; j++) {
        const px = j * size;
        const py = i * size;

        this.ctx.fillStyle = '#060a0f';
        this.ctx.fillRect(px, py, size, size);

        this.ctx.strokeStyle = 'rgba(80, 140, 170, 0.12)';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(px + 0.5, py + 0.5, size - 1, size - 1);

        const cell = game.board[boardRow][j];

        if (cell != null) {
          this.drawBlock(this.ctx, px, py, size, COLORS[cell]);
        }
      }
    }
  }

  drawPiece(piece, x, y, rotation, alpha = 1) {
    const shape = SHAPES[piece][rotation];
    this.ctx.globalAlpha = alpha;

    for (let row = 0; row < shape.length; row++) {
      for (let col = 0; col < shape[row].length; col++) {
        if (shape[row][col] == 0) {
          continue;
        }
        const screenRow = (y + row) - HIDDEN_ROWS;

        if (screenRow < 0) {
          continue;
        }

        const px = (x + col) * this.cellSize;
        const py = screenRow * this.cellSize;

        this.drawBlock(this.ctx, px, py, this.cellSize, COLORS[piece]);
      }
    }
    this.ctx.globalAlpha = 1;
  }

  drawGhost(game) {
    if (!game.current) {
      return;
    }

    let ghostY = game.getGhostPosition();

    if (ghostY == game.current.y) {
      return;
    }
    this.drawPiece(game.current.type, game.current.x, ghostY, game.current.rotation, 0.3);
  }

  drawMiniCentered(ctx, type, slotTop, slotHeight, cell) {
    const shape = SHAPES[type][0];
    const w = shape[0].length * cell;
    const h = shape.length * cell;
    const x = Math.round((ctx.canvas.width - w) / 2);
    const y = Math.round(slotTop + (slotHeight - h) / 2);

    this.drawMini(ctx, type, x, y, cell);
  }

  drawHold(game) {
    const ctx = this.holdCtx;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    if (!game.hold) {
      return;
    }

    this.drawMiniCentered(ctx, game.hold, 0, ctx.canvas.height, 26);
  }

  drawNext(game) {
    const ctx = this.nextCtx;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    for (let i = 0; i < game.nextQueue.length; i++) {
      this.drawMiniCentered(ctx, game.nextQueue[i], i * 80, 80, 20);
    }
  }

  drawMini(ctx, type, offsetX, offsetY, cell) {
    const shape = SHAPES[type][0];
    for (let row = 0; row < shape.length; row++) {
      for (let col = 0; col < shape[row].length; col++) {
        if (shape[row][col] === 0) {
          continue;
        }
        this.drawBlock(ctx, offsetX + col * cell, offsetY + row * cell, cell, COLORS[type]);
      }
    }
  }

  drawStats(game) {
    document.getElementById('score').textContent = game.score;
    document.getElementById('level').textContent = game.level;
    document.getElementById('lines').textContent = game.lines;
  }

  render(game) {
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    this.drawBoard(game);
    this.drawGhost(game);

    if (game.current != null) {
      this.drawPiece(game.current.type, game.current.x, game.current.y, game.current.rotation);
    }

    this.drawHold(game);
    this.drawNext(game);
    this.drawStats(game);

    if (game.paused) {
      this.drawPause(game);
    }

    if (game.gameOver) {
      this.drawGameOver(game);
    }

    this.drawCopyright(game);
  }

  drawCopyright(game) {
    if (!game.showCopyright) {
      return;
    }

    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.textAlign = 'center';
    ctx.font = '12px Arial';
    ctx.fillText('© 2026 My Tetris', ctx.canvas.width / 2, ctx.canvas.height - 10);
  }

  drawPanel(ctx, x, y, w, h, radius) {
    ctx.beginPath();

    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(x, y, w, h, radius);
    } else {
      ctx.rect(x, y, w, h);
    }

    ctx.fillStyle = 'rgba(53, 224, 255, 0.07)';
    ctx.fill();

    ctx.strokeStyle = 'rgba(53, 224, 255, 0.55)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  drawPause(game) {
    const ctx = this.ctx;
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;

    ctx.fillStyle = 'rgba(2, 6, 10, 0.82)';
    ctx.fillRect(0, 0, w, h);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (game.countdown > 0) {
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 84px "Segoe UI", Arial, sans-serif';
      ctx.fillText(Math.ceil(game.countdown), w / 2, h / 2);
    } else {
      this.drawPanel(ctx, 40, h / 2 - 50, w - 80, 100, 12);

      ctx.fillStyle = '#e9f4ff';
      ctx.font = 'bold 26px "Segoe UI", Arial, sans-serif';
      ctx.fillText('PAUSED', w / 2, h / 2 - 12);

      ctx.fillStyle = 'rgba(53, 224, 255, 0.8)';
      ctx.font = '11px "Segoe UI", Arial, sans-serif';
      ctx.fillText('ESC TO RESUME', w / 2, h / 2 + 22);
    }

    ctx.textBaseline = 'alphabetic';
  }

  drawGameOver(game) {
    const ctx = this.ctx;
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;

    ctx.fillStyle = 'rgba(2, 6, 10, 0.86)';
    ctx.fillRect(0, 0, w, h);

    const panelW = 244;
    const panelH = 132;
    const panelX = (w - panelW) / 2;
    const panelY = h / 2 - panelH / 2;

    this.drawPanel(ctx, panelX, panelY, panelW, panelH, 14);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.fillStyle = '#ff4d6d';
    ctx.font = 'bold 27px "Segoe UI", Arial, sans-serif';
    ctx.fillText('GAME OVER', w / 2, panelY + 40);

    ctx.fillStyle = '#e9f4ff';
    ctx.font = 'bold 15px "Segoe UI", Arial, sans-serif';
    ctx.fillText('SCORE  ' + game.score, w / 2, panelY + 76);

    ctx.fillStyle = 'rgba(233, 244, 255, 0.6)';
    ctx.font = '11px "Segoe UI", Arial, sans-serif';
    ctx.fillText('LINES ' + game.lines + '   ·   LEVEL ' + game.level, w / 2, panelY + 102);

    ctx.textBaseline = 'alphabetic';
  }
}

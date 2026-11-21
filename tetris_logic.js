const COLS = 10;
const ROWS = 40;
const HIDDEN_ROWS = 20;
const LINE_SCORES = [0, 100, 300, 500, 800];

const COLORS = {
  I: '#22d3ee',
  O: '#ffd93d',
  T: '#b45cff',
  S: '#3ddc84',
  Z: '#ff4d5e',
  J: '#4d7cff',
  L: '#ff9f1a',
};

const SHAPES = {
  I:[
    [
      [0,0,0,0],
      [1,1,1,1],
      [0,0,0,0],
      [0,0,0,0],
    ],

    [
      [0,0,1,0],
      [0,0,1,0],
      [0,0,1,0],
      [0,0,1,0],
    ],

    [
      [0,0,0,0],
      [0,0,0,0],
      [1,1,1,1],
      [0,0,0,0],
    ],

    [
      [0,1,0,0],
      [0,1,0,0],
      [0,1,0,0],
      [0,1,0,0],
    ],
  ],

  O:[
    [
      [1,1],
      [1,1],
    ],
    [
      [1,1],
      [1,1],
    ],
    [
      [1,1],
      [1,1],
    ],
    [
      [1,1],
      [1,1],
    ],
  ],

  T:[
    [
      [0,1,0],
      [1,1,1],
      [0,0,0],
    ],

    [
      [0,1,0],
      [0,1,1],
      [0,1,0],
    ],

    [
      [0,0,0],
      [1,1,1],
      [0,1,0],
    ],

    [
      [0,1,0],
      [1,1,0],
      [0,1,0],
    ],
  ],

  S:[
    [
      [0,1,1],
      [1,1,0],
      [0,0,0],
    ],

    [
      [0,1,0],
      [0,1,1],
      [0,0,1],
    ],

    [
      [0,0,0],
      [0,1,1],
      [1,1,0],
    ],

    [
      [1,0,0],
      [1,1,0],
      [0,1,0],
    ],
  ],

  Z:[
    [
      [1,1,0],
      [0,1,1],
      [0,0,0],
    ],

    [
      [0,0,1],
      [0,1,1],
      [0,1,0],
    ],

    [
      [0,0,0],
      [1,1,0],
      [0,1,1],
    ],

    [
      [0,1,0],
      [1,1,0],
      [1,0,0],
    ],
  ],

  J:[
    [
      [1,0,0],
      [1,1,1],
      [0,0,0],
    ],

    [
      [0,1,1],
      [0,1,0],
      [0,1,0],
    ],

    [
      [0,0,0],
      [1,1,1],
      [0,0,1],
    ],

    [
      [0,1,0],
      [0,1,0],
      [1,1,0],
    ],
  ],

  L:[
    [
      [0,0,1],
      [1,1,1],
      [0,0,0],
    ],

    [
      [0,1,0],
      [0,1,0],
      [0,1,1],
    ],

    [
      [0,0,0],
      [1,1,1],
      [1,0,0],
    ],

    [
      [1,1,0],
      [0,1,0],
      [0,1,0],
    ],
  ],
};

const SRS_KICKS = {
  JLSTZ: {
    '0>1': [[0,0],[-1,0],[-1,-1],[0,2],[-1,2]],
    '1>0': [[0,0],[1,0],[1,1],[0,-2],[1,-2]],
    '1>2': [[0,0],[1,0],[1,1],[0,-2],[1,-2]],
    '2>1': [[0,0],[-1,0],[-1,-1],[0,2],[-1,2]],
    '2>3': [[0,0],[1,0],[1,-1],[0,2],[1,2]],
    '3>2': [[0,0],[-1,0],[-1,1],[0,-2],[-1,-2]],
    '3>0': [[0,0],[-1,0],[-1,1],[0,-2],[-1,-2]],
    '0>3': [[0,0],[1,0],[1,-1],[0,2],[1,2]],
  },
  I: {
    '0>1': [[0,0],[-2,0],[1,0],[-2,1],[1,-2]],
    '1>0': [[0,0],[2,0],[-1,0],[2,-1],[-1,2]],
    '1>2': [[0,0],[-1,0],[2,0],[-1,-2],[2,1]],
    '2>1': [[0,0],[1,0],[-2,0],[1,2],[-2,-1]],
    '2>3': [[0,0],[2,0],[-1,0],[2,-1],[-1,2]],
    '3>2': [[0,0],[-2,0],[1,0],[-2,1],[1,-2]],
    '3>0': [[0,0],[1,0],[-2,0],[1,2],[-2,-1]],
    '0>3': [[0,0],[-1,0],[2,0],[-1,-2],[2,1]],
  },
};

function gravityForLevel(level) {
  const lv = Math.max(1, Math.min(level, 15));
  const seconds = Math.pow(0.8 - (lv - 1) * 0.007, lv - 1);
  return Math.max(seconds * 1000, 16);
}

class BagRandomizer {
  constructor() {
    this.bag = [];
  }

  refill() {
    const pieces = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

    for (let i = pieces.length -1; i > 0; i--) {
      let j = Math.floor(Math.random() * (i+1));
      let k = pieces[i]
      pieces[i] = pieces[j];
      pieces[j] = k;
    }
    this.bag = pieces
  }

  next() {
    if(this.bag.length === 0){
      this.refill()
    }
    return this.bag.pop()
  }
}

class TetrisGame {
  constructor() {
    this.board = this.createBoard();
    this.bag = new BagRandomizer();
    this.current = null;
    this.hold = null;
    this.canHold = true;
    this.score = 0;
    this.level = 1;
    this.lines = 0;
    this.gameOver = false;
    this.paused = false;
    this.dropCounter = 0;
    this.dropInterval = 500;
    this.level = 1 + Math.floor(this.lines / 10);
    this.nextQueue = [];
    this.sounds = null;
    this.onEvent = null;
    this.countdown = 0;
}

  createBoard() {
    const board = []
    for (let i = 0; i < ROWS; i++) {
      const row = Array(COLS).fill(null);
      board.push(row);
    }
    return board;
  }

  spawnPiece() {
    while (this.nextQueue.length < 6) {
      this.nextQueue.push(this.bag.next());
    }

    const type = this.nextQueue.shift();

    while (this.nextQueue.length < 6) {
      this.nextQueue.push(this.bag.next());
    }

    const width = SHAPES[type][0][0].length;
    const x = Math.floor((COLS - width) / 2);
    const y = HIDDEN_ROWS;

    this.current = {
      type: type,
      x: x,
      y: y,
      rotation: 0,
    };

    if(this.isCollision(this.current.type, this.current.x, this.current.y, this.current.rotation)){
      this.gameOver = true;

      if (this.sounds) {
        this.sounds.gameOver();
      }

      this.notify('gameover');
    }
  }

  moveLeft() {
    if (!this.isCollision(this.current.type, this.current.x - 1, this.current.y, this.current.rotation)) {
      this.current.x = this.current.x - 1;

      if (this.sounds) {
        this.sounds.move();
      }
    }
  }

  moveRight() {
    if (!this.isCollision(this.current.type, this.current.x + 1, this.current.y, this.current.rotation)) {
      this.current.x = this.current.x + 1;

      if (this.sounds) {
        this.sounds.move();
      }
    }
  }

  softDrop() {
    const nextY = this.current.y + 1;

    if (!this.isCollision(this.current.type, this.current.x, nextY, this.current.rotation)) {
      this.current.y = nextY;
    } else {
      this.lockPiece();
    }
  }

  hardDrop() {
    let nextY = this.current.y + 1;

    while (!this.isCollision(this.current.type, this.current.x, nextY, this.current.rotation)) {
      this.current.y = nextY;
      nextY = nextY + 1;
    }

    if (this.sounds) {
      this.sounds.drop();
    }

    this.notify('harddrop');
    this.lockPiece();
  }

  notify(type, value) {
    if (typeof this.onEvent === 'function') {
      this.onEvent(type, value);
    }
  }
  rotateCW() {
    this.applyRotation(1);
  }

  rotateCCW() {
    this.applyRotation(3);
  }

  applyRotation(step) {
    const from = this.current.rotation;
    const to = (from + step) % 4;
    const kicks = this.getKicks(this.current.type, from, to);

    for (let i = 0; i < kicks.length; i++) {
      const offsetX = kicks[i][0];
      const offsetY = kicks[i][1];

      if (!this.isCollision(this.current.type, this.current.x + offsetX, this.current.y + offsetY, to)) {
        this.current.x = this.current.x + offsetX;
        this.current.y = this.current.y + offsetY;
        this.current.rotation = to;

        if (this.sounds) {
          this.sounds.rotate();
        }

        return;
      }
    }
  }

  getKicks(type, from, to) {
    if (type === 'O') {
      return [[0, 0]];
    }

    const table = type === 'I' ? SRS_KICKS.I : SRS_KICKS.JLSTZ;
    return table[from + '>' + to] || [[0, 0]];
  }
  holdPiece() {
    if (this.canHold === false) {
      return;
    }

    const held = this.hold;
    this.hold = this.current.type;

    if (held == null) {
      this.spawnPiece();
    } else {
      const width = SHAPES[held][0][0].length;
      const x = Math.floor((COLS - width) / 2);

      this.current = {
        type: held,
        x: x,
        y: HIDDEN_ROWS,
        rotation: 0,
      };
    }

    this.canHold = false;

    if (this.sounds) {
      this.sounds.hold();
    }
  }

  lockPiece() {
   const shape = SHAPES[this.current.type][this.current.rotation]

    for (let row = 0; row < shape.length; row++) {
      for (let col = 0; col < shape[row].length; col++) {
        if(shape[row][col] == 0){
          continue;
        }

        this.board[this.current.y + row][this.current.x + col] = this.current.type;
      }
    }

    this.canHold = true;

    if (this.sounds) {
      this.sounds.lock();
    }

    this.clearLines();
    this.spawnPiece();
  }
  clearLines() {
    const remainingRows = this.board.filter((row) => row.includes(null));
    const cleared = ROWS - remainingRows.length;

    if (cleared === 0) {
      return;
    }

    const newRows = Array.from({ length: cleared }, () => Array(COLS).fill(null));
    this.board = [...newRows, ...remainingRows];

    this.lines = this.lines + cleared;
    this.score = this.score + LINE_SCORES[cleared] * this.level;
    this.level = 1 + Math.floor(this.lines / 10);

    if (this.sounds) {
      this.sounds.clear(cleared);
    }

    this.notify('clear', cleared);
  }

  isCollision(piece, x, y, rotation) {
    const shape = SHAPES[piece][rotation];

    for (let row = 0; row < shape.length; row++) {
      for (let col = 0; col < shape[row].length; col++) {
        if (shape[row][col] == 0){
          continue
        }

        const bx = x + col
        const by = y + row

        if (bx < 0 || bx >= COLS || by >= ROWS){
          return true
        }

        if (by < 0){
          continue
        }

        if (this.board[by][bx] != null){
          return true
        }
      }
    }
    return false
  }

  getGhostPosition() {
    let ghostY = this.current.y;

    while(!this.isCollision(this.current.type, this.current.x, ghostY + 1, this.current.rotation)){
      ghostY = ghostY + 1;
    }
    return ghostY;
  }

  updatePause(deltaTime) {
  if (this.countdown <= 0) {
    return;
  }

  this.countdown = this.countdown - deltaTime / 1000;

  if (this.countdown <= 0) {
    this.countdown = 0;
    this.paused = false;

    if (this.sounds) {
      this.sounds.resumeMusic();
    }
  }
}

  update(deltaTime) {
    this.dropCounter = this.dropCounter + deltaTime;

    if (this.dropCounter < gravityForLevel(this.level)) {
      return;
    }

    this.dropCounter = 0;

    const nextY = this.current.y + 1;

    if (!this.isCollision(this.current.type, this.current.x, nextY, this.current.rotation)) {
      this.current.y = nextY;
    } else {
      this.lockPiece();
    }
  }
}

# Welcome to My Tetris

A complete, dependency-free implementation of Tetris running in the browser, wrapped in a retro-modern arcade cabinet.

***

## Task

Build a fully playable Tetris clone from scratch in vanilla JavaScript on top of HTML5 `<canvas>`, with no third-party libraries — only the built-in browser APIs (and `Math`).

The challenge is not drawing blocks; it is **making the game feel correct**:

- **SRS rotation with wall kicks.** A piece rotated against a wall or another piece must "kick" into a legal position. This requires the full Super Rotation System offset tables, separately for the I piece and the JLSTZ pieces.
- **Fair randomness.** A naive `Math.random()` produces streaks of the same piece. The 7-bag algorithm guarantees that every group of seven pieces contains each tetromino exactly once.
- **Frame-rate independent gravity.** Falling speed is derived from elapsed time, not from frame count, and follows the Tetris Worlds speed curve across 15 levels.
- **A real game loop.** Spawning, locking, line clearing, scoring, level progression and top-out detection must stay consistent across all 40 rows (20 of which are hidden above the visible playfield).
- **Presentation.** The game also had to look and sound like an arcade machine — CRT screen effects, an attract screen, tactile feedback and audio — without letting any of it leak into the game logic.

## Description

The project is split into small, single-responsibility modules so that the game model stays free of any drawing or input code.

### Architecture

| File | Responsibility |
| --- | --- |
| `tetris_logic.js` | Pure game state: board, shapes, SRS kicks, 7-bag randomiser, collision, spawn, movement, rotation, locking, line clearing, scoring, level curve |
| `renderer.js` | All canvas drawing: playfield grid, 3D-beveled blocks, ghost piece, hold box, next queue, HUD counters, pause and game-over panels |
| `controller.js` | Keyboard mapping; translates physical keys into game commands |
| `audio.js` | Sound engine: Web Audio effects plus a looping music track, with a synthesized fallback |
| `my_tetris.js` | Bootstrap: builds the objects, owns the `requestAnimationFrame` loop, handles the attract screen, screen shake and UI feedback |
| `html_server.js` | Minimal static file server (Node core modules only) so the game can be served locally |
| `index.html`, `style.css` | Arcade cabinet markup and all visual styling |

### How the problem was solved

**Game model.** The board is a `40 × 10` matrix filled with `null`; a locked cell stores the letter of the piece (`'T'`, `'I'`, ...). Each tetromino stores four pre-computed rotation matrices inside a fixed bounding box (3×3 for T/S/Z/J/L, 4×4 for I, 2×2 for O), so rotation is an index change rather than a geometric calculation.

**Collision.** One function decides every legal move: it walks the shape matrix, skips empty cells, maps each filled cell to board coordinates and reports a hit on a wall, the floor or an occupied cell. Hidden rows above the board are treated as empty instead of being indexed.

**Rotation.** `applyRotation()` looks up the SRS kick table for the current transition (`0→1`, `1→2`, ...), tries each offset in order and applies the first one that does not collide — which is what allows spins next to walls and in tight wells.

**Randomness.** `BagRandomizer` shuffles the seven pieces with Fisher-Yates, returns them one by one, and refills only when the bag is empty.

**Loop and timing.** `update(deltaTime)` accumulates elapsed milliseconds; when the accumulated time exceeds the gravity interval for the current level, the piece moves down one row or locks. Level speed follows the Tetris Worlds formula: `(0.8 − (level − 1) × 0.007) ^ (level − 1)` seconds per row.

**Scoring.** A single line is worth 100, a double 300, a triple 500 and four lines 800, multiplied by the current level. Level increases every ten cleared lines.

**Presentation.** The UI is layered on top of the game: an attract screen until the player presses Enter, a power-on transition, CRT scanlines/mask/glare/vignette, screen shake on hard drops and line clears, animated counters, and an arcade cabinet frame that scales to fit the viewport without scrolling.

### Features

- 10 × 40 playfield (20 hidden rows) with 7 bag-randomised tetrominoes
- Full SRS rotation and wall kicks for both piece families
- Ghost piece, hold slot (once per piece), six-piece next queue
- Soft drop, hard drop, lock on landing, line clearing with scoring
- 15 levels with the Tetris Worlds gravity curve
- Pause with a 3-2-1 countdown (music pauses with the game)
- Game over detection and instant restart
- Synthesized sound effects and a looping theme with a mute toggle
- Arcade cabinet UI: CRT effects, attract mode, neon lighting, tactile animations

## Installation

No build step and no dependencies. The only requirement is **Node.js 18+** (used purely as a static file server; it ships with `http`, `fs` and `path`).

```bash
git clone https://github.com/a017aa/tetris
cd my_tetris
node html_server.js
```

The game is then available at **http://127.0.0.1:8080**.

Any other static server works as well (for example `python -m http.server 8080`). Opening `index.html` directly from disk also runs the game, but browsers block `fetch()` on `file://`, so the audio files will not load and the synthesized fallback is used instead.

## Usage

Start the server, open the page, then press **Enter** (or click the screen) at the "INSERT COIN / READY TO PLAY?" prompt.

```bash
node html_server.js
# Server running at http://127.0.0.1:8080/
```

### Controls

| Key | Action |
| --- | --- |
| `←` / `→` | Move left / right |
| `↓` | Soft drop |
| `↑` or `X` | Rotate clockwise |
| `Z` or `Ctrl` | Rotate counter-clockwise |
| `Space` | Hard drop |
| `Shift` or `C` | Hold piece |
| `Esc` or `F1` | Pause (press again for the 3-2-1 countdown) |
| `M` | Mute / unmute sound |
| `Enter` | Start game / restart after game over |

### Audio

The `audio/` folder contains the sound effects and the looping theme. Both are royalty-free: the melody is the Russian folk song *Korobeiniki* (public domain) and the performance is rendered locally, so there is no third-party recording involved.

To use your own track, drop a file named `theme.mp3` or `theme.wav` into `audio/` — it is picked up automatically. Sound effects can be replaced with files of the same names.

## Project Structure

```
.
├── index.html          # Arcade cabinet markup
├── style.css           # Layout, CRT effects, animations
├── tetris_logic.js     # Game state and rules
├── renderer.js         # Canvas rendering
├── controller.js       # Keyboard input
├── audio.js            # Sound engine
├── my_tetris.js        # Bootstrap and main loop
├── html_server.js      # Local static server
└── audio/
    ├── theme.wav       # Looping music
    ├── move.wav
    ├── rotate.wav
    ├── drop.wav
    ├── lock.wav
    ├── clear.wav
    ├── hold.wav
    └── gameover.wav
```

### The Core Team
hajiyev_a

<span><i>Made at <a href='https://qwasar.io'>Qwasar SV -- Software Engineering School</a></i></span>
<span><img alt='Qwasar SV -- Software Engineering School's Logo' src='https://storage.googleapis.com/qwasar-public/qwasar-logo_50x50.png' width='20px' /></span>

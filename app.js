/**
 * Brutal Sudoku - Core Game Logic & UI Controller
 */

// --- SUDOKU ENGINE ---
const SudokuEngine = {
  /**
   * Checks if placing val at (row, col) is valid on the grid.
   */
  isValid(grid, r, c, val) {
    for (let i = 0; i < 9; i++) {
      if (grid[r][i] === val) return false;
      if (grid[i][c] === val) return false;
      
      const boxRow = 3 * Math.floor(r / 3) + Math.floor(i / 3);
      const boxCol = 3 * Math.floor(c / 3) + (i % 3);
      if (grid[boxRow][boxCol] === val) return false;
    }
    return true;
  },

  /**
   * Solves the sudoku grid using backtracking.
   * Modifies the grid in place. Returns true if solvable.
   */
  solve(grid) {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (grid[r][c] === 0) {
          for (let val = 1; val <= 9; val++) {
            if (this.isValid(grid, r, c, val)) {
              grid[r][c] = val;
              if (this.solve(grid)) return true;
              grid[r][c] = 0;
            }
          }
          return false;
        }
      }
    }
    return true;
  },

  /**
   * Counts the number of solutions for a grid up to a limit.
   * Highly optimized by pre-indexing empty cells.
   */
  countSolutions(grid, limit = 2) {
    let count = 0;
    const empties = [];
    
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (grid[r][c] === 0) {
          empties.push({ r, c });
        }
      }
    }

    function backtrack(idx) {
      if (count >= limit) return;
      if (idx === empties.length) {
        count++;
        return;
      }

      const { r, c } = empties[idx];
      for (let val = 1; val <= 9; val++) {
        if (SudokuEngine.isValid(grid, r, c, val)) {
          grid[r][c] = val;
          backtrack(idx + 1);
          grid[r][c] = 0;
        }
      }
    }

    backtrack(0);
    return count;
  },

  /**
   * Generates a fully solved valid Sudoku board randomly.
   */
  generateFullBoard() {
    const grid = Array.from({ length: 9 }, () => Array(9).fill(0));
    
    function fill() {
      let r = -1;
      let c = -1;
      for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
          if (grid[i][j] === 0) {
            r = i;
            c = j;
            break;
          }
        }
        if (r !== -1) break;
      }
      
      if (r === -1) return true; // Completed

      const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];
      // Shuffle nums
      for (let i = nums.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [nums[i], nums[j]] = [nums[j], nums[i]];
      }

      for (const val of nums) {
        if (SudokuEngine.isValid(grid, r, c, val)) {
          grid[r][c] = val;
          if (fill()) return true;
          grid[r][c] = 0;
        }
      }
      return false;
    }

    fill();
    return grid;
  },

  /**
   * Generates a puzzle of specified difficulty with a guaranteed unique solution.
   */
  generatePuzzle(difficulty) {
    const solved = this.generateFullBoard();
    const puzzle = solved.map(row => [...row]);

    // Target clues remaining
    let targetClues = 34;
    if (difficulty === 'easy') targetClues = 42;
    else if (difficulty === 'medium') targetClues = 32;
    else if (difficulty === 'hard') targetClues = 26;
    else if (difficulty === 'expert') targetClues = 21;

    // Coordinate list
    const coords = [];
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        coords.push({ r, c });
      }
    }
    // Shuffle coordinates
    for (let i = coords.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [coords[i], coords[j]] = [coords[j], coords[i]];
    }

    let cluesCount = 81;
    // Iterate coordinates and try removing numbers
    for (const { r, c } of coords) {
      if (cluesCount <= targetClues) break;

      const temp = puzzle[r][c];
      puzzle[r][c] = 0;

      // Verify unique solution
      if (this.countSolutions(puzzle, 2) === 1) {
        cluesCount--;
      } else {
        puzzle[r][c] = temp; // Restore clue
      }
    }

    return { puzzle, solved };
  }
};


// --- CANVAS CONFETTI EFFECT ---
class ConfettiManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.active = false;
    this.colors = ['#FF5E97', '#A78BFA', '#34D399', '#FFE600', '#2563EB', '#F59E0B'];
    
    window.addEventListener('resize', () => this.resize());
    this.resize();
  }
  
  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }
  
  start() {
    this.active = true;
    this.particles = [];
    for (let i = 0; i < 150; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height - this.canvas.height,
        size: Math.random() * 8 + 6,
        color: this.colors[Math.floor(Math.random() * this.colors.length)],
        speedX: Math.random() * 6 - 3,
        speedY: Math.random() * 4 + 4,
        rotation: Math.random() * 360,
        rotationSpeed: Math.random() * 6 - 3
      });
    }
    this.loop();
  }
  
  stop() {
    this.active = false;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
  
  loop() {
    if (!this.active) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    let alive = false;
    for (const p of this.particles) {
      p.y += p.speedY;
      p.x += p.speedX;
      p.rotation += p.rotationSpeed;
      
      if (p.y < this.canvas.height) {
        alive = true;
      }
      
      this.ctx.save();
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate(p.rotation * Math.PI / 180);
      this.ctx.fillStyle = p.color;
      this.ctx.strokeStyle = '#000000';
      this.ctx.lineWidth = 2;
      this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      this.ctx.strokeRect(-p.size / 2, -p.size / 2, p.size, p.size);
      this.ctx.restore();
    }
    
    if (alive) {
      requestAnimationFrame(() => this.loop());
    } else {
      this.active = false;
    }
  }
}


// --- GAME CONTROLLER ---
class SudokuGame {
  constructor() {
    this.board = Array.from({ length: 9 }, () => Array(9).fill(0));
    this.solvedBoard = Array.from({ length: 9 }, () => Array(9).fill(0));
    this.initialBoard = Array.from({ length: 9 }, () => Array(9).fill(0));
    this.notes = Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => new Set()));
    this.history = [];
    
    this.selectedCell = { r: 0, c: 0 };
    this.mistakes = 0;
    this.difficulty = 'medium';
    this.timer = 0;
    this.timerInterval = null;
    this.isPaused = false;
    this.pencilMode = false;
    this.gameActive = false;
    
    // UI References
    this.gridContainer = document.getElementById('sudoku-board-grid');
    this.timerLabel = document.getElementById('lbl-timer');
    this.mistakesLabel = document.getElementById('lbl-mistakes');
    this.difficultyLabel = document.getElementById('lbl-difficulty');
    this.pauseBtn = document.getElementById('btn-pause-timer');
    this.pencilBtn = document.getElementById('btn-pencil');
    
    // Confetti
    const canvas = document.getElementById('confetti-canvas');
    this.confetti = new ConfettiManager(canvas);

    // Stats
    this.stats = this.loadStats();
    
    this.initDOMGrid();
    this.bindEvents();
    this.startNewGame('medium');
  }

  /**
   * Setup the 81 cell elements in the DOM.
   */
  initDOMGrid() {
    this.gridContainer.innerHTML = '';
    
    // Create Paused Overlay
    const pausedOverlay = document.createElement('div');
    pausedOverlay.className = 'paused-overlay';
    pausedOverlay.id = 'paused-grid-overlay';
    pausedOverlay.innerHTML = `
      <div style="font-family: var(--font-display); font-size: 2rem; font-weight: 900; letter-spacing: 1px; margin-bottom: 10px;">GAME PAUSED</div>
      <button class="btn btn-accent" id="btn-resume-from-overlay">RESUME</button>
    `;
    this.gridContainer.parentNode.appendChild(pausedOverlay);

    // Create 81 cells
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const cell = document.createElement('div');
        cell.className = 'sudoku-cell';
        cell.id = `cell-${r}-${c}`;
        cell.tabIndex = 0;
        cell.dataset.row = r;
        cell.dataset.col = c;
        
        // Notes subgrid
        const notesGrid = document.createElement('div');
        notesGrid.className = 'notes-grid';
        for (let n = 1; n <= 9; n++) {
          const noteCell = document.createElement('div');
          noteCell.className = 'note-cell';
          noteCell.id = `note-${r}-${c}-${n}`;
          notesGrid.appendChild(noteCell);
        }
        cell.appendChild(notesGrid);
        
        // Value Text
        const valSpan = document.createElement('span');
        valSpan.className = 'cell-value';
        valSpan.id = `val-${r}-${c}`;
        cell.appendChild(valSpan);
        
        // Event listeners for cell click
        cell.addEventListener('mousedown', () => {
          if (!this.gameActive || this.isPaused) return;
          this.selectCell(r, c);
          window.Sound.playClick();
        });
        
        this.gridContainer.appendChild(cell);
      }
    }
  }

  /**
   * Start a new game with the given difficulty.
   */
  startNewGame(difficulty) {
    this.confetti.stop();
    this.difficulty = difficulty;
    this.difficultyLabel.textContent = difficulty.toUpperCase();
    this.mistakes = 0;
    this.mistakesLabel.textContent = '0';
    this.timer = 0;
    this.isPaused = false;
    this.pencilMode = false;
    this.pencilBtn.classList.remove('active');
    this.history = [];
    
    // Create new puzzle
    const { puzzle, solved } = SudokuEngine.generatePuzzle(difficulty);
    this.board = puzzle.map(row => [...row]);
    this.solvedBoard = solved.map(row => [...row]);
    this.initialBoard = puzzle.map(row => [...row]);
    
    // Clear notes
    this.notes = Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => new Set()));
    
    // Reset layout states
    const cells = document.querySelectorAll('.sudoku-cell');
    cells.forEach(cell => {
      cell.classList.remove('win-animate');
      const r = parseInt(cell.dataset.row);
      const c = parseInt(cell.dataset.col);
      if (this.initialBoard[r][c] !== 0) {
        cell.setAttribute('data-initial', 'true');
      } else {
        cell.removeAttribute('data-initial');
      }
    });

    document.getElementById('paused-grid-overlay').classList.remove('active');
    this.updatePauseButtonIcon();
    
    this.gameActive = true;
    this.selectedCell = { r: 0, c: 0 };
    
    this.startTimer();
    this.render();
  }

  /**
   * Handles timer intervals.
   */
  startTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      if (!this.isPaused && this.gameActive) {
        this.timer++;
        this.updateTimerDisplay();
      }
    }, 1000);
    this.updateTimerDisplay();
  }

  updateTimerDisplay() {
    const mins = Math.floor(this.timer / 60);
    const secs = this.timer % 60;
    this.timerLabel.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Pause/Resume game flow.
   */
  togglePause() {
    if (!this.gameActive) return;
    this.isPaused = !this.isPaused;
    
    const overlay = document.getElementById('paused-grid-overlay');
    if (this.isPaused) {
      overlay.classList.add('active');
      window.Sound.playClick();
    } else {
      overlay.classList.remove('active');
      window.Sound.playClick();
    }
    this.updatePauseButtonIcon();
    this.render();
  }

  updatePauseButtonIcon() {
    const icon = document.getElementById('icon-pause-play');
    if (this.isPaused) {
      // Show Play symbol
      icon.innerHTML = `<polygon points="5 3 19 12 5 21 5 3"></polygon>`;
      this.pauseBtn.title = "Resume Game";
    } else {
      // Show Pause symbol
      icon.innerHTML = `<rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect>`;
      this.pauseBtn.title = "Pause Game";
    }
  }

  /**
   * Handle active cell selections.
   */
  selectCell(r, c) {
    this.selectedCell = { r, c };
    this.renderHighlights();
  }

  /**
   * Set inputs (numeric digit 1-9).
   */
  inputDigit(val) {
    if (!this.gameActive || this.isPaused) return;
    const { r, c } = this.selectedCell;
    
    // Ignore edits on initial board clues
    if (this.initialBoard[r][c] !== 0) return;
    
    // If we already filled this cell correctly, ignore overrides
    if (this.board[r][c] === this.solvedBoard[r][c]) return;

    if (this.pencilMode) {
      // Toggle note
      const oldNotes = new Set(this.notes[r][c]);
      if (this.notes[r][c].has(val)) {
        this.notes[r][c].delete(val);
      } else {
        this.notes[r][c].add(val);
      }
      const newNotes = new Set(this.notes[r][c]);
      
      this.pushHistory({
        type: 'notes',
        r, c,
        oldVal: this.board[r][c],
        newVal: this.board[r][c],
        oldNotes,
        newNotes
      });
      
      window.Sound.playToggle();
      this.renderCell(r, c);
    } else {
      // Regular input mode
      const oldVal = this.board[r][c];
      const oldNotes = new Set(this.notes[r][c]);
      
      this.board[r][c] = val;
      
      this.pushHistory({
        type: 'input',
        r, c,
        oldVal,
        newVal: val,
        oldNotes,
        newNotes: new Set(this.notes[r][c]) // notes unmodified
      });

      if (val === this.solvedBoard[r][c]) {
        // Correct Move
        window.Sound.playPop();
        // Clear notes of this value in same row/col/box
        this.autoClearNotes(r, c, val);
        this.checkWinCondition();
      } else {
        // Incorrect Move
        window.Sound.playBuzz();
        this.mistakes++;
        this.mistakesLabel.textContent = this.mistakes;
        
        // Add wiggle visual effect
        const cellEl = document.getElementById(`cell-${r}-${c}`);
        cellEl.classList.add('conflict');
        setTimeout(() => cellEl.classList.remove('conflict'), 400);

        if (this.mistakes >= 3) {
          this.triggerGameOver();
        }
      }
      this.render();
    }
  }

  /**
   * Erase value in selected cell.
   */
  eraseSelected() {
    if (!this.gameActive || this.isPaused) return;
    const { r, c } = this.selectedCell;
    
    if (this.initialBoard[r][c] !== 0) return;
    if (this.board[r][c] === this.solvedBoard[r][c]) return; // don't erase completed digits

    if (this.board[r][c] === 0 && this.notes[r][c].size === 0) return; // already empty

    const oldVal = this.board[r][c];
    const oldNotes = new Set(this.notes[r][c]);
    
    this.board[r][c] = 0;
    this.notes[r][c].clear();
    
    this.pushHistory({
      type: 'erase',
      r, c,
      oldVal,
      newVal: 0,
      oldNotes,
      newNotes: new Set()
    });

    window.Sound.playWhoosh();
    this.render();
  }

  /**
   * Undo last move.
   */
  undo() {
    if (!this.gameActive || this.isPaused || this.history.length === 0) return;
    
    const lastAction = this.history.pop();
    const { r, c, oldVal, oldNotes } = lastAction;
    
    this.board[r][c] = oldVal;
    this.notes[r][c] = new Set(oldNotes);
    
    window.Sound.playWhoosh();
    this.selectCell(r, c);
    this.render();
  }

  /**
   * Push an action onto the history stack.
   */
  pushHistory(action) {
    this.history.push(action);
    if (this.history.length > 50) {
      this.history.shift(); // limit history size to 50
    }
  }

  /**
   * Reveal the correct number for the selected cell.
   */
  revealHint() {
    if (!this.gameActive || this.isPaused) return;
    const { r, c } = this.selectedCell;
    
    if (this.initialBoard[r][c] !== 0) return;
    
    const correctVal = this.solvedBoard[r][c];
    if (this.board[r][c] === correctVal) return; // already correct
    
    const oldVal = this.board[r][c];
    const oldNotes = new Set(this.notes[r][c]);
    
    this.board[r][c] = correctVal;
    this.notes[r][c].clear();
    
    this.pushHistory({
      type: 'hint',
      r, c,
      oldVal,
      newVal: correctVal,
      oldNotes,
      newNotes: new Set()
    });
    
    window.Sound.playPop();
    this.autoClearNotes(r, c, correctVal);
    this.render();
    this.checkWinCondition();
  }

  /**
   * Automatically clears candidate notes in related groups on correct fill.
   */
  autoClearNotes(row, col, val) {
    for (let i = 0; i < 9; i++) {
      // Row check
      if (this.notes[row][i].has(val)) {
        this.notes[row][i].delete(val);
        this.renderCell(row, i);
      }
      // Col check
      if (this.notes[i][col].has(val)) {
        this.notes[i][col].delete(val);
        this.renderCell(i, col);
      }
      // Box check
      const boxRow = 3 * Math.floor(row / 3) + Math.floor(i / 3);
      const boxCol = 3 * Math.floor(col / 3) + (i % 3);
      if (this.notes[boxRow][boxCol].has(val)) {
        this.notes[boxRow][boxCol].delete(val);
        this.renderCell(boxRow, boxCol);
      }
    }
  }

  /**
   * Check if the grid has been correctly completed.
   */
  checkWinCondition() {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (this.board[r][c] !== this.solvedBoard[r][c]) {
          return; // not solved yet
        }
      }
    }
    
    // Solver success!
    this.gameActive = false;
    clearInterval(this.timerInterval);
    window.Sound.playWin();
    
    // Save stats
    this.saveWinStats();

    // Trigger grid cells win zoom animation sequence
    const cells = document.querySelectorAll('.sudoku-cell');
    cells.forEach((cell, idx) => {
      setTimeout(() => {
        cell.classList.add('win-animate');
      }, idx * 10);
    });

    // Confetti
    setTimeout(() => {
      this.confetti.start();
      this.triggerVictoryModal();
    }, 1000);
  }

  /**
   * Stats handlers
   */
  loadStats() {
    const saved = localStorage.getItem('brutal_sudoku_stats');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      easy: { played: 0, won: 0, bestTime: null },
      medium: { played: 0, won: 0, bestTime: null },
      hard: { played: 0, won: 0, bestTime: null },
      expert: { played: 0, won: 0, bestTime: null }
    };
  }

  saveWinStats() {
    const diff = this.difficulty;
    this.stats[diff].played++;
    this.stats[diff].won++;
    if (this.stats[diff].bestTime === null || this.timer < this.stats[diff].bestTime) {
      this.stats[diff].bestTime = this.timer;
    }
    localStorage.setItem('brutal_sudoku_stats', JSON.stringify(this.stats));
  }

  /**
   * Trigger Modals
   */
  triggerVictoryModal() {
    document.getElementById('victory-difficulty').textContent = this.difficulty.toUpperCase();
    
    const mins = Math.floor(this.timer / 60);
    const secs = this.timer % 60;
    document.getElementById('victory-time').textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    document.getElementById('victory-mistakes').textContent = `${this.mistakes} / 3`;
    
    document.getElementById('modal-victory').classList.add('active');
  }

  triggerGameOver() {
    this.gameActive = false;
    clearInterval(this.timerInterval);
    document.getElementById('modal-game-over').classList.add('active');
  }

  /**
   * Core UI Rendering Loop
   */
  render() {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        this.renderCell(r, c);
      }
    }
    this.renderHighlights();
  }

  /**
   * Renders a specific cell.
   */
  renderCell(r, c) {
    const cellEl = document.getElementById(`cell-${r}-${c}`);
    const valSpan = document.getElementById(`val-${r}-${c}`);
    const val = this.board[r][c];

    // If game is paused, hide digits to prevent cheating
    if (this.isPaused) {
      cellEl.setAttribute('data-has-val', 'false');
      valSpan.textContent = '';
      for (let n = 1; n <= 9; n++) {
        const noteCell = document.getElementById(`note-${r}-${c}-${n}`);
        noteCell.textContent = '';
      }
      return;
    }

    if (val !== 0) {
      cellEl.setAttribute('data-has-val', 'true');
      valSpan.textContent = val;
      
      // If user cell is wrong, mark style
      if (this.initialBoard[r][c] === 0 && val !== this.solvedBoard[r][c]) {
        cellEl.classList.add('conflict');
      } else {
        cellEl.classList.remove('conflict');
      }
    } else {
      cellEl.setAttribute('data-has-val', 'false');
      valSpan.textContent = '';
      cellEl.classList.remove('conflict');
      
      // Render Pencil notes
      for (let n = 1; n <= 9; n++) {
        const noteCell = document.getElementById(`note-${r}-${c}-${n}`);
        if (this.notes[r][c].has(n)) {
          noteCell.textContent = n;
        } else {
          noteCell.textContent = '';
        }
      }
    }
  }

  /**
   * Apply background highlighting and selections based on focused cell.
   */
  renderHighlights() {
    if (this.isPaused) return;
    const { r: selR, c: selC } = this.selectedCell;
    const selVal = this.board[selR][selC];

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const cellEl = document.getElementById(`cell-${r}-${c}`);
        cellEl.classList.remove('selected', 'highlighted');

        const inSameRow = (r === selR);
        const inSameCol = (c === selC);
        const inSameBox = (Math.floor(r / 3) === Math.floor(selR / 3) && Math.floor(c / 3) === Math.floor(selC / 3));

        if (r === selR && c === selC) {
          cellEl.classList.add('selected');
        } else if (inSameRow || inSameCol || inSameBox) {
          cellEl.classList.add('highlighted');
        } else if (selVal !== 0 && this.board[r][c] === selVal) {
          cellEl.classList.add('highlighted');
        }
      }
    }
  }

  /**
   * Bind event listeners for UI buttons and Keyboard shortcuts.
   */
  bindEvents() {
    // Top Controls
    document.getElementById('btn-toggle-sound').addEventListener('click', () => {
      const active = window.Sound.toggle();
      const btn = document.getElementById('btn-toggle-sound');
      if (active) {
        btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>`;
      } else {
        btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>`;
      }
      window.Sound.playClick();
    });

    document.getElementById('btn-open-rules').addEventListener('click', () => {
      document.getElementById('modal-rules').classList.add('active');
      window.Sound.playClick();
    });

    document.getElementById('lnk-footer-rules').addEventListener('click', (e) => {
      e.preventDefault();
      document.getElementById('modal-rules').classList.add('active');
      window.Sound.playClick();
    });

    document.getElementById('btn-close-rules-modal').addEventListener('click', () => {
      document.getElementById('modal-rules').classList.remove('active');
      window.Sound.playClick();
    });

    document.getElementById('btn-trigger-new-game').addEventListener('click', () => {
      document.getElementById('modal-new-game').classList.add('active');
      window.Sound.playClick();
    });

    document.getElementById('btn-close-new-game-modal').addEventListener('click', () => {
      document.getElementById('modal-new-game').classList.remove('active');
      window.Sound.playClick();
    });

    // Difficulty Options Buttons
    const diffButtons = ['btn-diff-easy', 'btn-diff-medium', 'btn-diff-hard', 'btn-diff-expert'];
    diffButtons.forEach(id => {
      const btn = document.getElementById(id);
      btn.addEventListener('click', () => {
        const diff = btn.getAttribute('data-difficulty');
        document.getElementById('modal-new-game').classList.remove('active');
        window.Sound.playClick();
        this.startNewGame(diff);
      });
    });

    // Pause/Resume Actions
    this.pauseBtn.addEventListener('click', () => this.togglePause());
    document.addEventListener('click', (e) => {
      if (e.target && e.target.id === 'btn-resume-from-overlay') {
        this.togglePause();
      }
    });

    // Keypad digits click
    for (let n = 1; n <= 9; n++) {
      document.getElementById(`btn-keypad-${n}`).addEventListener('click', () => {
        this.inputDigit(n);
      });
    }

    // Action Key click
    this.pencilBtn.addEventListener('click', () => {
      this.pencilMode = !this.pencilMode;
      this.pencilBtn.classList.toggle('active', this.pencilMode);
      window.Sound.playToggle();
    });

    document.getElementById('btn-erase').addEventListener('click', () => this.eraseSelected());
    document.getElementById('btn-undo').addEventListener('click', () => this.undo());
    document.getElementById('btn-hint').addEventListener('click', () => this.revealHint());

    // Game Over actions
    document.getElementById('btn-gameover-restart').addEventListener('click', () => {
      document.getElementById('modal-game-over').classList.remove('active');
      window.Sound.playClick();
      this.startNewGame(this.difficulty);
    });

    document.getElementById('btn-gameover-new').addEventListener('click', () => {
      document.getElementById('modal-game-over').classList.remove('active');
      document.getElementById('modal-new-game').classList.add('active');
      window.Sound.playClick();
    });

    // Victory play again
    document.getElementById('btn-victory-new').addEventListener('click', () => {
      document.getElementById('modal-victory').classList.remove('active');
      document.getElementById('modal-new-game').classList.add('active');
      window.Sound.playClick();
    });

    // Theme selector
    const themeDots = document.querySelectorAll('.theme-dot');
    themeDots.forEach(dot => {
      dot.addEventListener('click', () => {
        themeDots.forEach(d => d.classList.remove('active'));
        dot.classList.add('active');
        const theme = dot.getAttribute('data-theme');
        if (theme === 'default') {
          document.documentElement.removeAttribute('data-theme');
        } else {
          document.documentElement.setAttribute('data-theme', theme);
        }
        window.Sound.playClick();
      });
    });

    // Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
      if (!this.gameActive || this.isPaused) return;

      // Ignore shortcuts if a modal is open
      const modals = document.querySelectorAll('.modal-overlay.active');
      if (modals.length > 0) return;

      let r = this.selectedCell.r;
      let c = this.selectedCell.c;

      // Direction keys
      if (e.key === 'ArrowUp' || e.key.toLowerCase() === 'w') {
        e.preventDefault();
        this.selectCell((r - 1 + 9) % 9, c);
        window.Sound.playClick();
      } else if (e.key === 'ArrowDown' || e.key.toLowerCase() === 's') {
        e.preventDefault();
        this.selectCell((r + 1) % 9, c);
        window.Sound.playClick();
      } else if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') {
        e.preventDefault();
        this.selectCell(r, (c - 1 + 9) % 9);
        window.Sound.playClick();
      } else if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') {
        e.preventDefault();
        this.selectCell(r, (c + 1) % 9);
        window.Sound.playClick();
      }

      // Undo shortcut (Ctrl+Z or U)
      else if ((e.ctrlKey && e.key.toLowerCase() === 'z') || e.key.toLowerCase() === 'u') {
        e.preventDefault();
        this.undo();
      }

      // Pencil mode shortcut (N or Space)
      else if (e.key.toLowerCase() === 'n' || e.key === ' ') {
        e.preventDefault();
        this.pencilMode = !this.pencilMode;
        this.pencilBtn.classList.toggle('active', this.pencilMode);
        window.Sound.playToggle();
      }

      // Erase shortcuts (Backspace, Delete, or Digit 0)
      else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
        e.preventDefault();
        this.eraseSelected();
      }

      // Numbers 1-9
      else if (e.key >= '1' && e.key <= '9') {
        e.preventDefault();
        this.inputDigit(parseInt(e.key));
      }
    });
  }
}

// Initialise game on page load
window.addEventListener('DOMContentLoaded', () => {
  window.GameInstance = new SudokuGame();
});

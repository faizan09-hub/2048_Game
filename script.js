const gridElement = document.querySelector('.grid');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('highScore');
const gameOverElement = document.getElementById('gameOver');
const winScreenElement = document.getElementById('winScreen');
const themeToggleButton = document.getElementById('themeToggle');
const undoButton = document.getElementById('undoButton');
const hintButton = document.getElementById('hintButton');
const resetGameButton = document.getElementById('resetGameButton');
const gridSizeSelector = document.getElementById('gridSizeSelector');
const difficultySelector = document.getElementById("difficultySelector");
const levelSelector = document.getElementById("levelSelector");
const timeRemainingElement = document.getElementById('timeRemaining');

let board = [];
let score = 0;
let highScore = localStorage.getItem('highScore') || 0;
let previousBoards = []; // For undo functionality
let gridSize = 4; // Default grid size
let hasWon = false;
let level = 1; // Default level
let timer; // Timer for level time limit

const levelTargets = {
    1: { targetTile: 128, timeLimit: 120 }, // 2 minutes to reach 128 tile
    2: { targetTile: 256, timeLimit: 180 }, // 3 minutes to reach 256 tile
    3: { targetTile: 512, timeLimit: 240 }  // 4 minutes to reach 512 tile
};

// Initialize the game
function init() {
    clearInterval(timer); // Clear any existing timer
    board = Array.from({ length: gridSize }, () => Array(gridSize).fill(0));
    score = 0;
    scoreElement.textContent = score;
    highScoreElement.textContent = highScore;
    gameOverElement.style.display = 'none';
    winScreenElement.style.display = 'none';
    addRandomTile();
    addRandomTile();
    renderBoard();
    saveGameState(); // Auto-save game state
    startLevelTimer(); // Start the level timer
}

// Start the level timer
function startLevelTimer() {
    const { timeLimit } = levelTargets[level];
    let timeRemaining = timeLimit;
    timeRemainingElement.textContent = timeRemaining;
    timer = setInterval(() => {
        timeRemaining--;
        timeRemainingElement.textContent = timeRemaining;
        if (timeRemaining <= 0) {
            clearInterval(timer);
            checkGameOver();
        }
    }, 1000);
}

// Add a random tile (2 or 4) to an empty spot on the board
function addRandomTile() {
    const emptyTiles = [];
    for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
            if (board[r][c] === 0) emptyTiles.push([r, c]);
        }
    }
    if (emptyTiles.length > 0) {
        const [r, c] = emptyTiles[Math.floor(Math.random() * emptyTiles.length)];
        board[r][c] = Math.random() < 0.9 ? 2 : 4;
    }
}

// Render the board to the DOM
function renderBoard() {
    gridElement.innerHTML = '';
    gridElement.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
    gridElement.style.gridTemplateRows = `repeat(${gridSize}, 1fr)`;

    for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
            const tile = document.createElement('div');
            tile.classList.add('tile');
            if (board[r][c] !== 0) {
                tile.textContent = board[r][c];
                tile.style.backgroundColor = getTileColor(board[r][c]);
                tile.style.color = board[r][c] >= 8 ? '#f9f6f2' : '#776e65';
            } else {
                tile.classList.add('empty');
            }
            gridElement.appendChild(tile);
        }
    }
}

// Get tile color based on value
function getTileColor(value) {
    switch (value) {
        case 2: return '#eee4da';
        case 4: return '#f7ead2';
        case 8: return '#f2b179';
        case 16: return '#f59563';
        case 32: return '#f67c5f';
        case 64: return '#f65e3b';
        case 128: return '#edcf72';
        case 256: return '#edcc61';
        case 512: return '#edc850';
        case 1024: return '#edc53f';
        case 2048: return '#edc22e';
        default: return '#cdc1b4';
    }
}

// Handle key presses for movement
document.addEventListener('keydown', (e) => {
    saveState(); // Save the current state before moving
    playSound('moveSound');
    if (e.key === 'ArrowUp') moveUp();
    if (e.key === 'ArrowDown') moveDown();
    if (e.key === 'ArrowLeft') moveLeft();
    if (e.key === 'ArrowRight') moveRight();
});

// Move tiles up
function moveUp() {
    let moved = false;
    for (let c = 0; c < gridSize; c++) {
        let row = [];
        for (let r = 0; r < gridSize; r++) {
            if (board[r][c] !== 0) row.push(board[r][c]);
        }
        row = merge(row);
        for (let r = 0; r < gridSize; r++) {
            if (board[r][c] !== row[r]) moved = true;
            board[r][c] = row[r] || 0;
        }
    }
    if (moved) addRandomTile();
    checkGameOver();
    renderBoard();
}

// Move tiles down
function moveDown() {
    let moved = false;
    for (let c = 0; c < gridSize; c++) {
        let row = [];
        for (let r = gridSize - 1; r >= 0; r--) {
            if (board[r][c] !== 0) row.push(board[r][c]);
        }
        row = merge(row);
        for (let r = 0; r < gridSize; r++) {
            if (board[gridSize - 1 - r][c] !== row[r]) moved = true;
            board[gridSize - 1 - r][c] = row[r] || 0;
        }
    }
    if (moved) addRandomTile();
    checkGameOver();
    renderBoard();
}

// Move tiles left
function moveLeft() {
    let moved = false;
    for (let r = 0; r < gridSize; r++) {
        let row = [];
        for (let c = 0; c < gridSize; c++) {
            if (board[r][c] !== 0) row.push(board[r][c]);
        }
        row = merge(row);
        for (let c = 0; c < gridSize; c++) {
            if (board[r][c] !== row[c]) moved = true;
            board[r][c] = row[c] || 0;
        }
    }
    if (moved) addRandomTile();
    checkGameOver();
    renderBoard();
}

// Move tiles right
function moveRight() {
    let moved = false;
    for (let r = 0; r < gridSize; r++) {
        let row = [];
        for (let c = gridSize - 1; c >= 0; c--) {
            if (board[r][c] !== 0) row.push(board[r][c]);
        }
        row = merge(row);
        for (let c = 0; c < gridSize; c++) {
            if (board[r][gridSize - 1 - c] !== row[c]) moved = true;
            board[r][gridSize - 1 - c] = row[c] || 0;
        }
    }
    if (moved) addRandomTile();
    checkGameOver();
    renderBoard();
}

// Merge tiles in a row
function merge(row) {
    const newRow = [];
    for (let i = 0; i < row.length; i++) {
        if (row[i] === row[i + 1]) {
            newRow.push(row[i] * 2);
            score += row[i] * 2;
            scoreElement.textContent = score;
            if (score > highScore) {
                highScore = score;
                highScoreElement.textContent = highScore;
                localStorage.setItem('highScore', highScore);
            }
            playSound('mergeSound');
            if (row[i] * 2 === levelTargets[level].targetTile && !hasWon) {
                hasWon = true;
                clearInterval(timer); // Stop the timer
                showWinScreen();
            }
            i++;
        } else {
            newRow.push(row[i]);
        }
    }
    return newRow;
}

// Check if the game is over
function checkGameOver() {
    for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
            if (board[r][c] === 0) return;
            if (c < gridSize - 1 && board[r][c] === board[r][c + 1]) return;
            if (r < gridSize - 1 && board[r][c] === board[r + 1][c]) return;
        }
    }
    playSound('loseSound');
    gameOverElement.style.display = 'block';
}

// Undo the last move
function undo() {
    if (previousBoards.length > 0) {
        const { board: prevBoard, score: prevScore } = previousBoards.pop();
        board = prevBoard;
        score = prevScore;
        scoreElement.textContent = score;
        renderBoard();
    }
}

// Save the current state of the board and score
function saveState() {
    previousBoards.push({ board: JSON.parse(JSON.stringify(board)), score });
}

// Restart the game
function restartGame() {
    init();
}

// Reset the game completely (including high score)
function resetGame() {
    localStorage.removeItem('highScore');
    highScore = 0;
    highScoreElement.textContent = highScore;
    init();
}

// Toggle between dark and light themes
function toggleTheme() {
    document.body.classList.toggle('dark-theme');
}

// Provide a hint for the next best move
function provideHint() {
    alert("Hint: Try moving in the direction with the most space to combine tiles!");
}

// Show the win screen
function showWinScreen() {
    playSound('winSound');
    winScreenElement.style.display = 'block';
}

// Continue playing after winning
function continueGame() {
    winScreenElement.style.display = 'none';
}

// Play sound effects
function playSound(soundId) {
    const sound = document.getElementById(soundId);
    sound.currentTime = 0; // Rewind sound
    sound.play();
}

// Save game state to localStorage
function saveGameState() {
    localStorage.setItem('savedGame', JSON.stringify({ board, score, gridSize, level }));
}

// Load game state from localStorage
function loadGameState() {
    const savedGame = localStorage.getItem('savedGame');
    if (savedGame) {
        const { board: savedBoard, score: savedScore, gridSize: savedGridSize, level: savedLevel } = JSON.parse(savedGame);
        board = savedBoard;
        score = savedScore;
        gridSize = savedGridSize;
        level = savedLevel;
        scoreElement.textContent = score;
        gridSizeSelector.value = gridSize;
        levelSelector.value = level;
        renderBoard();
    } else {
        init();
    }
}

// Change grid size
gridSizeSelector.addEventListener('change', (e) => {
    gridSize = parseInt(e.target.value);
    init();
});

// Change level
levelSelector.addEventListener('change', (e) => {
    level = parseInt(e.target.value);
    init();
});

// Event Listeners
themeToggleButton.addEventListener('click', toggleTheme);
undoButton.addEventListener('click', undo);
hintButton.addEventListener('click', provideHint);
resetGameButton.addEventListener('click', resetGame);

let difficulty = "easy";
let undoLimit = Infinity;
let spawnRate = 0.9;

difficultySelector?.addEventListener("change", (e) => {
    difficulty = e.target.value;
    applyDifficultySettings();
    restartGame();
});

function applyDifficultySettings() {
    switch (difficulty) {
        case "easy":
            spawnRate = 0.9; // 90% chance for 2, 10% for 4
            undoLimit = Infinity;
            gridSizeSelector.disabled = false;
            break;
        case "intermediate":
            spawnRate = 0.8; // 80% for 2, 20% for 4
            undoLimit = 3;
            gridSizeSelector.disabled = false;
            break;
        case "hard":
            spawnRate = 0.7; // 70% for 2, 30% for 4
            undoLimit = 0;
            gridSizeSelector.value = "4";
            gridSizeSelector.disabled = true;
            break;
    }
}

function undo() {
    if (undoLimit > 0 || undoLimit === Infinity) {
        if (previousBoards.length > 0) {
            const { board: prevBoard, score: prevScore } = previousBoards.pop();
            board = prevBoard;
            score = prevScore;
            scoreElement.textContent = score;
            renderBoard();
            if (undoLimit !== Infinity) undoLimit--;
        }
    } else {
        alert("Undo is not available in this difficulty!");
    }
}

// Apply difficulty settings on game start
applyDifficultySettings();
// Start the game
loadGameState();
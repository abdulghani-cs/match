import React, { useState, useEffect } from 'react';
import './styles/Grid.css';

// LEVELS
const levels = [
  { targetScore: 50, maxMoves: 20, timeLimit: 60 },  // Level 1
  { targetScore: 70, maxMoves: 40, timeLimit: 100 }, // Level 2
  { targetScore: 100, maxMoves: 50, timeLimit: 150 }, // Level 3
];

// SYMBOLS
const symbolColorMap = {
    'Star (★)': 'Circle',
    'Club (♣)': 'Rectangle',
    'Diamond (♦)': 'Triangle',
    'Spade (♠)': 'Oval',
    'Heart (♥)': 'Hexagon',
    'Sun (☀)': 'Octagon',
    'Umbrella (☂)': 'Pentagon',
    'Music Note (♫)': 'Cross'
};

const symbols = Object.keys(symbolColorMap);
const rows = 8;
const cols = 8;

const Grid = () => {
  const [grid, setGrid] = useState(initializeGrid());
  const [selectedCells, setSelectedCells] = useState([]);
  const [score, setScore] = useState(0);
  const [currentLevel, setCurrentLevel] = useState(0);
  const [moves, setMoves] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(levels[0].timeLimit);
  const [showPopup, setShowPopup] = useState(false);
  const [targetScore, setTargetScore] = useState(levels[0].targetScore);
  const [isPaused, setIsPaused] = useState(false);
  const [starCount, setStarCount] = useState(0);  // Track how many stars have been blasted
  const [boosterEnabled, setBoosterEnabled] = useState(false);  // Track if booster button is enabled

  // GRID INITIALIZATION
  function initializeGrid() {
    return Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => {
        const symbol = symbols[Math.floor(Math.random() * symbols.length)];
        return { color: symbolColorMap[symbol], symbol, isBomb: false, isRocket: null };
      })
    );
  }

  // CREATE BOMB
  const createBomb = (i, j) => {
    const newGrid = [...grid];
    newGrid[i][j].isBomb = true;  // Mark the cell as a bomb
    newGrid[i][j].symbol = '💣';   // Set the bomb symbol
    setGrid(newGrid);
  };

  // BOMB TRIGGER

  // CREATE ROCKET
  const createRocket = (i, j, direction) => {
    const newGrid = [...grid];
    const rocketSymbol = direction === 'row' ? '🚀' : '🚀'; // You can use different symbols if needed
    newGrid[i][j] = { ...newGrid[i][j], isRocket: direction, symbol: rocketSymbol };
    setGrid(newGrid);
  };

  // ROCKET TRIGGER

  // SWAP TWO CELLS
  const swapCells = (first, second) => {
    const newGrid = [...grid];
    const temp = newGrid[first.i][first.j];
    newGrid[first.i][first.j] = newGrid[second.i][second.j];
    newGrid[second.i][second.j] = temp;
    setGrid(newGrid);
  };

  // CHECK MATCHES
  const checkMatches = () => {
    const newGrid = [...grid];
    let matchFound = false;

    const addToScoreAndReplace = (i, j, count, isRow) => {
      setScore((prevScore) => prevScore + count);
      for (let k = 0; k < count; k++) {
        const symbol = symbols[Math.floor(Math.random() * symbols.length)];
        const cellSymbol = isRow ? newGrid[i][j - k].symbol : newGrid[i - k][j].symbol;

        // Check if the symbol is a star (★)
        if (cellSymbol === '★') {
          setStarCount((prevCount) => {
            const newCount = prevCount + 1;
            if (newCount >= 6) {
              setBoosterEnabled(true);  // Enable booster button when 6 stars are blasted
            }
            return newCount;
          });
        }
        if (isRow) {
          newGrid[i][j - k] = { symbol, color: symbolColorMap[symbol], isBomb: false, isRocket: null };
        } else {
          newGrid[i - k][j] = { symbol, color: symbolColorMap[symbol], isBomb: false, isRocket: null };
        }
      }
    };

    for (let i = 0; i < rows; i++) {
      let matchCount = 1;
      for (let j = 0; j < cols - 1; j++) {
        if (newGrid[i][j].symbol === newGrid[i][j + 1].symbol) {
          matchCount++;
        } else {
          if (matchCount >= 3) {
            addToScoreAndReplace(i, j, matchCount, true);
            matchFound = true;
            if (matchCount === 4) createBomb(i, j); // Create a bomb if there are 4 matches
            if (matchCount === 5) createRocket(i, j, 'row');
          }
          matchCount = 1;
        }
      }
      if (matchCount >= 3) {
        addToScoreAndReplace(i, cols - 1, matchCount, true);
        matchFound = true;
        if (matchCount === 4) createBomb(i, cols - 1); // Create a bomb if there are 4 matches
        if (matchCount === 5) createRocket(i, cols - 1, 'row');
      }
    }

    for (let j = 0; j < cols; j++) {
      let matchCount = 1;
      for (let i = 0; i < rows - 1; i++) {
        if (newGrid[i][j].symbol === newGrid[i + 1][j].symbol) {
          matchCount++;
        } else {
          if (matchCount >= 3) {
            addToScoreAndReplace(i, j, matchCount, false);
            matchFound = true;
            if (matchCount === 4) createBomb(i, j); // Create a bomb if there are 4 matches
            if (matchCount === 5) createRocket(i, j, 'column');
          }
          matchCount = 1;
        }
      }
      if (matchCount >= 3) {
        addToScoreAndReplace(rows - 1, j, matchCount, false);
        matchFound = true;
        if (matchCount === 4) createBomb(rows - 1, j); // Create a bomb if there are 4 matches
        if (matchCount === 5) createRocket(rows - 1, j, 'column');
      }
    }

    setGrid(newGrid);
    return matchFound;
  };

  // SHIFT SYMBOLS DOWN
  const shiftSymbolsDown = () => {
    const newGrid = [...grid];
    for (let j = 0; j < cols; j++) {
      for (let i = rows - 1; i >= 0; i--) {
        if (newGrid[i][j].symbol === null) {
          for (let k = i - 1; k >= 0; k--) {
            if (newGrid[k][j].symbol !== null) {
              newGrid[i][j] = newGrid[k][j];
              newGrid[k][j] = { symbol: null, color: '#ffffff', isBomb: false, isRocket: null };
              break;
            }
          }
        }
      }
    }
    setGrid(newGrid);
    if (checkMatches()) {
      setTimeout(() => shiftSymbolsDown(), 500);
    }
  };

  // SELECT CELL
  const selectCell = (i, j) => {
    if (selectedCells.length === 0) {
      setSelectedCells([{ i, j }]);
    } else if (selectedCells.length === 1) {
      const firstCell = selectedCells[0];
      if (Math.abs(firstCell.i - i) + Math.abs(firstCell.j - j) === 1) {
        swapCells(firstCell, { i, j });
        setMoves(moves + 1);
        setSelectedCells([]);
      } else {
        setSelectedCells([{ i, j }]);
      }
    }
  };

  // TIMER
  useEffect(() => {
    if (!isPaused && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    } else if (timeRemaining === 0) {
      setShowPopup(true);
    }
  }, [timeRemaining, isPaused]);

  // NEXT LEVEL
  const nextLevel = () => {
    if (currentLevel < levels.length - 1) {
      setCurrentLevel((prev) => prev + 1);
      setMoves(0);
      setTimeRemaining(levels[currentLevel + 1].timeLimit);
      setTargetScore(levels[currentLevel + 1].targetScore);
      setGrid(initializeGrid());
      setScore(0);
      setStarCount(0);
      setBoosterEnabled(false); // Reset booster when moving to the next level
    } else {
      alert('Congratulations! You completed all levels!');
      resetGame();
    }
  };

  // RESET GAME
  const resetGame = () => {
    setGrid(initializeGrid());
    setScore(0);
    setMoves(0);
    setTimeRemaining(levels[0].timeLimit);
    setCurrentLevel(0);
    setTargetScore(levels[0].targetScore);
    setStarCount(0);
    setBoosterEnabled(false); // Reset booster when resetting the game
  };

  // BOOSTER ACTION
  const boosterAction = () => {
    // Clear all stars from the grid and reset their count
    const newGrid = grid.map((row) =>
      row.map((cell) => (cell.symbol === '★' ? { symbol: null, color: '#ffffff', isBomb: false, isRocket: null } : cell))
    );
    setGrid(newGrid);
    setStarCount(0); // Reset star count after using the booster
    setBoosterEnabled(false); // Disable booster after usage
  };

  return (
    <div>
      <h1>Grid Game</h1>
      <h2>Score: {score}</h2>
      <h2>Moves: {moves}</h2>
      <h2>Time Remaining: {timeRemaining}s</h2>
      <h2>Target Score: {targetScore}</h2>
      <h2>Stars Collected: {starCount}</h2>
      <button onClick={resetGame}>Reset Game</button>
      {boosterEnabled && <button onClick={boosterAction}>Use Booster (Clear Stars)</button>}
      {showPopup && (
        <div className="popup">
          <h2>Game Over</h2>
          <p>Your score: {score}</p>
          <button onClick={nextLevel}>Next Level</button>
          <button onClick={resetGame}>Restart</button>
        </div>
      )}
      <div className="grid">
        {grid.map((row, i) => (
          <div className="row" key={i}>
            {row.map((cell, j) => (
              <div
                key={j}
                className="cell"
                onClick={() => selectCell(i, j)}
                style={{ backgroundColor: cell.color }}
              >
                {cell.symbol}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Grid;

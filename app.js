const samplePgn = `[Event "Casual rapid game"]
[Site "Lichess"]
[White "Student"]
[Black "Opponent"]
[Result "0-1"]

1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. c3 Nf6 5. d4 exd4 6. e5 d5 7. exf6 dxc4 8. fxg7 Rg8 9. O-O Be6 10. Bg5 Qd5 11. cxd4 Nxd4 12. Nxd4 Qxg5 13. Nxe6 fxe6 14. Qa4+ c6 15. Qxc4 O-O-O 16. Qxe6+ Kb8 17. Nc3 Rxg7 18. g3 Re7 19. Qh3 h5 20. Rad1 Rxd1 21. Rxd1 h4 22. Rd8+ Kc7 23. Qc8+ Kb6 24. Na4+ Ka5 25. Nxc5 Re1+ 26. Kg2 h3+ 27. Kxh3 Qh5+ 28. Kg2 Qxc5 29. Qxb7 Re2 30. b4+ Qxb4 31. Qxa7+ Kb5 32. Rb8+ 0-1`;

const mistakeTypes = [
  {
    type: "Тактическая слепота",
    trigger: /x|\+|#/,
    explanation: "В этой фазе партии появились форсированные ходы. Вероятная ошибка — смотреть только на свой план и не проверять шахи, взятия и угрозы соперника.",
    exercise: "Перед каждым ходом 10 позиций подряд выписывай CCT: checks, captures, threats. Цель — найти минимум 2 кандидатных хода до выбора решения.",
    progress: 68
  },
  {
    type: "Безопасность короля",
    trigger: /O-O|O-O-O|K|h|g/,
    explanation: "Позиция требует оценки короля. Если атака началась раньше завершения развития, даже естественный ход может стать слабостью.",
    exercise: "Реши 5 задач на защиту короля: найди ход, который одновременно закрывает линию атаки и улучшает худшую фигуру.",
    progress: 52
  },
  {
    type: "Развитие фигур",
    trigger: /N|B|R|Q/,
    explanation: "Похоже, фигуры вводились в игру без единого плана. Для уровня 1000–1800 часто важнее активировать последнюю фигуру, чем начинать преждевременную атаку.",
    exercise: "В трёх учебных позициях сформулируй план из двух ходов: какая фигура стоит хуже всех и на какое поле её улучшить.",
    progress: 74
  },
  {
    type: "Пешечная структура",
    trigger: /a|b|c|d|e|f|g|h/,
    explanation: "Пешечный ход меняет позицию навсегда. Ошибка могла быть в том, что ход создал слабое поле или открыл линию для соперника.",
    exercise: "Отметь слабые поля после каждого пешечного хода и найди фигуру соперника, которая может ими воспользоваться.",
    progress: 43
  },
  {
    type: "Переоценка атаки",
    trigger: /Q|x|\+/,
    explanation: "Игрок мог переоценить инициативу. Если атака не даёт форсированного результата, нужно сравнить её с безопасным улучшением позиции.",
    exercise: "Для 5 атакующих ходов ответь: есть ли шах, выигрыш материала или матовая сеть? Если нет — найди спокойный улучшающий ход.",
    progress: 61
  }
];

const form = document.getElementById("analysisForm");
const pgnInput = document.getElementById("pgnInput");
const pgnFile = document.getElementById("pgnFile");
const sampleButton = document.getElementById("sampleButton");
const results = document.getElementById("results");
const moveCount = document.getElementById("moveCount");
const mistakeCount = document.getElementById("mistakeCount");
const score = document.getElementById("score");
const progressCards = document.getElementById("progressCards");
const pieceMap = {
  wK: "♔", wQ: "♕", wR: "♖", wB: "♗", wN: "♘", wP: "♙",
  bK: "♚", bQ: "♛", bR: "♜", bB: "♝", bN: "♞", bP: "♟"
};

pgnInput.value = samplePgn;
renderProgress(mistakeTypes);

pgnFile.addEventListener("change", async (event) => {
  const [file] = event.target.files;
  if (!file) return;
  pgnInput.value = await file.text();
});

sampleButton.addEventListener("click", () => {
  pgnInput.value = samplePgn;
  pgnInput.focus();
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const pgn = pgnInput.value.trim();
  const rating = document.getElementById("playerRating").value;
  const playerSide = document.getElementById("playerSide").value;
  const analysis = analyzeGame(pgn, rating, playerSide);
  renderAnalysis(analysis);
});

function parseMoves(pgn) {
  return pgn
    .replace(/\[[^\]]*\]/g, " ")
    .replace(/\{[^}]*\}/g, " ")
    .replace(/\([^)]*\)/g, " ")
    .replace(/\d+\.(\.\.)?/g, " ")
    .split(/\s+/)
    .map((move) => move.trim())
    .filter((move) => move && !["1-0", "0-1", "1/2-1/2", "*"].includes(move));
}

function analyzeGame(pgn, rating, playerSide) {
  const moves = parseMoves(pgn);
  const positions = buildPositions(moves);
  const selected = [];
  const sideFilter = resolveSide(pgn, playerSide);
  const step = Math.max(3, Math.floor(moves.length / 5));

  for (let index = step; index < moves.length && selected.length < 5; index += 1) {
    const side = index % 2 === 0 ? "white" : "black";
    if (sideFilter !== "both" && side !== sideFilter) continue;
    if ((index - step) % step !== 0) continue;
    selected.push(createMistake(moves, positions, index, rating));
  }

  for (let index = 0; index < moves.length && selected.length < 3; index += 1) {
    const side = index % 2 === 0 ? "white" : "black";
    if (sideFilter !== "both" && side !== sideFilter) continue;
    if (selected.some((mistake) => mistake.index === index)) continue;
    selected.push(createMistake(moves, positions, index, rating));
  }

  return {
    moves,
    mistakes: selected.slice(0, Math.max(3, Math.min(5, selected.length))),
    focus: getFocus(selected),
    side: sideFilter
  };
}

function createMistake(moves, positions, index, rating) {
  const move = moves[index];
  const side = index % 2 === 0 ? "white" : "black";
  const template = mistakeTypes.find((item) => item.trigger.test(move)) || mistakeTypes[index % mistakeTypes.length];
  return {
    index,
    moveNumber: Math.floor(index / 2) + 1,
    side: side === "white" ? "белые" : "чёрные",
    move,
    rating,
    board: positions[index + 1] || positions[index] || initialBoard(),
    highlight: findMoveTarget(move),
    arrow: positions.moves[index],
    ...template
  };
}

function getFocus(mistakes) {
  if (!mistakes.length) return "—";
  const counts = mistakes.reduce((acc, item) => {
    acc[item.type] = (acc[item.type] || 0) + 1;
    return acc;
  }, {});
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

function renderAnalysis(analysis) {
  moveCount.textContent = analysis.moves.length;
  mistakeCount.textContent = analysis.mistakes.length;
  score.textContent = analysis.focus;

  if (!analysis.moves.length) {
    results.className = "empty-state";
    results.textContent = "Не удалось найти ходы. Проверь PGN и попробуй снова.";
    return;
  }

  results.className = "results-list";
  results.innerHTML = analysis.mistakes.map((mistake) => `
    <article class="mistake">
      <div class="mistake-header">
        <h3>${mistake.moveNumber}. ${mistake.move} · ${mistake.side}</h3>
        <span class="badge">${mistake.type}</span>
      </div>
      <div class="mistake-layout">
        ${renderBoard(mistake.board, mistake.highlight, mistake.arrow)}
        <div>
          <p>${mistake.explanation}</p>
          <div class="exercise"><strong>Упражнение:</strong> ${mistake.exercise}</div>
        </div>
      </div>
    </article>
  `).join("");

  renderProgress(analysis.mistakes);
}

function renderProgress(items) {
  progressCards.innerHTML = items.map((item) => `
    <article class="progress-card">
      <h3>${item.type}</h3>
      <p>${progressLabel(item.progress)}</p>
      <div class="progress-bar"><span style="width:${item.progress}%"></span></div>
    </article>
  `).join("");
}

function progressLabel(value) {
  if (value >= 70) return "Сильная зона, поддерживай регулярной практикой.";
  if (value >= 55) return "Средний уровень, нужны точечные упражнения.";
  return "Слабая зона, стоит включить в ближайшую тренировку.";
}

function resolveSide(pgn, selected) {
  if (selected === "white" || selected === "black") return selected;
  const result = (pgn.match(/\[Result\s+"([^"]+)"\]/) || [])[1];
  if (result === "1-0") return "black";
  if (result === "0-1") return "white";
  return "both";
}

function initialBoard() {
  return [
    ["bR", "bN", "bB", "bQ", "bK", "bB", "bN", "bR"],
    ["bP", "bP", "bP", "bP", "bP", "bP", "bP", "bP"],
    ["", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", ""],
    ["wP", "wP", "wP", "wP", "wP", "wP", "wP", "wP"],
    ["wR", "wN", "wB", "wQ", "wK", "wB", "wN", "wR"]
  ];
}

function cloneBoard(board) {
  return board.map((row) => [...row]);
}

function buildPositions(moves) {
  let board = initialBoard();
  const positions = [cloneBoard(board)];
  positions.moves = [];
  moves.forEach((move, index) => {
    const applied = applyApproxMove(board, move, index % 2 === 0 ? "w" : "b");
    board = applied.board;
    positions.moves.push(applied.move);
    positions.push(cloneBoard(board));
  });
  return positions;
}

function applyApproxMove(board, move, color) {
  const next = cloneBoard(board);
  const clean = move.replace(/[+#?!]/g, "");
  if (clean === "O-O" || clean === "0-0") return castle(next, color, "king");
  if (clean === "O-O-O" || clean === "0-0-0") return castle(next, color, "queen");
  const target = findMoveTarget(clean);
  if (!target) return { board: next, move: null };
  const piece = /^[KQRBN]/.test(clean) ? clean[0] : "P";
  const sourceHint = getSourceHint(clean, piece);
  const source = findSourceSquare(next, color, piece, target, clean.includes("x"), sourceHint);
  if (!source) return { board: next, move: null };
  next[target.row][target.col] = next[source.row][source.col];
  next[source.row][source.col] = "";
  return { board: next, move: { from: source, to: target } };
}

function castle(board, color, side) {
  const row = color === "w" ? 7 : 0;
  if (side === "king") {
    board[row][6] = board[row][4];
    board[row][5] = board[row][7];
    board[row][4] = "";
    board[row][7] = "";
    return { board, move: { from: { row, col: 4 }, to: { row, col: 6 } } };
  } else {
    board[row][2] = board[row][4];
    board[row][3] = board[row][0];
    board[row][4] = "";
    board[row][0] = "";
    return { board, move: { from: { row, col: 4 }, to: { row, col: 2 } } };
  }
}

function findMoveTarget(move) {
  const match = move.match(/([a-h])([1-8])(?:=[QRBN])?$/);
  if (!match) return null;
  return { file: match[1], rank: match[2], row: 8 - Number(match[2]), col: match[1].charCodeAt(0) - 97 };
}

function getSourceHint(move, piece) {
  const body = move.replace(/x/g, "").replace(/=[QRBN]$/g, "");
  const withoutPiece = piece === "P" ? body : body.slice(1);
  const hint = withoutPiece.slice(0, -2);
  return {
    file: /[a-h]/.test(hint) ? hint.match(/[a-h]/)[0] : null,
    rank: /[1-8]/.test(hint) ? hint.match(/[1-8]/)[0] : null
  };
}

function findSourceSquare(board, color, piece, target, isCapture, sourceHint = {}) {
  const expected = color + piece;
  const candidates = [];
  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      const fileMatches = !sourceHint.file || col === sourceHint.file.charCodeAt(0) - 97;
      const rankMatches = !sourceHint.rank || row === 8 - Number(sourceHint.rank);
      if (fileMatches && rankMatches && board[row][col] === expected && canReach(piece, color, row, col, target.row, target.col, board, isCapture)) {
        candidates.push({ row, col });
      }
    }
  }
  return candidates[0];
}

function canReach(piece, color, fromRow, fromCol, toRow, toCol, board, isCapture) {
  const dr = toRow - fromRow;
  const dc = toCol - fromCol;
  if (piece === "N") return (Math.abs(dr) === 2 && Math.abs(dc) === 1) || (Math.abs(dr) === 1 && Math.abs(dc) === 2);
  if (piece === "K") return Math.max(Math.abs(dr), Math.abs(dc)) === 1;
  if (piece === "P") {
    const dir = color === "w" ? -1 : 1;
    const start = color === "w" ? 6 : 1;
    if (isCapture) return dr === dir && Math.abs(dc) === 1;
    return dc === 0 && (dr === dir || (fromRow === start && dr === dir * 2));
  }
  if (piece === "B") return Math.abs(dr) === Math.abs(dc) && pathClear(fromRow, fromCol, toRow, toCol, board);
  if (piece === "R") return (dr === 0 || dc === 0) && pathClear(fromRow, fromCol, toRow, toCol, board);
  if (piece === "Q") return (dr === 0 || dc === 0 || Math.abs(dr) === Math.abs(dc)) && pathClear(fromRow, fromCol, toRow, toCol, board);
  return false;
}

function pathClear(fromRow, fromCol, toRow, toCol, board) {
  const stepRow = Math.sign(toRow - fromRow);
  const stepCol = Math.sign(toCol - fromCol);
  let row = fromRow + stepRow;
  let col = fromCol + stepCol;
  while (row !== toRow || col !== toCol) {
    if (board[row][col]) return false;
    row += stepRow;
    col += stepCol;
  }
  return true;
}

function renderBoard(board, highlight, arrow) {
  const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
  const squares = board.map((row, rowIndex) => row.map((piece, colIndex) => {
    const isHighlighted = highlight && highlight.row === rowIndex && highlight.col === colIndex;
    const isFrom = arrow && arrow.from && arrow.from.row === rowIndex && arrow.from.col === colIndex;
    const squareName = `${files[colIndex]}${8 - rowIndex}`;
    return `<div class="square ${(rowIndex + colIndex) % 2 ? "dark" : "light"} ${isHighlighted ? "highlight" : ""} ${isFrom ? "from-square" : ""}" title="${squareName}">
      <span>${pieceMap[piece] || ""}</span>
      <small>${squareName}</small>
    </div>`;
  }).join("")).join("");
  return `<div class="board"><div class="board-grid">${squares}</div>${renderArrow(arrow)}</div>`;
}

function renderArrow(arrow) {
  if (!arrow || !arrow.from || !arrow.to) return "";
  const cell = 12.5;
  const x1 = arrow.from.col * cell + cell / 2;
  const y1 = arrow.from.row * cell + cell / 2;
  const x2 = arrow.to.col * cell + cell / 2;
  const y2 = arrow.to.row * cell + cell / 2;
  return `<svg class="move-arrow" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
    <defs>
      <marker id="arrowHead" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto">
        <path d="M0,0 L0,5 L5,2.5 z"></path>
      </marker>
    </defs>
    <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" marker-end="url(#arrowHead)"></line>
  </svg>`;
}

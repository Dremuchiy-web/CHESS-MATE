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
  },
  {
    type: "Потеря темпа",
    trigger: /N|B|Q|R/,
    explanation: "Повторный ход одной фигурой может отдать сопернику время на развитие, захват центра или создание угроз.",
    exercise: "Разбери 5 дебютных позиций и найди ход, который развивает новую фигуру с угрозой или улучшением центра.",
    progress: 57
  },
  {
    type: "Слабые поля",
    trigger: /c|f|g|h/,
    explanation: "Пешечный ход мог оставить за собой слабые клетки, которые уже нельзя защитить пешкой. Такие поля часто становятся стоянкой для коня или ферзя соперника.",
    exercise: "После каждого пешечного хода отметь два поля, которые стали слабее, и придумай, какая фигура соперника может туда прийти.",
    progress: 46
  },
  {
    type: "Проблема координации",
    trigger: /R|Q|B|N/,
    explanation: "Фигура могла выйти активно, но без поддержки остальных. В шахматах один сильный ход часто проигрывает группе хорошо скоординированных фигур.",
    exercise: "В трёх позициях найди худшую фигуру и ход, который связывает её с атакой или защитой ключевого пункта.",
    progress: 63
  },
  {
    type: "Недооценка ответа соперника",
    trigger: /\+|x|K|Q/,
    explanation: "Ход выглядит активным, но мог пропустить простой ресурс соперника: шах, контрудар, промежуточный ход или нападение на более ценную фигуру.",
    exercise: "Перед ходом выписывай один самый неприятный ответ соперника. Сделай это для 10 позиций подряд.",
    progress: 49
  },
  {
    type: "Риск эндшпиля",
    trigger: /K|R|P|[a-h]/,
    explanation: "В упрощённой позиции важны активность короля, проходные пешки и ладейная активность. Даже небольшой пассивный ход может испортить весь эндшпиль.",
    exercise: "Реши 5 ладейных или пешечных эндшпилей: сначала оцени активность короля, потом считай темпы пешечной гонки.",
    progress: 54
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
const aiApiKey = document.getElementById("aiApiKey");
const aiModel = document.getElementById("aiModel");
const useAiMentor = document.getElementById("useAiMentor");
const pieceMap = {
  wK: "♚", wQ: "♛", wR: "♜", wB: "♝", wN: "♞", wP: "♟",
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

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const pgn = pgnInput.value.trim();
  const rating = document.getElementById("playerRating").value;
  const playerSide = document.getElementById("playerSide").value;
  const analysis = await analyzeGame(pgn, rating, playerSide);
  if (useAiMentor.checked) {
    await enrichAnalysisWithAi(analysis, pgn);
  } else {
    renderAnalysis(analysis);
  }
});

function parseMoves(pgn) {
  const parsed = parseGameWithChessJs(pgn);
  if (parsed) return parsed.moves;
  return pgn
    .replace(/\[[^\]]*\]/g, " ")
    .replace(/\{[^}]*\}/g, " ")
    .replace(/\([^)]*\)/g, " ")
    .replace(/\d+\.(\.\.)?/g, " ")
    .split(/\s+/)
    .map((move) => move.trim())
    .filter((move) => move && !["1-0", "0-1", "1/2-1/2", "*"].includes(move));
}

function parseGameWithChessJs(pgn) {
  if (typeof Chess === "undefined") return null;
  try {
    const game = new Chess();
    const loaded = game.load_pgn(pgn, { sloppy: true });
    if (!loaded) return null;
    const history = game.history({ verbose: true });
    if (!history.length) return null;
    return {
      moves: history.map((move) => move.san),
      verboseMoves: history
    };
  } catch {
    return null;
  }
}

async function analyzeGame(pgn, rating, playerSide) {
  const parsedGame = parseGameWithChessJs(pgn);
  const moves = parsedGame?.moves || parseMoves(pgn);
  const positions = buildPositions(moves, parsedGame?.verboseMoves);
  const sideFilter = resolveSide(pgn, playerSide);
  const candidates = [];

  for (let index = 0; index < moves.length; index += 1) {
    const side = index % 2 === 0 ? "white" : "black";
    if (sideFilter !== "both" && side !== sideFilter) continue;
    const evaluation = evaluateMove(moves, positions, index, rating);
    candidates.push(createMistake(moves, positions, index, rating, evaluation));
  }

  await enrichCandidatesWithStockfish(candidates, positions);

  const selected = candidates
    .sort((a, b) => b.riskScore - a.riskScore || a.index - b.index)
    .sort((a, b) => a.index - b.index);

  const seen = new Set();
  const deduplicated = selected.filter(mistake => {
    const key = `${mistake.moveNumber}-${mistake.side}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return {
    moves,
    mistakes: deduplicated,
    focus: getFocus(deduplicated),
    side: sideFilter
  };
}

function createMistake(moves, positions, index, rating, evaluation = null) {
  const move = moves[index];
  const side = index % 2 === 0 ? "white" : "black";
  const template = evaluation?.template || mistakeTypes.find((item) => item.trigger.test(move)) || mistakeTypes[index % mistakeTypes.length];
  const mistake = {
    index,
    moveNumber: Math.floor(index / 2) + 1,
    side: side === "white" ? "белые" : "чёрные",
    move,
    rating,
    phase: evaluation?.phase || getGamePhase(index, moves.length),
    riskScore: evaluation?.score || 0,
    reason: evaluation?.reason || "Ход выбран как потенциально важный учебный момент.",
    board: positions[index + 1] || positions[index] || initialBoard(),
    highlight: positions.moves[index]?.to || findMoveTarget(move),
    arrow: positions.moves[index],
    fen: positions.fens?.[index + 1] || null,
    type: template.type,
    explanation: template.explanation,
    exercise: template.exercise,
    progress: template.progress
  };
  mistake.exercise = generateExercise(mistake);
  return mistake;
}

async function enrichCandidatesWithStockfish(candidates, positions) {
  if (!positions.fens?.length || !candidates.length) return;
  const engine = createStockfishEngine();
  if (!engine) return;

  const important = candidates
    .sort((a, b) => b.riskScore - a.riskScore);

  for (const mistake of important) {
    const beforeFen = positions.fens[mistake.index];
    const afterFen = positions.fens[mistake.index + 1];
    if (!beforeFen || !afterFen) continue;

    const before = await engine.evaluate(beforeFen, 8);
    const after = await engine.evaluate(afterFen, 8);
    if (before === null || after === null) continue;

    const playerColor = mistake.index % 2 === 0 ? "w" : "b";
    const beforeForPlayer = normalizeEvalForColor(before, playerColor);
    const afterForPlayer = normalizeEvalForColor(after, playerColor);
    const loss = Math.max(0, beforeForPlayer - afterForPlayer);

    mistake.engine = {
      before: beforeForPlayer,
      after: afterForPlayer,
      loss
    };
    const baseRisk = Math.min(55, mistake.riskScore);
    const engineRisk = Math.round(Math.min(38, loss * 14));
    mistake.riskScore = Math.min(95, baseRisk + engineRisk);
    mistake.reason = `${mistake.reason}; Stockfish показывает потерю оценки около ${loss.toFixed(1)} пешки`;
    mistake.exercise = generateExercise(mistake);
  }
}

function createStockfishEngine() {
  if (typeof Worker === "undefined") return null;
  try {
    const stockfishUrl = "https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.2/stockfish.js";
    const workerUrl = URL.createObjectURL(new Blob([`importScripts("${stockfishUrl}")`], { type: "application/javascript" }));
    const worker = new Worker(workerUrl);
    let current = null;
    worker.onmessage = (event) => {
      const line = String(event.data || "");
      if (!current) return;
      const cp = line.match(/score cp (-?\d+)/);
      const mate = line.match(/score mate (-?\d+)/);
      if (cp) current.score = Number(cp[1]) / 100;
      if (mate) current.score = Number(mate[1]) > 0 ? 100 : -100;
      if (line.startsWith("bestmove")) {
        current.resolve(current.score ?? 0);
        current = null;
      }
    };
    worker.postMessage("uci");
    worker.postMessage("isready");
    return {
      evaluate(fen, depth = 8) {
        return new Promise((resolve) => {
          current = { resolve, score: 0 };
          worker.postMessage(`position fen ${fen}`);
          worker.postMessage(`go depth ${depth}`);
          setTimeout(() => {
            if (current) {
              current.resolve(current.score ?? null);
              current = null;
            }
          }, 2500);
        });
      }
    };
  } catch {
    return null;
  }
}

function normalizeEvalForColor(score, color) {
  return color === "w" ? score : -score;
}

function generateExercise(mistake) {
  const loss = mistake.engine?.loss || 0;
  const moveLabel = `${mistake.moveNumber}. ${mistake.move}`;
  const target = mistake.highlight ? coordsToSquare(mistake.highlight) : "ключевую клетку";
  const hardMode = loss >= 1.5 || mistake.riskScore >= 55;
  const phaseTask = {
    дебют: `Вернись к позиции перед ходом ${moveLabel} и найди 2 альтернативы, которые развивают фигуру или борются за центр.`,
    миттельшпиль: `Поставь позицию перед ходом ${moveLabel} и выпиши CCT: все шахи, взятия и угрозы за обе стороны.`,
    эндшпиль: `В позиции перед ходом ${moveLabel} сравни активность королей и посчитай пешечные темпы на 3 хода вперёд.`
  }[mistake.phase] || `Разбери позицию перед ходом ${moveLabel} и найди 3 кандидатных хода.`;

  const typeTask = {
    "Тактическая слепота": `Не двигая фигуры, найди лучший ответ соперника после хода на ${target}. Затем проверь, есть ли промежуточный шах или взятие.`,
    "Безопасность короля": `Отметь все открытые линии к королю и найди защитный ход, который одновременно улучшает худшую фигуру.`,
    "Развитие фигур": `Найди фигуру, которая ещё не участвует в игре, и предложи ход развития с конкретной угрозой.`,
    "Пешечная структура": `После хода ${moveLabel} отметь слабые поля и пешки, которые уже нельзя защитить соседней пешкой.`,
    "Переоценка атаки": `Докажи атаку: найди форсированную линию на 3 полухода. Если её нет, выбери спокойное усиление позиции.`,
    "Потеря темпа": `Сравни ход ${moveLabel} с развитием новой фигуры. Цель — найти ход, который не отдаёт сопернику бесплатный темп.`,
    "Слабые поля": `Выбери одно слабое поле после ${moveLabel} и найди маршрут фигуры соперника к этому полю.`,
    "Проблема координации": `Найди две свои фигуры, которые не взаимодействуют, и предложи ход, связывающий их с одним планом.`,
    "Недооценка ответа соперника": `Перед тем как принять ${moveLabel}, выпиши самый неприятный ответ соперника и способ его нейтрализовать.`,
    "Риск эндшпиля": `Оцени, становится ли король активнее после ${moveLabel}. Если нет — найди более активный план.`,
    "Грубая ошибка": `Реши позицию как тактику: найди ход, который избегает потери ${loss.toFixed(1)} пешки по Stockfish, и запиши главную угрозу соперника.`,
    "Ошибка по оценке движка": `Сравни ${moveLabel} с двумя кандидатами и выбери ход, после которого оценка позиции не падает больше чем на 0.5 пешки.`
  }[mistake.type] || `Найди альтернативу ходу ${moveLabel} и объясни, какую угрозу она предотвращает.`;

  return hardMode ? `${phaseTask} Затем: ${typeTask}` : typeTask;
}

function coordsToSquare(coords) {
  const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
  return `${files[coords.col]}${8 - coords.row}`;
}

function evaluateMove(moves, positions, index, rating) {
  const move = moves[index];
  const previousBoard = positions[index] || initialBoard();
  const nextBoard = positions[index + 1] || previousBoard;
  const color = index % 2 === 0 ? "w" : "b";
  const phase = getGamePhase(index, moves.length);
  const target = findMoveTarget(move);
  const clean = move.replace(/[+#?!]/g, "");
  const piece = /^[KQRBN]/.test(clean) ? clean[0] : "P";
  const features = [];
  let score = 0;
  let template = mistakeTypes.find((item) => item.trigger.test(move)) || mistakeTypes[0];

  if (/[?!]/.test(move)) {
    score += 35;
    features.push("в PGN ход уже помечен как сомнительный");
  }

  if (move.includes("+") || move.includes("#")) {
    score += 18;
    template = mistakeTypes[4];
    features.push("форсирующий ход требует точного расчёта ответов");
  }

  if (move.includes("x")) {
    const captured = target ? previousBoard[target.row][target.col] : "";
    const moved = target ? nextBoard[target.row][target.col] : "";
    const tradeBalance = pieceValue(captured) - pieceValue(moved);
    score += tradeBalance < 0 ? 32 : 12;
    template = tradeBalance < 0 ? mistakeTypes[0] : template;
    features.push(tradeBalance < 0 ? "взятие может быть материально невыгодным" : "взятие меняет баланс и требует проверки тактики");
  }

  if (phase === "дебют" && piece === "Q") {
    score += 28;
    template = mistakeTypes[2];
    features.push("ранний выход ферзя часто отстаёт от развития фигур");
  }

  if (phase === "дебют" && piece === "P" && target && isFlankPawn(target.col)) {
    score += 24;
    template = target.col >= 6 ? mistakeTypes[1] : mistakeTypes[6];
    features.push("фланговый пешечный ход в дебюте может ослабить короля");
  }

  if (piece === "K" && !/O-O|0-0/.test(clean)) {
    score += 30;
    template = mistakeTypes[1];
    features.push("ход королём показывает возможную проблему с безопасностью");
  }

  if (piece === "P" && target && isCentralPawnBreak(target.col)) {
    score += phase === "дебют" ? 18 : 24;
    template = mistakeTypes[3];
    features.push("центральный пешечный ход меняет структуру и открывает линии");
  }

  if (piece === "R" && index < 16) {
    score += 22;
    template = mistakeTypes[2];
    features.push("ладья вошла в игру до завершения развития лёгких фигур");
  }

  if (isRepeatedPieceMove(moves, index, piece, color)) {
    score += 20;
    template = mistakeTypes[5];
    features.push("одна и та же фигура ходит повторно вместо развития остальных");
  }

  if (piece !== "P" && piece !== "K" && target && isPieceFarFromKingSide(target, color)) {
    score += 14;
    template = mistakeTypes[7];
    features.push("фигура уходит далеко от зоны взаимодействия с остальными");
  }

  if ((move.includes("+") || move.includes("x")) && index > 8) {
    score += 12;
    template = mistakeTypes[8];
    features.push("активный ход нужно проверить на лучший ресурс соперника");
  }

  if (phase === "эндшпиль") {
    score += piece === "K" || piece === "P" || piece === "R" ? 18 : 10;
    template = mistakeTypes[9];
    features.push("в эндшпиле каждый темп и активность фигур особенно важны");
  }

  const ratingBonus = rating === "1000–1200" ? 8 : rating === "1200–1500" ? 4 : 0;
  score += ratingBonus;

  return {
    score,
    phase,
    template,
    reason: features.length ? features.join("; ") : "позиция содержит учебный момент по общим принципам"
  };
}

function getGamePhase(index, totalMoves) {
  if (index < 12) return "дебют";
  if (index > Math.max(24, totalMoves * 0.72)) return "эндшпиль";
  return "миттельшпиль";
}

function pieceValue(piece) {
  if (!piece) return 1;
  return { P: 1, N: 3, B: 3, R: 5, Q: 9, K: 100 }[piece[1]] || 0;
}

function isFlankPawn(col) {
  return col <= 1 || col >= 6;
}

function isCentralPawnBreak(col) {
  return col >= 2 && col <= 5;
}

function isPieceFarFromKingSide(target, color) {
  return color === "w" ? target.row <= 2 || target.col <= 1 : target.row >= 5 || target.col >= 6;
}

function isRepeatedPieceMove(moves, index, piece, color) {
  if (piece === "P" || index < 2) return false;
  const previousSameColorMove = moves[index - 2] || "";
  const previousPiece = /^[KQRBN]/.test(previousSameColorMove) ? previousSameColorMove[0] : "P";
  return previousPiece === piece && color === (index % 2 === 0 ? "w" : "b");
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
  results.innerHTML = "";

  const seen = new Set();
  analysis.mistakes.forEach(mistake => {
    const key = `${mistake.moveNumber}-${mistake.side}`;
    if (seen.has(key)) return;
    seen.add(key);

    results.insertAdjacentHTML("beforeend", `
      <article class="mistake">
        <div class="mistake-header">
          <h3>${mistake.moveNumber}. ${mistake.move} · ${mistake.side}</h3>
          <span class="badge">${mistake.type}</span>
        </div>
        <div class="risk-line">
          <span>${mistake.phase}</span>
          <strong>риск ${Math.min(99, mistake.riskScore)}/100</strong>
        </div>
        ${mistake.engine ? `<div class="engine-line">Stockfish: ${formatEval(mistake.engine.before)} → ${formatEval(mistake.engine.after)} · потеря ${mistake.engine.loss.toFixed(1)}</div>` : ""}
        <div class="mistake-layout">
          ${mistake.board ? renderBoard(mistake.board, mistake.highlight, mistake.arrow) : '<div class="board-placeholder">Доска недоступна для этого хода</div>'}
          <div>
            <p class="reason"><strong>Почему выбран ход:</strong> ${mistake.reason || "ИИ-анализ"}</p>
            <p>${mistake.explanation}</p>
            <div class="exercise"><strong>Упражнение:</strong> ${mistake.exercise}</div>
          </div>
        </div>
      </article>
    `);
  });

  renderProgress(analysis.mistakes);
}

async function enrichAnalysisWithAi(analysis, pgn) {
  const key = aiApiKey.value.trim();
  if (!key) {
    showAiMessage("Введите API-ключ, чтобы включить ИИ-ментора.", "error");
    return;
  }

  if (window.location.hostname.includes('github.io')) {
    showAiMessage("⚠️ ИИ-ментор недоступен на GitHub Pages. Для работы ИИ нужен локальный прокси-сервер. Локальный анализ будет работать.", "error");
    return;
  }

  showAiMessage("ИИ-ментор анализирует партию...", "note");
  try {
    const aiMistakes = await requestAiMentor(analysis, pgn, key, "gpt-5.4-mini");
    if (!aiMistakes || !Array.isArray(aiMistakes)) {
      throw new Error("ИИ вернул неверный формат данных");
    }
    const localMistakes = analysis.mistakes;
    analysis.mistakes = aiMistakes.map(mistake => {
      const localMistake = localMistakes.find(m => m.moveNumber === mistake.moveNumber && (m.side === mistake.side || (m.side === "белые" && mistake.side === "white") || (m.side === "чёрные" && mistake.side === "black")));
      if (localMistake) {
        return {
          ...localMistake,
          type: mistake.type,
          explanation: mistake.explanation,
          exercise: mistake.exercise,
          rating: mistake.rating,
          phase: mistake.phase || localMistake.phase,
          riskScore: mistake.riskScore || localMistake.riskScore
        };
      }
      return {
        ...mistake,
        fen: "",
        board: null,
        phase: mistake.phase || "миттельшпиль",
        riskScore: mistake.riskScore || 50,
        engine: null,
        highlight: null,
        arrow: null,
        reason: "ИИ-анализ: ход не найден в локальном анализе"
      };
    }).filter(mistake => mistake.riskScore > 30);

    const seen = new Set();
    analysis.mistakes = analysis.mistakes.filter(mistake => {
      const key = `${mistake.moveNumber}-${mistake.side}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    renderAnalysis(analysis);
    showAiMessage("Анализ завершён через ИИ-ментора.", "note");
  } catch (error) {
    console.error('AI error:', error);
    showAiMessage(`ИИ недоступен: ${error.message}. Показаны локальные объяснения.`, "error");
  }
}

async function requestAiMentor(analysis, pgn, key, model) {
  const response = await fetch("http://localhost:3001/api/codex/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      apiKey: key,
      model,
      temperature: 0.35,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "Ты шахматный ИИ-тренер CHESS:MATE для любителей 1000-1800. Объясняй ошибки простым русским языком, без длинных вариантов. Возвращай только JSON."
        },
        {
          role: "user",
          content: buildAiPrompt(analysis, pgn)
        }
      ]
    })
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error?.message || "ошибка API");
  }

  const content = payload.choices?.[0]?.message?.content;
  const parsed = JSON.parse(content);
  if (!parsed.mistakes || !Array.isArray(parsed.mistakes)) {
    throw new Error("ИИ вернул неверный формат");
  }
  return parsed.mistakes;
}

function buildAiPrompt(analysis, pgn) {
  const compactPgn = pgn.slice(0, 3500);
  const moves = analysis.mistakes.map((mistake, index) => ({
    index,
    moveNumber: mistake.moveNumber,
    side: mistake.side,
    move: mistake.move,
    fenAfterMove: mistake.fen,
    stockfishEval: mistake.rating
  }));
  return `Ты шахматный ИИ-тренер CHESS:MATE для любителей 1000-1800. Проанализируй указанные ходы партии.

PGN партии:\n${compactPgn}

Ходы для анализа (анализируй ТОЛЬКО эти ходы, не добавляй новые):\n${JSON.stringify(moves, null, 2)}

Задача:
1. Для каждого хода из списка определи тип ошибки и напиши объяснение
2. НЕ добавляй новые ошибки, которых нет в списке
3. Для каждого хода укажи type, explanation, exercise, rating

Верни JSON строго такого вида:
{
  "mistakes": [
    {
      "moveNumber": 5,
      "side": "белые|чёрные",
      "move": "e4",
      "type": "тактическая слепота|потеря темпа|слабые поля|плохая позиция короля|недоразвитие фигур|неправильный размен|оценка позиции|ошибка времени|психологическая ошибка",
      "explanation": "2-3 предложения как живой тренер: почему ход плох и какой принцип нарушен",
      "exercise": "одно конкретное упражнение для исправления этой ошибки",
      "rating": -2.5,
      "phase": "дебют|миттельшпиль|эндшпиль",
      "riskScore": 85
    }
  ]
}

Правила:
- side: белые или чёрные (на русском)
- type: конкретный тип ошибки из списка:
  * тактическая слепота: пропущен тактический удар, взятие, шах или матовая угроза
  * потеря темпа: фигура ходит повторно вместо развития, отдаётся инициатива
  * слабые поля: пешечный ход создаёт слабые клетки, которые нельзя защитить
  * плохая позиция короля: король оставлен под атакой, не рокирован вовремя
  * недоразвитие фигур: фигуры не выведены из начальной позиции в дебюте
  * неправильный размен: размен ухудшает позицию или отдаёт инициативу
  * оценка позиции: неверная оценка позиции, переоценка атаки или защиты
  * ошибка времени: нехватка времени, спешка в критический момент
  * психологическая ошибка: желание взять материю вместо защиты, паника
- rating: оценка позиции после хода (отрицательная = плохо для белых, положительная = хорошо для белых)
- phase: дебют, миттельшпиль, эндшпиль (определи по номеру хода: до 10 = дебют, 10-30 = миттельшпиль, после 30 = эндшпиль)
- riskScore: число от 0 до 100, насколько серьёзна ошибка (большая потеря оценки = высокий риск)
- Количество ошибок в ответе должно совпадать с количеством ходов в списке`;
}

function showAiMessage(message, kind) {
  const existing = results.querySelector(".ai-note, .ai-error");
  if (existing) existing.remove();
  results.insertAdjacentHTML("afterbegin", `<div class="${kind === "error" ? "ai-error" : "ai-note"}">${message}</div>`);
}

function formatEval(value) {
  if (Math.abs(value) >= 99) return value > 0 ? "матовая атака" : "матовая угроза";
  return `${value > 0 ? "+" : ""}${value.toFixed(1)}`;
}

function renderProgress(items) {
  const grouped = items.reduce((acc, item) => {
    if (!acc[item.type]) {
      acc[item.type] = { type: item.type, count: 0 };
    }
    acc[item.type].count += 1;
    return acc;
  }, {});

  const maxCount = Math.max(...Object.values(grouped).map(g => g.count));
  const result = Object.values(grouped).map(group => ({
    type: group.type,
    count: group.count,
    progress: Math.round((group.count / maxCount) * 100)
  })).sort((a, b) => b.count - a.count);

  progressCards.innerHTML = result.map((item) => {
    const color = item.progress >= 70 ? '#ef4444' : item.progress >= 40 ? '#f59e0b' : '#22c55e';
    return `
    <article class="progress-card">
      <h3>${item.type} (${item.count} ${pluralize(item.count, 'ошибка', 'ошибки', 'ошибок')})</h3>
      <p>${progressLabel(item.progress)}</p>
      <div class="progress-bar"><span style="width:${item.progress}%; background: ${color}"></span></div>
    </article>
    `;
  }).join("");
}

function getRiskWeight(riskScore) {
  if (riskScore >= 80) return 2.0;
  if (riskScore >= 50) return 1.0;
  return 0.5;
}

function pluralize(count, one, two, five) {
  const lastTwo = count % 100;
  if (lastTwo >= 11 && lastTwo <= 19) return five;
  const lastOne = count % 10;
  if (lastOne === 1) return one;
  if (lastOne >= 2 && lastOne <= 4) return two;
  return five;
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

function buildPositions(moves, verboseMoves = null) {
  if (verboseMoves?.length && typeof Chess !== "undefined") {
    const game = new Chess();
    const positions = [boardFromChessJs(game.board())];
    positions.moves = [];
    positions.fens = [game.fen()];

    verboseMoves.forEach((move) => {
      const applied = game.move(move.san, { sloppy: true });
      positions.moves.push(applied ? {
        from: squareToCoords(applied.from),
        to: squareToCoords(applied.to),
        san: applied.san,
        flags: applied.flags,
        captured: applied.captured || null,
        promotion: applied.promotion || null
      } : null);
      positions.push(boardFromChessJs(game.board()));
      positions.fens.push(game.fen());
    });

    return positions;
  }

  let board = initialBoard();
  const positions = [cloneBoard(board)];
  positions.moves = [];
  positions.fens = [];
  moves.forEach((move, index) => {
    const applied = applyApproxMove(board, move, index % 2 === 0 ? "w" : "b");
    board = applied.board;
    positions.moves.push(applied.move);
    positions.push(cloneBoard(board));
  });
  return positions;
}

function boardFromChessJs(chessBoard) {
  return chessBoard.map((row) => row.map((piece) => {
    if (!piece) return "";
    return `${piece.color}${piece.type.toUpperCase()}`;
  }));
}

function squareToCoords(square) {
  return {
    row: 8 - Number(square[1]),
    col: square.charCodeAt(0) - 97
  };
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
    const pieceColor = piece ? (piece[0] === "w" ? "white-piece" : "black-piece") : "";
    return `<div class="square ${(rowIndex + colIndex) % 2 ? "dark" : "light"} ${isHighlighted ? "highlight" : ""} ${isFrom ? "from-square" : ""}" title="${squareName}">
      <span class="${pieceColor}">${pieceMap[piece] || ""}</span>
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

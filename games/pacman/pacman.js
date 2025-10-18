const form = document.querySelector('.signup-form');

if (form) {
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const emailField = form.querySelector('input[type="email"]');

    if (!emailField.value.trim()) {
      emailField.focus();
      return;
    }

    form.reset();
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = 'Obrigado por se inscrever! Em breve você receberá novidades.';
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.add('is-visible');
    });

    setTimeout(() => {
      toast.classList.remove('is-visible');
      toast.addEventListener('transitionend', () => toast.remove(), { once: true });
    }, 3000);
  });
}

const pacmanCanvas = document.getElementById('pacman-canvas');

if (pacmanCanvas) {
  const ctx = pacmanCanvas.getContext('2d');
  const scoreDisplay = document.getElementById('pacman-score');
  const livesDisplay = document.getElementById('pacman-lives');
  const statusDisplay = document.getElementById('pacman-status');
  const resetButton = document.getElementById('pacman-reset');

  const TILE_SIZE = 16;
  const PACMAN_SPEED = 90;
  const GHOST_BASE_SPEED = 75;
  const POWER_DURATION = 6;
  const READY_DELAY = 2;
  const GHOST_PHASES = [7, 20, 7, 20, 5, 20];
  const DIRECTIONS = {
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 },
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 }
  };

  const KEY_BINDINGS = {
    ArrowLeft: 'left',
    ArrowRight: 'right',
    ArrowUp: 'up',
    ArrowDown: 'down',
    a: 'left',
    d: 'right',
    w: 'up',
    s: 'down'
  };

  const RAW_LAYOUT = [
    '############################',
    '#............##............#',
    '#.####.#####.##.#####.####.#',
    '#o####.#####.##.#####.####o#',
    '#.####.#####.##.#####.####.#',
    '#..........................#',
    '#.####.##.########.##.####.#',
    '#.####.##.########.##.####.#',
    '#......##....##....##......#',
    '######.##### ## #####.######',
    '     #.##### ## #####.#     ',
    '     #.##          ##.#     ',
    '     #.## ###--### ##.#     ',
    '######.## #      # ##.######',
    '#........ #      # ........#',
    '######.## #      # ##.######',
    '     #.## ######## ##.#     ',
    '     #.## ######## ##.#     ',
    '     #.##          ##.#     ',
    '######.## ######## ##.######',
    '#............##............#',
    '#.####.#####.##.#####.####.#',
    '#.####.#####.##.#####.####.#',
    '#o..##................##..o#',
    '###.##.##.########.##.##.###',
    '#......##....##....##......#',
    '#.##########.##.##########.#',
    '#.##########.##.##########.#',
    '#..........................#',
    '############################'
  ];

  const ROWS = RAW_LAYOUT.length;
  const COLS = RAW_LAYOUT[0].length;
  pacmanCanvas.width = COLS * TILE_SIZE;
  pacmanCanvas.height = ROWS * TILE_SIZE;
  const HOME_TILE = { x: 13, y: 14 };

  let map = createMap();
  let pelletsRemaining = countPellets(map);
  let score = 0;
  let lives = 3;
  let frightenedTimer = 0;
  let readyTimer = READY_DELAY;
  let ghostMode = 'scatter';
  let ghostPhaseIndex = 0;
  let ghostPhaseTimer = GHOST_PHASES[0];
  let lastTimestamp = 0;
  let running = false;
  let gameState = 'idle';
  let mouthTicker = 0;

  const pacman = {
    x: 0,
    y: 0,
    radius: TILE_SIZE / 2 - 2,
    speed: PACMAN_SPEED,
    direction: { x: 0, y: 0 },
    pendingDirection: null,
    startTile: { x: 13, y: 23 },
    facing: { x: 1, y: 0 }
  };

  const ghosts = [
    {
      name: 'Blinky',
      color: '#ff4b4b',
      startTile: { x: 13, y: 11 },
      startDirection: { x: 1, y: 0 },
      scatterTarget: { x: 25, y: 1 }
    },
    {
      name: 'Pinky',
      color: '#ff8ed4',
      startTile: { x: 13, y: 14 },
      startDirection: { x: 0, y: -1 },
      scatterTarget: { x: 2, y: 1 }
    },
    {
      name: 'Inky',
      color: '#4bf0ff',
      startTile: { x: 12, y: 14 },
      startDirection: { x: 0, y: 1 },
      scatterTarget: { x: 25, y: 28 }
    },
    {
      name: 'Clyde',
      color: '#ffb24b',
      startTile: { x: 15, y: 14 },
      startDirection: { x: 0, y: 1 },
      scatterTarget: { x: 2, y: 28 }
    }
  ].map((ghost) => ({
    ...ghost,
    x: 0,
    y: 0,
    radius: TILE_SIZE / 2 - 1,
    speed: GHOST_BASE_SPEED,
    baseSpeed: GHOST_BASE_SPEED,
    direction: cloneDirection(ghost.startDirection),
    state: ghostMode
  }));

  setEntityPosition(pacman, pacman.startTile.x, pacman.startTile.y);
  ghosts.forEach((ghost) => setEntityPosition(ghost, ghost.startTile.x, ghost.startTile.y));
  updateHud();
  updateStatus('Pressione espaço para iniciar.');
  draw();
  requestAnimationFrame(gameLoop);

  document.addEventListener('keydown', (event) => {
    if (event.target && event.target.tagName === 'INPUT') {
      return;
    }

    if (event.code === 'Space' || event.key === ' ' || event.key === 'Spacebar') {
      event.preventDefault();
      handleSpaceKey();
      return;
    }

    const key = KEY_BINDINGS[event.key] || KEY_BINDINGS[event.key.toLowerCase()];
    if (!key) {
      return;
    }

    event.preventDefault();
    pacman.pendingDirection = DIRECTIONS[key];

    if (gameState === 'idle') {
      startRunning();
    }
  });

  resetButton?.addEventListener('click', () => {
    resetGame();
    draw();
  });

  function createMap() {
    return RAW_LAYOUT.map((row) => row.split(''));
  }

  function countPellets(board) {
    return board.reduce((total, row) => (
      total + row.filter((cell) => cell === '.' || cell === 'o').length
    ), 0);
  }

  function cloneDirection(dir) {
    return { x: dir.x, y: dir.y };
  }

  function tileCenter(col, row) {
    return {
      x: (col + 0.5) * TILE_SIZE,
      y: (row + 0.5) * TILE_SIZE
    };
  }

  function setEntityPosition(entity, col, row) {
    const center = tileCenter(col, row);
    entity.x = center.x;
    entity.y = center.y;
  }

  function tileForPosition(x, y) {
    return {
      x: Math.floor(x / TILE_SIZE),
      y: Math.floor(y / TILE_SIZE)
    };
  }

  function getTile(col, row) {
    const wrappedCol = ((col % COLS) + COLS) % COLS;
    if (row < 0 || row >= ROWS) {
      return '#';
    }
    return map[row][wrappedCol];
  }

  function isBlocked(col, row, type) {
    const tile = getTile(col, row);
    if (tile === '#') {
      return true;
    }
    if (tile === '-' && type === 'pacman') {
      return true;
    }
    return false;
  }

  function isNearCenter(entity) {
    const tile = tileForPosition(entity.x, entity.y);
    const center = tileCenter(tile.x, tile.y);
    return Math.abs(entity.x - center.x) < 0.9 && Math.abs(entity.y - center.y) < 0.9;
  }

  function tryChangeDirection(entity, dir, type) {
    if (!isNearCenter(entity)) {
      return false;
    }

    const tile = tileForPosition(entity.x, entity.y);
    const targetCol = tile.x + dir.x;
    const targetRow = tile.y + dir.y;

    if (isBlocked(targetCol, targetRow, type)) {
      return false;
    }

    entity.direction = cloneDirection(dir);

    if (type === 'pacman') {
      pacman.facing = cloneDirection(dir);
    }

    return true;
  }

  function collidesWithWall(x, y, type) {
    const radius = type === 'pacman' ? pacman.radius : TILE_SIZE / 2 - 1;
    const left = x - radius;
    const right = x + radius;
    const top = y - radius;
    const bottom = y + radius;

    const tiles = [
      { col: Math.floor(left / TILE_SIZE), row: Math.floor(top / TILE_SIZE) },
      { col: Math.floor(right / TILE_SIZE), row: Math.floor(top / TILE_SIZE) },
      { col: Math.floor(left / TILE_SIZE), row: Math.floor(bottom / TILE_SIZE) },
      { col: Math.floor(right / TILE_SIZE), row: Math.floor(bottom / TILE_SIZE) }
    ];

    return tiles.some(({ col, row }) => isBlocked(col, row, type));
  }

  function moveEntity(entity, delta, type) {
    if (!entity.direction || (entity.direction.x === 0 && entity.direction.y === 0)) {
      return;
    }

    const displacement = entity.speed * delta;

    if (entity.direction.x) {
      const targetX = entity.x + entity.direction.x * displacement;
      if (!collidesWithWall(targetX, entity.y, type)) {
        entity.x = targetX;
      } else {
        snapToCenter(entity);
        entity.direction = { x: 0, y: 0 };
      }
    }

    if (entity.direction.y) {
      const targetY = entity.y + entity.direction.y * displacement;
      if (!collidesWithWall(entity.x, targetY, type)) {
        entity.y = targetY;
      } else {
        snapToCenter(entity);
        entity.direction = { x: 0, y: 0 };
      }
    }

    const tunnelThreshold = TILE_SIZE / 2;
    const boardWidth = COLS * TILE_SIZE;

    if (entity.x < -tunnelThreshold) {
      entity.x = boardWidth + tunnelThreshold;
    } else if (entity.x > boardWidth + tunnelThreshold) {
      entity.x = -tunnelThreshold;
    }
  }

  function snapToCenter(entity) {
    const tile = tileForPosition(entity.x, entity.y);
    const center = tileCenter(tile.x, tile.y);
    entity.x = center.x;
    entity.y = center.y;
  }

  function updatePacman(delta) {
    if (pacman.pendingDirection) {
      if (tryChangeDirection(pacman, pacman.pendingDirection, 'pacman')) {
        pacman.pendingDirection = null;
      }
    }

    moveEntity(pacman, delta, 'pacman');

    const tile = tileForPosition(pacman.x, pacman.y);
    const center = tileCenter(tile.x, tile.y);

    if (Math.abs(pacman.x - center.x) > 1 || Math.abs(pacman.y - center.y) > 1) {
      return;
    }

    const tileValue = getTile(tile.x, tile.y);

    if (tileValue === '.') {
      map[tile.y][tile.x] = ' ';
      pelletsRemaining -= 1;
      score += 10;
      updateHud();
    } else if (tileValue === 'o') {
      map[tile.y][tile.x] = ' ';
      pelletsRemaining -= 1;
      score += 50;
      triggerPowerPellet();
      updateHud();
    }

    if (pelletsRemaining === 0) {
      handleVictory();
    }
  }

  function triggerPowerPellet() {
    frightenedTimer = POWER_DURATION;
    updateStatus('Poder energético ativado!');
    ghosts.forEach((ghost) => {
      if (ghost.state === 'eaten') {
        return;
      }
      ghost.state = 'frightened';
      ghost.speed = ghost.baseSpeed * 0.6;
      ghost.direction = { x: -ghost.direction.x, y: -ghost.direction.y };
    });
  }

  function availableDirectionsFrom(tile, type) {
    return Object.values(DIRECTIONS).filter((dir) => !isBlocked(tile.x + dir.x, tile.y + dir.y, type));
  }

  function chooseDirectionTowards(tile, options, target) {
    let chosen = options[0];
    let bestDistance = Number.POSITIVE_INFINITY;

    options.forEach((dir) => {
      const nextCol = tile.x + dir.x;
      const nextRow = tile.y + dir.y;
      const distance = Math.hypot(target.x - nextCol, target.y - nextRow);
      if (distance < bestDistance) {
        chosen = dir;
        bestDistance = distance;
      }
    });

    return cloneDirection(chosen);
  }

  function updateGhosts(delta) {
    if (frightenedTimer > 0) {
      frightenedTimer = Math.max(0, frightenedTimer - delta);
      if (frightenedTimer === 0) {
        ghosts.forEach((ghost) => {
          if (ghost.state === 'frightened') {
            ghost.state = ghostMode;
            ghost.speed = ghost.baseSpeed;
          }
        });
        updateStatus('Os fantasmas se recuperaram!');
      }
    } else if (ghostPhaseIndex < GHOST_PHASES.length) {
      ghostPhaseTimer -= delta;
      if (ghostPhaseTimer <= 0) {
        ghostPhaseIndex += 1;
        if (ghostPhaseIndex >= GHOST_PHASES.length) {
          ghostMode = 'chase';
          ghostPhaseTimer = Number.POSITIVE_INFINITY;
        } else {
          ghostMode = ghostPhaseIndex % 2 === 0 ? 'scatter' : 'chase';
          ghostPhaseTimer = GHOST_PHASES[ghostPhaseIndex];
        }
        ghosts.forEach((ghost) => {
          if (ghost.state !== 'eaten') {
            ghost.state = ghostMode;
          }
        });
      }
    }

    ghosts.forEach((ghost) => {
      if (ghost.state !== 'frightened' && ghost.state !== 'eaten') {
        ghost.speed = ghost.baseSpeed;
      }

      const tile = tileForPosition(ghost.x, ghost.y);
      const options = availableDirectionsFrom(tile, 'ghost');

      if (options.length) {
        let filtered = options;
        const opposite = { x: -ghost.direction.x, y: -ghost.direction.y };
        if (ghost.direction.x !== 0 || ghost.direction.y !== 0) {
          filtered = options.filter((dir) => dir.x !== opposite.x || dir.y !== opposite.y);
          if (!filtered.length) {
            filtered = options;
          }
        }

        let nextDirection;

        if (ghost.state === 'frightened') {
          nextDirection = cloneDirection(filtered[Math.floor(Math.random() * filtered.length)]);
        } else if (ghost.state === 'eaten') {
          nextDirection = chooseDirectionTowards(tile, filtered, HOME_TILE);
        } else if (ghost.state === 'scatter') {
          nextDirection = chooseDirectionTowards(tile, filtered, ghost.scatterTarget);
        } else {
          const target = tileForPosition(pacman.x, pacman.y);
          nextDirection = chooseDirectionTowards(tile, filtered, target);
        }

        ghost.direction = nextDirection;
      }

      moveEntity(ghost, delta, 'ghost');

      if (ghost.state === 'eaten') {
        const ghostTile = tileForPosition(ghost.x, ghost.y);
        if (ghostTile.x === HOME_TILE.x && ghostTile.y === HOME_TILE.y && isNearCenter(ghost)) {
          ghost.state = ghostMode;
          ghost.speed = ghost.baseSpeed;
          ghost.direction = cloneDirection(ghost.startDirection);
        }
      }
    });
  }

  function stepGame(delta) {
    if (readyTimer > 0) {
      readyTimer = Math.max(0, readyTimer - delta);
      if (readyTimer === 0) {
        updateStatus('Caçada em andamento!');
      }
      return;
    }

    updatePacman(delta);
    updateGhosts(delta);
    checkCollisions();
  }

  function checkCollisions() {
    for (const ghost of ghosts) {
      const distance = Math.hypot(ghost.x - pacman.x, ghost.y - pacman.y);
      if (distance >= pacman.radius + ghost.radius - 2) {
        continue;
      }

      if (ghost.state === 'frightened') {
        handleGhostCapture(ghost);
      } else if (ghost.state !== 'eaten') {
        handlePacmanCaught();
        break;
      }
    }
  }

  function handleGhostCapture(ghost) {
    ghost.state = 'eaten';
    ghost.speed = ghost.baseSpeed * 1.5;
    score += 200;
    updateHud();
    updateStatus('Fantasma devorado!');
  }

  function handlePacmanCaught() {
    lives -= 1;
    updateHud();

    if (lives <= 0) {
      running = false;
      gameState = 'over';
      updateStatus('Fim de jogo! Pressione espaço para recomeçar.');
      prepareRound();
      return;
    }

    running = false;
    gameState = 'idle';
    updateStatus('Você perdeu uma vida! Pressione espaço para continuar.');
    prepareRound();
  }

  function prepareRound(message) {
    setEntityPosition(pacman, pacman.startTile.x, pacman.startTile.y);
    pacman.direction = { x: 0, y: 0 };
    pacman.pendingDirection = null;
    pacman.facing = { x: 1, y: 0 };

    ghosts.forEach((ghost) => {
      setEntityPosition(ghost, ghost.startTile.x, ghost.startTile.y);
      ghost.direction = cloneDirection(ghost.startDirection);
      ghost.state = ghostMode;
      ghost.speed = ghost.baseSpeed;
    });

    frightenedTimer = 0;
    readyTimer = READY_DELAY;
    ghostPhaseTimer = ghostPhaseIndex < GHOST_PHASES.length ? GHOST_PHASES[ghostPhaseIndex] : Number.POSITIVE_INFINITY;
    mouthTicker = 0;

    if (typeof message === 'string') {
      updateStatus(message);
    }
  }

  function resetMap() {
    map = createMap();
    pelletsRemaining = countPellets(map);
  }

  function resetGame() {
    resetMap();
    score = 0;
    lives = 3;
    ghostMode = 'scatter';
    ghostPhaseIndex = 0;
    ghostPhaseTimer = GHOST_PHASES[0];
    frightenedTimer = 0;
    readyTimer = READY_DELAY;
    running = false;
    gameState = 'idle';
    updateHud();
    prepareRound('Pressione espaço para iniciar.');
  }

  function startRunning() {
    if (gameState === 'running') {
      return;
    }
    running = true;
    gameState = 'running';
    if (readyTimer > 0) {
      updateStatus('Preparar...');
    } else {
      updateStatus('Caçada em andamento!');
    }
  }

  function handleSpaceKey() {
    if (gameState === 'running') {
      running = false;
      gameState = 'paused';
      updateStatus('Jogo pausado. Pressione espaço para continuar.');
      return;
    }

    if (gameState === 'paused') {
      running = true;
      gameState = 'running';
      updateStatus('Caçada em andamento!');
      return;
    }

    if (gameState === 'over' || gameState === 'victory') {
      resetGame();
      draw();
      return;
    }

    if (gameState === 'idle') {
      startRunning();
    }
  }

  function updateHud() {
    if (scoreDisplay) {
      scoreDisplay.textContent = score.toString().padStart(1, '0');
    }
    if (livesDisplay) {
      livesDisplay.textContent = lives.toString();
    }
  }

  function updateStatus(message) {
    if (statusDisplay) {
      statusDisplay.textContent = message;
    }
  }

  function handleVictory() {
    running = false;
    gameState = 'victory';
    updateStatus('Labirinto completo! Pressione espaço para jogar novamente.');
  }

  function gameLoop(timestamp) {
    if (!lastTimestamp) {
      lastTimestamp = timestamp;
    }

    const delta = (timestamp - lastTimestamp) / 1000;
    lastTimestamp = timestamp;

    if (running) {
      stepGame(delta);
    }

    mouthTicker += delta;
    draw();
    requestAnimationFrame(gameLoop);
  }

  function draw() {
    ctx.fillStyle = '#02010c';
    ctx.fillRect(0, 0, pacmanCanvas.width, pacmanCanvas.height);

    drawMaze();
    drawPellets();
    drawGhosts();
    drawPacman();
    drawOverlay();
  }

  function drawMaze() {
    for (let row = 0; row < ROWS; row += 1) {
      for (let col = 0; col < COLS; col += 1) {
        const tile = map[row][col];
        if (tile === '#') {
          ctx.fillStyle = '#132c62';
          ctx.fillRect(col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE);
          ctx.strokeStyle = 'rgba(18, 84, 201, 0.35)';
          ctx.lineWidth = 1;
          ctx.strokeRect(col * TILE_SIZE + 2, row * TILE_SIZE + 2, TILE_SIZE - 4, TILE_SIZE - 4);
        }
        if (tile === '-') {
          ctx.fillStyle = '#ff85b3';
          ctx.fillRect(col * TILE_SIZE, row * TILE_SIZE + TILE_SIZE / 2 - 2, TILE_SIZE, 4);
        }
      }
    }
  }

  function drawPellets() {
    const blink = Math.floor(performance.now() / 200) % 2 === 0;

    for (let row = 0; row < ROWS; row += 1) {
      for (let col = 0; col < COLS; col += 1) {
        const tile = map[row][col];
        if (tile !== '.' && tile !== 'o') {
          continue;
        }

        const center = tileCenter(col, row);
        ctx.beginPath();
        ctx.fillStyle = '#f5f5f7';

        if (tile === '.') {
          ctx.arc(center.x, center.y, 2.2, 0, Math.PI * 2);
        } else {
          const radius = blink ? 5.5 : 4.2;
          ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
        }

        ctx.fill();
      }
    }
  }

  function drawPacman() {
    const direction = pacman.direction.x || pacman.direction.y ? pacman.direction : pacman.facing;
    let angle = 0;
    if (direction.x === -1) angle = Math.PI;
    else if (direction.x === 1) angle = 0;
    else if (direction.y === -1) angle = -Math.PI / 2;
    else if (direction.y === 1) angle = Math.PI / 2;

    const mouth = gameState === 'running' ? 0.28 + 0.12 * Math.abs(Math.sin(mouthTicker * 8)) : 0.28;

    ctx.fillStyle = '#ffd447';
    ctx.beginPath();
    ctx.moveTo(pacman.x, pacman.y);
    ctx.arc(pacman.x, pacman.y, pacman.radius, angle + mouth, angle - mouth, false);
    ctx.closePath();
    ctx.fill();
  }

  function drawGhosts() {
    const blink = frightenedTimer > 0 && frightenedTimer < 2 && Math.floor(performance.now() / 200) % 2 === 0;

    ghosts.forEach((ghost) => {
      let bodyColor = ghost.color;
      if (ghost.state === 'frightened') {
        bodyColor = blink ? '#ffffff' : '#365bff';
      }

      if (ghost.state !== 'eaten') {
        drawGhostBody(ghost, bodyColor);
      }

      drawGhostEyes(ghost);
    });
  }

  function drawGhostBody(ghost, color) {
    const radius = ghost.radius;
    const baseX = ghost.x;
    const baseY = ghost.y;

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(baseX, baseY, radius, Math.PI, 0, false);
    ctx.lineTo(baseX + radius, baseY + radius);

    const segments = 4;
    for (let i = segments; i >= 0; i -= 1) {
      const x = baseX - radius + (i * 2 * radius) / segments;
      const offset = i % 2 === 0 ? 0 : 4;
      ctx.quadraticCurveTo(x - radius / segments, baseY + radius + offset, x, baseY + radius);
    }

    ctx.closePath();
    ctx.fill();
  }

  function drawGhostEyes(ghost) {
    const eyeRadius = 3;
    const pupilRadius = 1.4;
    const offsetX = ghost.state === 'eaten' ? 0 : ghost.direction.x * 2;
    const offsetY = ghost.state === 'eaten' ? 0 : ghost.direction.y * 2;

    const leftEyeX = ghost.x - 4;
    const rightEyeX = ghost.x + 4;
    const eyeY = ghost.y - 2;

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(leftEyeX, eyeY, eyeRadius, 0, Math.PI * 2);
    ctx.arc(rightEyeX, eyeY, eyeRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = ghost.state === 'frightened' ? '#001c8b' : '#001c8b';
    ctx.beginPath();
    ctx.arc(leftEyeX + offsetX, eyeY + offsetY, pupilRadius, 0, Math.PI * 2);
    ctx.arc(rightEyeX + offsetX, eyeY + offsetY, pupilRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawOverlay() {
    let message = '';

    if (gameState === 'paused') {
      message = 'PAUSADO';
    } else if (gameState === 'victory') {
      message = 'VOCÊ VENCEU!';
    } else if (gameState === 'over') {
      message = 'FIM DE JOGO';
    } else if (!running && gameState === 'idle') {
      message = 'PRESSIONE ESPAÇO';
    } else if (running && readyTimer > 0) {
      message = 'PRONTO!';
    }

    if (!message) {
      return;
    }

    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.fillRect(0, 0, pacmanCanvas.width, pacmanCanvas.height);
    drawOverlayText(message);
  }

  function drawOverlayText(text) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.fillRect(0, pacmanCanvas.height / 2 - 40, pacmanCanvas.width, 80);
    ctx.font = 'bold 24px "Press Start 2P", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, pacmanCanvas.width / 2, pacmanCanvas.height / 2 + 8);
  }
}

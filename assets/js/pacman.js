class PacmanGame {
  constructor(section) {
    this.section = section;
    this.canvas = section.querySelector('#pacman-canvas');
    this.ctx = this.canvas?.getContext('2d');
    this.scoreElement = section.querySelector('[data-pacman-score]');
    this.livesElement = section.querySelector('[data-pacman-lives]');
    this.statusElement = section.querySelector('[data-pacman-status]');
    this.startButton = section.querySelector('[data-pacman-start]');

    this.tileSize = 24;
    this.pacmanSpeed = 90;
    this.ghostSpeed = 70;
    this.frightenedSpeed = 45;
    this.frightenedDuration = 7;
    this.respawnDelay = 1.5;
    this.mouthPhase = 0;

    this.baseMap = [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
      [1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1],
      [1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1],
      [1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1],
      [1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1],
      [1, 0, 0, 0, 1, 0, 0, 0, 1, 2, 1, 0, 0, 0, 1, 0, 0, 0, 1],
      [1, 1, 1, 0, 1, 1, 1, 0, 1, 3, 1, 0, 1, 1, 1, 0, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 1, 1, 1, 1, 1, 1, 1, 3, 1, 1, 1, 1, 1, 1, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 1, 0, 0, 0, 1, 2, 1, 0, 0, 0, 1, 0, 0, 0, 1],
      [1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1],
      [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1],
      [1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
    ];

    this.map = this.cloneMap(this.baseMap);
    this.score = 0;
    this.lives = 3;
    this.remainingPellets = this.countPellets(this.map);
    this.frightenedTimer = 0;
    this.respawnTimer = 0;
    this.running = false;
    this.loopHandle = null;

    this.pacman = this.createPacman();
    this.ghosts = this.createGhosts();

    this.bindEvents();
    this.updateHud();
    this.updateStatus('Pressione Iniciar para começar a perseguição.');
    this.draw();
  }

  bindEvents() {
    if (this.startButton) {
      this.startButton.addEventListener('click', () => this.startGame());
    }

    this.keyListener = (event) => this.handleKey(event);
    document.addEventListener('keydown', this.keyListener);
  }

  startGame() {
    if (this.running) {
      return;
    }

    this.map = this.cloneMap(this.baseMap);
    this.remainingPellets = this.countPellets(this.map);
    this.score = 0;
    this.lives = 3;
    this.frightenedTimer = 0;
    this.respawnTimer = 0;
    this.pacman = this.createPacman();
    this.ghosts = this.createGhosts();
    this.running = true;
    this.mouthPhase = 0;
    this.lastTimestamp = performance.now();
    this.setStartButtonState(true);
    this.updateHud();
    this.updateStatus('Colete todos os pac-dots e evite os fantasmas!');
    this.loopHandle = requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
  }

  setStartButtonState(isRunning) {
    if (!this.startButton) {
      return;
    }

    this.startButton.disabled = isRunning;
    if (isRunning) {
      this.startButton.textContent = 'Rodada em curso';
    } else {
      this.startButton.textContent = 'Jogar novamente';
    }
  }

  gameLoop(timestamp) {
    if (!this.running) {
      return;
    }

    const delta = Math.min((timestamp - this.lastTimestamp) / 1000, 0.1);
    this.lastTimestamp = timestamp;

    this.update(delta);
    this.draw();

    this.loopHandle = requestAnimationFrame((time) => this.gameLoop(time));
  }

  update(delta) {
    if (this.respawnTimer > 0) {
      this.respawnTimer -= delta;
      if (this.respawnTimer <= 0) {
        this.updateStatus('Retome a coleta!');
      }
      return;
    }

    this.updatePacman(delta);
    this.updateGhosts(delta);
    this.handleCollisions();
    this.updateFrightened(delta);
    this.mouthPhase = (this.mouthPhase + delta * 6) % (Math.PI * 2);
  }

  updatePacman(delta) {
    const pacman = this.pacman;

    if (this.isAligned(pacman)) {
      if (this.canMove(pacman, pacman.nextDirection)) {
        pacman.direction = { ...pacman.nextDirection };
        pacman.facing = this.directionToAngle(pacman.direction) ?? pacman.facing;
      }

      if (!this.canMove(pacman, pacman.direction)) {
        pacman.direction = { x: 0, y: 0 };
      }

      this.consumePellet();
    }

    pacman.x += pacman.direction.x * this.pacmanSpeed * delta;
    pacman.y += pacman.direction.y * this.pacmanSpeed * delta;
  }

  updateGhosts(delta) {
    this.ghosts.forEach((ghost) => {
      if (this.isAligned(ghost)) {
        ghost.direction = this.chooseGhostDirection(ghost);
      }

      const speed = ghost.frightened ? this.frightenedSpeed : this.ghostSpeed;
      ghost.x += ghost.direction.x * speed * delta;
      ghost.y += ghost.direction.y * speed * delta;
    });
  }

  handleCollisions() {
    const pacman = this.pacman;
    const collisionRadius = this.tileSize * 0.45;

    for (const ghost of this.ghosts) {
      const distance = Math.hypot(ghost.x - pacman.x, ghost.y - pacman.y);
      if (distance > collisionRadius) {
        continue;
      }

      if (ghost.frightened) {
        this.score += 200;
        this.updateHud();
        this.updateStatus('Fantasma devorado! +200 pontos.');
        this.resetGhost(ghost);
      } else {
        this.handleLifeLoss();
      }

      break;
    }
  }

  updateFrightened(delta) {
    if (this.frightenedTimer <= 0) {
      return;
    }

    this.frightenedTimer -= delta;

    if (this.frightenedTimer <= 0) {
      this.ghosts.forEach((ghost) => {
        ghost.frightened = false;
      });
      this.updateStatus('Os fantasmas se recomporam. Continue atento!');
    }
  }

  consumePellet() {
    const row = Math.floor(this.pacman.y / this.tileSize);
    const col = Math.floor(this.pacman.x / this.tileSize);
    const tile = this.map[row]?.[col];

    if (tile === 0) {
      this.map[row][col] = 3;
      this.score += 10;
      this.remainingPellets -= 1;
      this.updateHud();
    } else if (tile === 2) {
      this.map[row][col] = 3;
      this.score += 40;
      this.remainingPellets -= 1;
      this.triggerFrightenedMode();
      this.updateHud();
    }

    if (this.remainingPellets <= 0) {
      this.endGame(true);
    }
  }

  triggerFrightenedMode() {
    this.frightenedTimer = this.frightenedDuration;
    this.ghosts.forEach((ghost) => {
      ghost.frightened = true;
      ghost.direction = { x: -ghost.direction.x, y: -ghost.direction.y };
    });
    this.updateStatus('Modo energético! Fantasmas vulneráveis temporariamente.');
  }

  handleLifeLoss() {
    if (!this.running) {
      return;
    }

    this.lives -= 1;
    this.updateHud();

    if (this.lives <= 0) {
      this.endGame(false);
      return;
    }

    this.updateStatus('Você perdeu uma vida! Prepare-se para continuar.');
    this.pacman = this.createPacman();
    this.ghosts = this.createGhosts();
    this.frightenedTimer = 0;
    this.respawnTimer = this.respawnDelay;
  }

  endGame(victory) {
    if (this.loopHandle) {
      cancelAnimationFrame(this.loopHandle);
      this.loopHandle = null;
    }

    const message = victory
      ? 'Vitória! Você limpou o labirinto da Arcadia.'
      : 'Fim de jogo! Os fantasmas dominaram desta vez.';

    this.updateStatus(message);
    this.running = false;
    this.setStartButtonState(false);
    this.draw();
  }

  handleKey(event) {
    const directions = {
      ArrowUp: { x: 0, y: -1 },
      ArrowDown: { x: 0, y: 1 },
      ArrowLeft: { x: -1, y: 0 },
      ArrowRight: { x: 1, y: 0 }
    };

    const direction = directions[event.key];

    if (!direction) {
      return;
    }

    if (event.key.startsWith('Arrow')) {
      event.preventDefault();
    }

    this.pacman.nextDirection = direction;
    if (this.pacman.direction.x === 0 && this.pacman.direction.y === 0) {
      this.pacman.direction = { ...direction };
      this.pacman.facing = this.directionToAngle(direction);
    }
  }

  draw() {
    if (!this.ctx) {
      return;
    }

    this.ctx.fillStyle = '#050514';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    for (let row = 0; row < this.map.length; row += 1) {
      for (let col = 0; col < this.map[row].length; col += 1) {
        const tile = this.map[row][col];
        const x = col * this.tileSize;
        const y = row * this.tileSize;

        this.drawTile(tile, x, y);
      }
    }

    this.drawPellets();
    this.drawGhosts();
    this.drawPacman();
  }

  drawTile(tile, x, y) {
    if (tile === 1) {
      const gradient = this.ctx.createLinearGradient(x, y, x + this.tileSize, y + this.tileSize);
      gradient.addColorStop(0, '#1a2a80');
      gradient.addColorStop(1, '#2f3fb9');
      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(x, y, this.tileSize, this.tileSize);
      this.ctx.fillStyle = 'rgba(12, 18, 58, 0.6)';
      this.ctx.fillRect(x + 2, y + 2, this.tileSize - 4, this.tileSize - 4);
    } else {
      this.ctx.fillStyle = 'rgba(10, 12, 32, 0.85)';
      this.ctx.fillRect(x, y, this.tileSize, this.tileSize);
      this.ctx.strokeStyle = 'rgba(42, 52, 116, 0.35)';
      this.ctx.strokeRect(x + 0.5, y + 0.5, this.tileSize - 1, this.tileSize - 1);
    }
  }

  drawPellets() {
    for (let row = 0; row < this.map.length; row += 1) {
      for (let col = 0; col < this.map[row].length; col += 1) {
        const tile = this.map[row][col];

        if (tile !== 0 && tile !== 2) {
          continue;
        }

        const x = col * this.tileSize + this.tileSize / 2;
        const y = row * this.tileSize + this.tileSize / 2;
        const radius = tile === 2 ? this.tileSize * 0.22 : this.tileSize * 0.1;

        this.ctx.beginPath();
        this.ctx.fillStyle = tile === 2 ? '#ff9ff3' : '#ffd770';
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }
  }

  drawPacman() {
    const pacman = this.pacman;
    const radius = this.tileSize * 0.38;
    const facing = pacman.facing ?? 0;
    const mouthAmplitude = Math.abs(Math.sin(this.mouthPhase)) * (Math.PI / 4);
    const startAngle = facing + mouthAmplitude;
    const endAngle = facing - mouthAmplitude;

    this.ctx.beginPath();
    this.ctx.fillStyle = '#ffd770';
    this.ctx.moveTo(pacman.x, pacman.y);
    this.ctx.arc(pacman.x, pacman.y, radius, startAngle, endAngle, true);
    this.ctx.closePath();
    this.ctx.fill();
  }

  drawGhosts() {
    this.ghosts.forEach((ghost) => {
      const radius = this.tileSize * 0.35;
      const x = ghost.x;
      const y = ghost.y;
      const bodyColor = ghost.frightened ? '#4ecdc4' : ghost.color;

      this.ctx.beginPath();
      this.ctx.fillStyle = bodyColor;
      this.ctx.arc(x, y, radius, Math.PI, 0, false);
      this.ctx.rect(x - radius, y, radius * 2, radius);
      this.ctx.fill();

      this.ctx.fillStyle = '#050514';
      const eyeOffsetX = this.tileSize * 0.12;
      const eyeOffsetY = this.tileSize * 0.05;
      this.ctx.beginPath();
      this.ctx.arc(x - eyeOffsetX, y - eyeOffsetY, this.tileSize * 0.08, 0, Math.PI * 2);
      this.ctx.arc(x + eyeOffsetX, y - eyeOffsetY, this.tileSize * 0.08, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }

  chooseGhostDirection(ghost) {
    const row = Math.floor(ghost.y / this.tileSize);
    const col = Math.floor(ghost.x / this.tileSize);
    const possibleDirections = [
      { x: 1, y: 0 },
      { x: -1, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: -1 }
    ];

    const validDirections = possibleDirections.filter((dir) => !this.isWall(row + dir.y, col + dir.x));
    const forwardDirections = validDirections.filter((dir) => dir.x !== -ghost.direction.x || dir.y !== -ghost.direction.y);
    const options = forwardDirections.length > 0 ? forwardDirections : validDirections;

    if (options.length === 0) {
      return { x: -ghost.direction.x, y: -ghost.direction.y };
    }

    if (ghost.frightened) {
      return options[Math.floor(Math.random() * options.length)];
    }

    let bestOption = options[0];
    let bestDistance = Number.POSITIVE_INFINITY;

    options.forEach((option) => {
      const nextX = (col + option.x + 0.5) * this.tileSize;
      const nextY = (row + option.y + 0.5) * this.tileSize;
      const distance = Math.hypot(this.pacman.x - nextX, this.pacman.y - nextY);

      if (distance < bestDistance) {
        bestDistance = distance;
        bestOption = option;
      }
    });

    return bestOption;
  }

  resetGhost(ghost) {
    ghost.x = (ghost.home.col + 0.5) * this.tileSize;
    ghost.y = (ghost.home.row + 0.5) * this.tileSize;
    ghost.direction = { x: 0, y: 0 };
    ghost.frightened = false;
  }

  createPacman() {
    return {
      x: (9 + 0.5) * this.tileSize,
      y: (9 + 0.5) * this.tileSize,
      direction: { x: 0, y: 0 },
      nextDirection: { x: 0, y: 0 },
      facing: 0
    };
  }

  createGhosts() {
    const homes = [
      { row: 8, col: 9, color: '#ff6b81' },
      { row: 9, col: 8, color: '#74c0fc' },
      { row: 9, col: 10, color: '#fbc531' }
    ];

    return homes.map((home, index) => ({
      x: (home.col + 0.5) * this.tileSize,
      y: (home.row + 0.5) * this.tileSize,
      direction: { x: index === 0 ? 1 : index === 1 ? 0 : -1, y: index === 1 ? 1 : 0 },
      frightened: false,
      color: home.color,
      home
    }));
  }

  countPellets(map) {
    let count = 0;
    map.forEach((row) => {
      row.forEach((tile) => {
        if (tile === 0 || tile === 2) {
          count += 1;
        }
      });
    });
    return count;
  }

  cloneMap(map) {
    return map.map((row) => [...row]);
  }

  isAligned(entity) {
    const tolerance = 0.08;
    const modX = (entity.x / this.tileSize) % 1;
    const modY = (entity.y / this.tileSize) % 1;
    return Math.abs(modX - 0.5) < tolerance && Math.abs(modY - 0.5) < tolerance;
  }

  canMove(entity, direction) {
    if (!direction || (direction.x === 0 && direction.y === 0)) {
      return true;
    }

    const row = Math.floor(entity.y / this.tileSize);
    const col = Math.floor(entity.x / this.tileSize);
    const targetRow = row + direction.y;
    const targetCol = col + direction.x;

    return !this.isWall(targetRow, targetCol);
  }

  isWall(row, col) {
    return this.map[row]?.[col] !== undefined ? this.map[row][col] === 1 : true;
  }

  directionToAngle(direction) {
    if (!direction) {
      return 0;
    }

    if (direction.x === 0 && direction.y === 0) {
      return this.pacman?.facing ?? 0;
    }

    return Math.atan2(direction.y, direction.x);
  }

  updateHud() {
    if (this.scoreElement) {
      this.scoreElement.textContent = this.score.toString().padStart(4, '0');
    }

    if (this.livesElement) {
      this.livesElement.textContent = this.lives.toString();
    }
  }

  updateStatus(message) {
    if (this.statusElement) {
      this.statusElement.textContent = message;
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const pacmanSection = document.getElementById('pacman');
  if (pacmanSection) {
    new PacmanGame(pacmanSection);
  }
});

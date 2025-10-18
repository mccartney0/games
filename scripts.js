class SimCityGame {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.gridSize = 20;
    this.tileSize = canvas.width / this.gridSize;
    this.map = Array.from({ length: this.gridSize }, () => Array(this.gridSize).fill('empty'));

    this.rules = {
      empty: { color: '#151529' },
      road: {
        label: 'Estrada',
        cost: 20,
        maintenance: 0.5,
        color: '#5c6279'
      },
      residential: {
        label: 'Zona residencial',
        cost: 120,
        maintenance: 1,
        demand: 4,
        color: '#2ecc71'
      },
      commercial: {
        label: 'Zona comercial',
        cost: 160,
        maintenance: 1.5,
        demand: 6,
        color: '#3498db'
      },
      industrial: {
        label: 'Zona industrial',
        cost: 200,
        maintenance: 2,
        demand: 8,
        color: '#f1c40f'
      },
      power: {
        label: 'Usina de energia',
        cost: 650,
        maintenance: 6,
        output: 160,
        color: '#e74c3c'
      },
      park: {
        label: 'Parque urbano',
        cost: 80,
        maintenance: 0.3,
        color: '#27ae60'
      }
    };

    this.statsElements = {
      funds: document.getElementById('simcity-funds'),
      population: document.getElementById('simcity-population'),
      jobs: document.getElementById('simcity-jobs'),
      mood: document.getElementById('simcity-mood'),
      power: document.getElementById('simcity-power')
    };

    this.selectedTool = 'road';
    this.funds = 5000;
    this.population = 0;
    this.jobs = 0;
    this.powerBalance = 0;
    this.powerCoverage = 1;
    this.civicMood = 'Esperançoso';
    this.flags = { lowPower: false, lowFunds: false };
    this.cycle = 0;

    this.toolButtons = document.querySelectorAll('.simcity__toolbar [data-tool]');
    this.logContainer = document.getElementById('simcity-log');
    this.messages = [];
    if (this.logContainer) {
      this.logContainer.innerHTML = '';
    }

    this.bindEvents();
    this.draw();
    this.log('Bem-vindo a Arcadia! Construa estradas para iniciar sua cidade.');
    this.updateInterface(true);
  }

  bindEvents() {
    this.canvas.addEventListener('click', (event) => this.onCanvasClick(event));

    this.toolButtons.forEach((button) => {
      button.addEventListener('click', () => {
        this.selectTool(button.dataset.tool);
      });
    });

    this.tickTimer = window.setInterval(() => this.tick(), 4000);
  }

  onCanvasClick(event) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const x = Math.floor((event.clientX - rect.left) * scaleX);
    const y = Math.floor((event.clientY - rect.top) * scaleY);
    const col = Math.floor(x / this.tileSize);
    const row = Math.floor(y / this.tileSize);

    if (row < 0 || row >= this.gridSize || col < 0 || col >= this.gridSize) {
      return;
    }

    this.buildAt(row, col);
  }

  selectTool(tool) {
    this.selectedTool = tool;
    this.toolButtons.forEach((button) => {
      const isActive = button.dataset.tool === tool;
      button.classList.toggle('is-active', isActive);
    });
  }

  buildAt(row, col) {
    const currentType = this.map[row][col];

    if (this.selectedTool === 'bulldoze') {
      if (currentType === 'empty') {
        this.log('Não há nada para remover neste terreno.');
        return;
      }

      const refundBase = this.rules[currentType]?.cost ?? 20;
      const refund = Math.round(refundBase * 0.4);
      this.map[row][col] = 'empty';
      this.funds += refund;
      this.log(`Terreno liberado. Reembolso de ${this.formatCurrency(refund)}.`);
      this.updateInterface();
      return;
    }

    if (currentType !== 'empty') {
      this.log('O terreno já possui uma construção. Use Remover para liberar a área.');
      return;
    }

    const rule = this.rules[this.selectedTool];

    if (!rule) {
      return;
    }

    if (this.funds < rule.cost) {
      this.log('Caixa insuficiente para esta construção. Ajuste o planejamento.');
      return;
    }

    this.funds -= rule.cost;
    this.map[row][col] = this.selectedTool;
    this.log(`${rule.label} adicionada. Investimento de ${this.formatCurrency(rule.cost)}.`);
    this.updateInterface();
  }

  tick() {
    this.cycle += 1;
    const stats = this.calculateStats();
    const revenue = stats.revenue;
    const maintenance = stats.maintenance;

    this.population = stats.population;
    this.jobs = stats.jobs;
    this.powerBalance = stats.powerBalance;
    this.powerCoverage = stats.powerCoverage;
    this.civicMood = this.evaluateMood(stats);

    this.funds = Math.round(this.funds + revenue - maintenance);

    if (this.cycle % 3 === 0) {
      this.log(`Impostos: ${this.formatCurrency(revenue)} | Manutenção: ${this.formatCurrency(maintenance)}.`);
    }

    if (stats.powerBalance < 0 && !this.flags.lowPower) {
      this.log('A rede elétrica está sobrecarregada! Construa uma nova usina.');
      this.flags.lowPower = true;
    } else if (stats.powerBalance >= 0 && this.flags.lowPower) {
      this.log('Energia estabilizada após investimentos na rede.');
      this.flags.lowPower = false;
    }

    if (this.funds < 300 && !this.flags.lowFunds) {
      this.log('O caixa está no limite. Priorize zonas que gerem impostos.');
      this.flags.lowFunds = true;
    } else if (this.funds > 800 && this.flags.lowFunds) {
      this.log('As finanças se recuperaram. Continue expandindo com cuidado.');
      this.flags.lowFunds = false;
    }

    this.updateInterface();
  }

  calculateStats() {
    let roadCount = 0;
    let powerPlants = 0;
    let parks = 0;
    let availablePower = 0;

    const zones = {
      residential: { total: 0, connected: 0 },
      commercial: { total: 0, connected: 0 },
      industrial: { total: 0, connected: 0 }
    };

    for (let row = 0; row < this.gridSize; row += 1) {
      for (let col = 0; col < this.gridSize; col += 1) {
        const tile = this.map[row][col];

        if (tile === 'road') {
          roadCount += 1;
        } else if (tile === 'power') {
          powerPlants += 1;
          availablePower += this.rules.power.output;
        } else if (tile === 'park') {
          parks += 1;
        } else if (zones[tile]) {
          zones[tile].total += 1;
          if (this.hasAdjacentRoad(row, col)) {
            zones[tile].connected += 1;
          }
        }
      }
    }

    const connectedResidential = zones.residential.connected;
    const connectedCommercial = zones.commercial.connected;
    const connectedIndustrial = zones.industrial.connected;

    const powerDemand = connectedResidential * this.rules.residential.demand +
      connectedCommercial * this.rules.commercial.demand +
      connectedIndustrial * this.rules.industrial.demand;

    const powerCoverage = powerDemand > 0 ? Math.min(1, availablePower / powerDemand) : 1;
    const effectiveResidential = Math.round(connectedResidential * powerCoverage);
    const effectiveCommercial = Math.round(connectedCommercial * powerCoverage);
    const effectiveIndustrial = Math.round(connectedIndustrial * powerCoverage);

    const population = Math.round(effectiveResidential * 12);
    const jobs = Math.round(effectiveCommercial * 10 + effectiveIndustrial * 18);

    const revenue = Math.round(population * 2 + effectiveCommercial * 12 + effectiveIndustrial * 15);

    const maintenance = Math.round(
      roadCount * this.rules.road.maintenance +
      powerPlants * this.rules.power.maintenance +
      connectedResidential * this.rules.residential.maintenance +
      connectedCommercial * this.rules.commercial.maintenance +
      connectedIndustrial * this.rules.industrial.maintenance +
      parks * this.rules.park.maintenance
    );

    const powerBalance = Math.round(availablePower - powerDemand);

    return {
      population,
      jobs,
      revenue,
      maintenance,
      powerBalance,
      powerCoverage,
      parks,
      connectedResidential,
      connectedCommercial,
      connectedIndustrial
    };
  }

  hasAdjacentRoad(row, col) {
    const neighbours = [
      [row - 1, col],
      [row + 1, col],
      [row, col - 1],
      [row, col + 1]
    ];

    return neighbours.some(([r, c]) => this.map[r]?.[c] === 'road');
  }

  evaluateMood(stats) {
    let moodScore = 50;

    moodScore += stats.parks * 4;
    moodScore += stats.population > 250 ? 8 : 0;
    moodScore += this.funds > 1500 ? 6 : 0;
    moodScore -= stats.powerBalance < 0 ? 18 : 0;
    moodScore -= this.funds < 200 ? 15 : 0;

    moodScore = Math.max(0, Math.min(100, moodScore));

    if (moodScore >= 75) {
      return 'Eufórico';
    }
    if (moodScore >= 55) {
      return 'Esperançoso';
    }
    if (moodScore >= 35) {
      return 'Apreensivo';
    }
    return 'Em crise';
  }

  updateInterface(initial = false) {
    if (this.statsElements.funds) {
      this.statsElements.funds.textContent = this.formatCurrency(this.funds);
    }

    if (this.statsElements.population) {
      this.statsElements.population.textContent = `${this.population.toLocaleString('pt-BR')} habitantes`;
    }

    if (this.statsElements.jobs) {
      this.statsElements.jobs.textContent = `${this.jobs.toLocaleString('pt-BR')} vagas`;
    }

    if (this.statsElements.mood) {
      this.statsElements.mood.textContent = this.civicMood;
    }

    if (this.statsElements.power) {
      this.statsElements.power.textContent = this.describePower();
    }

    if (!initial) {
      this.draw();
    }
  }

  describePower() {
    if (this.powerBalance >= 0 && this.powerCoverage >= 1) {
      return `Estável (+${this.powerBalance} MW)`;
    }

    if (this.powerBalance >= 0) {
      return `No limite (+${this.powerBalance} MW)`;
    }

    return `Crítico (-${Math.abs(this.powerBalance)} MW)`;
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let row = 0; row < this.gridSize; row += 1) {
      for (let col = 0; col < this.gridSize; col += 1) {
        const tileType = this.map[row][col];
        const rule = this.rules[tileType] ?? this.rules.empty;
        const x = col * this.tileSize;
        const y = row * this.tileSize;

        this.ctx.fillStyle = rule.color || this.rules.empty.color;
        this.ctx.fillRect(x, y, this.tileSize, this.tileSize);

        if (tileType === 'road') {
          this.drawRoad(x, y);
        } else if (tileType === 'power') {
          this.drawPowerPlant(x, y);
        } else if (tileType === 'park') {
          this.drawPark(x, y);
        } else if (tileType === 'residential') {
          this.drawZone(x, y, '#27ae60', '#1abc9c');
        } else if (tileType === 'commercial') {
          this.drawZone(x, y, '#2980b9', '#1f618d');
        } else if (tileType === 'industrial') {
          this.drawZone(x, y, '#d68910', '#b9770e');
        }

        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
        this.ctx.strokeRect(x, y, this.tileSize, this.tileSize);
      }
    }
  }

  drawRoad(x, y) {
    this.ctx.fillStyle = '#3c4154';
    this.ctx.fillRect(x, y + this.tileSize / 2 - 4, this.tileSize, 8);
    this.ctx.fillStyle = '#dcdcff';
    this.ctx.fillRect(x, y + this.tileSize / 2 - 1, this.tileSize, 2);
  }

  drawPowerPlant(x, y) {
    const padding = this.tileSize * 0.15;
    this.ctx.fillStyle = '#c0392b';
    this.ctx.fillRect(x + padding, y + padding, this.tileSize - padding * 2, this.tileSize - padding * 2);
    this.ctx.fillStyle = '#f9e79f';
    this.ctx.fillRect(x + padding * 1.6, y + this.tileSize / 2 - 4, this.tileSize - padding * 3.2, 8);
  }

  drawPark(x, y) {
    const radius = this.tileSize * 0.22;
    this.ctx.fillStyle = '#1e8449';
    this.ctx.beginPath();
    this.ctx.arc(x + this.tileSize / 2, y + this.tileSize / 2, radius, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.fillStyle = '#58d68d';
    this.ctx.beginPath();
    this.ctx.arc(x + this.tileSize / 2.4, y + this.tileSize / 2.8, radius / 1.6, 0, Math.PI * 2);
    this.ctx.fill();
  }

  drawZone(x, y, accent, shadow) {
    const padding = this.tileSize * 0.18;
    this.ctx.fillStyle = accent;
    this.ctx.fillRect(x + padding, y + padding, this.tileSize - padding * 2, this.tileSize - padding * 2);
    this.ctx.fillStyle = shadow;
    this.ctx.fillRect(x + padding, y + padding, this.tileSize - padding * 2, (this.tileSize - padding * 2) * 0.35);
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    this.ctx.fillRect(x + padding, y + padding * 1.4, this.tileSize - padding * 2, 3);
  }

  log(message) {
    if (!this.logContainer) {
      return;
    }

    this.messages.unshift({ id: Date.now() + Math.random(), text: message });
    this.messages = this.messages.slice(0, 5);

    this.logContainer.innerHTML = '';
    this.messages.forEach((entry) => {
      const paragraph = document.createElement('p');
      paragraph.textContent = entry.text;
      this.logContainer.appendChild(paragraph);
    });
  }

  formatCurrency(value) {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2
    });
  }
}

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

function initNewsletterForm() {
  const form = document.querySelector('.signup-form');

  if (!form) {
    return;
  }

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

document.addEventListener('DOMContentLoaded', () => {
  initNewsletterForm();

  const canvas = document.getElementById('simcity-canvas');
  if (canvas) {
    new SimCityGame(canvas);
  }

  const pacmanSection = document.getElementById('pacman');
  if (pacmanSection) {
    new PacmanGame(pacmanSection);
  }
});

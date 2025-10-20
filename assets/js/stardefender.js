(() => {
  const summary = document.querySelector('[data-stardefender-summary]');
  const waveEl = document.querySelector('[data-stardefender-wave]');
  const threatEl = document.querySelector('[data-stardefender-threat]');
  const logEl = document.querySelector('[data-stardefender-log]');
  const startBtn = document.querySelector('[data-stardefender-start]');
  const scanBtn = document.querySelector('[data-stardefender-scan]');
  const loadoutRadios = document.querySelectorAll('input[name="arma"]');
  const supportChecks = document.querySelectorAll('input[type="checkbox"]');

  if (!summary) {
    return;
  }

  function updateSummary() {
    const weaponInput = Array.from(loadoutRadios).find((input) => input.checked);
    const weaponLabel = weaponInput ? weaponInput.closest('label')?.textContent.trim() : 'Arma desconhecida';
    const supports = Array.from(supportChecks)
      .filter((input) => input.checked)
      .map((input) => input.closest('label')?.textContent.trim() || '')
      .filter(Boolean);

    const supportText = supports.length ? supports.join(', ') : 'Sem suporte adicional selecionado';
    summary.textContent = `${weaponLabel} equipado. ${supportText}.`;
  }

  loadoutRadios.forEach((radio) => {
    radio.addEventListener('change', updateSummary);
  });

  supportChecks.forEach((checkbox) => {
    checkbox.addEventListener('change', updateSummary);
  });

  let wave = 0;
  let running = false;

  function runSimulation() {
    if (running) {
      return;
    }
    running = true;
    wave = 0;
    logEl.textContent = 'Ondas hostis detectadas. Prepare-se para ajustar a estratégia.';

    const interval = setInterval(() => {
      wave += 1;
      const threat = Math.min(100, Math.floor(Math.random() * 40) + wave * 10);
      waveEl.textContent = wave.toString();
      threatEl.textContent = `${threat}%`;

      if (threat >= 90) {
        logEl.textContent = 'Ameaça crítica! Direcione energia para a matriz de escudos.';
        clearInterval(interval);
        running = false;
      } else if (wave >= 5) {
        logEl.textContent = 'Simulação concluída. Pontos fracos identificados com sucesso.';
        clearInterval(interval);
        running = false;
      } else {
        logEl.textContent = `Onda ${wave} neutralizada. Redirecione esquadrões para flancos vulneráveis.`;
      }
    }, 1500);
  }

  function runScan() {
    scanBtn.disabled = true;
    scanBtn.textContent = 'Varredura em andamento...';
    logEl.textContent = 'Sensores analisando rotas hiperluminais dos drones inimigos.';

    setTimeout(() => {
      logEl.textContent = 'Assinaturas detectadas nos quadrantes 3 e 5. Envie interceptadores imediatamente!';
      scanBtn.disabled = false;
      scanBtn.textContent = 'Ativar varredura';
    }, 2200);
  }

  startBtn?.addEventListener('click', runSimulation);
  scanBtn?.addEventListener('click', runScan);

  updateSummary();
})();

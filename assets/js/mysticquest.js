(() => {
  const relicButtons = document.querySelectorAll('[data-relic]');
  const relicResult = document.querySelector('[data-relic-result]');
  const crystalStatus = document.querySelector('[data-crystal-status]');
  const crystalRanges = document.querySelectorAll('[data-crystal]');
  const chronicleLog = document.querySelector('[data-chronicle-log]');
  const chronicleAdvance = document.querySelector('[data-chronicle-advance]');

  if (!relicButtons.length) {
    return;
  }

  const combinations = {
    'sol-luna': 'Esfera Solar e Coroa Lunar alinham eclipses sagrados, concedendo visão noturna total.',
    'sol-terra': 'O Totem Telúrico amplifica o calor solar, criando muralhas de obsidiana.',
    'sol-vento': 'Arco Zephyr canaliza ventos abrasadores que limpam neblinas místicas.',
    'luna-terra': 'Luz lunar estabiliza o Totem Telúrico, revelando passagens subterrâneas ocultas.',
    'luna-vento': 'A sinergia lunar-vento cria rajadas silenciosas perfeitas para infiltração.',
    'terra-vento': 'Terra e Ar unem forças em projéteis de cristalina precisão.',
  };

  let firstSelection = null;

  function normalizePair(first, second) {
    return [first, second].sort().join('-');
  }

  function handleRelicClick(event) {
    const button = event.currentTarget;
    const relic = button.getAttribute('data-relic');

    if (!firstSelection) {
      firstSelection = relic;
      relicButtons.forEach((btn) => btn.classList.toggle('is-active', btn === button));
      relicResult.textContent = 'Escolha uma segunda relíquia para completar o ritual.';
      return;
    }

    const pairKey = normalizePair(firstSelection, relic);
    const phrase = combinations[pairKey] || 'Ressonância instável. Ajuste as relíquias escolhidas.';
    relicResult.textContent = phrase;
    relicButtons.forEach((btn) => btn.classList.remove('is-active'));
    firstSelection = null;
  }

  relicButtons.forEach((button) => {
    button.addEventListener('click', handleRelicClick);
  });

  function updateCrystalStatus() {
    const total = Array.from(crystalRanges).reduce((sum, input) => sum + Number(input.value), 0);
    const balanced = total === 100;

    if (balanced) {
      crystalStatus.textContent = 'Portal estabilizado! Energia distribuída com precisão de mestre arcano.';
    } else {
      crystalStatus.textContent = `Energia acumulada em ${total}%. Ajuste para atingir 100%.`;
    }
  }

  crystalRanges.forEach((input) => {
    input.addEventListener('input', updateCrystalStatus);
  });

  const chronicles = [
    'O oráculo vislumbra constelações alinhando-se sobre as ruínas do Vale Sereno.',
    'Uma voz ecoa nas cavernas etéreas, anunciando guardiões despertando.',
    'Um portal cintila entre colunas antigas, aguardando a chave elemental correta.',
  ];

  let chronicleIndex = 0;

  function advanceChronicle() {
    chronicleIndex = (chronicleIndex + 1) % chronicles.length;
    chronicleLog.textContent = chronicles[chronicleIndex];
  }

  chronicleAdvance?.addEventListener('click', advanceChronicle);

  updateCrystalStatus();
})();

(() => {
  const summaryEl = document.querySelector('[data-garage-summary]');
  const garageForm = document.querySelector('.neonriders-garage');
  const trackList = document.querySelector('[data-track-list]');
  const trackDetails = document.querySelector('[data-track-details]');
  const podiumEl = document.querySelector('[data-ranking-podium]');
  const refreshBtn = document.querySelector('[data-ranking-refresh]');

  if (!garageForm) {
    return;
  }

  const trackDescriptions = {
    aurora: 'No Circuito Aurora você encara túneis translúcidos, neblina colorida e trechos com gravidade reduzida.',
    mirage: 'A Pista Mirage traz miragens holográficas, tempestades de luz e saltos com portais temporais.',
    zenith: 'O Anel Zenith orbita arranha-céus com tráfego aéreo dinâmico e curvas antigravitacionais.',
  };

  function updateSummary() {
    const energy = new FormData(garageForm).get('energia');
    const energyLabel = {
      equilibrado: 'Equilíbrio urbano',
      velocidade: 'Nitro espectral',
      manobra: 'Estabilidade gravitacional',
    }[energy] || 'Configuração desconhecida';

    const extras = Array.from(garageForm.querySelectorAll('input[type="checkbox"]:checked'))
      .map((input) => input.closest('label')?.textContent.trim())
      .filter(Boolean);

    const extrasText = extras.length ? `Extras: ${extras.join(', ')}.` : 'Sem extras visuais selecionados.';
    summaryEl.textContent = `${energyLabel} ativado. ${extrasText}`;
  }

  garageForm.addEventListener('change', updateSummary);

  function handleTrackChange(event) {
    const button = event.target.closest('[data-track]');
    if (!button) {
      return;
    }

    const track = button.getAttribute('data-track');
    trackList.querySelectorAll('[data-track]').forEach((btn) => btn.classList.toggle('is-active', btn === button));
    trackDetails.textContent = trackDescriptions[track] || 'Detalhes indisponíveis para este circuito.';
  }

  trackList?.addEventListener('click', handleTrackChange);

  function generatePodium() {
    const pilots = ['Luma Nova', 'Rex Voltar', 'Ivy Prisma', 'Kai Holo', 'Vega Flux'];
    const pilot = pilots[Math.floor(Math.random() * pilots.length)];
    const minutes = 1;
    const seconds = (Math.random() * 59 + 1).toFixed(0).padStart(2, '0');
    const milliseconds = (Math.random() * 99).toFixed(0).padStart(2, '0');
    podiumEl.textContent = `1º ${pilot} — 0${minutes}:${seconds}.${milliseconds}`;
  }

  refreshBtn?.addEventListener('click', generatePodium);

  updateSummary();
})();

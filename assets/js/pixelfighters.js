(() => {
  const moveButtons = document.querySelectorAll('[data-move]');
  const comboStatus = document.querySelector('[data-combo-status]');
  const trainingStatus = document.querySelector('[data-training-status]');
  const trainingRanges = document.querySelectorAll('[data-training]');

  if (!moveButtons.length) {
    return;
  }

  const moveNames = {
    socop: 'Soco pesado',
    chutep: 'Chute primário',
    upper: 'Uppercut fóton',
    dash: 'Dash espectral',
    ulti: 'Golpe supremo',
  };

  const combo = [];

  function toggleMove(event) {
    const button = event.currentTarget;
    const move = button.getAttribute('data-move');
    const index = combo.indexOf(move);

    if (index > -1) {
      combo.splice(index, 1);
      button.classList.remove('is-selected');
    } else {
      if (combo.length >= 4) {
        combo.shift();
        moveButtons.forEach((btn) => {
          if (!combo.includes(btn.getAttribute('data-move'))) {
            btn.classList.remove('is-selected');
          }
        });
      }
      combo.push(move);
      button.classList.add('is-selected');
    }

    const comboNames = combo.map((key) => moveNames[key]);
    comboStatus.textContent = comboNames.length
      ? `Combo atual: ${comboNames.join(' > ')}.`
      : 'Selecione até quatro golpes para criar um combo exclusivo.';
  }

  moveButtons.forEach((button) => {
    button.addEventListener('click', toggleMove);
  });

  function updateTrainingStatus() {
    const intensidade = Number(document.querySelector('[data-training="intensidade"]').value);
    const ritmo = Number(document.querySelector('[data-training="ritmo"]').value);
    const media = Math.round((intensidade + ritmo) / 2);

    if (media > 75) {
      trainingStatus.textContent = 'Medidor especial quase completo! Prepare-se para o Golpe supremo.';
    } else if (media < 35) {
      trainingStatus.textContent = 'Ritmo baixo. Aumente a cadência para evoluir seus reflexos.';
    } else {
      trainingStatus.textContent = 'Intensidade equilibrada. Continue treinando para evoluir.';
    }
  }

  trainingRanges.forEach((input) => {
    input.addEventListener('input', updateTrainingStatus);
  });

  updateTrainingStatus();
})();

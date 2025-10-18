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
});

window.registerPortfolioPage('contact', () => {
  const scope = new AbortController();
  const form = document.getElementById('contact-form');
  const email = document.getElementById('sender-email');
  const message = document.getElementById('contact-message');
  const note = document.getElementById('contact-form-note');

  message.addEventListener('input', () => message.setCustomValidity(''), { signal: scope.signal });
  form.addEventListener(
    'submit',
    (event) => {
      event.preventDefault();
      message.setCustomValidity(message.value.trim() ? '' : 'Please write a message.');
      if (!form.reportValidity()) return;
      const sender = email.value.trim();
      const subject = encodeURIComponent(`Portfolio message from ${sender}`);
      const body = encodeURIComponent(`From: ${sender}\n\n${message.value.trim()}`);
      window.location.href = `mailto:em.be.alawi@gmail.com?subject=${subject}&body=${body}`;
      note.textContent = 'Continue in your email app to send the message.';
    },
    { signal: scope.signal }
  );

  document.addEventListener(
    'keydown',
    (event) => {
      if (event.key !== 'Escape' || event.repeat || event.altKey || event.ctrlKey || event.metaKey)
        return;
      event.preventDefault();
      window.navigateWithBackSfx('index.html');
    },
    { signal: scope.signal }
  );
  return () => scope.abort();
});

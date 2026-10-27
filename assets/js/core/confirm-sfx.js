(() => {
  const MENU_CONFIRM_DURATION_MS = 580;
  const REDUCED_CONFIRM_DURATION_MS = 120;
  const sounds = {
    confirm: document.querySelector('#confirm-sfx'),
    back: document.querySelector('#back-sfx'),
  };
  let navigating = false;
  let confirming = false;
  let menuAnimation = null;

  function play(type) {
    const audio = sounds[type];
    if (!audio) return;
    try {
      document.querySelector('#menu-sfx')?.pause();
      Object.values(sounds).forEach((sound) => sound?.pause());
      audio.pause();
      audio.currentTime = 0;
      audio.volume = 0.72;
      audio.play()?.catch(() => {});
    } catch {
      /* Audio availability does not block the menu. */
    }
  }

  window.playConfirmSfx = () => play('confirm');
  window.playBackSfx = () => play('back');

  async function navigate(url, type, confirmationStartedAt) {
    if (navigating) return;
    navigating = true;
    if (!confirmationStartedAt) play(type);
    try {
      await window.navigatePortfolio(url);
    } finally {
      navigating = false;
    }
  }
  window.navigateWithConfirmSfx = (url, startedAt) => navigate(url, 'confirm', startedAt);
  window.navigateWithBackSfx = (url) => navigate(url, 'back');

  window.confirmMenu = async (label, complete) => {
    if (confirming || navigating) return;
    confirming = true;
    document.body.classList.add('is-confirming-menu');
    const startedAt = Date.now();
    play('confirm');
    try {
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (label?.animate) {
        menuAnimation = label.animate(
          [
            { transform: 'scale(1)', opacity: 1, offset: 0 },
            { transform: reduced ? 'scale(1)' : 'scale(1.18)', opacity: 0.85, offset: 0.3 },
            { transform: reduced ? 'scale(1)' : 'scale(1.7)', opacity: 0, offset: 1 },
          ],
          {
            duration: reduced ? REDUCED_CONFIRM_DURATION_MS : MENU_CONFIRM_DURATION_MS,
            easing: 'cubic-bezier(.2, .65, .3, 1)',
            fill: 'forwards',
          }
        );
        await menuAnimation.finished;
      }
      await complete(startedAt);
    } catch {
      /* A cancelled animation must not open another menu. */
    } finally {
      if (!navigating) {
        menuAnimation?.cancel();
        menuAnimation = null;
        confirming = false;
        document.body.classList.remove('is-confirming-menu');
      }
    }
  };

  window.addEventListener('pageshow', () => {
    navigating = false;
    confirming = false;
    menuAnimation?.cancel();
    menuAnimation = null;
    document.body.classList.remove('is-confirming-menu');
  });
})();

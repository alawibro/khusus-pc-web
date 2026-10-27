window.registerPortfolioPage('menu', () => {
  const scope = new AbortController();
  const on = (target, type, handler) =>
    target.addEventListener(type, handler, { signal: scope.signal });
  const captions = {
    projects: 'Explore personal works, applications, and featured projects.',
    skills: 'View capabilities, technical tools, and skill proficiencies.',
    about: 'Discover the person behind the projects and interfaces.',
    contact: 'Get in touch via email, social channels, or direct message.',
  };
  const menuItems = [...document.querySelectorAll('.menu-item')];
  const caption = document.querySelector('#menu-caption-text');
  const menuSfx = document.querySelector('#menu-sfx');
  let activeMenu = window.portfolioMenuSelection || 'projects';
  let captionTimer;

  function selectMenu(id) {
    if (document.body.classList.contains('is-confirming-menu') || !captions[id]) return;
    activeMenu = id;
    window.portfolioMenuSelection = id;
    menuItems.forEach((item) => {
      const active = item.dataset.menu === id;
      item.classList.toggle('is-active', active);
      if (active) item.setAttribute('aria-current', 'true');
      else item.removeAttribute('aria-current');
    });
    clearTimeout(captionTimer);
    if (caption.textContent === captions[id]) {
      caption.classList.remove('is-changing');
      return;
    }
    caption.classList.add('is-changing');
    captionTimer = setTimeout(() => {
      caption.textContent = captions[id];
      caption.classList.remove('is-changing');
    }, 120);
  }

  function enterSelectedMenu() {
    const item = menuItems.find((item) => item.dataset.menu === activeMenu);
    window.confirmMenu(item?.querySelector('.menu-item__label'), (startedAt) =>
      window.navigateWithConfirmSfx(`${activeMenu}.html`, startedAt)
    );
  }

  menuItems.forEach((item) => {
    on(item, 'pointerenter', () => selectMenu(item.dataset.menu));
    on(item, 'focus', () => selectMenu(item.dataset.menu));
    on(item, 'click', () => {
      if (document.body.classList.contains('is-confirming-menu')) return;
      selectMenu(item.dataset.menu);
      enterSelectedMenu();
    });
  });

  on(document, 'keydown', (event) => {
    if (document.body.classList.contains('is-confirming-menu')) {
      if (
        ['Enter', ' ', 'ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'Tab', 'Escape'].includes(
          event.key
        )
      )
        event.preventDefault();
      return;
    }
    if (
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.target.closest("a, input, select, textarea, [contenteditable='true']")
    )
      return;
    if (event.key === 'Enter') {
      event.preventDefault();
      if (!event.repeat) enterSelectedMenu();
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const currentIndex = menuItems.findIndex((item) => item.dataset.menu === activeMenu);
      const direction = event.key === 'ArrowDown' ? 1 : -1;
      const next = menuItems[(currentIndex + direction + menuItems.length) % menuItems.length];
      try {
        menuSfx.currentTime = 0;
        menuSfx.volume = 0.48;
        menuSfx.play()?.catch(() => {});
      } catch {
        /* Audio does not block navigation. */
      }
      selectMenu(next.dataset.menu);
      next.focus();
    }
  });

  selectMenu(activeMenu);
  return () => {
    scope.abort();
    clearTimeout(captionTimer);
  };
});

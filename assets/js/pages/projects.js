window.registerPortfolioPage('projects', () => {
  const scope = new AbortController();
  const on = (target, type, handler) =>
    target.addEventListener(type, handler, { signal: scope.signal });
  const stopWallpaper = window.mountPortfolioWallpaper(
    document.querySelector('.projects-screen'),
    scope.signal,
    'projects'
  );

  /**
   * Project catalogue for the Projects menu. The menu is rendered from this list,
   * so adding, removing or reordering entries here is the only change needed.
   *
   * @typedef {Object} PortfolioProject
   * @property {string} id           Stable slug, unique within the list.
   * @property {string} title        Name shown in the menu.
   * @property {string} category     Short label, exposed as data-category for styling.
   * @property {string} description  Caption shown under the menu when the item is selected.
   * @property {string} url          Live demo link. Must be an https:// URL.
   */
  /** @type {PortfolioProject[]} */
  const PROJECTS = [
    {
      id: 'coba-hp-web',
      title: 'Coba HP Web',
      category: 'Halaman Pribadi',
      description:
        'Halaman biodata pribadi dengan menu bagian, kartu profil, generator fakta acak, dan easter egg tersembunyi.',
      url: 'https://alawibro.github.io/coba-hp-web/',
    },
    {
      id: 'hp-web-coba',
      title: 'HP Web Coba',
      category: 'Portofolio Antarmuka Game',
      description:
        'Portofolio yang meniru menu pause Persona 3 Reload, lengkap dengan layar loading dan navigasi bergaya game.',
      url: 'https://alawibro.github.io/hp-web-coba/',
    },
    {
      id: 'hp-my-kisah',
      title: 'HP My Kisah',
      category: 'Pengalaman Interaktif',
      description:
        'Halaman pembuka ke pengalaman audio-visual, di mana suara dan video mulai aktif setelah pengunjung masuk.',
      url: 'https://alawibro.github.io/hp-mykisah-wkwkwk/',
    },
    {
      id: 'khusus-web-pc-laptop',
      title: 'Khusus Web PC Laptop',
      category: 'Portofolio',
      description:
        'Portofolio pribadi lengkap dengan menu bagian, bio, daftar repository GitHub, tautan sosial, dan form kontak.',
      url: 'https://alawibro.github.io/khusus-web-pc-laptop/',
    },
  ];

  const isValidProject = (project) => {
    if (!project || typeof project !== 'object') return false;
    const fields = [project.id, project.title, project.category, project.description, project.url];
    if (!fields.every((value) => typeof value === 'string' && value.trim())) return false;
    try {
      return new URL(project.url).protocol === 'https:';
    } catch {
      return false;
    }
  };

  const projects = PROJECTS.filter((project) => {
    const valid = isValidProject(project);
    if (!valid) console.warn('Projects: skipped invalid entry', project);
    return valid;
  });

  const list = document.querySelector('#project-list');
  const template = document.querySelector('#project-item-template');
  const spark = document.querySelector('.project-menu-spark');
  const caption = document.querySelector('#project-caption');
  const captionCategory = caption.querySelector('.project-category');
  const captionDescription = caption.querySelector('.project-description');
  const sfx = document.querySelector('#menu-sfx');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  // Guard: with no valid entries there is nothing to select, so only show an empty state.
  if (projects.length === 0) {
    caption.textContent = 'Belum ada proyek untuk ditampilkan.';
    return () => {
      scope.abort();
      stopWallpaper();
    };
  }

  let captionAnimation = null;
  let selected = 0;

  const buttons = projects.map((project, index) => {
    const item = template.content.cloneNode(true);
    const li = item.querySelector('li');
    const button = item.querySelector('button');
    li.style.setProperty('--project-index', index);
    button.dataset.project = index;
    button.dataset.category = project.category;
    button.querySelector('.project-item-title').textContent = project.title;
    list.append(item);
    return button;
  });

  function sound(volume = 0.42) {
    try {
      sfx.currentTime = 0;
      sfx.volume = volume;
      sfx.play().catch(() => {});
    } catch {
      /* Audio availability does not block navigation. */
    }
  }

  function updateSpark() {
    const button = buttons[selected];
    const buttonRect = button.getBoundingClientRect();
    const listRect = list.getBoundingClientRect();
    const menuRect = list.parentElement.getBoundingClientRect();
    // Keep the halo outside the list's clipping/scrolling box.
    spark.style.top = `${buttonRect.top - menuRect.top - 13}px`;
    spark.classList.toggle(
      'is-visible',
      buttonRect.bottom > listRect.top && buttonRect.top < listRect.bottom
    );
  }

  function select(index, withSound = false) {
    const changed = selected !== index;
    selected = index;
    buttons.forEach((button, i) => {
      button.classList.toggle('is-active', i === selected);
      if (i === selected) button.setAttribute('aria-current', 'true');
      else button.removeAttribute('aria-current');
    });
    updateSpark();
    captionCategory.textContent = projects[selected].category;
    captionDescription.textContent = projects[selected].description;
    if (changed) {
      captionAnimation?.cancel();
      if (!reducedMotion.matches) {
        captionAnimation = caption.animate(
          [
            { opacity: 0, transform: 'translateY(3px)' },
            { opacity: 1, transform: 'translateY(0)' },
          ],
          { duration: 220, easing: 'ease-out' }
        );
      }
    }
    if (changed && withSound) sound();
  }

  function openProject(withConfirm = false) {
    const project = projects[selected];
    if (withConfirm) window.playConfirmSfx();
    else sound(0.65);
    window.open(project.url, '_blank', 'noopener,noreferrer');
  }

  buttons.forEach((button, index) => {
    on(button, 'pointerenter', (event) => {
      if (event.pointerType !== 'touch') select(index);
    });
    on(button, 'focus', () => select(index));
    on(button, 'click', () => {
      select(index);
      openProject();
    });
  });

  on(document.querySelector('.return-link'), 'click', (event) => {
    if (event.button !== 0 || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey)
      return;
    event.preventDefault();
    window.navigateWithBackSfx('index.html');
  });

  on(document, 'keydown', (event) => {
    if (
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.target.closest("input, select, textarea, [contenteditable='true']")
    )
      return;
    if (['ArrowDown', 'ArrowUp', 'ArrowRight', 'ArrowLeft'].includes(event.key)) {
      event.preventDefault();
      const delta = ['ArrowDown', 'ArrowRight'].includes(event.key) ? 1 : -1;
      select((selected + delta + projects.length) % projects.length, true);
      buttons[selected].scrollIntoView({
        block: 'nearest',
        behavior: reducedMotion.matches ? 'instant' : 'smooth',
      });
      buttons[selected].focus({ preventScroll: true });
    } else if (event.key === 'Enter' && !event.target.closest('a')) {
      event.preventDefault();
      if (!event.repeat) openProject(true);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      if (!event.repeat) window.navigateWithBackSfx('index.html');
    }
  });

  on(list, 'scroll', updateSpark);
  on(window, 'resize', updateSpark);
  select(selected);

  return () => {
    scope.abort();
    stopWallpaper();
    captionAnimation?.cancel();
  };
});

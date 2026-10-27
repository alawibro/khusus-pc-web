(() => {
  const PAGE_EXIT_DURATION_MS = 170;
  // fetch() and module imports are blocked for file:// pages, so the in-place
  // page swap only runs when the site is served over http(s). Locally, pages
  // change with a regular browser navigation after the exit fade.
  const SUPPORTS_PAGE_SWAP = location.protocol !== 'file:';
  const pages = new Map();
  const cache = new Map();
  const scripts = new Map();
  let cleanup = null;
  let moving = false;

  function pageName(path) {
    const filename = path.split('/').pop();
    const names = {
      'projects.html': 'projects',
      'skills.html': 'skills',
      'about.html': 'about',
      'contact.html': 'contact',
    };
    return names[filename] || 'menu';
  }

  // Paths are relative to the document, which is where the site's HTML pages live.
  const controllers = {
    menu: { file: 'assets/js/pages/menu.js', dependencies: [] },
    projects: {
      file: 'assets/js/pages/projects.js',
      dependencies: ['assets/js/effects/wallpaper.js'],
    },
    skills: {
      file: 'assets/js/pages/skills.js',
      dependencies: ['assets/js/effects/wallpaper.js', 'assets/data/skills.js'],
    },
    about: { file: 'assets/js/pages/about.js', dependencies: [] },
    contact: { file: 'assets/js/pages/contact.js', dependencies: [] },
  };

  // Classic <script> tags load on file:// where ES module imports do not.
  function loadScript(src) {
    if (!scripts.has(src)) {
      scripts.set(
        src,
        new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = src;
          script.onload = resolve;
          script.onerror = () => {
            scripts.delete(src);
            script.remove();
            reject(new Error(`Script unavailable: ${src}`));
          };
          document.head.append(script);
        })
      );
    }
    return scripts.get(src);
  }

  async function loadController(name) {
    if (!pages.has(name)) {
      const controller = controllers[name];
      await Promise.all(controller.dependencies.map(loadScript));
      await loadScript(controller.file);
    }
    return pages.get(name);
  }

  // Audio lives outside the replaceable content so page changes do not cut SFX.
  const audioBank = document.createElement('div');
  audioBank.id = 'audio-bank';
  document.querySelectorAll('audio').forEach((audio) => audioBank.append(audio));
  const content = document.createElement('div');
  content.id = 'page-content';
  [...document.body.childNodes]
    .filter((node) => node.nodeName !== 'SCRIPT')
    .forEach((node) => content.append(node));
  document.body.append(content, audioBank);
  history.replaceState({ portfolio: true }, '', location.href);

  window.registerPortfolioPage = (name, mount) => {
    pages.set(name, mount);
    if (name === pageName(location.pathname) && !cleanup) cleanup = mount();
  };

  async function load(url) {
    const key = url.pathname;
    if (!cache.has(key)) {
      const request = fetch(url.href)
        .then(async (response) => {
          if (!response.ok) throw new Error('Page unavailable');
          return response.text();
        })
        .catch((error) => {
          cache.delete(key);
          throw error;
        });
      cache.set(key, request);
    }
    return cache.get(key);
  }

  function startExitFade(currentScreen) {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!currentScreen || currentScreen.classList.contains('title-screen')) return null;
    return currentScreen.animate(
      [{ opacity: getComputedStyle(currentScreen).opacity }, { opacity: 0 }],
      { duration: reduced ? 0 : PAGE_EXIT_DURATION_MS, easing: 'ease-in', fill: 'forwards' }
    );
  }

  async function navigate(url, replaceHistory = false) {
    if (moving) return;
    moving = true;
    const destination = new URL(url, location.href);
    const currentScreen = content.querySelector('main');
    const exitAnimation = startExitFade(currentScreen);
    const exited = exitAnimation?.finished.catch(() => {});

    if (!SUPPORTS_PAGE_SWAP) {
      // Keep the faded frame on screen until the browser replaces the document.
      await exited;
      window.location.href = destination.href;
      return;
    }

    try {
      // Prepare the next page while the current one fades out.
      const doc = new DOMParser().parseFromString(await load(destination), 'text/html');
      const mount = await loadController(pageName(destination.pathname));
      if (!mount) throw new Error('Page controller unavailable');
      const sheet = document.createElement('link');
      sheet.rel = 'stylesheet';
      sheet.dataset.pageStyle = '';
      sheet.media = 'not all';
      sheet.href = new URL(
        doc.querySelector('[data-page-style]').getAttribute('href'),
        destination
      ).href;
      await new Promise((resolve, reject) => {
        sheet.onload = resolve;
        sheet.onerror = () => {
          sheet.remove();
          reject(new Error('Styles unavailable'));
        };
        document.head.append(sheet);
      });
      const fragment = document.createDocumentFragment();
      const body = doc.body.cloneNode(true);
      body.querySelectorAll('audio, script').forEach((node) => node.remove());
      [...body.childNodes].forEach((node) => fragment.append(document.importNode(node, true)));
      await exited;
      // Stop the old page's listeners and animation before mounting its replacement.
      cleanup?.();
      document.querySelectorAll('[data-page-style]').forEach((old) => {
        if (old !== sheet) old.remove();
      });
      sheet.media = 'all';
      content.replaceChildren(fragment);
      document.body.classList.remove('is-confirming-menu');
      document.title = doc.title;
      document.querySelector('meta[name="theme-color"]').content = doc.querySelector(
        'meta[name="theme-color"]'
      ).content;
      if (!replaceHistory) history.pushState({ portfolio: true }, '', destination.href);
      cleanup = mount();
      const focus =
        content.querySelector('[aria-current="true"], [role="tab"][aria-selected="true"]') ||
        content.querySelector('main');
      if (focus) {
        if (focus.tagName === 'MAIN') focus.tabIndex = -1;
        focus.focus({ preventScroll: true });
      }
    } catch {
      // A real page remains available if soft navigation cannot load it.
      window.location.href = destination.href;
    } finally {
      exitAnimation?.cancel();
      moving = false;
    }
  }
  window.navigatePortfolio = navigate;
  // Load only the current screen; audio nodes persist across page transitions.
  loadController(pageName(location.pathname)).catch((error) =>
    console.error('Page controller unavailable.', error)
  );
  window.addEventListener('popstate', () => {
    window.playBackSfx?.();
    navigate(location.href, true);
  });
  // A page restored from the back/forward cache keeps old JS state; reset the lock.
  window.addEventListener('pageshow', () => {
    moving = false;
  });
  // Warm the small HTML documents while the title screen is idle.
  if (SUPPORTS_PAGE_SWAP) {
    window.addEventListener(
      'load',
      () => {
        ['index.html', 'projects.html', 'skills.html', 'about.html', 'contact.html'].forEach(
          (path) => load(new URL(path, location.href)).catch(() => {})
        );
      },
      { once: true }
    );
  }
})();

window.registerPortfolioPage('about', () => {
  const scope = new AbortController();
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

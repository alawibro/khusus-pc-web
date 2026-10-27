window.registerPortfolioPage('skills', () => {
  const scope = new AbortController();
  const on = (target, type, handler) =>
    target.addEventListener(type, handler, { signal: scope.signal });
  const stopWallpaper = window.mountPortfolioWallpaper(
    document.querySelector('.skills-screen'),
    scope.signal
  );
  const groups = window.SKILLS_DATA;
  const labels = ['FRONTEND', 'BACKEND', 'AI & ML', 'LANGUAGES'];
  const tabs = document.querySelector('.skills-tabs');
  const rows = document.querySelector('.skills-rows');
  const panel = document.querySelector('#skills-panel');
  let selected = Math.max(
    0,
    groups.findIndex((group) => group.id === window.portfolioSkillCategory)
  );
  let rendered = false;
  const buttons = groups.map((group, index) => {
    const button = document.createElement('button');
    button.className = 'skill-tab';
    button.style.setProperty('--skill-index', index);
    button.type = 'button';
    button.role = 'tab';
    button.id = `skill-tab-${group.id}`;
    button.setAttribute('aria-controls', 'skills-panel');
    button.innerHTML =
      '<span class="skill-tab-label"></span><svg class="skill-tab-crown" viewBox="0 0 40 34" aria-hidden="true"><path d="M4 5 13 16 20 2 27 16 36 5 31 29Q20 33 9 29Z" fill="currentColor" /></svg><span class="skill-tab-spark" aria-hidden="true"></span>';
    button.querySelector('.skill-tab-label').textContent = labels[index];
    tabs.append(button);
    on(button, 'pointerenter', (event) => {
      if (event.pointerType !== 'touch') select(index);
    });
    on(button, 'focus', () => select(index));
    on(button, 'click', () => select(index, true));
    return button;
  });
  function select(index, withSound = false) {
    const changed = selected !== index;
    if (!changed && rendered) return;
    rows.style.setProperty('--skills-enter-delay', rendered ? '0ms' : '300ms');
    selected = index;
    rendered = true;
    const group = groups[selected];
    window.portfolioSkillCategory = group.id;
    buttons.forEach((button, i) => {
      button.setAttribute('aria-selected', String(i === selected));
      button.tabIndex = i === selected ? 0 : -1;
    });
    document.querySelector('#skill-category-heading').textContent = group.title;
    panel.setAttribute('aria-labelledby', buttons[selected].id);
    rows.replaceChildren();
    group.skills.forEach((skill, index) => {
      const row = document.createElement('div');
      row.className = 'skill-row';
      row.style.setProperty('--row-index', index);
      row.style.setProperty('--skill-level', `${skill.level}%`);
      const inner = document.createElement('div');
      inner.className = 'skill-row-inner';
      const name = document.createElement('span');
      name.className = 'skill-name';
      name.id = `skill-name-${group.id}-${index}`;
      name.textContent = skill.name;
      const track = document.createElement('div');
      track.className = 'skill-track';
      track.role = 'progressbar';
      track.setAttribute('aria-labelledby', name.id);
      track.setAttribute('aria-valuemin', '0');
      track.setAttribute('aria-valuemax', '100');
      track.setAttribute('aria-valuenow', skill.level);
      const fill = document.createElement('span');
      fill.className = 'skill-fill';
      track.append(fill);
      const value = document.createElement('span');
      value.className = 'skill-value';
      value.textContent = `${skill.level}%`;
      inner.append(name, track, value);
      row.append(inner);
      rows.append(row);
    });
    panel.scrollTop = 0;
    if (withSound && changed) {
      const sound = document.querySelector('#menu-sfx');
      sound.currentTime = 0;
      sound.volume = 0.42;
      sound.play()?.catch(() => {});
    }
  }
  function move(delta) {
    select((selected + delta + groups.length) % groups.length, true);
    buttons[selected].focus({ preventScroll: true });
  }
  const back = () => window.navigateWithBackSfx('index.html');
  on(document.querySelector('.skills-back'), 'click', (event) => {
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey)
      return;
    event.preventDefault();
    back();
  });
  on(document, 'keydown', (event) => {
    if (
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.target.closest('input, textarea, select, [contenteditable="true"]')
    )
      return;
    if (event.key === 'Escape') {
      event.preventDefault();
      if (!event.repeat) back();
    } else if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
      event.preventDefault();
      move(['ArrowRight', 'ArrowDown'].includes(event.key) ? 1 : -1);
    } else if (event.target.closest('[role="tab"]') && ['Home', 'End'].includes(event.key)) {
      event.preventDefault();
      select(event.key === 'Home' ? 0 : groups.length - 1, true);
      buttons[selected].focus();
    }
  });
  select(selected);
  return () => {
    scope.abort();
    stopWallpaper();
  };
});

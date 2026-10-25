(() => {
  const year = new Date().getFullYear();
  document.querySelectorAll('[data-year]').forEach((node) => {
    node.textContent = String(year);
  });

  const menus = [...document.querySelectorAll('.language-menu')];
  document.addEventListener('click', (event) => {
    menus.forEach((menu) => {
      if (!menu.contains(event.target)) menu.open = false;
    });
  });
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    menus.forEach((menu) => {
      if (!menu.open) return;
      const focusWasInside = menu.contains(document.activeElement);
      menu.open = false;
      if (focusWasInside) menu.querySelector('summary')?.focus();
    });
  });
})();

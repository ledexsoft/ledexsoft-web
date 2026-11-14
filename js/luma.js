'use strict';
(() => {
  const scenes = {
    reunion: { meta: 'HOY · 10:30 · 18 MIN', title: 'Las ideas ya tienen rumbo.', summary: 'El equipo acordó simplificar la primera versión y centrarse en una experiencia de bienvenida más clara.', points: ['Priorizar tres funciones principales.', 'Revisar el diseño antes del viernes.', 'Probar la propuesta con un grupo pequeño.'], tasks: ['Preparar una propuesta de bienvenida.', 'Compartir el diseño con el equipo.', 'Organizar la próxima sesión de pruebas.'] },
    idea: { meta: 'HOY · 17:15 · 2 MIN', title: 'Una caminata. Una nueva idea.', summary: 'Una nota de voz para no perder una idea: conectar a los productores del barrio con quienes buscan productos frescos cerca de casa.', points: ['Comenzar por un solo barrio.', 'Mostrar disponibilidad y horarios.', 'Conversar con los negocios antes de diseñar.'], tasks: ['Anotar tres negocios para entrevistar.', 'Dibujar el recorrido de un primer pedido.', 'Preparar preguntas sobre entregas y horarios.'] },
    estudio: { meta: 'AYER · 16:00 · 35 MIN', title: 'Aprender, sin perder el hilo.', summary: 'La sesión repasó cómo las plantas transforman la luz en energía química y por qué ese proceso sostiene los ecosistemas.', points: ['La clorofila absorbe energía luminosa.', 'El proceso utiliza agua y dióxido de carbono.', 'Se producen azúcares y se libera oxígeno.'], tasks: ['Repasar las etapas de la fotosíntesis.', 'Dibujar un esquema del cloroplasto.', 'Preparar tres preguntas para la próxima clase.'] }
  };
  let scene = 'reunion';
  let view = 'resumen';
  let renderedScene = scene;
  let renderedView = view;
  let renderTimer = 0;
  let renderVersion = 0;
  const header = document.querySelector('.nav');
  const menuToggle = document.querySelector('.menu-toggle');
  const mainNav = document.getElementById('lumaNav');
  const closeMenu = (returnFocus = false) => {
    header.classList.remove('menu-open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Abrir menú');
    if (returnFocus) menuToggle.focus();
  };
  menuToggle.addEventListener('click', () => {
    const open = menuToggle.getAttribute('aria-expanded') !== 'true';
    header.classList.toggle('menu-open', open);
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  });
  mainNav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => closeMenu()));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menuToggle.getAttribute('aria-expanded') === 'true') closeMenu(true);
  });
  window.addEventListener('resize', () => {
    if (window.innerWidth > 700) closeMenu();
  }, { passive: true });

  const syncControls = () => {
    document.querySelectorAll('[data-scene], [data-view]').forEach(button => {
      const active = button.dataset.scene ? button.dataset.scene === scene : button.dataset.view === view;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
  };
  const paintDemo = () => {
    const data = scenes[scene];
    document.getElementById('scene-meta').textContent = data.meta;
    document.getElementById('scene-title').textContent = data.title;
    const label = document.createElement('span');
    label.className = 'content-label';
    label.textContent = view === 'resumen' ? 'LO ESENCIAL' : 'DE LA IDEA A LA ACCIÓN';
    const paragraph = document.createElement('p');
    paragraph.textContent = view === 'resumen' ? data.summary : 'Posibles tareas extraídas de esta conversación de ejemplo:';
    const list = document.createElement('ul');
    (view === 'resumen' ? data.points : data.tasks).forEach(text => {
      const item = document.createElement('li');
      item.textContent = text;
      list.append(item);
    });
    document.getElementById('demo-content').replaceChildren(label, paragraph, list);
    syncControls();
  };
  const render = () => {
    const sceneChanged = scene !== renderedScene;
    const viewChanged = view !== renderedView;
    const content = document.getElementById('demo-content');
    const heading = document.querySelector('.memory-heading');
    const version = ++renderVersion;
    window.clearTimeout(renderTimer);
    syncControls();
    if (!sceneChanged && !viewChanged) {
      heading.classList.remove('is-updating');
      content.classList.remove('is-updating');
      return;
    }
    if (sceneChanged) heading.classList.add('is-updating');
    content.classList.add('is-updating');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const update = () => {
      if (version !== renderVersion) return;
      paintDemo();
      renderedScene = scene;
      renderedView = view;
      requestAnimationFrame(() => {
        if (version !== renderVersion) return;
        heading.classList.remove('is-updating');
        content.classList.remove('is-updating');
      });
    };
    if (reducedMotion) update();
    else renderTimer = window.setTimeout(update, 160);
  };
  document.querySelectorAll('[data-scene]').forEach(button => button.addEventListener('click', () => { scene = button.dataset.scene; render(); }));
  document.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => { view = button.dataset.view; render(); }));
})();

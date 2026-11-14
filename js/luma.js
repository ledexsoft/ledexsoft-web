'use strict';
(() => {
  const scenes = {
  "reunion": {
    "meta": "REUNIÓN DE EQUIPO · FRAGMENTO 02:14",
    "title": "El diseño tiene fecha y responsable.",
    "source": "«Marta, envía el diseño el jueves. Diego lo revisa el viernes. Para esta versión nos quedamos con tres funciones.»",
    "summary": "Marta enviará el diseño el jueves y Diego lo revisará el viernes. La primera versión se limitará a tres funciones.",
    "points": [
      "Alcance: tres funciones en la primera versión.",
      "Entrega del diseño: Marta, el jueves.",
      "Revisión: Diego, el viernes."
    ],
    "tasks": [
      "Marta: enviar el diseño el jueves.",
      "Diego: revisar el diseño el viernes.",
      "Equipo: mantener el alcance en tres funciones."
    ],
    "question": "¿Quién revisa el diseño y cuándo?",
    "answer": "Diego lo revisa el viernes. Marta debe enviarlo el jueves.",
    "benefit": "Sabrías a quién consultar y qué fecha confirmar, sin reconstruir toda la reunión."
  },
  "cliente": {
    "meta": "PEDIDO DE ANA · FRAGMENTO 00:38",
    "title": "Un pedido con sus detalles.",
    "source": "«Soy Ana. Quería una tarta de chocolate para ocho personas, sin nueces. La recojo el sábado a las diez. ¿Me confirmas mañana el precio?»",
    "summary": "Ana pide una tarta de chocolate para ocho personas, sin nueces. La recogería el sábado a las 10:00 y espera confirmación del precio mañana.",
    "points": [
      "Producto: tarta de chocolate para ocho personas.",
      "Petición: sin nueces; confirmar requisitos con Ana.",
      "Recogida: sábado a las 10:00."
    ],
    "tasks": [
      "Confirmar mañana el precio con Ana.",
      "Verificar con Ana sus requisitos sobre las nueces.",
      "Confirmar la recogida del sábado a las 10:00."
    ],
    "question": "¿Qué pidió Ana y cuándo lo recoge?",
    "answer": "Una tarta de chocolate para ocho personas, sin nueces, para recoger el sábado a las 10:00. Falta confirmar el precio.",
    "benefit": "Tendrías los detalles juntos antes de responder o preparar el pedido."
  },
  "personal": {
    "meta": "CONVERSACIÓN EN CASA · FRAGMENTO 01:06",
    "title": "Ese «yo me encargo», a la vista.",
    "source": "«Yo recojo el paquete mañana antes de las seis. Tú llama al técnico y pregúntale si puede venir el martes por la mañana.»",
    "summary": "Una persona se compromete a recoger el paquete mañana antes de las 18:00 y pide a la otra consultar disponibilidad con el técnico.",
    "points": [
      "Paquete: mañana antes de las 18:00.",
      "Técnico: consultar el martes por la mañana.",
      "No se mencionaron nombres de los responsables."
    ],
    "tasks": [
      "Asignar quién recoge el paquete mañana.",
      "Asignar quién llama al técnico.",
      "Consultar disponibilidad; la visita aún no está confirmada."
    ],
    "question": "¿El técnico viene el martes?",
    "answer": "Todavía no está confirmado. Se propuso preguntarle si puede venir el martes por la mañana.",
    "benefit": "Distinguirías una propuesta de una cita confirmada antes de organizar tu día."
  },
  "idea": {
    "meta": "NOTA PERSONAL · FRAGMENTO 00:12",
    "title": "La idea sigue aquí cuando vuelves.",
    "source": "«Una cesta semanal con productos del barrio. Podría empezar con dos tiendas y recogida los viernes. Antes de hacer una app, preguntar a cinco vecinos si les serviría.»",
    "summary": "Propuesta de una cesta semanal de productos locales: comenzar con dos tiendas y recogida los viernes, validando primero el interés de los vecinos.",
    "points": [
      "Formato: cesta semanal de productos del barrio.",
      "Prueba inicial: dos tiendas, recogida los viernes.",
      "Validación: conversar con cinco vecinos antes de crear la app."
    ],
    "tasks": [
      "Preguntar a cinco vecinos si les serviría.",
      "Explorar la idea con dos tiendas.",
      "Validar la propuesta antes de desarrollar una app."
    ],
    "question": "¿Qué quería probar antes de crear la app?",
    "answer": "Preguntar a cinco vecinos si les serviría una cesta semanal de productos del barrio.",
    "benefit": "Recuperarías no solo la idea, sino el primer paso que pensaste para probarla."
  },
  "estudio": {
    "meta": "SESIÓN DE ESTUDIO · FRAGMENTO 04:20",
    "title": "Del apunte incompleto al repaso.",
    "source": "«La clorofila absorbe luz. La planta utiliza agua y dióxido de carbono para producir azúcares y libera oxígeno. Para el lunes, dibujen el proceso e identifiquen entradas y salidas.»",
    "summary": "La sesión explica el papel de la luz, el agua y el dióxido de carbono en la fotosíntesis. Para el lunes se pide un esquema de entradas y salidas.",
    "points": [
      "La clorofila absorbe luz.",
      "Entradas mencionadas: agua y dióxido de carbono.",
      "Productos mencionados: azúcares y oxígeno."
    ],
    "tasks": [
      "Preparar el esquema para el lunes.",
      "Identificar agua y dióxido de carbono como entradas.",
      "Identificar azúcares y oxígeno como productos."
    ],
    "question": "¿Qué había que entregar el lunes?",
    "answer": "Un dibujo del proceso de fotosíntesis que identifique sus entradas y salidas.",
    "benefit": "Separarías lo que debes repasar de lo que debes entregar."
  }
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
    document.getElementById('scene-source').textContent = data.source;
    const label = document.createElement('span');
    label.className = 'content-label';
    label.textContent = view === 'resumen' ? 'LO ESENCIAL' : view === 'tareas' ? 'TAREAS SUGERIDAS · PARA REVISAR' : data.question;
    const paragraph = document.createElement('p');
    paragraph.textContent = view === 'resumen' ? data.summary : view === 'tareas' ? 'Nada se ejecuta automáticamente. Estos serían los próximos pasos a revisar:' : data.answer;
    const list = document.createElement('ul');
    (view === 'resumen' ? data.points : view === 'tareas' ? data.tasks : ['Fuente: ' + data.meta, 'Respuesta preparada para esta demo; no es una consulta de IA en vivo.']).forEach(text => {
      const item = document.createElement('li');
      item.textContent = text;
      list.append(item);
    });
    const benefit = document.createElement('p');
    benefit.className = 'demo-benefit';
    benefit.textContent = data.benefit;
    document.getElementById('demo-content').replaceChildren(label, paragraph, list, benefit);
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
  document.querySelectorAll('[data-case]').forEach(link => link.addEventListener('click', () => { scene = link.dataset.case; view = 'resumen'; render(); }));
  paintDemo();
  document.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => { view = button.dataset.view; render(); }));
})();

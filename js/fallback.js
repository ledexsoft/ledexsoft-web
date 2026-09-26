/* Keep essential controls usable when the animation CDN is unavailable. */
(function () {
  'use strict';
  if (window.gsap && window.ScrollTrigger) return;

  document.body.classList.remove('is-loading');
  var preloader = document.getElementById('preloader');
  if (preloader) preloader.style.display = 'none';
  document.querySelectorAll('.hero-head .line').forEach(function (line) {
    line.style.opacity = '1';
    line.style.transform = 'none';
  });

  var nav = document.getElementById('siteNav');
  var burger = document.getElementById('burgerBtn');
  var menu = document.getElementById('mobileMenu');
  if (burger && menu) {
    function setMenu(open) {
      document.body.classList.toggle('menu-open', open);
      menu.inert = !open;
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
      if (open && nav) nav.classList.remove('is-hidden');
    }
    burger.addEventListener('click', function () {
      var open = !document.body.classList.contains('menu-open');
      setMenu(open);
      if (open) menu.querySelector('a').focus();
    });
    menu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () { setMenu(false); });
    });
    document.addEventListener('keydown', function (e) {
      if (!document.body.classList.contains('menu-open')) return;
      if (e.key === 'Escape') { setMenu(false); burger.focus(); }
      if (e.key === 'Tab') {
        var items = [burger].concat(Array.from(menu.querySelectorAll('a')));
        var i = items.indexOf(document.activeElement);
        if (e.shiftKey && i === 0) { e.preventDefault(); items[items.length - 1].focus(); }
        else if (!e.shiftKey && i === items.length - 1) { e.preventDefault(); items[0].focus(); }
      }
    });
  }

  document.querySelectorAll('.faq-item').forEach(function (item) {
    var button = item.querySelector('.faq-q');
    var answer = item.querySelector('.faq-a');
    answer.style.height = item.classList.contains('is-open') ? 'auto' : '0';
    button.addEventListener('click', function () {
      document.querySelectorAll('.faq-item').forEach(function (other) {
        var open = other === item && !other.classList.contains('is-open');
        other.classList.toggle('is-open', open);
        other.querySelector('.faq-q').setAttribute('aria-expanded', String(open));
        var panel = other.querySelector('.faq-a');
        panel.inert = !open;
        panel.style.height = open ? 'auto' : '0';
      });
    });
  });

  var reading = document.getElementById('readingBtn');
  if (reading) {
    function updateReading() {
      var on = document.body.classList.contains('reading');
      reading.setAttribute('aria-pressed', String(on));
      var label = reading.querySelector('.btn-reading-label');
      if (label) label.textContent = on ? 'Modo normal' : 'Modo lectura';
    }
    updateReading();
    reading.addEventListener('click', function () {
      document.body.classList.toggle('reading');
      updateReading();
      try { localStorage.setItem('estatutos-lectura', document.body.classList.contains('reading') ? '1' : '0'); } catch (e) {}
    });
    var search = document.getElementById('tocSearch');
    search.addEventListener('input', function () {
      var query = search.value.trim().toLowerCase();
      document.querySelectorAll('#tocNav a').forEach(function (link) {
        link.style.display = !query || link.textContent.toLowerCase().includes(query) ? 'block' : 'none';
      });
    });
    var toTop = document.getElementById('toTop');
    toTop.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
  }

  if (nav) {
    function onScroll() { nav.classList.toggle('is-scrolled', window.scrollY > 80); }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }
})();

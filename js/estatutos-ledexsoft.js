(function(){
  "use strict";
  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  gsap.registerPlugin(ScrollTrigger);

  /* ---------------- smooth scroll ---------------- */
  var lenis;
  if(!REDUCED){
    try{
      lenis = new Lenis({ duration:1.1, smoothWheel:true, easing:function(t){ return Math.min(1,1.001-Math.pow(2,-10*t)); } });
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function(time){ lenis.raf(time*1000); });
      gsap.ticker.lagSmoothing(0);
    }catch(e){}
  }

  /* ---------------- reading progress ---------------- */
  gsap.to('.progress-bar', {
    scaleX:1, ease:'none',
    scrollTrigger:{ trigger:document.body, start:'top top', end:'bottom bottom', scrub:0.3 }
  });

  /* ---------------- nav + back-to-top visibility ---------------- */
  var nav = document.getElementById('siteNav');
  var toTop = document.getElementById('toTop');
  function onScrollState(){
    var y = window.scrollY || 0;
    nav.classList.toggle('is-scrolled', y > 60);
    toTop.classList.toggle('is-visible', y > 700);
  }
  window.addEventListener('scroll', onScrollState, {passive:true});
  onScrollState();

  /* ---------------- smooth anchors ---------------- */
  function smoothScrollTo(target){
    if(!target) return;
    if(lenis){ lenis.scrollTo(target, {duration:1.1, offset:-90}); }
    else{ target.scrollIntoView({behavior: REDUCED ? 'auto' : 'smooth'}); }
  }
  document.querySelectorAll('a[href^="#"]').forEach(function(a){
    var id = a.getAttribute('href');
    if(!id || id.length < 2) return;
    var target = document.querySelector(id);
    if(!target) return;
    a.addEventListener('click', function(e){ e.preventDefault(); smoothScrollTo(target); });
  });
  toTop.addEventListener('click', function(){
    if(lenis){ lenis.scrollTo(0, {duration:1.1}); }
    else{ window.scrollTo({top:0, behavior: REDUCED ? 'auto' : 'smooth'}); }
  });

  /* ---------------- modo lectura ---------------- */
  var readingBtn = document.getElementById('readingBtn');
  function applyReading(on){
    document.body.classList.toggle('reading', on);
    readingBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
    var lbl = readingBtn.querySelector('.btn-reading-label');
    if(lbl){ lbl.textContent = on ? 'Modo normal' : 'Modo lectura'; }
  }
  applyReading(document.body.classList.contains('reading'));
  readingBtn.addEventListener('click', function(){
    var on = !document.body.classList.contains('reading');
    applyReading(on);
    try{ localStorage.setItem('estatutos-lectura', on ? '1' : '0'); }catch(e){}
  });

  /* ---------------- TOC scroll-spy ---------------- */
  var tocLinks = document.querySelectorAll('#tocNav a');
  tocLinks.forEach(function(link){
    var id = link.getAttribute('href');
    var section = document.querySelector(id);
    if(!section) return;
    ScrollTrigger.create({
      trigger:section, start:'top 30%', end:'bottom 30%',
      onToggle:function(self){
        if(!self.isActive) return;
        tocLinks.forEach(function(l){ l.classList.toggle('is-active', l===link); });
      }
    });
  });

  /* ---------------- TOC filter ---------------- */
  var search = document.getElementById('tocSearch');
  search.addEventListener('input', function(){
    var q = search.value.trim().toLowerCase();
    tocLinks.forEach(function(l){
      var match = !q || l.textContent.toLowerCase().indexOf(q) !== -1;
      l.style.display = match ? 'block' : 'none';
    });
  });

  /* ---------------- pending fields count (derived, not hardcoded) ---------------- */
  var pendingEls = document.querySelectorAll('.pending');
  document.getElementById('pendingCount').textContent = pendingEls.length;

  /* ---------------- chapter reveals ---------------- */
  gsap.utils.toArray('.chapter').forEach(function(ch){
    gsap.fromTo(ch, {opacity:0, y:22}, {
      opacity:1, y:0, duration:.7, ease:'power3.out',
      scrollTrigger:{ trigger:ch, start:'top 88%' }
    });
  });

  gsap.fromTo('.doc-badges .badge', {opacity:0, y:14}, {opacity:1, y:0, duration:.6, ease:'power3.out', stagger:.08, delay:.1});
  gsap.fromTo('.doc-hero h1', {opacity:0, y:22}, {opacity:1, y:0, duration:.9, ease:'power3.out', delay:.15});
  gsap.fromTo('.doc-lede, .doc-meta', {opacity:0, y:18}, {opacity:1, y:0, duration:.8, ease:'power3.out', stagger:.1, delay:.3});
  gsap.fromTo('.notice-inner', {opacity:0, y:20}, {opacity:1, y:0, duration:.8, ease:'power3.out', delay:.45});

})();

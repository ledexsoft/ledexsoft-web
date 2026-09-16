(function(){
  "use strict";
  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  gsap.registerPlugin(ScrollTrigger);

  gsap.set('.hero-head .line', { yPercent: REDUCED ? 0 : 110, opacity:1 });

  /* ---------------- Lenis smooth scroll ---------------- */
  var lenis;
  if(!REDUCED){
    try{
      lenis = new Lenis({ duration:1.15, smoothWheel:true, easing:function(t){ return Math.min(1,1.001-Math.pow(2,-10*t)); } });
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function(time){ lenis.raf(time*1000); });
      gsap.ticker.lagSmoothing(0);
    }catch(e){}
  }

  /* ---------------- progress bar ---------------- */
  gsap.to('.progress-bar', {
    scaleX:1, ease:'none',
    scrollTrigger:{ trigger:document.body, start:'top top', end:'bottom bottom', scrub:0.3 }
  });

  /* ---------------- nav background on scroll ---------------- */
  var nav = document.getElementById('siteNav');
  ScrollTrigger.create({
    trigger:document.body, start:'top -80', end:99999,
    onUpdate:function(self){ nav.classList.toggle('is-scrolled', self.scroll() > 80); }
  });
  window.addEventListener('scroll', function(){
    nav.classList.toggle('is-scrolled', (window.scrollY||0) > 80);
  }, {passive:true});

  /* ---------------- custom cursor ---------------- */
  var cursor = document.getElementById('cursor');
  if(window.matchMedia('(hover:hover) and (pointer:fine)').matches){
    var xTo = gsap.quickTo(cursor,'x',{duration:.5, ease:'power3'});
    var yTo = gsap.quickTo(cursor,'y',{duration:.5, ease:'power3'});
    var cursorRevealed = false;
    window.addEventListener('mousemove', function(e){
      xTo(e.clientX); yTo(e.clientY);
      if(!cursorRevealed){ cursorRevealed = true; cursor.classList.add('is-visible'); }
    });
    document.querySelectorAll('[data-cursor]').forEach(function(el){
      el.addEventListener('mouseenter', function(){
        cursor.classList.add('is-active');
        cursor.querySelector('.cursor-label').textContent = el.dataset.cursor || '';
      });
      el.addEventListener('mouseleave', function(){ cursor.classList.remove('is-active'); });
    });
    document.querySelectorAll('.screen-frame, #heroPhone').forEach(function(card){
      var img = card.querySelector('img');
      card.style.perspective = '700px';
      card.addEventListener('mousemove', function(e){
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left)/r.width - 0.5;
        var py = (e.clientY - r.top)/r.height - 0.5;
        gsap.to(img, {rotateY:px*14, rotateX:-py*14, scale:1.05, duration:.6, ease:'power3', transformPerspective:600});
      });
      card.addEventListener('mouseleave', function(){
        gsap.to(img, {rotateY:0, rotateX:0, scale:1, duration:.8, ease:'power3'});
      });
    });
  }

  /* ---------------- magnetic buttons ---------------- */
  document.querySelectorAll('.magnetic').forEach(function(btn){
    btn.addEventListener('mousemove', function(e){
      var r = btn.getBoundingClientRect();
      var relX = e.clientX - r.left - r.width/2;
      var relY = e.clientY - r.top - r.height/2;
      gsap.to(btn, {x:relX*0.3, y:relY*0.3, duration:.4, ease:'power3'});
    });
    btn.addEventListener('mouseleave', function(){ gsap.to(btn, {x:0, y:0, duration:.6, ease:'elastic.out(1,0.4)'}); });
  });

  /* ---------------- smooth in-page anchors ---------------- */
  function smoothScrollTo(target){
    if(!target) return;
    if(lenis){ lenis.scrollTo(target, {duration:1.2}); }
    else{ target.scrollIntoView({behavior: REDUCED ? 'auto' : 'smooth'}); }
  }
  document.querySelectorAll('a[href^="#"]').forEach(function(a){
    var id = a.getAttribute('href');
    if(!id || id.length < 2) return;
    var target = document.querySelector(id);
    if(!target) return;
    a.addEventListener('click', function(e){
      e.preventDefault();
      document.body.classList.remove('menu-open');
      smoothScrollTo(target);
    });
  });

  /* ---------------- mobile menu ---------------- */
  var burger = document.getElementById('burgerBtn');
  burger.addEventListener('click', function(){
    var open = document.body.classList.toggle('menu-open');
    burger.setAttribute('aria-expanded', open ? 'true':'false');
  });

  /* ---------------- preloader + hero intro ---------------- */
  var counter = { val:0 };
  var preloadNum = document.getElementById('preloadNum');
  var preloadFill = document.getElementById('preloadFill');

  function heroIntro(){
    var lines = document.querySelectorAll('.hero-head .line');
    gsap.to(lines, { yPercent:0, duration:1.1, ease:'power4.out', stagger:.08, delay:.1 });
    gsap.fromTo(['.hero-tag','.hero-sub','.hero-actions','.hero-meta'], {opacity:0,y:16}, {opacity:1,y:0,duration:.9,ease:'power3.out',stagger:.08,delay:.5});
    gsap.fromTo('.phone-stage', {opacity:0,y:30,scale:.94}, {opacity:1,y:0,scale:1,duration:1,ease:'power3.out',delay:.4});
    gsap.fromTo('header.site-nav', {y:-40,opacity:0}, {
      y:0, opacity:1, duration:.8, ease:'power3.out', delay:.2,
      onComplete:function(){ gsap.set('header.site-nav', {clearProps:'transform'}); }
    });
  }

  function finishLoad(){
    document.body.classList.remove('is-loading');
    document.getElementById('preloader').style.display='none';
    heroIntro();
    ScrollTrigger.refresh();
  }

  if(REDUCED){
    document.getElementById('preloader').style.display='none';
    document.body.classList.remove('is-loading');
  } else {
    var tl = gsap.timeline({ onComplete:finishLoad });
    tl.to(counter, {
      val:100, duration:1.5, ease:'power2.inOut',
      onUpdate:function(){
        var v = Math.floor(counter.val);
        preloadNum.textContent = v;
        preloadFill.style.width = v+'%';
      }
    })
    .to('.preloader-word,.preloader-count,.preloader-bar', {opacity:0, y:-14, duration:.4, ease:'power2.in'}, '-=.15')
    .to('.preloader', {yPercent:-100, duration:.9, ease:'power4.inOut'}, '-=.1');
  }

  /* ---------------- hero recedes as you scroll past it ---------------- */
  gsap.to('.hero .wrap', {
    y:-50, scale:.95, opacity:.32, ease:'none',
    scrollTrigger:{ trigger:'.hero', start:'top top', end:'bottom top', scrub:true }
  });
  gsap.to('#scrollCue', {
    opacity:0, ease:'none',
    scrollTrigger:{ trigger:'.hero', start:'top top', end:'200 top', scrub:true }
  });

  /* ---------------- marquee skews with scroll speed ---------------- */
  if(!REDUCED){
    var marqueeTracks = document.querySelectorAll('.marquee-track');
    var skewTo = gsap.quickTo(marqueeTracks, 'skewX', {duration:.5, ease:'power3'});
    var skewTimer;
    ScrollTrigger.create({
      trigger:document.body, start:'top top', end:'bottom bottom',
      onUpdate:function(self){
        var v = gsap.utils.clamp(-18, 18, self.getVelocity()/-250);
        skewTo(v);
        clearTimeout(skewTimer);
        skewTimer = setTimeout(function(){ skewTo(0); }, 120);
      }
    });
  }

  /* ---------------- steps: connecting line draws in on scroll ---------------- */
  gsap.to('#stepsLineFill', {
    scaleX:1, ease:'none',
    scrollTrigger:{ trigger:'.steps-wrap', start:'top 70%', end:'bottom 55%', scrub:true }
  });

  /* ---------------- section-head reveal ---------------- */
  gsap.utils.toArray('.section-head').forEach(function(el){
    gsap.fromTo(el, {opacity:0, y:24}, { opacity:1, y:0, duration:.9, ease:'power3.out', scrollTrigger:{ trigger:el, start:'top 85%' } });
  });

  /* ---------------- step cards stagger ---------------- */
  gsap.fromTo('.step-card', {opacity:0, y:30}, {
    opacity:1, y:0, duration:.8, ease:'power3.out', stagger:.12,
    scrollTrigger:{ trigger:'.steps', start:'top 80%' }
  });

  /* ---------------- category cards stagger ---------------- */
  gsap.fromTo('.cat-card', {opacity:0, y:30}, {
    opacity:1, y:0, duration:.7, ease:'power3.out', stagger:.08,
    scrollTrigger:{ trigger:'.cat-grid', start:'top 82%' }
  });

  /* ---------------- app screens reveal ---------------- */
  gsap.fromTo('.screen-card', {opacity:0, y:40}, {
    opacity:1, y:0, duration:.8, ease:'power3.out', stagger:.15,
    scrollTrigger:{ trigger:'.screens', start:'top 80%' }
  });

  /* ---------------- download ticket + cta head scrub ---------------- */
  gsap.fromTo('.ticket', {opacity:0, y:60, rotate:5}, {
    opacity:1, y:0, rotate:-1.2, ease:'none',
    scrollTrigger:{ trigger:'.download', start:'top 78%', end:'top 42%', scrub:true }
  });
  gsap.fromTo('.cta-head', {opacity:0, scale:.92, y:36}, {
    opacity:1, scale:1, y:0, ease:'none',
    scrollTrigger:{ trigger:'.cta', start:'top 85%', end:'top 45%', scrub:true }
  });

  /* ---------------- active nav link tracking ---------------- */
  var topLinks = document.querySelectorAll('.nav-links a[href^="#"]');
  ['#como-funciona','#negocios','#app','#preguntas','#descarga'].forEach(function(id){
    var el = document.querySelector(id);
    if(!el) return;
    ScrollTrigger.create({
      trigger:el, start:'top center', end:'bottom center',
      onToggle:function(self){
        if(!self.isActive) return;
        topLinks.forEach(function(l){ l.classList.toggle('is-active', l.getAttribute('href')===id); });
      }
    });
  });

  /* ---------------- countdown to launch ---------------- */
  var target = new Date('2026-09-12T00:00:00-04:00').getTime();
  var cdDays=document.getElementById('cdDays'), cdHours=document.getElementById('cdHours'),
      cdMin=document.getElementById('cdMin'), cdSec=document.getElementById('cdSec'),
      cdLabel=document.getElementById('cdLabel'), cdState=document.getElementById('cdState');
  function tickCountdown(){
    var diff = target - Date.now();
    if(diff <= 0){
      cdLabel.textContent = 'Ya está en beta abierta'; cdState.textContent = 'Beta abierta';
      cdDays.textContent='00'; cdHours.textContent='00'; cdMin.textContent='00'; cdSec.textContent='00';
      return;
    }
    var d = Math.floor(diff/86400000), h = Math.floor((diff%86400000)/3600000),
        m = Math.floor((diff%3600000)/60000), s = Math.floor((diff%60000)/1000);
    cdDays.textContent = String(d).padStart(2,'0');
    cdHours.textContent = String(h).padStart(2,'0');
    cdMin.textContent = String(m).padStart(2,'0');
    cdSec.textContent = String(s).padStart(2,'0');
  }
  tickCountdown();
  setInterval(tickCountdown, 1000);

  /* ---------------- FAQ accordion ---------------- */
  document.querySelectorAll('.faq-item.is-open .faq-a').forEach(function(a){ gsap.set(a, {height:'auto'}); });
  document.querySelectorAll('.faq-item').forEach(function(item){
    var answer = item.querySelector('.faq-a');
    item.querySelector('.faq-q').addEventListener('click', function(){
      var wasOpen = item.classList.contains('is-open');
      document.querySelectorAll('.faq-item').forEach(function(i){
        if(i.classList.contains('is-open')){
          i.classList.remove('is-open');
          gsap.to(i.querySelector('.faq-a'), {height:0, duration:.4, ease:'power2.inOut'});
        }
      });
      if(!wasOpen){
        item.classList.add('is-open');
        var full = answer.scrollHeight;
        gsap.fromTo(answer, {height:0}, {height:full, duration:.45, ease:'power2.inOut', onComplete:function(){ gsap.set(answer,{height:'auto'}); }});
      }
    });
  });

})();

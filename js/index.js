(function(){
  "use strict";
  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  gsap.registerPlugin(ScrollTrigger);

  /* seed the hero headline's hidden state via GSAP itself (not CSS), so the
     later yPercent tween has a clean baseline to animate from */
  gsap.set('.hero-head .line', { yPercent: REDUCED ? 0 : 110, opacity:1 });

  /* ---------------- Lenis smooth scroll ---------------- */
  var lenis;
  if(!REDUCED){
    try{
      lenis = new Lenis({ duration:1.15, smoothWheel:true, easing:function(t){ return Math.min(1,1.001-Math.pow(2,-10*t)); } });
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function(time){ lenis.raf(time*1000); });
      gsap.ticker.lagSmoothing(0);
    }catch(e){ /* fall back to native scroll */ }
  }

  /* ---------------- progress bar ---------------- */
  gsap.to('.progress-bar', {
    scaleX:1, ease:'none',
    scrollTrigger:{ trigger:document.body, start:'top top', end:'bottom bottom', scrub:0.3 }
  });

  /* ---------------- nav bg + direction-aware hide/show ---------------- */
  var nav = document.getElementById('siteNav');
  var lastScrollY = 0;
  ScrollTrigger.create({
    trigger:document.body, start:'top -80', end:99999,
    onUpdate:function(self){
      var y = self.scroll();
      nav.classList.toggle('is-scrolled', y > 80);
      if(!REDUCED && !document.body.classList.contains('menu-open')){
        if(y > lastScrollY && y > window.innerHeight * 0.6){
          nav.classList.add('is-hidden');
        } else {
          nav.classList.remove('is-hidden');
        }
      }
      lastScrollY = y;
    }
  });
  // belt-and-suspenders: a plain scroll listener guarantees the background
  // toggle works even if the ScrollTrigger instance above doesn't fire.
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
  }

  /* ---------------- magnetic buttons ---------------- */
  document.querySelectorAll('.magnetic').forEach(function(btn){
    btn.addEventListener('mousemove', function(e){
      var r = btn.getBoundingClientRect();
      var relX = e.clientX - r.left - r.width/2;
      var relY = e.clientY - r.top - r.height/2;
      gsap.to(btn, {x:relX*0.35, y:relY*0.35, duration:.4, ease:'power3'});
    });
    btn.addEventListener('mouseleave', function(){
      gsap.to(btn, {x:0, y:0, duration:.6, ease:'elastic.out(1,0.4)'});
    });
  });

  /* ---------------- 3D tilt on product cards ---------------- */
  if(window.matchMedia('(hover:hover) and (pointer:fine)').matches){
    document.querySelectorAll('.wp-media').forEach(function(card){
      var img = card.querySelector('img');
      card.addEventListener('mousemove', function(e){
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left)/r.width - 0.5;
        var py = (e.clientY - r.top)/r.height - 0.5;
        gsap.to(img, {rotateY:px*16, rotateX:-py*16, scale:1.06, duration:.6, ease:'power3', transformPerspective:600});
      });
      card.addEventListener('mouseleave', function(){
        gsap.to(img, {rotateY:0, rotateX:0, scale:1, duration:.8, ease:'power3'});
      });
    });
  }

  /* ---------------- click ripple ---------------- */
  if(!REDUCED){
    document.addEventListener('click', function(e){
      var ripple = document.createElement('div');
      ripple.className = 'click-ripple';
      ripple.style.left = e.clientX+'px';
      ripple.style.top = e.clientY+'px';
      document.body.appendChild(ripple);
      gsap.fromTo(ripple, {scale:0, opacity:.6}, {
        scale:3.2, opacity:0, duration:.7, ease:'power2.out',
        onComplete:function(){ ripple.remove(); }
      });
    });
  }

  /* ---------------- smooth in-page anchor navigation ---------------- */
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
    if(open){ nav.classList.remove('is-hidden'); }
  });

  /* ---------------- text split helpers ---------------- */
  function splitLines(el){
    // words already pre-wrapped in HTML via .mask > .line — nothing to do
    return el.querySelectorAll('.line');
  }
  function splitWords(el){
    var text = el.textContent.trim();
    var words = text.split(/\s+/);
    el.innerHTML = words.map(function(w){ return '<span class="word">'+w+'</span>'; }).join(' ');
    return el.querySelectorAll('.word');
  }

  /* ---------------- preloader + hero intro ---------------- */
  var counter = { val:0 };
  var preloadNum = document.getElementById('preloadNum');
  var preloadFill = document.getElementById('preloadFill');
  var preloadStatus = document.getElementById('preloadStatus');
  var statusPhrases = ['Preparando todo', 'Puliendo detalles', 'Casi listo'];

  function heroIntro(){
    var lines = document.querySelectorAll('.hero-head .line');
    gsap.to(lines, { yPercent:0, duration:1.1, ease:'power4.out', stagger:.08, delay:.1 });
    gsap.fromTo(['.hero-sub','.hero-actions','.hero-tag'], {opacity:0,y:16}, {opacity:1,y:0,duration:.9,ease:'power3.out',stagger:.08,delay:.5});
    gsap.fromTo('.hero-photo', {opacity:0,y:30,rotate:10}, {opacity:1,y:0,rotate:4,duration:1,ease:'power3.out',delay:.7});
    gsap.fromTo('header.site-nav', {y:-40,opacity:0}, {
      y:0, opacity:1, duration:.8, ease:'power3.out', delay:.2,
      onComplete:function(){ gsap.set('header.site-nav', {clearProps:'transform'}); }
    });
  }

  function finishLoad(){
    document.body.classList.remove('is-loading');
    var pre = document.getElementById('preloader');
    pre.style.display='none';
    heroIntro();
    ScrollTrigger.refresh();
  }

  if(REDUCED){
    document.getElementById('preloader').style.display='none';
    document.body.classList.remove('is-loading');
  } else {
    var tl = gsap.timeline({ onComplete:finishLoad });
    tl.to(counter, {
      val:100, duration:1.7, ease:'power2.inOut',
      onUpdate:function(){
        var v = Math.floor(counter.val);
        preloadNum.textContent = v;
        preloadFill.style.width = v+'%';
        var phrase = v<30 ? statusPhrases[0] : v<70 ? statusPhrases[1] : statusPhrases[2];
        if(preloadStatus.textContent !== phrase) preloadStatus.textContent = phrase;
      }
    })
    .to('.preloader-word,.preloader-count,.preloader-bar,.preloader-status', {opacity:0, y:-14, duration:.4, ease:'power2.in'}, '-=.15')
    .to('.preloader', {yPercent:-100, duration:.9, ease:'power4.inOut'}, '-=.1');
  }

  /* ---------------- hero float glow follow ---------------- */
  if(!REDUCED){
    var glow = document.querySelector('.hero-glow');
    window.addEventListener('mousemove', function(e){
      var xp = (e.clientX/window.innerWidth-0.5)*40;
      var yp = (e.clientY/window.innerHeight-0.5)*40;
      gsap.to(glow, {x:xp, y:yp, duration:1.2, ease:'power2.out'});
    });
  }

  /* ---------------- hero recedes as you scroll past it ---------------- */
  gsap.to('.hero .wrap, .hero-photo', {
    y:-60, scale:.94, opacity:.3, ease:'none',
    scrollTrigger:{ trigger:'.hero', start:'top top', end:'bottom top', scrub:true }
  });
  gsap.to('.hero-glow', {
    opacity:.15, ease:'none',
    scrollTrigger:{ trigger:'.hero', start:'top top', end:'bottom top', scrub:true }
  });

  /* ---------------- pinned circle-wipe transition ---------------- */
  if(REDUCED){
    gsap.set('.wipe-panel', {scale:16}); gsap.set('.wipe-word', {opacity:1});
  } else {
    gsap.timeline({
      scrollTrigger:{ trigger:'.wipe', start:'top top', end:'+=120%', scrub:.6, pin:true }
    })
    .to('.wipe-panel', {scale:16, duration:.6, ease:'power1.inOut'})
    .to('.wipe-word', {opacity:1, duration:.25}, '-=.15');
  }

  /* ---------------- manifesto scroll-scrub reveal ---------------- */
  var manifestoWords = splitWords(document.getElementById('manifestoText'));
  gsap.timeline({
    scrollTrigger:{ trigger:'#manifiesto', start:'top 75%', end:'bottom 65%', scrub:.6 }
  }).to(manifestoWords, { opacity:1, stagger:.04, ease:'none' });

  /* ---------------- productos horizontal pin ---------------- */
  var mm = gsap.matchMedia();
  mm.add('(min-width:900px)', function(){
    var track = document.getElementById('workTrack');
    var dots = document.querySelectorAll('#workProgress span');
    var hint = document.getElementById('workHint');
    var distance = function(){ return track.scrollWidth - window.innerWidth; };

    var anim = gsap.to(track, {
      x:function(){ return -distance(); },
      ease:'none',
      scrollTrigger:{
        trigger:'#workPin',
        start:'top top',
        end:function(){ return '+='+distance(); },
        scrub:1,
        pin:true,
        invalidateOnRefresh:true,
        snap:{ snapTo:1/2, duration:.4, ease:'power1.inOut' },
        onUpdate:function(self){
          var idx = Math.min(2, Math.floor(self.progress*3));
          dots.forEach(function(d,i){ d.classList.toggle('is-on', i===idx); });
          if(hint && self.progress > 0.04 && !hint.dataset.hidden){
            hint.dataset.hidden = '1';
            gsap.to(hint, {opacity:0, duration:.4});
          }
        }
      }
    });
    return function(){ anim.scrollTrigger.kill(); anim.kill(); };
  });

  /* ---------------- spotlight media reveal ---------------- */
  gsap.fromTo('#spotlightImg', {clipPath:'inset(12% 12% 12% 12% round 10px)'}, {
    clipPath:'inset(0% 0% 0% 0% round 10px)', ease:'none',
    scrollTrigger:{ trigger:'.spotlight', start:'top 75%', end:'top 30%', scrub:true }
  });
  gsap.fromTo('.float-chip', {opacity:0, y:44}, {
    opacity:1, y:0, ease:'none',
    scrollTrigger:{ trigger:'.spotlight', start:'top 70%', end:'top 38%', scrub:true }
  });
  gsap.fromTo('.ticket', {opacity:0, y:60, rotate:5}, {
    opacity:1, y:0, rotate:-1.4, ease:'none',
    scrollTrigger:{ trigger:'.spotlight', start:'top 78%', end:'top 42%', scrub:true }
  });

  /* ---------------- founder rows: each reveals independently as it enters ---------------- */
  document.querySelectorAll('.founder-row').forEach(function(row){
    var img = row.querySelector('.founder-photo img');
    gsap.fromTo(img, {clipPath:'inset(16% 30% 16% 30%)', scale:1.25}, {
      clipPath:'inset(0% 0% 0% 0%)', scale:1, ease:'none',
      scrollTrigger:{ trigger:row, start:'top 80%', end:'top 40%', scrub:true }
    });
    var textEls = row.querySelectorAll('.founder-quote,.founder-name,.founder-role,.founder-bio');
    gsap.fromTo(textEls, {opacity:0,y:20}, {
      opacity:1, y:0, duration:.8, ease:'power3.out', stagger:.08,
      scrollTrigger:{ trigger:row, start:'top 70%' }
    });
    var rule = row.querySelector('.founder-rule');
    if(rule){
      gsap.to(rule, {
        scaleX:1, ease:'none',
        scrollTrigger:{ trigger:row, start:'top 65%', end:'top 40%', scrub:true }
      });
    }
  });

  /* ---------------- cta headline: dramatic scrub scale-in ---------------- */
  gsap.fromTo('.cta-head', {opacity:0, scale:.9, y:40}, {
    opacity:1, scale:1, y:0, ease:'none',
    scrollTrigger:{ trigger:'.cta', start:'top 85%', end:'top 40%', scrub:true }
  });

  /* ---------------- generic section-head reveal (single treatment) ---------------- */
  gsap.utils.toArray('.section-head, .work-head, .cta-sub').forEach(function(el){
    gsap.fromTo(el, {opacity:0, y:24}, {
      opacity:1, y:0, duration:.9, ease:'power3.out',
      scrollTrigger:{ trigger:el, start:'top 85%' }
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
      cdLabel.textContent = 'Ya está en beta abierta';
      cdState.textContent = 'Beta abierta';
      cdDays.textContent='00'; cdHours.textContent='00'; cdMin.textContent='00'; cdSec.textContent='00';
      return;
    }
    var d = Math.floor(diff/86400000);
    var h = Math.floor((diff%86400000)/3600000);
    var m = Math.floor((diff%3600000)/60000);
    var s = Math.floor((diff%60000)/1000);
    cdDays.textContent = String(d).padStart(2,'0');
    cdHours.textContent = String(h).padStart(2,'0');
    cdMin.textContent = String(m).padStart(2,'0');
    cdSec.textContent = String(s).padStart(2,'0');
  }
  tickCountdown();
  setInterval(tickCountdown, 1000);

  /* ---------------- cta button scroll to CumaShop ---------------- */
  document.getElementById('ctaBtn').addEventListener('click', function(){
    smoothScrollTo(document.getElementById('cumashop'));
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

  /* ---------------- side + top nav track the active section ---------------- */
  var sideLinks = document.querySelectorAll('.side-nav a');
  var topLinks = document.querySelectorAll('.nav-links a[href^="#"]');
  [
    {sel:'#hero', href:'#top'},
    {sel:'#manifiesto', href:'#manifiesto'},
    {sel:'#productos', href:'#productos'},
    {sel:'#cumashop', href:'#cumashop'},
    {sel:'#fundador', href:'#fundador'},
    {sel:'#contacto', href:'#contacto'}
  ].forEach(function(entry, i){
    var el = document.querySelector(entry.sel);
    if(!el) return;
    ScrollTrigger.create({
      trigger:el, start:'top center', end:'bottom center',
      onToggle:function(self){
        if(!self.isActive) return;
        sideLinks.forEach(function(l,li){ l.classList.toggle('is-active', li===i); });
        topLinks.forEach(function(l){ l.classList.toggle('is-active', l.getAttribute('href')===entry.href); });
      }
    });
  });

  /* ---------------- subtle parallax on framed images ---------------- */
  function addParallax(imgSelector, range){
    var img = document.querySelector(imgSelector);
    if(!img) return;
    gsap.fromTo(img, {yPercent:-range}, {
      yPercent:range, ease:'none',
      scrollTrigger:{ trigger:img.parentElement, start:'top bottom', end:'bottom top', scrub:true }
    });
  }
  addParallax('.ms-frame img', 8);
  if(window.matchMedia('(min-width:761px)').matches){
    addParallax('.hero-photo-frame img', 8);
  }

})();

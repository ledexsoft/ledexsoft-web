(function(){
  "use strict";
  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);

  /* Scope the page-wide grain away while the local Twodo-style grain is active. */
  var productsSection = document.getElementById('productos');
  if(productsSection && 'IntersectionObserver' in window){
    var productsVisibility = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        document.body.classList.toggle('is-products-visible',entry.isIntersecting);
      });
    }, {threshold:0});
    productsVisibility.observe(productsSection);
  }

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

  /* The CumaShop iframe owns its normal scroll. During the pinned horizontal
     handoff, relay only its wheel delta to the parent page so ScrollTrigger can
     keep the product track moving instead of the app consuming the gesture. */
  var cumaFrame=document.querySelector('.wp-screen-preview');
  window.addEventListener('message',function(event){
    if(!cumaFrame || event.origin!==location.origin || event.source!==cumaFrame.contentWindow) return;
    var message=event.data;
    if(!message || message.type!=='cumashop-preview-wheel' || window.getCumaShopWheelOwner?.()!=='page') return;
    var deltaY=Number(message.payload?.deltaY);
    if(!Number.isFinite(deltaY) || deltaY===0) return;
    deltaY=Math.max(-320,Math.min(320,deltaY));
    var targetY=Math.max(0,window.scrollY+deltaY);
    if(lenis) lenis.scrollTo(targetY,{immediate:true,force:true});
    else window.scrollTo(window.scrollX,targetY);
  });

  /* ---------------- progress bar ---------------- */
  gsap.to('.progress-bar', {
    scaleX:1, ease:'none',
    scrollTrigger:{ trigger:document.body, start:'top top', end:'bottom bottom', scrub:0.3 }
  });

  /* ---------------- persistent top navigation ---------------- */
  var nav = document.getElementById('siteNav');
  ScrollTrigger.create({
    trigger:document.body, start:'top -80', end:99999,
    onUpdate:function(self){
      var y = self.scroll();
      nav.classList.toggle('is-scrolled', y > 80);
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
    var cursorFooter = document.querySelector('footer');
    var pointerX = -1, pointerY = -1;
    var cursorRevealed = false;
    function updateFooterCursorVisibility(){
      if(!cursorFooter || pointerX < 0 || pointerY < 0) return;
      var bounds = cursorFooter.getBoundingClientRect();
      var inside = pointerX >= bounds.left && pointerX <= bounds.right &&
        pointerY >= bounds.top && pointerY <= bounds.bottom;
      cursor.classList.toggle('is-footer-hidden',inside);
    }
    window.addEventListener('mousemove', function(e){
      pointerX = e.clientX;
      pointerY = e.clientY;
      xTo(e.clientX); yTo(e.clientY);
      updateFooterCursorVisibility();
      if(!cursorRevealed){ cursorRevealed = true; cursor.classList.add('is-visible'); }
    });
    window.addEventListener('scroll',updateFooterCursorVisibility,{passive:true});
    document.querySelectorAll('[data-cursor]').forEach(function(el){
      el.addEventListener('mouseenter', function(){
        cursor.classList.add('is-active');
        cursor.querySelector('.cursor-label').textContent = el.dataset.cursor || '';
      });
      el.addEventListener('mouseleave', function(){ cursor.classList.remove('is-active'); });
    });
  }

  /* ---------------- cursor-reactive ASCII particle trail ---------------- */
  (function initCursorTrail(){
    var canvas = document.getElementById('cursorTrail');
    var footer = canvas && canvas.closest('footer');
    var pointerDevice = window.matchMedia('(hover:hover) and (pointer:fine)').matches;
    if(!canvas || !footer || !pointerDevice || REDUCED) return;

    var ctx = canvas.getContext('2d');
    if(!ctx) return;

    var cellSize = 9;
    var glyphs = [['.'],['·','.'],['·','•'],['•','·','o'],['o','•'],['o','•','o']];
    var width = 0, height = 0, columns = 0, rows = 0;
    var field = new Float32Array(0), trail = [];
    var pointer = {x:0,y:0}, eased = {x:0,y:0};
    var intensity = 0, opacity = 0, raf = 0, running = false;
    var hasPointer = false, lastFrame = performance.now(), previousBounds = null;

    function colorChannels(name, fallback){
      var value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      var hex = value.match(/^#([\da-f]{3}|[\da-f]{6})$/i);
      if(hex){
        var digits = hex[1].length === 3 ? hex[1].split('').map(function(c){return c+c;}).join('') : hex[1];
        return [0,2,4].map(function(index){return parseInt(digits.slice(index,index+2),16);}).join(', ');
      }
      var rgb = value.match(/rgba?\(\s*(\d+)\D+(\d+)\D+(\d+)/i);
      return rgb ? rgb.slice(1,4).join(', ') : fallback;
    }

    var brightColor = colorChannels('--paper','243, 238, 221');
    var softColor = colorChannels('--mist','159, 180, 168');
    var font = '600 12px ' + getComputedStyle(document.body).fontFamily;

    function resize(){
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = footer.clientWidth;
      height = footer.scrollHeight;
      canvas.width = Math.floor(width*dpr);
      canvas.height = Math.floor(height*dpr);
      ctx.setTransform(dpr,0,0,dpr,0,0);
      ctx.font = font;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      columns = Math.ceil(width/cellSize)+1;
      rows = Math.ceil(height/cellSize)+1;
      field = new Float32Array(columns*rows);
      previousBounds = null;
    }

    function onPointerMove(event){
      var bounds = footer.getBoundingClientRect();
      var inside = event.clientX>=bounds.left && event.clientX<=bounds.right &&
        event.clientY>=bounds.top && event.clientY<=bounds.bottom;
      if(!inside){ intensity=0; return; }
      pointer.x = event.clientX-bounds.left;
      pointer.y = event.clientY-bounds.top;
      if(!hasPointer){
        eased.x = pointer.x;
        eased.y = pointer.y;
        hasPointer = true;
      }
      intensity = 1;
      if(!running){
        running = true;
        lastFrame = performance.now();
        raf = requestAnimationFrame(draw);
      }
    }

    function randomGlyphIndex(column,row,level,count){
      var hash = (0x466f45d*column ^ 0x127409f*row ^ 0x4f9ffb7*level) >>> 0;
      return ((hash ^ (hash >>> 13)) >>> 0) % count;
    }

    function draw(now){
      var delta = Math.min((now-lastFrame)/1000,.05);
      lastFrame = now;
      var frame = Math.floor(now/320);
      eased.x += (pointer.x-eased.x)*.13;
      eased.y += (pointer.y-eased.y)*.13;
      intensity = Math.max(0,intensity-1.2*delta);
      opacity += (intensity-opacity)*Math.min(1,8*delta);
      trail.push({x:eased.x,y:eased.y});
      if(trail.length>115) trail.shift();

      if(previousBounds){
        ctx.clearRect(previousBounds.x,previousBounds.y,previousBounds.width,previousBounds.height);
        previousBounds = null;
      }
      if(opacity<.01 && intensity===0){ running=false; return; }
      if(trail.length<4 || opacity<.01){ raf=requestAnimationFrame(draw); return; }

      var pulse = 1+.07*Math.sin(now/1000*1.6)*(1-intensity);
      var spread = .35+.65*opacity;
      var minColumn=columns,maxColumn=0,minRow=rows,maxRow=0;
      var step=Math.max(1,Math.ceil(trail.length/62));

      for(var i=0;i<trail.length;i+=step){
        var point=trail[i], progress=i/(trail.length-1);
        var radius=(4+34*Math.pow(progress,1.6))*pulse*spread;
        var weight=(.16+Math.pow(progress,1.8))*step*.5;
        var inverse=1/(2*radius*radius), reach=2.2*radius;
        var left=Math.max(0,Math.floor((point.x-reach)/cellSize));
        var right=Math.min(columns-1,Math.ceil((point.x+reach)/cellSize));
        var top=Math.max(0,Math.floor((point.y-reach)/cellSize));
        var bottom=Math.min(rows-1,Math.ceil((point.y+reach)/cellSize));
        if(left>right || top>bottom) continue;
        minColumn=Math.min(minColumn,left); maxColumn=Math.max(maxColumn,right);
        minRow=Math.min(minRow,top); maxRow=Math.max(maxRow,bottom);
        for(var row=top;row<=bottom;row++){
          var dy=cellSize*row+cellSize/2-point.y, rowOffset=row*columns;
          for(var column=left;column<=right;column++){
            var dx=cellSize*column+cellSize/2-point.x;
            field[rowOffset+column]+=weight*Math.exp(-(dx*dx+dy*dy)*inverse);
          }
        }
      }

      if(minColumn>maxColumn){ raf=requestAnimationFrame(draw); return; }
      previousBounds={
        x:(minColumn-1)*cellSize, y:(minRow-1)*cellSize,
        width:(maxColumn-minColumn+3)*cellSize, height:(maxRow-minRow+3)*cellSize
      };
      ctx.globalCompositeOperation='lighter';
      ctx.globalAlpha=opacity;
      for(var y=minRow;y<=maxRow;y++){
        var offset=y*columns, baseline=cellSize*y+cellSize/2;
        for(var x=minColumn;x<=maxColumn;x++){
          var value=field[offset+x];
          field[offset+x]=0;
          if(value<.015) continue;
          var density=1-Math.exp(-1.1*value);
          if(density<.04) continue;
          var level=Math.min(glyphs.length-1,Math.floor(density*glyphs.length));
          var choices=glyphs[level];
          var glyph=choices[randomGlyphIndex(x,y,frame+level,choices.length)];
          if(density>.86) ctx.fillStyle='rgba(255, 138, 60, '+(.7+.3*density)+')';
          else if(density>.58) ctx.fillStyle='rgba(255, 69, 0, '+(.35+.6*density)+')';
          else if(density>.28) ctx.fillStyle='rgba('+brightColor+', '+(.1+.85*density)+')';
          else ctx.fillStyle='rgba('+softColor+', '+(.08+.9*density)+')';
          ctx.fillText(glyph,cellSize*x+cellSize/2,baseline);
        }
      }
      ctx.globalAlpha=1;
      ctx.globalCompositeOperation='source-over';
      raf=requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener('resize',resize,{passive:true});
    window.addEventListener('pointermove',onPointerMove,{passive:true});
    if(window.ResizeObserver){ new ResizeObserver(resize).observe(footer); }
    if(document.fonts && document.fonts.load) document.fonts.load(font).then(function(){ctx.font=font;});
  })();

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
      var img = card.querySelector('.wp-visual') || card.querySelector('img');
      var screenFrame = card.querySelector('.wp-screen-preview');
      var isCumaShop = card.classList.contains('wp-media--cumashop');
      var isPymepedia = card.classList.contains('wp-media--pymepedia');
      var maxTilt = isCumaShop ? 9 : (isPymepedia ? 9 : 16);
      var hoverScale = isCumaShop ? 1.03 : (isPymepedia ? 1.035 : 1.06);
      var framePointerInside = false;
      var leaveResetTimer = 0;
      function tiltFromPoint(clientX,clientY,reference){
        var r = (reference || card).getBoundingClientRect();
        var px = Math.max(-.5,Math.min(.5,(clientX - r.left)/r.width - 0.5));
        var py = Math.max(-.5,Math.min(.5,(clientY - r.top)/r.height - 0.5));
        gsap.to(img, {rotateY:px*maxTilt, rotateX:-py*maxTilt, scale:hoverScale, duration:.6, ease:'power3', transformPerspective:600});
      }
      card.addEventListener('mousemove', function(e){
        framePointerInside = false;
        window.clearTimeout(leaveResetTimer);
        tiltFromPoint(e.clientX,e.clientY);
      });
      if(screenFrame){
        window.addEventListener('message',function(event){
          if(event.origin!==location.origin || event.source!==screenFrame.contentWindow) return;
          if(event.data?.type==='cumashop-preview-pointer-leave'){
            framePointerInside = false;
            if(!card.matches(':hover')) gsap.to(img, {rotateY:0, rotateX:0, scale:1, duration:.8, ease:'power3', transformPerspective:600});
            return;
          }
          if(event.data?.type!=='cumashop-preview-pointer') return;
          var pointer=event.data.payload;
          if(!pointer || !Number.isFinite(pointer.x) || !Number.isFinite(pointer.y)) return;
          framePointerInside = true;
          window.clearTimeout(leaveResetTimer);
          var r=screenFrame.getBoundingClientRect();
          tiltFromPoint(r.left+pointer.x*r.width,r.top+pointer.y*r.height,img);
        });
      }
      card.addEventListener('mouseleave', function(){
        window.clearTimeout(leaveResetTimer);
        leaveResetTimer=window.setTimeout(function(){
          if(!framePointerInside) gsap.to(img, {rotateY:0, rotateX:0, scale:1, duration:.8, ease:'power3', transformPerspective:600});
        },100);
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
      closeMenu();
      smoothScrollTo(target);
    });
  });

  /* ---------------- mobile menu ---------------- */
  var burger = document.getElementById('burgerBtn');
  var mobileMenu = document.getElementById('mobileMenu');
  function setMenu(open){
    document.body.classList.toggle('menu-open', open);
    mobileMenu.inert = !open;
    burger.setAttribute('aria-expanded', open ? 'true':'false');
    burger.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  }
  function closeMenu(){ setMenu(false); }
  burger.addEventListener('click', function(){
    var open = !document.body.classList.contains('menu-open');
    setMenu(open);
    if(open) mobileMenu.querySelector('a').focus();
  });
  document.addEventListener('keydown', function(e){
    if(!document.body.classList.contains('menu-open')) return;
    if(e.key === 'Escape'){ closeMenu(); burger.focus(); }
    if(e.key === 'Tab'){
      var items = [burger].concat(Array.from(mobileMenu.querySelectorAll('a')));
      var i = items.indexOf(document.activeElement);
      if(e.shiftKey && i === 0){ e.preventDefault(); items[items.length-1].focus(); }
      else if(!e.shiftKey && i === items.length-1){ e.preventDefault(); items[0].focus(); }
    }
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
  function splitScrollRevealWords(el){
    if(el.dataset.cumashopSplit==='1') return Array.prototype.slice.call(el.querySelectorAll('.cumashop-reveal-word'));
    el.dataset.cumashopSplit='1';
    var walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);
    var nodes=[];
    while(walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function(node){
      var value=node.nodeValue;
      if(!value || !value.trim()) return;
      var fragment=document.createDocumentFragment();
      var parts=value.match(/\s+|\S+/g)||[];
      parts.forEach(function(part){
        if(/^\s+$/.test(part)) fragment.appendChild(document.createTextNode(part));
        else {
          var word=document.createElement('span');
          word.className='cumashop-reveal-word';
          word.textContent=part;
          word.setAttribute('data-word',part);
          fragment.appendChild(word);
        }
      });
      node.parentNode.replaceChild(fragment,node);
    });
    return Array.prototype.slice.call(el.querySelectorAll('.cumashop-reveal-word'));
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
  var wipeCardCounts = {small:8,medium:16,large:20};
  var wipeAppNames = ['CumaShop','Pymepedia','Ledexia'];
  var wipeCardSets = {
    small:wipeCardCounts.small,
    medium:wipeCardCounts.medium,
    large:wipeCardCounts.large
  };
  var wipeRingSettings = [
    {name:'small',direction:1,rotation:180},
    {name:'medium',direction:-1,rotation:135},
    {name:'large',direction:1,rotation:90}
  ];
  wipeRingSettings.forEach(function(config){
    var ring = document.querySelector('[data-wipe-orbit="'+config.name+'"]');
    if(!ring) return;
    var cardCount = wipeCardSets[config.name] || 0;
    for(var index=0;index<cardCount;index++){
      var item = document.createElement('span');
      item.className = 'wipe-orbit-item';
      item.style.setProperty('--angle',(index * (360/cardCount))+'deg');
      var tile = document.createElement('span');
      tile.className = 'wipe-orbit-card';
      var name = document.createElement('span');
      name.className = 'wipe-orbit-name';
      name.textContent = wipeAppNames[index % wipeAppNames.length];
      tile.appendChild(name);
      item.appendChild(tile);
      ring.appendChild(item);
    }
  });

  if(REDUCED){
    gsap.set('.wipe-panel', {clipPath:'circle(145vmax at 50% 50%)'});
    gsap.set(['.wipe-orbit-field','.wipe-word'], {opacity:1});
  } else {
    var wipeTimeline = gsap.timeline({
      scrollTrigger:{ trigger:'.wipe', start:'top top', end:'+=160%', scrub:.6, pin:true }
    });
    wipeTimeline.to('.wipe-panel', {clipPath:'circle(145vmax at 50% 50%)', duration:.78, ease:'none'}, 0);
    wipeTimeline.to('.wipe-orbit-field', {opacity:1, duration:.2, ease:'none'}, .22);
    wipeTimeline.to('.wipe-orbit-field', {opacity:0, duration:.55, ease:'none'}, 1.05);
    wipeTimeline.to('.wipe-word', {opacity:1, duration:.2, ease:'none'}, .34);
    wipeRingSettings.forEach(function(config){
      var ring = document.querySelector('[data-wipe-orbit="'+config.name+'"]');
      if(!ring) return;
      var finalAngle = config.rotation*config.direction;
      var cruiseDuration = .62;
      var settleDuration = .20;
      var angularSpeed = config.rotation/.78;
      var cruiseAngle = finalAngle+config.direction*angularSpeed*cruiseDuration;
      var stopAngle = cruiseAngle+config.direction*angularSpeed*settleDuration*.5;
      wipeTimeline.to(ring, {rotation:finalAngle, duration:.78, ease:'none'}, 0);
      wipeTimeline.to(ring, {rotation:cruiseAngle, duration:cruiseDuration, ease:'none'}, .78);
      wipeTimeline.to(ring, {rotation:stopAngle, duration:settleDuration, ease:'power1.out'}, .78+cruiseDuration);
    });
    wipeTimeline.to('.wipe-copy', {y:'-22vh', opacity:0, duration:.55, ease:'power2.inOut'}, 1.05);
    wipeTimeline.to('.wipe-orbit-center', {y:'-22vh', duration:.55, ease:'power2.inOut'}, 1.05);
  }

  /* ---------------- manifesto scroll-scrub reveal ---------------- */
  var manifestoWords = splitWords(document.getElementById('manifestoText'));
  gsap.timeline({
    scrollTrigger:{ trigger:'#manifiesto', start:'top 75%', end:'bottom 80%', scrub:.6 }
  }).to(manifestoWords, { opacity:1, stagger:.04, ease:'none' });

  /* ---------------- productos horizontal pin ---------------- */
  var mm = gsap.matchMedia();
  mm.add('(min-width:900px)', function(){
    var track = document.getElementById('workTrack');
    var dots = document.querySelectorAll('#workProgress span');
    var hint = document.getElementById('workHint');
    var count = track.querySelectorAll('.work-panel').length;
    var copyArea = document.getElementById('cumashopCopyArea');
    var intro = document.getElementById('cumashopIntro');
    var chapters = Array.prototype.slice.call(document.querySelectorAll('#cumashopStory .cumashop-chapter'));
    var chapterReveals = chapters.map(function(chapter){
      var textNodes=Array.prototype.slice.call(chapter.querySelectorAll('.cumashop-chapter__number,.cumashop-chapter__eyebrow,h4,p'));
      var words=[];
      textNodes.forEach(function(node){ words=words.concat(splitScrollRevealWords(node)); });
      return {words:words};
    });
    var distance = function(){ return Math.max(0,track.scrollWidth - window.innerWidth); };
    var storyStart = .22;
    var storyStepPixels = function(){ return Math.max(420,window.innerHeight*.68); };
    var revealDuration = .68;
    var readingHold = .7/.68;
    var chapterInterval = revealDuration + readingHold;
    var chapterTweenDuration = .24;
    var storyEnd = storyStart + chapters.length*chapterInterval + chapterTweenDuration;
    var horizontalHandoffStart = storyEnd - .12;
    var setWheelOwnerForStory = function(time){
      if(window.setCumaShopWheelOwner) window.setCumaShopWheelOwner(time>=horizontalHandoffStart?'page':'app');
    };
    var setActiveChapter = function(index){
      chapters.forEach(function(chapter,i){
        var active=i===index;
        chapter.classList.toggle('is-active',active);
        chapter.setAttribute('aria-current',active?'step':'false');
      });
    };
    var updateChapterReveal = function(time){
      chapterReveals.forEach(function(reveal,index){
        var start=storyStart+index*chapterInterval;
        var progress=Math.max(0,Math.min(1,(time-start)/revealDuration));
        var hasEntered=time>=start;
        reveal.words.forEach(function(word,wordIndex){
          var threshold=reveal.words.length>1 ? wordIndex/(reveal.words.length-1) : 0;
          var active=hasEntered && progress*1.0001>threshold;
          if(active) word.setAttribute('data-cumashop-reveal-active','');
          else word.removeAttribute('data-cumashop-reveal-active');
        });
      });
    };

    if(copyArea && intro && chapters.length){
      copyArea.classList.add('is-story-pinned');
      gsap.set(intro,{autoAlpha:1,y:0});
      gsap.set(chapters,{autoAlpha:0,y:24});
      setActiveChapter(-1);
    }

    var horizontalTween;
    var story = gsap.timeline({
      onUpdate:function(){
        var time=story.time();
        setWheelOwnerForStory(time);
        if(!chapters.length) return;
        updateChapterReveal(time);
        if(time<storyStart) setActiveChapter(-1);
        else if(time>=storyEnd) setActiveChapter(-1);
        else setActiveChapter(Math.min(chapters.length-1,Math.floor((time-storyStart)/chapterInterval)));
        if(hint && time>.04 && !hint.dataset.hidden){
          hint.dataset.hidden='1';
          gsap.to(hint,{opacity:0,duration:.4});
        }
      },
      scrollTrigger:{
        trigger:'#workPin',
        start:'top top',
        end:function(){ return '+='+(storyEnd*storyStepPixels()+distance()); },
        scrub:true,
        pin:true,
        invalidateOnRefresh:true,
        onRefreshInit:function(){
          if(horizontalTween) horizontalTween.duration(distance()/storyStepPixels());
        },
        onLeave:function(){ if(window.setCumaShopWheelOwner) window.setCumaShopWheelOwner('app'); },
        onLeaveBack:function(){ if(window.setCumaShopWheelOwner) window.setCumaShopWheelOwner('app'); },
        onUpdate:function(){
          var total=distance();
          var x=Number(gsap.getProperty(track,'x'))||0;
          var progress=total?Math.max(0,Math.min(1,-x/total)):0;
          var idx=Math.min(count-1,Math.round(progress*(count-1)));
          dots.forEach(function(dot,i){ dot.classList.toggle('is-on',i===idx); });
        }
      }
    });

    if(chapters.length){
      story.to(intro,{autoAlpha:0,y:-18,duration:.16,ease:'power1.in'},storyStart-.16);
      chapters.forEach(function(chapter,index){
        var start=storyStart+index*chapterInterval;
        story.to(chapter,{autoAlpha:1,y:0,duration:chapterTweenDuration,ease:'power2.out'},start);
        story.to(chapter,{autoAlpha:0,y:-18,duration:chapterTweenDuration,ease:'power2.in'},start+chapterInterval);
      });
    }

    horizontalTween=story.to(track,{
      x:function(){ return -distance(); },
      duration:distance()/storyStepPixels(),
      ease:'none'
    },storyEnd);

    return function(){
      if(window.setCumaShopWheelOwner) window.setCumaShopWheelOwner('app');
      if(story.scrollTrigger) story.scrollTrigger.kill();
      story.kill();
      if(copyArea) copyArea.classList.remove('is-story-pinned');
      if(intro) gsap.set(intro,{clearProps:'all'});
      if(chapters.length){
        gsap.set(chapters,{clearProps:'all'});
        setActiveChapter(-1);
      }
      if(hint) gsap.set(hint,{clearProps:'opacity'});
    };
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

  /* ---------------- top nav tracks the active section ---------------- */
  var topLinks = document.querySelectorAll('.nav-links a[href^="#"]');
  [
    {sel:'#hero', href:'#top'},
    {sel:'#manifiesto', href:'#manifiesto'},
    {sel:'#productos', href:'#productos'},
    {sel:'#cumashop', href:'#cumashop'},
    {sel:'#fundador', href:'#fundador'},
    {sel:'#contacto', href:'#contacto'}
  ].forEach(function(entry){
    var el = document.querySelector(entry.sel);
    if(!el) return;
    ScrollTrigger.create({
      trigger:el, start:'top center', end:'bottom center',
      onToggle:function(self){
        if(!self.isActive) return;
        topLinks.forEach(function(l){ l.classList.toggle('is-active', l.getAttribute('href')===entry.href); });
      }
    });
  });

  /* ---------------- subtle parallax on hero image ---------------- */
  function addParallax(imgSelector, range){
    var img = document.querySelector(imgSelector);
    if(!img) return;
    gsap.fromTo(img, {yPercent:-range}, {
      yPercent:range, ease:'none',
      scrollTrigger:{ trigger:img.parentElement, start:'top bottom', end:'bottom top', scrub:true }
    });
  }
  if(window.matchMedia('(min-width:761px)').matches){
    addParallax('.hero-photo-frame img', 8);
  }

})();

window.installManifestoTextEffect=function(){

  var section=document.getElementById('manifiesto');
  var text=document.getElementById('manifestoText');
  var reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  if(!section || !text || !window.gsap || !window.ScrollTrigger || reduced.matches) return;

  gsap.registerPlugin(ScrollTrigger);

  var copy=text.textContent.replace(/\s+/g,' ').trim();
  if(!copy) return;

  var finalColor=getComputedStyle(text).color;
  var accessible=document.createElement('span');
  accessible.className='sr-only';
  accessible.textContent=copy;

  var visual=document.createElement('span');
  visual.setAttribute('aria-hidden','true');
  visual.className='manifesto-text__visual';

  var chars=[];
  (copy.match(/\s+|\S+/g)||[]).forEach(function(token){
    if(/^\s+$/.test(token)){
      visual.appendChild(document.createTextNode(token));
      return;
    }
    var word=document.createElement('span');
    word.className='manifesto-text__word';
    word.style.cssText='display:inline-block;white-space:nowrap';
    Array.from(token).forEach(function(character){
      var span=document.createElement('span');
      span.className='manifesto-char';
      span.textContent=character;
      word.appendChild(span);
      chars.push(span);
    });
    visual.appendChild(word);
  });

  text.replaceChildren(accessible,visual);
  gsap.set(chars,{
    color:'rgba(140,143,136,.45)',
    scale:1,
    rotation:0,
    display:'inline-block',
    transformOrigin:'center center',
    textShadow:'0 0 0 rgba(255,84,0,0)',
    willChange:'transform,color',
    backfaceVisibility:'hidden'
  });

  function pinDistance(){
    if(window.innerWidth<480) return 1150;
    if(window.innerWidth<992) return 1550;
    return 2200;
  }

  function exitTail(){
    return Math.round(window.innerHeight*.36);
  }

  function startOffset(){
    var available=window.innerHeight-text.getBoundingClientRect().height-32;
    return Math.round(Math.max(72,Math.min(window.innerHeight*.22,available)));
  }

  function animationStartOffset(){
    return Math.round(window.innerHeight*.70);
  }

  function documentTop(element){
    var top=0;
    while(element){
      top+=element.offsetTop;
      element=element.offsetParent;
    }
    return top;
  }

  var textRevealProgress=0;

  var pinTrigger=ScrollTrigger.create({
    trigger:text,
    start:function(){ return 'top '+startOffset()+'px'; },
    end:function(){ return '+='+(pinDistance()+exitTail()); },
    pin:section,
    pinSpacing:true,
    anticipatePin:1,
    invalidateOnRefresh:true,
    onUpdate:updateImageReveal
  });

  function updateImageReveal(){
    var image=section.querySelector('.project-image');
    var surface=section.querySelector('.portfolio-surface');
    var pinProgress=pinTrigger.progress;
    if(surface) surface.style.opacity='1';
    if(!image) return;
    if(!pinTrigger.isActive && pinProgress===0){
      window.__manifestoApricodeRevealOverride=0;
      return;
    }
    var top=image.getBoundingClientRect().top;
    var base=Math.max(0,Math.min(1,(window.innerHeight-top)/(window.innerHeight*1.4)));
    var imageProgress=Math.min(1,textRevealProgress*2);
    window.__manifestoApricodeRevealOverride=base+(1-base)*imageProgress;
  }

  var timeline=gsap.timeline({
    scrollTrigger:{
      trigger:text,
      start:function(){ return 'top '+animationStartOffset()+'px'; },
      end:function(){
        var preRoll=Math.max(0,animationStartOffset()-startOffset());
        return '+='+(pinDistance()+preRoll);
      },
      scrub:window.innerWidth<992?.6:.8,
      invalidateOnRefresh:true,
      fastScrollEnd:true,
      preventOverlaps:true,
      onUpdate:function(self){
        textRevealProgress=self.progress;
        updateImageReveal();
        if(pinTrigger.isActive){
          document.querySelectorAll('.nav-links a[href^="#"]').forEach(function(link){
            link.classList.toggle('is-active',link.getAttribute('href')==='#manifiesto');
          });
        }
      }
    }
  });

  var exitTween=gsap.to(section.querySelector('.wrap'),{
    y:-60,
    scale:.94,
    opacity:.3,
    ease:'none',
    onUpdate:function(){
      var surface=section.querySelector('.portfolio-surface');
      if(!surface) return;
      var progress=this.progress();
      gsap.set(surface,{
        y:-60*progress,
        scale:1-.06*progress,
        opacity:1-.7*progress
      });
    },
    scrollTrigger:{
      trigger:section,
      start:function(){ return pinTrigger.end; },
      end:function(){
        var sectionBottom=documentTop(section)+section.offsetHeight;
        return '+='+Math.max(1,sectionBottom-pinTrigger.start);
      },
      scrub:true,
      invalidateOnRefresh:true
    }
  });

  var letterAnimSpan=85;
  chars.forEach(function(char,index){
    var startTime=(index/chars.length)*letterAnimSpan;
    timeline.to(char,{
      color:'#ff5400',
      scale:1.12,
      rotation:function(){ return gsap.utils.random(-4,4); },
      textShadow:'0.6px 0.6px 0 #ff5400, -0.6px -0.6px 0 #ff5400, 0.6px -0.6px 0 #ff5400, -0.6px 0.6px 0 #ff5400',
      duration:3.5,
      ease:'power1.out'
    },startTime);
    timeline.to(char,{
      color:finalColor,
      scale:1,
      rotation:0,
      textShadow:'0 0 0 rgba(0,0,0,0)',
      duration:3.5,
      ease:'power1.inOut'
    },startTime+3.5);
  });

  window.addEventListener('pagehide',function(){
    timeline.scrollTrigger&&timeline.scrollTrigger.kill();
    timeline.kill();
    pinTrigger.kill();
    exitTween.scrollTrigger&&exitTween.scrollTrigger.kill();
    exitTween.kill();
  },{once:true});
};

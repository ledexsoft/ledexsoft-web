/* Keep the original Apricode image effect independent from the GSAP page bundle. */
(function(){
  'use strict';
  var section=document.querySelector('#manifiesto');
  if(!section || !section.querySelector('.project-image img')) return;

  window.__manifestoApricodeRevealOverride=0;
  var started=false;

  function startEffect(){
    if(started) return;
    started=true;
    import('../assets/apricode/portfolio-sheets-MgpdmwSY.js?v=4')
      .then(function(module){
        var controller=module.createPortfolioSheets({
          section:section,
          blocked:function(){return document.hidden;},
          revealProgress:function(){return window.__manifestoApricodeRevealOverride||0;}
        });
        if(!controller) return;
        window.__manifestoApricodeSheet=controller;
        window.addEventListener('pagehide',function(){
          controller.dispose();
          delete window.__manifestoApricodeRevealOverride;
          if(window.__manifestoApricodeSheet===controller) delete window.__manifestoApricodeSheet;
        },{once:true});
      })
      .catch(function(error){ console.error('No se pudo iniciar el efecto WebGL original de Apricode en el manifiesto.',error); });
  }

  // Defer Three.js and the image textures until the manifesto is approaching.
  // The Apricode runtime already budgets the drawing buffer and pauses its RAF offscreen.
  if('IntersectionObserver' in window){
    var observer=new IntersectionObserver(function(records){
      if(!records.some(function(record){return record.isIntersecting;})) return;
      observer.disconnect();
      startEffect();
    },{rootMargin:'150% 0px'});
    observer.observe(section);
  }else{
    startEffect();
  }
})();

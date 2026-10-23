/* Keep the original Apricode image effect independent from the GSAP page bundle. */
(function(){
  'use strict';
  var section=document.querySelector('#manifiesto');
  if(!section || !section.querySelector('.project-image img')) return;

  import('../assets/apricode/portfolio-sheets-MgpdmwSY.js?v=2')
    .then(function(module){
      var controller=module.createPortfolioSheets({section:section,blocked:function(){return document.hidden;}});
      if(!controller) return;
      window.__manifestoApricodeSheet=controller;
      window.addEventListener('pagehide',function(){
        controller.dispose();
        if(window.__manifestoApricodeSheet===controller) delete window.__manifestoApricodeSheet;
      },{once:true});
    })
    .catch(function(error){ console.error('No se pudo iniciar el efecto WebGL original de Apricode en el manifiesto.',error); });
})();

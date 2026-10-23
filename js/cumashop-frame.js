(function(){
  'use strict';
  var frame=document.querySelector('.wp-screen-preview');
  if(!frame) return;
  var status=document.getElementById('cumashopScreenStatus');
  var screen=frame.closest('.wp-device-screen');
  var initialized=false;
  var started=false;
  var wheelOwner='app';
  var splashExitTimer=0;
  var splashFailsafeTimer=0;
  var appUrl=frame.dataset.src;
  frame.removeAttribute('src');

  function startFrame(){
    if(started) return;
    started=true;
    initialized=false;
    if(screen) screen.classList.add('is-loading');
    splashFailsafeTimer=window.setTimeout(markReady,5000);
    if(appUrl) frame.src=appUrl;
  }
  function sendHostInit(){
    if(initialized || !frame.contentWindow) return;
    initialized=true;
    frame.contentWindow.postMessage({type:'cumashop:host',action:'init'},location.origin==='null'?'*':location.origin);
  }
  function sendWheelOwner(){
    if(!frame.contentWindow) return;
    frame.contentWindow.postMessage({type:'cumashop:host',action:'scroll-mode',owner:wheelOwner},location.origin==='null'?'*':location.origin);
  }
  window.setCumaShopWheelOwner=function(owner){
    if(owner!=='app' && owner!=='page') return;
    if(wheelOwner===owner) return;
    wheelOwner=owner;
    sendWheelOwner();
  };
  window.getCumaShopWheelOwner=function(){ return wheelOwner; };
  function markReady(){
    if(!started || !screen || screen.classList.contains('is-ready')) return;
    window.clearTimeout(splashExitTimer);
    window.clearTimeout(splashFailsafeTimer);
    screen.classList.remove('is-loading');
    screen.classList.add('is-ready');
  }
  function scheduleSplashExit(){
    if(!started || !screen || screen.classList.contains('is-ready') || splashExitTimer) return;
    splashExitTimer=window.setTimeout(markReady,850);
  }

  window.addEventListener('message',function(event){
    if(event.origin!==location.origin || event.source!==frame.contentWindow) return;
    var message=event.data;
    if(!message || typeof message.type!=='string') return;
    if(message.type==='cumashop:ready'){
      sendHostInit();
      sendWheelOwner();
      scheduleSplashExit();
      return;
    }
    if(message.type==='cumashop:state' && status){
      var payload=message.payload || {};
      var view=typeof payload.viewLabel==='string' ? payload.viewLabel : 'Inicio';
      var count=Number(payload.cartCount) || 0;
      status.textContent='CumaShop · '+view+' · '+count+(count===1?' producto':' productos')+' en el carrito.';
    }
  });
  frame.addEventListener('load',function(){
    if(!started) return;
    sendHostInit();
    sendWheelOwner();
    scheduleSplashExit();
  });

  var loadTarget=frame.closest('.wp-media--cumashop') || frame;
  if('IntersectionObserver' in window){
    var frameObserver=new IntersectionObserver(function(entries){
      if(entries.some(function(entry){ return entry.isIntersecting; })){
        frameObserver.disconnect();
        startFrame();
      }
    },{rootMargin:'900px 0px',threshold:0});
    frameObserver.observe(loadTarget);
  }else{
    var checkNearFrame=function(){
      var rect=loadTarget.getBoundingClientRect();
      if(rect.top < window.innerHeight+900 && rect.bottom > -900){
        window.removeEventListener('scroll',checkNearFrame);
        window.removeEventListener('resize',checkNearFrame);
        startFrame();
      }
    };
    window.addEventListener('scroll',checkNearFrame,{passive:true});
    window.addEventListener('resize',checkNearFrame);
    checkNearFrame();
  }
})();

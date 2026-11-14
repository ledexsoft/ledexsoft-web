(function(){
  'use strict';

  var canvas=document.getElementById('heroGlobe');
  var hero=document.getElementById('hero');
  if(!canvas||!hero) return;
  var ctx=canvas.getContext('2d',{alpha:true,desynchronized:true});
  if(!ctx) return;

  var reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var small=window.matchMedia('(max-width: 767px)').matches;
  var dpr=Math.min(window.devicePixelRatio||1,1.25);
  var width=0,height=0,radius=0,cx=0,cy=0,rotation=0,last=0,lastDraw=0,frame=0,visible=true;
  var points=[],routes=[];
  var regions=[
    [58,-122,13,32],[48,-102,14,28],[35,-82,12,23],[12,-76,12,20],
    [52,12,12,34],[30,22,20,25],[10,20,14,23],[-24,25,20,24],
    [45,78,18,34],[28,112,17,28],[8,128,13,22],[-25,135,15,26]
  ];
  var colors=[[86,97,255],[177,75,255],[255,0,109]];

  function random(seed){
    var value=seed>>>0;
    return function(){value=(value+0x6D2B79F5)|0;var t=Math.imul(value^value>>>15,1|value);t^=t+Math.imul(t^t>>>7,61|t);return((t^t>>>14)>>>0)/4294967296;};
  }
  var rand=random(851903);
  function nearRegion(lat,lon){
    for(var i=0;i<regions.length;i++){
      var area=regions[i],dx=lon-area[1];
      dx=((dx+180)%360+360)%360-180;
      var x=dx/area[3],y=(lat-area[0])/area[2];
      if(x*x+y*y<=1) return true;
    }
    return false;
  }
  function buildPoints(){
    points=[];routes=[];
    // A coarser grid keeps the globe detailed while avoiding thousands of
    // Canvas path allocations on every display refresh, especially on mobile.
    var latCount=small?22:42,lonCount=small?44:84;
    for(var row=1;row<latCount;row++){
      var lat=row/latCount*180-90,phi=lat*Math.PI/180;
      for(var col=0;col<lonCount;col++){
        var lon=col/lonCount*360-180,theta=lon*Math.PI/180;
        points.push([Math.cos(phi)*Math.cos(theta),Math.sin(phi),Math.cos(phi)*Math.sin(theta),nearRegion(lat,lon)]);
      }
    }
    var lit=points.filter(function(p){return p[3];}),tries=0;
    while(routes.length<11&&tries++<700){
      var from=lit[Math.floor(rand()*lit.length)],to=lit[Math.floor(rand()*lit.length)];
      var dx=from[0]-to[0],dy=from[1]-to[1],dz=from[2]-to[2];
      if(Math.hypot(dx,dy,dz)>1.05) routes.push({from:from,to:to,offset:rand(),color:colors[routes.length%colors.length]});
    }
  }
  function resize(){
    var rect=hero.getBoundingClientRect();
    width=rect.width;height=rect.height;
    canvas.width=Math.max(1,Math.round(width*dpr));
    canvas.height=Math.max(1,Math.round(height*dpr));
    ctx.setTransform(dpr,0,0,dpr,0,0);
    radius=Math.min(width*.46,760);cx=width/2;cy=height*.46;
    draw(performance.now());
  }
  function rotateY(p,a){var c=Math.cos(a),s=Math.sin(a);return[p[0]*c+p[2]*s,p[1],-p[0]*s+p[2]*c];}
  function rotateX(p,a){var c=Math.cos(a),s=Math.sin(a);return[p[0],p[1]*c-p[2]*s,p[1]*s+p[2]*c];}
  function project(p){
    var q=rotateX(rotateY(p,rotation),-.34);
    return[cx+q[0]*radius,cy-q[1]*radius,q[2]];
  }
  function draw(timestamp){
    if(!width||!height) return;
    ctx.clearRect(0,0,width,height);
    ctx.lineWidth=1;

    for(var ring=0;ring<3;ring++){
      var tilt=.45+ring*.4,started=false;
      ctx.beginPath();
      for(var step=0;step<=96;step++){
        var angle=step/96*Math.PI*2;
        var point=[1.06*Math.cos(angle),0,1.06*Math.sin(angle)];
        var rotated=rotateX(rotateY(rotateX(point,tilt),rotation*(.7+.15*ring)+1.1*ring),-.34);
        var x=cx+rotated[0]*radius,y=cy-rotated[1]*radius;
        if(rotated[2]<-.04){started=false;continue;}
        if(started) ctx.lineTo(x,y); else{ctx.moveTo(x,y);started=true;}
      }
      ctx.strokeStyle='rgba(222,226,255,.055)';ctx.stroke();
    }

    for(var i=0;i<points.length;i++){
      var point=points[i],screen=project(point);
      if(screen[2]<-.12) continue;
      var depth=(screen[2]+1)/2;
      ctx.fillStyle=point[3]?'rgba(244,244,255,'+(.09+.26*depth).toFixed(3)+')':'rgba(232,235,255,'+(.014+.038*depth).toFixed(3)+')';
      ctx.beginPath();ctx.arc(screen[0],screen[1],point[3]?.8+.9*depth:.5+.35*depth,0,Math.PI*2);ctx.fill();
    }

    var elapsed=reduced?0:timestamp;
    for(var r=0;r<routes.length;r++){
      var route=routes[r],start=project(route.from),end=project(route.to);
      if(start[2]<-.25&&end[2]<-.25) continue;
      var mx=(route.from[0]+route.to[0])/2,my=(route.from[1]+route.to[1])/2,mz=(route.from[2]+route.to[2])/2;
      var length=Math.hypot(mx,my,mz)||1,control=project([mx/length*1.4,my/length*1.4,mz/length*1.4]);
      ctx.strokeStyle='rgba(235,237,255,.055)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(start[0],start[1]);ctx.quadraticCurveTo(control[0],control[1],end[0],end[1]);ctx.stroke();
      var rgb=route.color.join(','),progress=(elapsed/4200+route.offset)%1;
      for(var trail=0;trail<5;trail++){
        var t=progress-.04*trail;if(t<0||t>1) continue;
        var inv=1-t,x=inv*inv*start[0]+2*inv*t*control[0]+t*t*end[0],y=inv*inv*start[1]+2*inv*t*control[1]+t*t*end[1];
        if(trail===0){var halo=ctx.createRadialGradient(x,y,0,x,y,13);halo.addColorStop(0,'rgba('+rgb+',.30)');halo.addColorStop(1,'rgba('+rgb+',0)');ctx.fillStyle=halo;ctx.beginPath();ctx.arc(x,y,13,0,Math.PI*2);ctx.fill();}
        ctx.fillStyle=trail===0?'rgba(255,255,255,.78)':'rgba('+rgb+','+(.4*(1-trail/5)).toFixed(3)+')';
        ctx.beginPath();ctx.arc(x,y,trail===0?1.9:1.2,0,Math.PI*2);ctx.fill();
      }
    }
  }
  function animate(timestamp){
    frame=0;
    if(!visible||document.hidden) return;
    if(!last) last=timestamp;
    var frameInterval=small?1000/22:1000/30;
    if(timestamp-lastDraw<frameInterval){frame=requestAnimationFrame(animate);return;}
    var delta=Math.min(100,timestamp-last);last=timestamp;lastDraw=timestamp;
    if(!reduced) rotation+=delta*(small?.000055:.00009);
    draw(timestamp);
    if(!reduced) frame=requestAnimationFrame(animate);
  }
  function start(){if(!frame&&!reduced&&visible&&!document.hidden){last=0;lastDraw=0;frame=requestAnimationFrame(animate);}}
  function stop(){if(frame){cancelAnimationFrame(frame);frame=0;}last=0;lastDraw=0;}

  buildPoints();resize();
  if('ResizeObserver'in window) new ResizeObserver(resize).observe(hero); else window.addEventListener('resize',resize,{passive:true});
  if('IntersectionObserver'in window){
    new IntersectionObserver(function(entries){visible=entries[0].isIntersecting;if(visible) start();else stop();},{rootMargin:'120px'}).observe(hero);
  }
  document.addEventListener('visibilitychange',function(){if(document.hidden) stop();else start();});
  start();
})();

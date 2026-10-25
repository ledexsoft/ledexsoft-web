(function(){
  "use strict";
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches||!window.gsap||!window.ScrollTrigger) return;
  var boxes=Array.prototype.slice.call(document.querySelectorAll('.founder-photo'));
  if(!boxes.length) return;
  var states=[];
  var vs='attribute vec2 aPos; attribute vec2 aUv; uniform float uProgress; varying vec2 vUv; varying float vShade;\n'+
    'void main(){float p=clamp(uProgress,0.,1.);vec2 dir=normalize(vec2(.78,-.62));float tmax=abs(dir.x)+abs(dir.y);float L=2.*tmax;float Lp=L;float t=dot(aPos,dir);float nn=-aPos.x*dir.y+aPos.y*dir.x;float e=tmax-t;float twist=.12;float ec=(p*(1.+abs(twist))-abs(twist)*.5+twist*(nn/Lp))*L;float d=e-ec;float x=t;float z=0.;float k=1.42/L;if(d>0.){float dc=min(d,2.93/k);float phi=k*dc;x=tmax-ec-sin(phi)/k;z=(1.-cos(phi))/k;if(d>2.93/k){float extra=d-2.93/k;x-=cos(phi)*extra;z+=sin(phi)*extra;}}float lift=(1.-p)*.07*sin((aUv.x+aUv.y)*6.2831853+p*4.);z+=lift;vec2 curved=vec2(x*dir.x-nn*dir.y,x*dir.y+nn*dir.x);float perspective=1.+z*.24;gl_Position=vec4(curved/perspective,0.,1.);vUv=aUv;vShade=clamp(.84+.16*cos(min(d,2.93/k)*k),.68,1.);}\n';
  var fs='precision mediump float; uniform sampler2D uTex; varying vec2 vUv; varying float vShade; void main(){vec4 c=texture2D(uTex,vec2(vUv.x,1.-vUv.y));gl_FragColor=vec4(c.rgb*vShade,c.a);}';

  function shader(gl,type,source){var s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
  function makeState(box){
    var img=box.querySelector('img');if(!img||!img.complete||!img.naturalWidth)return null;
    var canvas=document.createElement('canvas');canvas.className='founder-paper-canvas';canvas.setAttribute('aria-hidden','true');
    canvas.style.cssText='position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none;border-radius:inherit;will-change:transform,opacity';
    var gl=canvas.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:true});if(!gl)return null;
    try{
      var program=gl.createProgram();gl.attachShader(program,shader(gl,gl.VERTEX_SHADER,vs));gl.attachShader(program,shader(gl,gl.FRAGMENT_SHADER,fs));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
      gl.useProgram(program);
      var nx=48,ny=48,verts=[],indices=[];
      for(var y=0;y<=ny;y++)for(var x=0;x<=nx;x++){var u=x/nx,v=y/ny;verts.push(u*2-1,1-v*2,u,v);}
      for(var yy=0;yy<ny;yy++)for(var xx=0;xx<nx;xx++){var a=yy*(nx+1)+xx,b=a+nx+1;indices.push(a,b,a+1,b,b+1,a+1);}
      var vb=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,vb);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(verts),gl.STATIC_DRAW);
      var ib=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ib);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(indices),gl.STATIC_DRAW);
      var stride=16,p0=gl.getAttribLocation(program,'aPos'),p1=gl.getAttribLocation(program,'aUv');gl.enableVertexAttribArray(p0);gl.vertexAttribPointer(p0,2,gl.FLOAT,false,stride,0);gl.enableVertexAttribArray(p1);gl.vertexAttribPointer(p1,2,gl.FLOAT,false,stride,8);
      var tex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,tex);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);
      var state={box:box,img:img,canvas:canvas,gl:gl,program:program,tex:tex,indexBuffer:ib,progress:gl.getUniformLocation(program,'uProgress'),width:0,height:0};
      box.appendChild(canvas);box.classList.add('is-paper-ready');return state;
    }catch(error){gl.getExtension('WEBGL_lose_context')?.loseContext();return null;}
  }
  function render(state){
    if(!state)return;var box=state.box,gl=state.gl,canvas=state.canvas;
    var p=parseFloat(getComputedStyle(box).getPropertyValue('--founder-paper-progress'));if(!Number.isFinite(p))p=1;p=Math.max(0,Math.min(1,p));
    var w=Math.max(1,Math.round(box.clientWidth*(window.devicePixelRatio||1))),h=Math.max(1,Math.round(box.clientHeight*(window.devicePixelRatio||1)));
    if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
    canvas.style.opacity=String(Math.min(1,p*3.4));canvas.style.transform='translate3d('+(-22*(1-p))+'px,'+(26*(1-p))+'px,0) rotate('+(-3.5*(1-p))+'deg) scale('+(0.94+0.06*p)+')';
    gl.viewport(0,0,w,h);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.useProgram(state.program);gl.bindTexture(gl.TEXTURE_2D,state.tex);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,state.indexBuffer);gl.uniform1f(state.progress,p);gl.drawElements(gl.TRIANGLES,48*48*6,gl.UNSIGNED_SHORT,0);
  }
  boxes.forEach(function(box){var img=box.querySelector('img');if(!img)return;var init=function(){var state=makeState(box);if(state)states.push(state);};if(img.complete)init();else img.addEventListener('load',init,{once:true});});
  if(window.ScrollTrigger){
    ScrollTrigger.create({trigger:document.querySelector('.founder'),start:'top bottom',end:'bottom top',onUpdate:function(){states.forEach(render);}});
    ScrollTrigger.addEventListener('refresh',function(){states.forEach(render);});
  }
  window.addEventListener('resize',function(){states.forEach(render);},{passive:true});
  window.setTimeout(function(){states.forEach(render);},0);
})();

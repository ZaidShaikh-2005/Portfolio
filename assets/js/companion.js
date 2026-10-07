'use strict';

/* Byte is an original procedural 3D model; no embeds, downloads or libraries. */
(function () {
  function initCompanion() {
    var panel = document.querySelector('[data-companion]');
    if (!panel) return;
    var canvas = panel.querySelector('[data-companion-canvas]');
    var toggle = panel.querySelector('[data-companion-toggle]');
    var body = panel.querySelector('[data-companion-body]');
    var waveButton = panel.querySelector('[data-companion-wave]');
    var motionButton = panel.querySelector('[data-companion-motion]');
    var motionLabel = panel.querySelector('[data-companion-motion-label]');
    var resetButton = panel.querySelector('[data-companion-reset]');
    var status = panel.querySelector('[data-companion-status]');
    var hint = panel.querySelector('[data-companion-hint]');
    var desktop = window.matchMedia('(min-width: 1280px)');
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    var motion = !reduced.matches;
    var visible = true;
    var contextLost = false;
    var yaw = -0.28;
    var pitch = 0;
    var look = [0, 0];
    var drag = null;
    var waveStart = -10000;
    var frame = 0;
    var lastFrame = -Infinity;
    var animationTime = 0;
    var gl, program, meshes, uniforms;
    var colours;

    function shown() { return desktop.matches || panel.classList.contains('is-expanded'); }
    function syncDisclosure() {
      var open = shown();
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.disabled = desktop.matches;
      body.setAttribute('aria-hidden', open ? 'false' : 'true');
      if (open) refresh(); else stop();
    }
    toggle.addEventListener('click', function () {
      if (!desktop.matches) panel.classList.toggle('is-expanded');
      syncDisclosure();
    });

    function identity() { return [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]; }
    function multiply(a, b) {
      var m = new Array(16);
      for (var c = 0; c < 4; c++) for (var r = 0; r < 4; r++) {
        m[c*4+r] = a[r]*b[c*4] + a[4+r]*b[c*4+1] + a[8+r]*b[c*4+2] + a[12+r]*b[c*4+3];
      }
      return m;
    }
    function transform(p, s, r) {
      p = p || [0,0,0]; s = s || [1,1,1]; r = r || [0,0,0];
      var cx=Math.cos(r[0]), sx=Math.sin(r[0]), cy=Math.cos(r[1]), sy=Math.sin(r[1]);
      var cz=Math.cos(r[2]), sz=Math.sin(r[2]);
      var rx=[1,0,0,0, 0,cx,sx,0, 0,-sx,cx,0, 0,0,0,1];
      var ry=[cy,0,-sy,0, 0,1,0,0, sy,0,cy,0, 0,0,0,1];
      var rz=[cz,sz,0,0, -sz,cz,0,0, 0,0,1,0, 0,0,0,1];
      var m=multiply(multiply(ry,rx),rz);
      for(var i=0;i<3;i++) for(var j=0;j<3;j++) m[i*4+j]*=s[i];
      m[12]=p[0];m[13]=p[1];m[14]=p[2];
      return m;
    }
    function cross(a,b) { return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]; }
    function dot(a,b) { return a[0]*b[0]+a[1]*b[1]+a[2]*b[2]; }
    function unit(v) { var n=Math.sqrt(dot(v,v)) || 1;return v.map(function(x){return x/n;}); }
    function normalMatrix(m) {
      var a=m.slice(0,3),b=m.slice(4,7),c=m.slice(8,11),bc=cross(b,c);
      var d=dot(a,bc);
      return bc.concat(cross(c,a),cross(a,b)).map(function(x){return x/d;});
    }
    function perspective(aspect) {
      var f=Math.min(1/Math.tan(32*Math.PI/360),aspect*4.8),near=.1,far=40;
      return [f/aspect,0,0,0, 0,f,0,0, 0,0,(far+near)/(near-far),-1, 0,0,2*far*near/(near-far),0];
    }
    function viewMatrix() {
      var eye=[0,2.65,8.9],target=[0,2.0,0];
      var z=unit(eye.map(function(x,i){return x-target[i];}));
      var x=unit(cross([0,1,0],z)),y=cross(z,x);
      return [x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-dot(x,eye),-dot(y,eye),-dot(z,eye),1];
    }

    function surface(nu,nv,sample) {
      var vertices=[],indices=[];
      for(var j=0;j<=nv;j++) for(var i=0;i<=nu;i++) {
        var v=sample(i/nu,j/nv);vertices.push.apply(vertices,v);
      }
      for(var y=0;y<nv;y++) for(var x=0;x<nu;x++) {
        var a=y*(nu+1)+x,b=a+1,c=a+nu+1,d=c+1;
        indices.push(a,b,c,b,d,c);
      }
      return {vertices:vertices,indices:indices};
    }
    function roundedBox() {
      var all={vertices:[],indices:[]};
      var faces=[[[1,0,0],[0,0,-1],[0,1,0]],[[-1,0,0],[0,0,1],[0,1,0]],
        [[0,1,0],[1,0,0],[0,0,-1]],[[0,-1,0],[1,0,0],[0,0,1]],
        [[0,0,1],[1,0,0],[0,1,0]],[[0,0,-1],[-1,0,0],[0,1,0]]];
      faces.forEach(function(face){
        var mesh=surface(12,12,function(u,v){
          var p=face[0].map(function(n,k){return n*.5+face[1][k]*(u-.5)+face[2][k]*(v-.5);});
          var q=p.map(function(x){return Math.max(-.34,Math.min(.34,x));});
          var normal=unit(p.map(function(x,k){return x-q[k];}));
          return q.map(function(x,k){return x+normal[k]*.16;}).concat(normal);
        });
        var offset=all.vertices.length/6;
        all.vertices.push.apply(all.vertices,mesh.vertices);
        mesh.indices.forEach(function(x){all.indices.push(x+offset);});
      });
      return all;
    }
    function cylinder() {
      var mesh=surface(40,1,function(u,v){var a=u*Math.PI*2;return [Math.cos(a),v-.5,Math.sin(a),Math.cos(a),0,Math.sin(a)];});
      [-1,1].forEach(function(side){
        var centre=mesh.vertices.length/6;mesh.vertices.push(0,side*.5,0,0,side,0);
        for(var i=0;i<=40;i++) {var a=i*Math.PI/20;mesh.vertices.push(Math.cos(a),side*.5,Math.sin(a),0,side,0);}
        for(var j=0;j<40;j++) mesh.indices.push(centre,centre+j+1,centre+j+2);
      });
      return mesh;
    }
    function geometry() {
      return {
        box:roundedBox(),
        sphere:surface(28,18,function(u,v){var a=u*Math.PI*2,b=v*Math.PI;var p=[Math.cos(a)*Math.sin(b),Math.cos(b),Math.sin(a)*Math.sin(b)];return p.concat(p);}),
        cylinder:cylinder(),
        ring:surface(48,10,function(u,v){var a=u*Math.PI*2,b=v*Math.PI*2,r=.88+.075*Math.cos(b);return [r*Math.cos(a),r*Math.sin(a),.075*Math.sin(b),Math.cos(b)*Math.cos(a),Math.cos(b)*Math.sin(a),Math.sin(b)];})
      };
    }
    var vertexSource='attribute vec3 aPosition;\nattribute vec3 aNormal;\nuniform mat4 uModel;\nuniform mat4 uVP;\nuniform mat3 uNormal;\nvarying vec3 vNormal;\nvarying vec3 vWorld;\nvoid main(){vec4 p=uModel*vec4(aPosition,1.0);vWorld=p.xyz;vNormal=uNormal*aNormal;gl_Position=uVP*p;}';
    var fragmentSource='#ifdef GL_ES\nprecision mediump float;\n#endif\nuniform vec3 uColour;\nuniform vec3 uAccent;\nuniform float uEmission;\nvarying vec3 vNormal;\nvarying vec3 vWorld;\nvoid main(){vec3 n=normalize(vNormal);vec3 l=normalize(vec3(-0.6,1.0,1.6));vec3 v=normalize(vec3(0.0,2.65,8.9)-vWorld);float diffuse=max(dot(n,l),0.0);float fill=max(dot(n,normalize(vec3(1.0,0.2,-0.6))),0.0);float shade=0.38+0.54*diffuse+0.17*fill;float spec=pow(max(dot(n,normalize(l+v)),0.0),48.0)*0.22;float rim=pow(1.0-max(dot(n,v),0.0),3.0)*0.13;vec3 c=uColour*mix(shade,1.25,uEmission)+vec3(spec)*(1.0-uEmission)+uAccent*rim;gl_FragColor=vec4(pow(max(c,vec3(0.0)),vec3(0.4545)),1.0);}';

    function shader(type,source) {
      var s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);
      if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      return s;
    }
    function setupGPU() {
      gl=canvas.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:false,powerPreference:'low-power'});
      if(!gl) throw new Error('No rendering context');
      program=gl.createProgram();
      var vertex=shader(gl.VERTEX_SHADER,vertexSource),fragment=shader(gl.FRAGMENT_SHADER,fragmentSource);
      gl.attachShader(program,vertex);gl.attachShader(program,fragment);gl.linkProgram(program);
      if(!gl.getProgramParameter(program,gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
      gl.deleteShader(vertex);gl.deleteShader(fragment);gl.useProgram(program);
      uniforms={};['uModel','uVP','uNormal','uColour','uAccent','uEmission'].forEach(function(name){uniforms[name]=gl.getUniformLocation(program,name);});
      var position=gl.getAttribLocation(program,'aPosition'),normal=gl.getAttribLocation(program,'aNormal');
      meshes={};var shapes=geometry();
      Object.keys(shapes).forEach(function(name){
        var data=shapes[name],buffer=gl.createBuffer(),index=gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data.vertices),gl.STATIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,index);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(data.indices),gl.STATIC_DRAW);
        meshes[name]={buffer:buffer,index:index,count:data.indices.length,position:position,normal:normal};
      });
      gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.clearColor(0,0,0,0);
      panel.classList.add('is-ready');contextLost=false;
    }
    function linear(hex) {
      return [1,3,5].map(function(i){return Math.pow(parseInt(hex.slice(i,i+2),16)/255,2.2);});
    }
    function updateTheme() {
      var accents={dark:'#7ee4d0',light:'#7975ff','arcade-dark':'#8fea87','arcade-light':'#f1bb59'};
      colours={navy:linear('#283651'),dark:linear('#0f1b2d'),shell:linear('#e4eaf3'),metal:linear('#8d9eb6'),
        accent:linear(accents[document.body.getAttribute('data-theme')]||accents.dark),white:linear('#edfaff')};
      refresh();
    }
    function part(shape,parent,p,s,colour,r,emission) {
      var mesh=meshes[shape],model=multiply(parent,transform(p,s,r));
      gl.bindBuffer(gl.ARRAY_BUFFER,mesh.buffer);
      gl.vertexAttribPointer(mesh.position,3,gl.FLOAT,false,24,0);gl.enableVertexAttribArray(mesh.position);
      gl.vertexAttribPointer(mesh.normal,3,gl.FLOAT,false,24,12);gl.enableVertexAttribArray(mesh.normal);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,mesh.index);
      gl.uniformMatrix4fv(uniforms.uModel,false,new Float32Array(model));
      gl.uniformMatrix3fv(uniforms.uNormal,false,new Float32Array(normalMatrix(model)));
      gl.uniform3fv(uniforms.uColour,new Float32Array(colours[colour]));
      gl.uniform1f(uniforms.uEmission,emission||0);
      gl.drawElements(gl.TRIANGLES,mesh.count,gl.UNSIGNED_SHORT,0);
    }

    function render(now) {
      if(!gl || contextLost || !shown()) return;
      var width=canvas.clientWidth,height=canvas.clientHeight;if(!width||!height) return;
      var ratio=Math.min(window.devicePixelRatio||1,1.8);
      if(canvas.width!==Math.round(width*ratio)||canvas.height!==Math.round(height*ratio)) {
        canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);
      }
      gl.viewport(0,0,canvas.width,canvas.height);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
      gl.useProgram(program);gl.uniformMatrix4fv(uniforms.uVP,false,new Float32Array(multiply(perspective(width/height),viewMatrix())));
      gl.uniform3fv(uniforms.uAccent,new Float32Array(colours.accent));
      var t=motion?animationTime:0,bob=motion?Math.sin(t*1.7)*.035:0;
      var root=transform([0,bob,0],[1,1,1],[pitch,yaw,0]);
      var floor=transform();
      part('cylinder',floor,[0,-.04,0],[1.08,.13,.85],'navy');
      part('ring',floor,[0,.028,0],[1.15,.91,.11],'accent',[Math.PI/2,0,0],.7);
      part('cylinder',root,[0,2.81,0],[.19,.22,.19],'metal');
      part('box',root,[0,2.21,0],[1.03,1.09,.66],'shell');
      part('box',root,[0,1.71,0],[.90,.20,.65],'navy');
      part('box',root,[0,2.3,.335],[.68,.41,.09],'navy');
      part('ring',root,[0,2.3,.403],[.145,.145,.20],'accent',null,.85);
      part('sphere',root,[0,2.3,.404],[.071,.071,.025],'accent',null,.8);
      [-1,1].forEach(function(side){
        part('box',root,[side*.34,2.58,.35],[.12,.12,.035],'accent',[0,0,side*.2],.25);
        for(var i=0;i<3;i++) part('box',root,[-.115+i*.115,1.95,.35],[.065,.035,.035],'metal');
      });
      part('box',root,[0,1.51,0],[.86,.28,.54],'navy');
      var head=multiply(root,transform([0,3.21,0],[1,1,1],[look[1]*.08,look[0]*.12,Math.sin(t*.8)*.025]));
      part('box',head,[0,0,0],[1.21,.91,.82],'shell');
      part('box',head,[0,-.015,.423],[1.02,.61,.085],'navy');
      part('box',head,[0,-.018,.472],[.91,.51,.025],'dark');
      var blink=motion && t%4.8>4.59 ? Math.max(.12,Math.abs((t%4.8-4.69)/.1)) : 1;
      [-1,1].forEach(function(side){
        part('box',head,[side*.235,.035,.496],[.13,.175*blink,.035],'accent',null,1);
        part('box',head,[side*.21,-.187,.5],[.115,.035,.027],'accent',[0,0,-side*.20],.8);
        part('sphere',head,[side*.65,-.015,0],[.13,.20,.24],'navy');
        part('sphere',head,[side*.746,-.015,.035],[.035,.11,.115],'accent',null,.4);
      });
      part('box',head,[0,-.205,.5],[.13,.032,.027],'accent',null,.8);
      part('cylinder',head,[0,.55,0],[.032,.22,.032],'metal');
      part('sphere',head,[0,.708,0],[.088,.088,.088],'accent',null,.6);
      part('box',head,[0,.394,0],[.36,.09,.57],'navy');

      var waveAge=(now-waveStart)/1000,waving=waveAge>=0 && waveAge<2.35;
      var lift=waving?Math.sin(Math.min(waveAge/.4,1)*Math.PI/2)*Math.min(1,(2.35-waveAge)/.35):0;
      [-1,1].forEach(function(side){
        var angle=side*(.12+Math.sin(t*1.3)*.035);
        if(side===1 && waving) angle+=lift*(1.94+Math.sin(waveAge*12)*.15);
        var arm=multiply(root,transform([side*.64,2.56,0],[1,1,1],[0,0,angle]));
        part('sphere',arm,[0,0,0],[.235,.23,.25],'navy');
        part('box',arm,[side*.045,-.27,0],[.29,.47,.31],'shell');
        part('sphere',arm,[side*.075,-.54,0],[.14,.14,.16],'metal');
        part('box',arm,[side*.08,-.77,.055],[.33,.40,.37],'navy',[.10,0,0]);
        part('box',arm,[side*.08,-.77,.251],[.17,.19,.035],'accent',null,.5);
        part('sphere',arm,[side*.08,-1.03,.06],[.16,.19,.16],'shell');
        part('sphere',arm,[side*-.055,-1.00,.15],[.075,.105,.075],'navy');
        var leg=multiply(root,transform([side*.255,1.4,0],[1,1,1],[0,0,side*-.045]));
        part('box',leg,[0,-.25,0],[.33,.46,.37],'shell');
        part('sphere',leg,[0,-.54,.025],[.165,.17,.18],'navy');
        part('box',leg,[0,-.57,.168],[.23,.19,.08],'accent',null,.2);
        part('box',leg,[0,-.91,0],[.33,.52,.34],'shell');
        part('box',leg,[0,-.94,.176],[.12,.29,.035],'navy');
        part('box',leg,[0,-1.24,.115],[.47,.25,.69],'navy');
        part('box',leg,[0,-1.19,.17],[.40,.14,.59],'shell');
        part('box',leg,[0,-1.24,.454],[.28,.06,.025],'accent',null,.45);
      });
      // Small floating circuit blocks echo the site's gaming theme.
      [-1,1].forEach(function(side){
        part('box',floor,[side*1.01,3.20+side*.37+Math.sin(t+side)*.07,-.22],[.15,.15,.15],'accent',[t*.35,.3,Math.PI/4],.1);
      });
      if(!waving && status.textContent==='Hello, builder!') status.textContent='Ready for the next build.';
    }
    function stop() { if(frame) window.cancelAnimationFrame(frame);frame=0; }
    function tick(now) {
      frame=0;
      if(document.hidden || !visible || !shown() || contextLost) return;
      if(now-lastFrame>=1000/30) {
        if(isFinite(lastFrame)) animationTime+=Math.min((now-lastFrame)/1000,.1);
        lastFrame=now;render(now);
      }
      if(motion || now-waveStart<2350) frame=window.requestAnimationFrame(tick);
    }
    function refresh() {
      if(!gl || !shown() || contextLost || document.hidden) return;
      render(window.performance.now());
      if(!frame && visible && (motion || window.performance.now()-waveStart<2350)) frame=window.requestAnimationFrame(tick);
    }
    function syncMotion() {
      motionButton.setAttribute('aria-pressed',motion?'true':'false');
      motionButton.setAttribute('aria-label',motion?'Pause character animation':'Play character animation');
      motionLabel.textContent=motion?'Pause':'Play';
      if(!motion) stop();refresh();
    }
    motionButton.addEventListener('click',function(){motion=!motion;syncMotion();});
    waveButton.addEventListener('click',function(){waveStart=window.performance.now();status.textContent='Hello, builder!';refresh();});
    resetButton.addEventListener('click',function(){yaw=-.28;pitch=0;look=[0,0];status.textContent='Ready for the next build.';refresh();});
    canvas.addEventListener('pointerdown',function(event){
      if(event.button!==0 || contextLost || !gl) return;
      drag={id:event.pointerId,x:event.clientX,y:event.clientY};canvas.setPointerCapture(event.pointerId);canvas.classList.add('is-dragging');
    });
    canvas.addEventListener('pointermove',function(event){
      var rect=canvas.getBoundingClientRect();
      if(drag && event.pointerId===drag.id){
        yaw+=(event.clientX-drag.x)*.011;pitch=Math.max(-.22,Math.min(.22,pitch+(event.clientY-drag.y)*.004));
        drag.x=event.clientX;drag.y=event.clientY;
      } else if(event.pointerType!=='touch') {
        look=[(event.clientX-rect.left)/rect.width*2-1,1-(event.clientY-rect.top)/rect.height*2];
      }
      refresh();
    });
    function release(){drag=null;canvas.classList.remove('is-dragging');}
    canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);canvas.addEventListener('lostpointercapture',release);
    canvas.addEventListener('pointerleave',function(){if(!drag){look=[0,0];refresh();}});
    canvas.addEventListener('keydown',function(event){
      var keys={ArrowLeft:-.18,ArrowRight:.18};
      if(Object.prototype.hasOwnProperty.call(keys,event.key)){event.preventDefault();yaw+=keys[event.key];refresh();}
      else if(event.key==='ArrowUp'||event.key==='ArrowDown'){event.preventDefault();pitch=Math.max(-.22,Math.min(.22,pitch+(event.key==='ArrowUp'?-.05:.05)));refresh();}
      else if(event.key==='Home'){event.preventDefault();yaw=-.28;pitch=0;refresh();}
    });
    function fallback() {
      contextLost=true;stop();panel.classList.remove('is-ready');
      [waveButton,motionButton,resetButton].forEach(function(b){b.disabled=true;});
      canvas.setAttribute('tabindex','-1');
      hint.textContent='Your coding companion.';
    }
    canvas.addEventListener('webglcontextlost',function(event){event.preventDefault();contextLost=true;fallback();});
    canvas.addEventListener('webglcontextrestored',function(){
      try{setupGPU();[waveButton,motionButton,resetButton].forEach(function(b){b.disabled=false;});canvas.setAttribute('tabindex','0');hint.textContent='Drag to rotate · Arrow keys work too';updateTheme();syncMotion();refresh();}catch(e){fallback();}
    });
    document.addEventListener('visibilitychange',function(){if(document.hidden)stop();else{lastFrame=-Infinity;refresh();}});
    window.addEventListener('pagehide',stop);window.addEventListener('pageshow',refresh);
    window.addEventListener('resize',syncDisclosure);
    if(typeof window.ResizeObserver==='function') new window.ResizeObserver(refresh).observe(canvas);
    if(typeof window.IntersectionObserver==='function') new window.IntersectionObserver(function(entries){visible=entries[0].isIntersecting;if(visible)refresh();else stop();}).observe(canvas);
    if(typeof window.MutationObserver==='function') new window.MutationObserver(updateTheme).observe(document.body,{attributes:true,attributeFilter:['data-theme']});
    function watch(query,handler){if(query.addEventListener)query.addEventListener('change',handler);else if(query.addListener)query.addListener(handler);}
    watch(desktop,syncDisclosure);
    watch(reduced,function(){motion=!reduced.matches;syncMotion();});
    try{setupGPU();updateTheme();syncMotion();syncDisclosure();}catch(e){fallback();syncDisclosure();}
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',initCompanion,{once:true});else initCompanion();
})();

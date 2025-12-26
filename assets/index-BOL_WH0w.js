(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const a of document.querySelectorAll('link[rel="modulepreload"]'))i(a);new MutationObserver(a=>{for(const n of a)if(n.type==="childList")for(const s of n.addedNodes)s.tagName==="LINK"&&s.rel==="modulepreload"&&i(s)}).observe(document,{childList:!0,subtree:!0});function t(a){const n={};return a.integrity&&(n.integrity=a.integrity),a.referrerPolicy&&(n.referrerPolicy=a.referrerPolicy),a.crossOrigin==="use-credentials"?n.credentials="include":a.crossOrigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function i(a){if(a.ep)return;a.ep=!0;const n=t(a);fetch(a.href,n)}})();const Se=`
  attribute vec2 a_position;
  varying vec2 v_uv;
  
  void main() {
    v_uv = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`,Ee=`
  precision highp float;
  
  varying vec2 v_uv;
  uniform float u_time;
  uniform vec2 u_resolution;
  uniform vec2 u_mouse;
  uniform float u_progress;
  uniform float u_warmth;
  
  // Rich color palette
  const vec3 COLOR_TRAVEL_DEEP = vec3(0.85, 0.45, 0.35);    // Deep coral
  const vec3 COLOR_TRAVEL_WARM = vec3(0.95, 0.65, 0.45);    // Warm orange
  const vec3 COLOR_TRAVEL_SOFT = vec3(1.0, 0.85, 0.75);     // Soft peach
  const vec3 COLOR_TRAVEL_SKY = vec3(0.98, 0.78, 0.55);     // Sunset gold
  
  const vec3 COLOR_DEV_YELLOW = vec3(0.98, 0.82, 0.28);     // JS Yellow
  const vec3 COLOR_DEV_AMBER = vec3(0.85, 0.65, 0.20);      // Amber
  const vec3 COLOR_DEV_GRAY = vec3(0.18, 0.20, 0.24);       // Dark graphite
  const vec3 COLOR_DEV_SLATE = vec3(0.28, 0.32, 0.38);      // Slate
  
  const vec3 COLOR_BG_DARK = vec3(0.10, 0.10, 0.14);        // Deep background
  const vec3 COLOR_BG_MID = vec3(0.15, 0.14, 0.18);         // Mid background
  
  // Noise functions
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }
  
  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 5; i++) {
      value += amplitude * noise(p);
      p *= 2.0;
      amplitude *= 0.5;
    }
    return value;
  }
  
  // Smooth arc for flight paths
  float arc(vec2 uv, vec2 center, float radius, float width, float startAngle, float endAngle) {
    vec2 d = uv - center;
    float angle = atan(d.y, d.x);
    float dist = length(d);
    float angleInRange = smoothstep(startAngle - 0.15, startAngle, angle) * 
                         (1.0 - smoothstep(endAngle, endAngle + 0.15, angle));
    float ringDist = abs(dist - radius);
    return angleInRange * (1.0 - smoothstep(0.0, width, ringDist));
  }
  
  // Glowing node
  float node(vec2 uv, vec2 pos, float radius) {
    float d = length(uv - pos);
    float core = 1.0 - smoothstep(0.0, radius * 0.4, d);
    float glow = 1.0 - smoothstep(radius * 0.4, radius * 1.5, d);
    return core + glow * 0.5;
  }
  
  // Line with glow
  float line(vec2 uv, vec2 a, vec2 b, float width) {
    vec2 pa = uv - a;
    vec2 ba = b - a;
    float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    float d = length(pa - ba * h);
    float core = 1.0 - smoothstep(0.0, width, d);
    float glow = 1.0 - smoothstep(width, width * 4.0, d);
    return core + glow * 0.3;
  }
  
  // Animated star/sparkle
  float star(vec2 uv, vec2 pos, float size) {
    float d = length(uv - pos);
    return (1.0 - smoothstep(0.0, size, d)) * 0.8;
  }
  
  // Cloud-like shape
  float cloud(vec2 uv, vec2 center, float scale) {
    vec2 p = (uv - center) * scale;
    float n = fbm(p + u_time * 0.05);
    return smoothstep(0.4, 0.6, n);
  }
  
  void main() {
    vec2 uv = v_uv;
    float aspect = u_resolution.x / u_resolution.y;
    
    // Subtle parallax
    vec2 parallax = (u_mouse - 0.5) * 0.02;
    uv += parallax;
    
    // Base dark background
    vec3 bgColor = mix(COLOR_BG_DARK, COLOR_BG_MID, uv.y * 0.5 + 0.3);
    
    // Add subtle noise texture
    float bgNoise = fbm(uv * 8.0) * 0.08;
    bgColor += bgNoise;
    
    // Zone split with smooth diagonal transition
    float zoneSplit = smoothstep(0.35, 0.65, uv.x + (uv.y - 0.5) * 0.15);
    
    // ========== TRAVEL ZONE (left) ==========
    vec3 travelZone = bgColor;
    
    // Warm gradient glow
    float warmGradient = (1.0 - zoneSplit) * 0.4;
    vec3 sunsetGlow = mix(COLOR_TRAVEL_DEEP, COLOR_TRAVEL_SKY, uv.y);
    travelZone = mix(travelZone, sunsetGlow, warmGradient * 0.6);
    
    // Animated clouds in travel zone
    float clouds = 0.0;
    clouds += cloud(uv, vec2(0.15, 0.7), 3.0) * 0.3;
    clouds += cloud(uv, vec2(0.25, 0.5), 4.0) * 0.25;
    clouds += cloud(uv, vec2(0.1, 0.3), 3.5) * 0.2;
    travelZone = mix(travelZone, COLOR_TRAVEL_SOFT, clouds * (1.0 - zoneSplit));
    
    // Flight arcs with animation
    float arcs = 0.0;
    float t = u_time * 0.3;
    
    // Main arc
    arcs += arc(uv, vec2(0.05, 0.9), 0.55, 0.004, -0.3 + sin(t) * 0.1, 1.4) * 0.8;
    arcs += arc(uv, vec2(0.15, 0.2), 0.35, 0.003, 0.2, 2.2) * 0.6;
    arcs += arc(uv, vec2(0.1, 0.6), 0.2, 0.003, -0.8, 0.8 + sin(t * 0.8) * 0.2) * 0.5;
    arcs += arc(uv, vec2(0.3, 0.8), 0.25, 0.003, 0.5, 2.0) * 0.4;
    
    float travelProgress = 0.4 + 0.6 * smoothstep(0.0, 0.5, u_progress);
    float arcPulse = 0.6 + 0.4 * sin(u_time * 0.6);
    
    travelZone = mix(travelZone, COLOR_TRAVEL_WARM, arcs * arcPulse * travelProgress * (1.0 - zoneSplit));
    
    // Travel destination nodes
    float travelNodes = 0.0;
    travelNodes += node(uv, vec2(0.06, 0.18), 0.025) * (0.5 + 0.5 * sin(u_time * 2.0));
    travelNodes += node(uv, vec2(0.22, 0.12), 0.02) * (0.5 + 0.5 * sin(u_time * 2.3 + 1.0));
    travelNodes += node(uv, vec2(0.35, 0.28), 0.028) * (0.5 + 0.5 * sin(u_time * 1.8 + 2.0));
    travelNodes += node(uv, vec2(0.12, 0.50), 0.022) * (0.5 + 0.5 * sin(u_time * 2.5 + 0.5));
    travelNodes += node(uv, vec2(0.28, 0.65), 0.024) * (0.5 + 0.5 * sin(u_time * 2.1 + 1.5));
    travelNodes += node(uv, vec2(0.18, 0.78), 0.02) * (0.5 + 0.5 * sin(u_time * 1.9 + 2.5));
    travelNodes += node(uv, vec2(0.08, 0.85), 0.018) * (0.5 + 0.5 * sin(u_time * 2.2 + 0.8));
    
    travelZone = mix(travelZone, COLOR_TRAVEL_WARM, travelNodes * travelProgress * (1.0 - zoneSplit) * 0.9);
    
    // Sparkles/stars for travel atmosphere
    float stars = 0.0;
    for (float i = 0.0; i < 6.0; i++) {
      vec2 starPos = vec2(
        0.05 + hash(vec2(i * 13.7, 0.0)) * 0.35,
        0.1 + hash(vec2(i * 7.3, 1.0)) * 0.8
      );
      float twinkle = 0.5 + 0.5 * sin(u_time * (2.0 + i * 0.3) + i * 1.5);
      stars += star(uv, starPos, 0.008) * twinkle;
    }
    travelZone = mix(travelZone, COLOR_TRAVEL_SOFT, stars * (1.0 - zoneSplit) * 0.6);
    
    // ========== DEV ZONE (right) ==========
    vec3 devZone = bgColor;
    
    // Cool tech gradient
    float techGradient = zoneSplit * 0.35;
    devZone = mix(devZone, COLOR_DEV_GRAY, techGradient);
    
    // Subtle grid pattern
    float gridX = smoothstep(0.98, 1.0, fract(uv.x * 30.0));
    float gridY = smoothstep(0.98, 1.0, fract(uv.y * 30.0));
    float grid = (gridX + gridY) * 0.1 * zoneSplit;
    devZone = mix(devZone, COLOR_DEV_SLATE, grid);
    
    // Dependency graph with more connections
    float graphLines = 0.0;
    float devProgress = 0.4 + 0.6 * smoothstep(0.0, 0.5, u_progress);
    
    // Graph connections with glow
    graphLines += line(uv, vec2(0.55, 0.15), vec2(0.72, 0.28), 0.003);
    graphLines += line(uv, vec2(0.72, 0.28), vec2(0.88, 0.18), 0.003);
    graphLines += line(uv, vec2(0.72, 0.28), vec2(0.82, 0.45), 0.003);
    graphLines += line(uv, vec2(0.60, 0.42), vec2(0.82, 0.45), 0.003);
    graphLines += line(uv, vec2(0.82, 0.45), vec2(0.95, 0.58), 0.003);
    graphLines += line(uv, vec2(0.68, 0.58), vec2(0.82, 0.45), 0.003);
    graphLines += line(uv, vec2(0.68, 0.58), vec2(0.55, 0.75), 0.003);
    graphLines += line(uv, vec2(0.55, 0.75), vec2(0.78, 0.82), 0.003);
    graphLines += line(uv, vec2(0.78, 0.82), vec2(0.92, 0.72), 0.003);
    graphLines += line(uv, vec2(0.60, 0.42), vec2(0.55, 0.15), 0.003);
    graphLines += line(uv, vec2(0.68, 0.58), vec2(0.78, 0.82), 0.003);
    
    float lineAnim = 0.4 + 0.6 * sin(u_time * 0.5);
    devZone = mix(devZone, COLOR_DEV_YELLOW * 0.7, graphLines * lineAnim * devProgress * zoneSplit * 0.7);
    
    // Dev nodes with strong glow
    float devNodes = 0.0;
    devNodes += node(uv, vec2(0.55, 0.15), 0.028) * (0.6 + 0.4 * sin(u_time * 1.5));
    devNodes += node(uv, vec2(0.72, 0.28), 0.032) * (0.6 + 0.4 * sin(u_time * 1.8 + 1.0));
    devNodes += node(uv, vec2(0.88, 0.18), 0.024) * (0.6 + 0.4 * sin(u_time * 2.0 + 0.5));
    devNodes += node(uv, vec2(0.60, 0.42), 0.028) * (0.6 + 0.4 * sin(u_time * 1.6 + 1.5));
    devNodes += node(uv, vec2(0.82, 0.45), 0.035) * (0.6 + 0.4 * sin(u_time * 1.4 + 2.0));
    devNodes += node(uv, vec2(0.95, 0.58), 0.022) * (0.6 + 0.4 * sin(u_time * 2.2 + 0.8));
    devNodes += node(uv, vec2(0.68, 0.58), 0.028) * (0.6 + 0.4 * sin(u_time * 1.7 + 1.2));
    devNodes += node(uv, vec2(0.55, 0.75), 0.025) * (0.6 + 0.4 * sin(u_time * 1.9 + 1.8));
    devNodes += node(uv, vec2(0.78, 0.82), 0.028) * (0.6 + 0.4 * sin(u_time * 1.5 + 2.2));
    devNodes += node(uv, vec2(0.92, 0.72), 0.02) * (0.6 + 0.4 * sin(u_time * 2.1 + 2.8));
    
    devZone = mix(devZone, COLOR_DEV_YELLOW, devNodes * devProgress * zoneSplit * 0.85);
    
    // Code-like floating rectangles
    for (float i = 0.0; i < 8.0; i++) {
      vec2 barPos = vec2(
        0.55 + hash(vec2(i * 5.3, 2.0)) * 0.4,
        0.1 + hash(vec2(i * 7.1, 3.0)) * 0.8 + sin(u_time * 0.2 + i) * 0.02
      );
      float barWidth = 0.015 + hash(vec2(i * 11.0, 4.0)) * 0.04;
      float barHeight = 0.004;
      
      if (uv.x > barPos.x && uv.x < barPos.x + barWidth &&
          uv.y > barPos.y && uv.y < barPos.y + barHeight) {
        float barAlpha = (0.3 + 0.2 * sin(u_time * 0.5 + i)) * zoneSplit * devProgress;
        devZone = mix(devZone, COLOR_DEV_AMBER, barAlpha);
      }
    }
    
    // ========== COMBINE ZONES ==========
    vec3 finalColor = mix(travelZone, devZone, zoneSplit);
    
    // Center blend area - softer transition with glow
    float centerGlow = 1.0 - abs(zoneSplit - 0.5) * 2.0;
    centerGlow = pow(centerGlow, 2.0) * 0.15;
    finalColor += vec3(centerGlow);
    
    // Progress-based enhancements
    if (u_progress >= 0.33) {
      float warmthBoost = smoothstep(0.33, 0.5, u_progress) * 0.12;
      finalColor = mix(finalColor, COLOR_TRAVEL_WARM, warmthBoost);
    }
    
    if (u_progress >= 1.0) {
      float celebration = 0.5 + 0.5 * sin(u_time * 3.0);
      vec3 celebrationColor = mix(COLOR_TRAVEL_WARM, COLOR_DEV_YELLOW, celebration);
      finalColor = mix(finalColor, celebrationColor, 0.2);
    }
    
    // Subtle vignette
    float vignette = 1.0 - length((uv - 0.5) * 1.2);
    vignette = smoothstep(0.0, 0.8, vignette);
    finalColor *= 0.85 + vignette * 0.15;
    
    // Warmth adjustment
    finalColor = mix(finalColor, finalColor * vec3(1.1, 1.0, 0.9), u_warmth);
    
    gl_FragColor = vec4(finalColor, 1.0);
  }
`;class Ce{canvas;gl=null;program=null;animationId=0;startTime=0;timeLocation=null;resolutionLocation=null;mouseLocation=null;progressLocation=null;warmthLocation=null;mouseX=.5;mouseY=.5;progress=0;warmth=0;constructor(e){this.canvas=e,this.init()}init(){if(this.gl=this.canvas.getContext("webgl",{antialias:!0,preserveDrawingBuffer:!0}),!this.gl){console.warn("WebGL not supported, falling back to CSS background"),this.canvas.style.background="linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)";return}const e=this.gl,t=this.createShader(e.VERTEX_SHADER,Se),i=this.createShader(e.FRAGMENT_SHADER,Ee);if(!t||!i)return;if(this.program=e.createProgram(),e.attachShader(this.program,t),e.attachShader(this.program,i),e.linkProgram(this.program),!e.getProgramParameter(this.program,e.LINK_STATUS)){console.error("Program link error:",e.getProgramInfoLog(this.program));return}const a=new Float32Array([-1,-1,1,-1,-1,1,1,1]),n=e.createBuffer();e.bindBuffer(e.ARRAY_BUFFER,n),e.bufferData(e.ARRAY_BUFFER,a,e.STATIC_DRAW);const s=e.getAttribLocation(this.program,"a_position");e.enableVertexAttribArray(s),e.vertexAttribPointer(s,2,e.FLOAT,!1,0,0),this.timeLocation=e.getUniformLocation(this.program,"u_time"),this.resolutionLocation=e.getUniformLocation(this.program,"u_resolution"),this.mouseLocation=e.getUniformLocation(this.program,"u_mouse"),this.progressLocation=e.getUniformLocation(this.program,"u_progress"),this.warmthLocation=e.getUniformLocation(this.program,"u_warmth"),this.resize(),this.startTime=performance.now(),this.render(),window.addEventListener("resize",()=>this.resize()),window.addEventListener("mousemove",r=>this.onMouseMove(r)),window.DeviceOrientationEvent&&window.addEventListener("deviceorientation",r=>this.onDeviceOrientation(r))}createShader(e,t){const i=this.gl,a=i.createShader(e);return i.shaderSource(a,t),i.compileShader(a),i.getShaderParameter(a,i.COMPILE_STATUS)?a:(console.error("Shader compile error:",i.getShaderInfoLog(a)),i.deleteShader(a),null)}resize(){const e=Math.min(window.devicePixelRatio,2);this.canvas.width=window.innerWidth*e,this.canvas.height=window.innerHeight*e,this.canvas.style.width=window.innerWidth+"px",this.canvas.style.height=window.innerHeight+"px",this.gl&&this.gl.viewport(0,0,this.canvas.width,this.canvas.height)}onMouseMove(e){this.mouseX=e.clientX/window.innerWidth,this.mouseY=1-e.clientY/window.innerHeight}onDeviceOrientation(e){e.gamma!==null&&e.beta!==null&&(this.mouseX=.5+e.gamma/90*.5,this.mouseY=.5+e.beta/90*.5)}render=()=>{if(!this.gl||!this.program)return;const e=this.gl,t=(performance.now()-this.startTime)/1e3;e.useProgram(this.program),e.uniform1f(this.timeLocation,t),e.uniform2f(this.resolutionLocation,this.canvas.width,this.canvas.height),e.uniform2f(this.mouseLocation,this.mouseX,this.mouseY),e.uniform1f(this.progressLocation,this.progress),e.uniform1f(this.warmthLocation,this.warmth),e.drawArrays(e.TRIANGLE_STRIP,0,4),this.animationId=requestAnimationFrame(this.render)};setProgress(e){this.progress=e/30}setWarmth(e){this.warmth=e}destroy(){cancelAnimationFrame(this.animationId),window.removeEventListener("resize",()=>this.resize())}}class Pe{canvas;ctx;animationId=0;time=0;startPoint={x:-.1,y:.85};controlPoint1={x:.25,y:.6};controlPoint2={x:.6,y:.4};endPoint={x:1.1,y:.15};constructor(e){this.canvas=document.createElement("canvas"),this.canvas.className="scene-canvas",e.appendChild(this.canvas),this.ctx=this.canvas.getContext("2d"),this.resize(),window.addEventListener("resize",()=>this.resize()),this.animate()}resize(){const e=this.canvas.parentElement.getBoundingClientRect(),t=Math.min(window.devicePixelRatio,2);this.canvas.width=e.width*t,this.canvas.height=e.height*t,this.canvas.style.width=e.width+"px",this.canvas.style.height=e.height+"px",this.ctx.scale(t,t)}bezierPoint(e){const t=1-e,i=t*t*t*this.startPoint.x+3*t*t*e*this.controlPoint1.x+3*t*e*e*this.controlPoint2.x+e*e*e*this.endPoint.x,a=t*t*t*this.startPoint.y+3*t*t*e*this.controlPoint1.y+3*t*e*e*this.controlPoint2.y+e*e*e*this.endPoint.y;return{x:i,y:a}}bezierTangent(e){const t=this.bezierPoint(Math.max(0,e-.01)),i=this.bezierPoint(Math.min(1,e+.01));return Math.atan2(i.y-t.y,i.x-t.x)}drawCloud(e,t,i,a){const n=this.ctx,s=this.canvas.width/(window.devicePixelRatio||1),r=this.canvas.height/(window.devicePixelRatio||1);n.beginPath(),n.fillStyle=`rgba(255, 240, 230, ${a})`;const l=e*s,c=t*r,d=i*Math.min(s,r);n.arc(l,c,d*.4,0,Math.PI*2),n.arc(l+d*.3,c-d*.1,d*.35,0,Math.PI*2),n.arc(l+d*.6,c,d*.3,0,Math.PI*2),n.arc(l-d*.25,c+d*.05,d*.3,0,Math.PI*2),n.fill()}drawPlane(e,t,i,a){const n=this.ctx,s=this.canvas.width/(window.devicePixelRatio||1),r=this.canvas.height/(window.devicePixelRatio||1);n.save(),n.translate(e*s,t*r),n.rotate(i),n.scale(a,a),n.fillStyle="#ffffff",n.strokeStyle="#e8a87c",n.lineWidth=2,n.beginPath(),n.ellipse(0,0,25,8,0,0,Math.PI*2),n.fill(),n.stroke(),n.beginPath(),n.moveTo(-5,0),n.lineTo(-15,-20),n.lineTo(10,-20),n.lineTo(5,0),n.closePath(),n.fill(),n.stroke(),n.beginPath(),n.moveTo(-5,0),n.lineTo(-15,20),n.lineTo(10,20),n.lineTo(5,0),n.closePath(),n.fill(),n.stroke(),n.beginPath(),n.moveTo(-20,0),n.lineTo(-30,-12),n.lineTo(-25,0),n.lineTo(-30,12),n.closePath(),n.fill(),n.stroke(),n.beginPath(),n.moveTo(25,0),n.lineTo(35,0),n.lineTo(25,-3),n.closePath(),n.fillStyle="#e8a87c",n.fill(),n.restore()}drawTrail(e){const t=this.ctx,i=this.canvas.width/(window.devicePixelRatio||1),a=this.canvas.height/(window.devicePixelRatio||1);t.beginPath(),t.strokeStyle="rgba(232, 168, 124, 0.4)",t.lineWidth=2,t.setLineDash([5,10]);const n=Math.max(0,e-.3);for(let s=n;s<=e;s+=.01){const r=this.bezierPoint(s);s===n?t.moveTo(r.x*i,r.y*a):t.lineTo(r.x*i,r.y*a)}t.stroke(),t.setLineDash([])}animate=()=>{const e=this.ctx,t=this.canvas.width/(window.devicePixelRatio||1),i=this.canvas.height/(window.devicePixelRatio||1);e.clearRect(0,0,t,i);const a=e.createLinearGradient(0,0,0,i);a.addColorStop(0,"#2d1f3d"),a.addColorStop(.3,"#4a2c5a"),a.addColorStop(.6,"#e88a6a"),a.addColorStop(.85,"#f5c89a"),a.addColorStop(1,"#f8e0c0"),e.fillStyle=a,e.fillRect(0,0,t,i),this.time+=.002;const n=this.time*.1%1;this.drawCloud(.15+n*.1,.25,.08,.6),this.drawCloud(.4-n*.05,.35,.1,.5),this.drawCloud(.7+n*.08,.2,.12,.4),this.drawCloud(.85-n*.1,.4,.07,.5);const s=this.time*.125%1;this.drawTrail(s);const r=this.bezierPoint(s),l=this.bezierTangent(s);this.drawPlane(r.x,r.y,l,1.2),this.animationId=requestAnimationFrame(this.animate)};destroy(){cancelAnimationFrame(this.animationId),this.canvas.remove()}}class xe{canvas;ctx;animationId=0;time=0;cursorVisible=!0;currentLine=0;currentChar=0;lastTypeTime=0;codeLines=["const dream = async () => {","  const goals = await fetchGoals();","  const plan = createPlan(goals);","  ","  for (const step of plan) {","    await execute(step);","    celebrate(step.done);","  }","  ","  return SUCCESS;","};","","dream().then(result => {",'  console.log("✨ Dreams:", result);',"});"];displayedLines=[];constructor(e){this.canvas=document.createElement("canvas"),this.canvas.className="scene-canvas",e.appendChild(this.canvas),this.ctx=this.canvas.getContext("2d"),this.resize(),window.addEventListener("resize",()=>this.resize()),this.animate()}resize(){const e=this.canvas.parentElement.getBoundingClientRect(),t=Math.min(window.devicePixelRatio,2);this.canvas.width=e.width*t,this.canvas.height=e.height*t,this.canvas.style.width=e.width+"px",this.canvas.style.height=e.height+"px",this.ctx.scale(t,t)}drawLaptop(){const e=this.ctx,t=this.canvas.width/(window.devicePixelRatio||1),i=this.canvas.height/(window.devicePixelRatio||1),a=t*.7,n=i*.5,s=(t-a)/2,r=i*.3;e.fillStyle="#2a2a35",e.strokeStyle="#3a3a45",e.lineWidth=2;const l=8;e.beginPath(),e.roundRect(s,r,a,n,8),e.fill(),e.stroke();const c=s+l,d=r+l,g=a-l*2,L=n-l*2;e.fillStyle="#1a1a24",e.beginPath(),e.roundRect(c,d,g,L,4),e.fill();const p=e.createRadialGradient(c+g/2,d+L/2,0,c+g/2,d+L/2,g);p.addColorStop(0,"rgba(245, 200, 66, 0.05)"),p.addColorStop(1,"rgba(245, 200, 66, 0)"),e.fillStyle=p,e.fillRect(0,0,t,i),this.drawCode(c+15,d+15,g-30,L-30);const w=r+n,v=i*.08;e.fillStyle="#3a3a45",e.beginPath(),e.moveTo(s-20,w),e.lineTo(s+a+20,w),e.lineTo(s+a+30,w+v),e.lineTo(s-30,w+v),e.closePath(),e.fill(),e.fillStyle="#4a4a55",e.beginPath(),e.roundRect(s+a*.35,w+v*.3,a*.3,v*.5,4),e.fill()}drawCode(e,t,i,a){const n=this.ctx,s=18,r=13;for(n.font=`${r}px 'SF Mono', 'Consolas', monospace`;this.displayedLines.length<this.currentLine;)this.displayedLines.push("");if(this.currentLine<this.codeLines.length){const l=this.codeLines[this.currentLine];this.currentChar<=l.length&&(this.displayedLines[this.currentLine]=l.substring(0,this.currentChar))}for(let l=0;l<this.displayedLines.length&&l*s<a;l++){const c=this.displayedLines[l];let d=e;const g=t+l*s+r;n.fillStyle="#555565",n.fillText(`${(l+1).toString().padStart(2," ")} `,d,g),d+=30;const L=this.tokenizeLine(c);for(const p of L)n.fillStyle=p.color,n.fillText(p.text,d,g),d+=n.measureText(p.text).width}if(this.cursorVisible&&this.currentLine<this.codeLines.length){const l=t+this.currentLine*s+r,c=this.displayedLines[this.currentLine]||"",d=e+30+n.measureText(c).width;n.fillStyle="#f5c842",n.fillRect(d,l-r+3,2,r)}}tokenizeLine(e){const t=[],i=["const","let","var","async","await","for","of","return","then","function"],a=["fetchGoals","createPlan","execute","celebrate","dream","console","log"];let n=e,s=0;for(;s<n.length;){let r=!1;if(n[s]==='"'||n[s]==="'"){const c=n[s];let d=n.indexOf(c,s+1);d===-1&&(d=n.length),t.push({text:n.substring(s,d+1),color:"#98c379"}),s=d+1,r=!0;continue}for(const c of i)if(n.substring(s).startsWith(c)&&(s===0||!/\w/.test(n[s-1]))&&(s+c.length>=n.length||!/\w/.test(n[s+c.length]))){t.push({text:c,color:"#c678dd"}),s+=c.length,r=!0;break}if(r)continue;for(const c of a)if(n.substring(s).startsWith(c)){t.push({text:c,color:"#61afef"}),s+=c.length,r=!0;break}if(r)continue;if(/\d/.test(n[s])){let c=s;for(;c<n.length&&/\d/.test(n[c]);)c++;t.push({text:n.substring(s,c),color:"#d19a66"}),s=c;continue}if(/[{}()[\];,.:=><+\-*/]/.test(n[s])){t.push({text:n[s],color:"#f5c842"}),s++;continue}let l=s;for(;l<n.length&&!/[{})[\];,.:=><+\-*/"'\s]/.test(n[l]);)l++;if(l>s)t.push({text:n.substring(s,l),color:"#e5c07b"}),s=l;else if(/\s/.test(n[s])){let c=s;for(;c<n.length&&/\s/.test(n[c]);)c++;t.push({text:n.substring(s,c),color:"#abb2bf"}),s=c}else t.push({text:n[s],color:"#abb2bf"}),s++}return t}drawDecorations(){const e=this.ctx,t=this.canvas.width/(window.devicePixelRatio||1),i=this.canvas.height/(window.devicePixelRatio||1),a=t*.15,n=i*.7;e.fillStyle="#f5f0e8",e.beginPath(),e.ellipse(a,n,25,8,0,0,Math.PI*2),e.fill(),e.fillStyle="#e8e0d5",e.beginPath(),e.moveTo(a-20,n),e.lineTo(a-15,n+35),e.lineTo(a+15,n+35),e.lineTo(a+20,n),e.closePath(),e.fill(),e.strokeStyle="#e8e0d5",e.lineWidth=4,e.beginPath(),e.arc(a+22,n+15,10,-Math.PI/2,Math.PI/2),e.stroke(),e.strokeStyle="rgba(255, 255, 255, 0.3)",e.lineWidth=2;for(let l=0;l<3;l++){const c=a-8+l*8,d=this.time*2+l;e.beginPath(),e.moveTo(c,n-5),e.quadraticCurveTo(c+Math.sin(d)*5,n-15,c+Math.sin(d+1)*3,n-25),e.stroke()}const s=t*.85,r=i*.75;e.fillStyle="#d4a574",e.beginPath(),e.moveTo(s-20,r),e.lineTo(s-15,r+30),e.lineTo(s+15,r+30),e.lineTo(s+20,r),e.closePath(),e.fill(),e.fillStyle="#4a8c5c";for(let l=0;l<5;l++){const c=l/5*Math.PI-Math.PI/2+Math.sin(this.time+l)*.1,d=25+Math.sin(l*1.5)*10;e.beginPath(),e.ellipse(s+Math.cos(c)*d*.7,r-10+Math.sin(c)*d*.3-d*.5,d*.4,d*.15,c,0,Math.PI*2),e.fill()}}animate=()=>{const e=this.ctx,t=this.canvas.width/(window.devicePixelRatio||1),i=this.canvas.height/(window.devicePixelRatio||1);e.clearRect(0,0,t,i);const a=e.createLinearGradient(0,0,0,i);a.addColorStop(0,"#16161e"),a.addColorStop(.5,"#1e1e28"),a.addColorStop(1,"#252530"),e.fillStyle=a,e.fillRect(0,0,t,i),e.strokeStyle="rgba(245, 200, 66, 0.1)",e.lineWidth=1;for(let r=0;r<8;r++){const l=(Math.sin(r*1.3)*.3+.5)*t,c=(Math.cos(r*.9)*.3+.3)*i,d=(Math.sin(r*1.7+1)*.3+.5)*t,g=(Math.cos(r*1.1+1)*.3+.5)*i;e.beginPath(),e.moveTo(l,c),e.lineTo(d,g),e.stroke(),e.fillStyle=`rgba(245, 200, 66, ${.1+Math.sin(this.time*2+r)*.05})`,e.beginPath(),e.arc(l,c,4,0,Math.PI*2),e.fill()}this.time+=.016;const n=performance.now();if(n-this.lastTypeTime>50)if(this.lastTypeTime=n,this.currentLine<this.codeLines.length){const r=this.codeLines[this.currentLine];this.currentChar<r.length?this.currentChar++:(this.currentLine++,this.currentChar=0,this.displayedLines.push(""))}else this.currentLine=0,this.currentChar=0,this.displayedLines=[];Math.floor(this.time*2)%2===0?this.cursorVisible=!0:this.cursorVisible=!1,this.drawDecorations(),this.drawLaptop(),this.animationId=requestAnimationFrame(this.animate)};destroy(){cancelAnimationFrame(this.animationId),this.canvas.remove()}}const x=30,Re="vision-board-db",Te=1,y="images",K="vision-board-meta";let R=null;async function B(){return console.log("[Storage] Initializing IndexedDB..."),new Promise((o,e)=>{if(!window.indexedDB){console.error("[Storage] IndexedDB not supported"),e(new Error("IndexedDB not supported"));return}const t=indexedDB.open(Re,Te);t.onerror=()=>{console.error("[Storage] DB Open Error:",t.error),e(t.error)},t.onsuccess=()=>{console.log("[Storage] DB Opened Successfully"),R=t.result,o()},t.onupgradeneeded=i=>{console.log("[Storage] DB Upgrade Needed");const a=i.target.result;a.objectStoreNames.contains(y)||a.createObjectStore(y,{keyPath:"id"})}})}async function ce(o,e){return R||await B(),new Promise((t,i)=>{const a=R.transaction(y,"readwrite");a.objectStore(y).put({id:o,blob:e,timestamp:Date.now()}),a.oncomplete=()=>t(),a.onerror=()=>i(a.error)})}async function de(o){return R||await B(),new Promise((e,t)=>{const n=R.transaction(y,"readonly").objectStore(y).get(o);n.onsuccess=()=>{e(n.result?.blob||null)},n.onerror=()=>t(n.error)})}async function _e(o){return R||await B(),new Promise((e,t)=>{const i=R.transaction(y,"readwrite");i.objectStore(y).delete(o),i.oncomplete=()=>e(),i.onerror=()=>t(i.error)})}async function he(){return R||await B(),new Promise((o,e)=>{const t=R.transaction(y,"readwrite");t.objectStore(y).clear(),t.oncomplete=()=>o(),t.onerror=()=>e(t.error)})}function ue(o){localStorage.setItem(K,JSON.stringify(o))}function fe(){const o=localStorage.getItem(K);if(!o)return null;try{return JSON.parse(o)}catch{return null}}function Ie(){localStorage.removeItem(K)}async function Ae(){const o=fe();if(!o)return JSON.stringify({cells:[],theme:"neutral"});const e={cells:[],theme:o.theme,exportedAt:Date.now()};for(const t of o.cells){const i=await de(t.imageId);let a;i&&(a=await Me(i)),e.cells.push({...t,imageData:a})}return JSON.stringify(e,null,2)}async function Oe(o){const e=JSON.parse(o);await he();const t={cells:[],theme:e.theme||"neutral",lastModified:Date.now()};for(const i of e.cells||[]){if(i.imageData){const a=ke(i.imageData);await ce(i.imageId,a)}t.cells.push({index:i.index,imageId:i.imageId,cropSettings:i.cropSettings})}return ue(t),t}function Me(o){return new Promise((e,t)=>{const i=new FileReader;i.onloadend=()=>e(i.result),i.onerror=t,i.readAsDataURL(o)})}function ke(o){const e=o.split(","),t=e[0].match(/:(.*?);/)?.[1]||"image/png",i=atob(e[1]),a=new Uint8Array(i.length);for(let n=0;n<i.length;n++)a[n]=i.charCodeAt(n);return new Blob([a],{type:t})}function De(){return`img_${Date.now()}_${Math.random().toString(36).substr(2,9)}`}let m=[],V=null,I=null;function Z(o,e,t){V=e,I=t,m=[],o.innerHTML="";for(let i=0;i<x;i++){const a=Be(i);m.push(a),o.appendChild(a.element)}console.assert(m.length===x,`Expected ${x} cells, got ${m.length}`),Xe()}function Be(o){const e=document.createElement("div");e.className="cell empty",e.dataset.index=String(o),e.addEventListener("click",()=>Ne(o)),e.addEventListener("dragover",i=>ze(i,o)),e.addEventListener("dragleave",()=>Ye(o)),e.addEventListener("drop",i=>We(i,o));let t;return e.addEventListener("touchstart",()=>{t=window.setTimeout(()=>{const i=m[o];i.state==="filled"&&I&&I(i)},500)}),e.addEventListener("touchend",()=>clearTimeout(t)),e.addEventListener("touchmove",()=>clearTimeout(t)),{element:e,index:o,state:"empty",data:null,imageElement:null}}function Ne(o){const e=m[o];if(e.state==="empty"){const t=document.createElement("input");t.type="file",t.accept="image/*",t.style.position="absolute",t.style.opacity="0",t.style.pointerEvents="none",document.body.appendChild(t),console.log("[Cell] Input created and appended. Triggering click..."),t.onchange=async i=>{console.log("[Cell] File selected");const a=i.target.files?.[0];a&&await Q(o,a),document.body.removeChild(t)},t.click(),console.log("[Cell] Click triggered")}else e.state==="filled"&&I&&(console.log("[Cell] Editing filled cell"),I(e))}function ze(o,e){o.preventDefault(),o.stopPropagation(),m[e].element.classList.add("dragover")}function Ye(o){m[o].element.classList.remove("dragover")}async function We(o,e){o.preventDefault(),o.stopPropagation(),m[e].element.classList.remove("dragover");const t=o.dataTransfer?.files;if(t&&t.length>0){const i=t[0];i.type.startsWith("image/")&&await Q(e,i)}}async function Q(o,e,t){const i=m[o],a=De();await ce(a,e);const n=URL.createObjectURL(e),s=document.createElement("img");s.className="cell-image",s.src=n,s.draggable=!1;const r=Ge(o);i.element.classList.remove("empty"),i.element.classList.add("filled","animating"),i.element.innerHTML="",i.element.appendChild(s),i.element.appendChild(r),i.state="filled",i.imageElement=s,i.data={index:o,imageId:a,cropSettings:t||{offsetX:0,offsetY:0,scale:1,rotation:0}},me(i),setTimeout(()=>{i.element.classList.remove("animating")},500),ee(),pe()}function Ge(o){const e=document.createElement("div");e.className="cell-actions";const t=document.createElement("button");t.className="cell-action-btn",t.innerHTML="✏️",t.title="Редактировать",t.onclick=a=>{a.stopPropagation();const n=m[o];I&&I(n)};const i=document.createElement("button");return i.className="cell-action-btn",i.innerHTML="🗑️",i.title="Удалить",i.onclick=async a=>{a.stopPropagation(),await ge(o)},e.appendChild(t),e.appendChild(i),e}async function ge(o){const e=m[o];e.data&&await _e(e.data.imageId),e.element.className="cell empty",e.element.innerHTML="",e.state="empty",e.data=null,e.imageElement=null,ee(),pe()}function Fe(o,e){const t=m[o];t.data&&(t.data.cropSettings=e,me(t),ee())}function me(o){if(!o.imageElement||!o.data)return;const{offsetX:e,offsetY:t,scale:i,rotation:a}=o.data.cropSettings;o.imageElement.style.transform=`
    translate(${e}px, ${t}px)
    scale(${i})
    rotate(${a}deg)
  `}function ve(){return m.filter(o=>o.state==="filled").length}function pe(){if(V){const o=ve();V(o);const e=document.getElementById("poster");e&&(e.classList.remove("surprise-10","surprise-30"),o===10?(e.classList.add("surprise-10"),setTimeout(()=>e.classList.remove("surprise-10"),2e3)):o===30&&(e.classList.add("surprise-30"),setTimeout(()=>e.classList.remove("surprise-30"),3e3)))}}function ee(){const o={cells:m.filter(e=>e.data!==null).map(e=>e.data),theme:document.documentElement.dataset.theme||"neutral",lastModified:Date.now()};ue(o)}async function Xe(){const o=fe();if(o){for(const e of o.cells){const t=await de(e.imageId);if(t){const i=new File([t],"image",{type:t.type});await Q(e.index,i,e.cropSettings)}}o.theme!=="neutral"&&(document.documentElement.dataset.theme=o.theme)}}async function Ve(){for(let o=0;o<m.length;o++)m[o].state==="filled"&&await ge(o)}let _=null,h=null,f=null,S=null,k=null,oe=null,ie=null,ae=null,z=null,P=null,u={offsetX:0,offsetY:0,scale:1,rotation:0},A=!1,Y=0,W=0,G=0,F=0,we=0,be=1;function Ze(){_=document.getElementById("crop-modal"),h=document.getElementById("crop-canvas"),f=h?.getContext("2d")||null,S=document.getElementById("zoom-slider"),k=document.getElementById("rotate-slider"),oe=document.getElementById("crop-apply"),ie=document.getElementById("crop-cancel"),ae=_?.querySelector(".modal-backdrop"),!(!_||!h||!f)&&(h.width=400,h.height=400,S?.addEventListener("input",$e),k?.addEventListener("input",qe),oe?.addEventListener("click",He),ie?.addEventListener("click",se),ae?.addEventListener("click",se),h.addEventListener("mousedown",je),h.addEventListener("mousemove",Je),h.addEventListener("mouseup",re),h.addEventListener("mouseleave",re),h.addEventListener("touchstart",Ke,{passive:!1}),h.addEventListener("touchmove",Qe,{passive:!1}),h.addEventListener("touchend",et),h.addEventListener("wheel",tt,{passive:!1}))}function Ue(o){!_||!o.imageElement||!o.data||(z=o,u={...o.data.cropSettings},P=new Image,P.crossOrigin="anonymous",P.onload=()=>{O(),_.classList.remove("hidden"),S&&(S.value=String(u.scale)),k&&(k.value=String(u.rotation))},P.src=o.imageElement.src)}function Le(){_&&_.classList.add("hidden"),z=null,P=null}function O(){if(!f||!h||!P)return;f.clearRect(0,0,h.width,h.height),f.fillStyle="#f0f0f0",f.fillRect(0,0,h.width,h.height),f.save(),f.translate(h.width/2,h.height/2),f.rotate(u.rotation*Math.PI/180),f.scale(u.scale,u.scale),f.translate(u.offsetX,u.offsetY);const o=P.width/P.height;let e=h.width,t=h.height;o>1?t=e/o:e=t*o,f.drawImage(P,-e/2,-t/2,e,t),f.restore(),f.strokeStyle="rgba(255, 255, 255, 0.8)",f.lineWidth=2,f.strokeRect(10,10,h.width-20,h.height-20),f.strokeStyle="rgba(255, 255, 255, 0.3)",f.lineWidth=1;const i=h.width/3,a=h.height/3;f.beginPath(),f.moveTo(i,0),f.lineTo(i,h.height),f.moveTo(i*2,0),f.lineTo(i*2,h.height),f.moveTo(0,a),f.lineTo(h.width,a),f.moveTo(0,a*2),f.lineTo(h.width,a*2),f.stroke()}function $e(){S&&(u.scale=parseFloat(S.value),O())}function qe(){k&&(u.rotation=parseInt(k.value,10),O())}function He(){z&&Fe(z.index,u),Le()}function se(){Le()}function je(o){A=!0,Y=o.clientX,W=o.clientY,G=u.offsetX,F=u.offsetY}function Je(o){if(!A)return;const e=o.clientX-Y,t=o.clientY-W;u.offsetX=G+e/u.scale,u.offsetY=F+t/u.scale,O()}function re(){A=!1}function Ke(o){o.preventDefault(),o.touches.length===1?(A=!0,Y=o.touches[0].clientX,W=o.touches[0].clientY,G=u.offsetX,F=u.offsetY):o.touches.length===2&&(A=!1,we=ye(o.touches),be=u.scale)}function Qe(o){if(o.preventDefault(),o.touches.length===1&&A){const e=o.touches[0].clientX-Y,t=o.touches[0].clientY-W;u.offsetX=G+e/u.scale,u.offsetY=F+t/u.scale,O()}else if(o.touches.length===2){const t=ye(o.touches)/we;u.scale=Math.max(.5,Math.min(3,be*t)),S&&(S.value=String(u.scale)),O()}}function et(){A=!1}function ye(o){const e=o[0].clientX-o[1].clientX,t=o[0].clientY-o[1].clientY;return Math.sqrt(e*e+t*t)}function tt(o){o.preventDefault();const e=o.deltaY>0?-.1:.1;u.scale=Math.max(.5,Math.min(3,u.scale+e)),S&&(S.value=String(u.scale)),O()}let D=null,M=null,U=null;const $=24,q=2*Math.PI*$;function nt(){D=document.getElementById("progress-indicator"),D&&(D.innerHTML=`
    <svg class="progress-ring" width="60" height="60" viewBox="0 0 60 60">
      <circle
        class="progress-ring-bg"
        cx="30"
        cy="30"
        r="${$}"
      />
      <circle
        class="progress-ring-fill"
        cx="30"
        cy="30"
        r="${$}"
        stroke-dasharray="${q}"
        stroke-dashoffset="${q}"
      />
    </svg>
    <div class="progress-count">0/${x}</div>
  `,M=D.querySelector(".progress-ring-fill"),U=D.querySelector(".progress-count"))}function te(o){if(!M||!U)return;const e=Math.max(0,Math.min(x,o)),t=e/x,i=q*(1-t);M.style.strokeDashoffset=String(i),t<.33?M.style.stroke="var(--accent-travel)":t<.66?M.style.stroke="#c9a87c":M.style.stroke="var(--accent-dev)",U.textContent=`${e}/${x}`}async function H(o="normal"){const e=document.getElementById("poster");if(!e)return;const t=o==="print"?3:1,i=e.getBoundingClientRect(),a=i.width*t,n=i.height*t,s=document.createElement("canvas");s.width=a,s.height=n;const r=s.getContext("2d");if(!r)return;r.scale(t,t),r.fillStyle=getComputedStyle(e).backgroundColor||"#f5f0e8",r.fillRect(0,0,i.width,i.height);const l=getComputedStyle(e),c=parseFloat(l.borderRadius)||0;r.beginPath(),X(r,0,0,i.width,i.height,c),r.clip();const d=r.createLinearGradient(0,0,i.width,i.height);d.addColorStop(0,"rgba(232, 168, 124, 0.08)"),d.addColorStop(.5,"rgba(245, 240, 232, 0.05)"),d.addColorStop(1,"rgba(245, 200, 66, 0.08)"),r.fillStyle=d,r.fillRect(0,0,i.width,i.height);const g=document.getElementById("grid");if(!g)return;const L=g.querySelectorAll(".cell"),p=g.getBoundingClientRect();p.left-i.left,p.top-i.top;for(const w of L){const v=w.getBoundingClientRect(),b=v.left-i.left,E=v.top-i.top,C=v.width,N=v.height;r.save(),r.beginPath(),X(r,b,E,C,N,8),r.clip(),r.fillStyle="#fffef9",r.fillRect(b,E,C,N);const ne=w.querySelector(".cell-image");ne&&await ot(r,ne,b,E,C,N),r.restore(),r.strokeStyle="rgba(200, 190, 170, 0.4)",r.lineWidth=1,r.beginPath(),X(r,b,E,C,N,8),r.stroke()}s.toBlob(w=>{if(!w)return;const v=URL.createObjectURL(w),b=document.createElement("a");b.href=v,b.download=`vision-board-${o}-${Date.now()}.png`,document.body.appendChild(b),b.click(),document.body.removeChild(b),URL.revokeObjectURL(v)},"image/png",1)}async function ot(o,e,t,i,a,n){return new Promise(s=>{const r=e.style.transform||"",l=r.match(/translate\(([-\d.]+)px,\s*([-\d.]+)px\)/),c=r.match(/scale\(([-\d.]+)\)/),d=r.match(/rotate\(([-\d.]+)deg\)/),g=l?parseFloat(l[1]):0,L=l?parseFloat(l[2]):0,p=c?parseFloat(c[1]):1,w=d?parseFloat(d[1]):0;o.save(),o.translate(t+a/2,i+n/2),o.rotate(w*Math.PI/180),o.scale(p,p),o.translate(g,L);const v=e.naturalWidth/e.naturalHeight,b=a/n;let E,C;v>b?(C=n,E=n*v):(E=a,C=a/v),o.drawImage(e,-E/2,-C/2,E,C),o.restore(),s()})}function X(o,e,t,i,a,n){o.moveTo(e+n,t),o.lineTo(e+i-n,t),o.quadraticCurveTo(e+i,t,e+i,t+n),o.lineTo(e+i,t+a-n),o.quadraticCurveTo(e+i,t+a,e+i-n,t+a),o.lineTo(e+n,t+a),o.quadraticCurveTo(e,t+a,e,t+a-n),o.lineTo(e,t+n),o.quadraticCurveTo(e,t,e+n,t)}let T=null,it=null,at=null;async function le(){console.log("[App] Starting initialization...");try{console.log("[App] Calling initStorage..."),await B(),console.log("[App] Storage initialized");const o=document.getElementById("bg-canvas");o?(console.log("[App] Initializing background renderer"),T=new Ce(o)):console.warn("[App] bg-canvas not found");const e=document.getElementById("bg-travel"),t=document.getElementById("bg-dev");e&&(it=new Pe(e)),t&&(at=new xe(t)),console.log("[App] Initializing grid...");const i=document.getElementById("grid");if(i){console.log("[App] Grid element found, calling initCells"),Z(i,j,J);const n=i.querySelectorAll(".cell").length;console.log(`[App] Grid verification: ${n} cells created`),console.assert(n===x,`Grid must have exactly ${x} cells, found ${n}`)}else console.error("[App] Grid element NOT found");Ze(),nt(),te(ve()),st(),rt();const a=document.getElementById("settings-panel");a&&a.classList.remove("hidden"),console.log("[App] Initialization complete")}catch(o){console.error("[App] Initialization FAILED:",o)}}function j(o){te(o),T&&T.setProgress(o)}function J(o){Ue(o)}function st(){const o=document.getElementById("toolbar");o&&(o.innerHTML=`
    <button class="toolbar-btn" id="btn-add" title="Добавить изображение">➕</button>
    <button class="toolbar-btn" id="btn-clear" title="Очистить всё">🗑️</button>
    <button class="toolbar-btn" id="btn-png" title="Скачать PNG">📷</button>
    <button class="toolbar-btn" id="btn-png-hq" title="Скачать PNG (высокое качество)">🖼️</button>
  `,o.querySelector("#btn-add")?.addEventListener("click",()=>{const e=document.querySelectorAll(".cell.empty");e.length>0&&e[0].click()}),o.querySelector("#btn-clear")?.addEventListener("click",async()=>{confirm("Очистить все ячейки?")&&await Ve()}),o.querySelector("#btn-png")?.addEventListener("click",()=>{H("normal")}),o.querySelector("#btn-png-hq")?.addEventListener("click",()=>{H("print")}))}function rt(){const o=document.getElementById("theme-toggle"),e=document.getElementById("export-png"),t=document.getElementById("export-json"),i=document.getElementById("import-json"),a=document.getElementById("clear-all"),n=document.getElementById("json-input");let s=0;const r=["neutral","warm","cool"];o?.addEventListener("click",()=>{s=(s+1)%r.length;const l=r[s];if(l==="neutral"?delete document.documentElement.dataset.theme:document.documentElement.dataset.theme=l,T){const c=l==="warm"?.15:l==="cool"?-.1:0;T.setWarmth(c)}}),e?.addEventListener("click",()=>{H("normal")}),t?.addEventListener("click",async()=>{const l=await Ae(),c=new Blob([l],{type:"application/json"}),d=URL.createObjectURL(c),g=document.createElement("a");g.href=d,g.download=`vision-board-${Date.now()}.json`,document.body.appendChild(g),g.click(),document.body.removeChild(g),URL.revokeObjectURL(d)}),i?.addEventListener("click",()=>{n?.click()}),n?.addEventListener("change",async l=>{const c=l.target.files?.[0];if(c){try{const d=await c.text();await Oe(d);const g=document.getElementById("grid");g&&Z(g,j,J)}catch(d){console.error("Import error:",d),alert("Ошибка импорта файла")}n.value=""}}),a?.addEventListener("click",async()=>{if(confirm("Удалить все изображения и сбросить прогресс?")){await he(),Ie();const l=document.getElementById("grid");l&&Z(l,j,J),te(0),T&&T.setProgress(0)}})}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",le):le();

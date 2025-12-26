/**
 * WebGL Background Renderer for Dual-Universe Vision Board
 * Creates rich animated procedural background with travel and dev zones
 */

// Vertex shader
const vertexShaderSource = `
  attribute vec2 a_position;
  varying vec2 v_uv;
  
  void main() {
    v_uv = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

// Fragment shader - creates beautiful dual-zone animated background
const fragmentShaderSource = `
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
`;

export class BackgroundRenderer {
  private canvas: HTMLCanvasElement;
  private gl: WebGLRenderingContext | null = null;
  private program: WebGLProgram | null = null;
  private animationId: number = 0;
  private startTime: number = 0;

  // Uniforms
  private timeLocation: WebGLUniformLocation | null = null;
  private resolutionLocation: WebGLUniformLocation | null = null;
  private mouseLocation: WebGLUniformLocation | null = null;
  private progressLocation: WebGLUniformLocation | null = null;
  private warmthLocation: WebGLUniformLocation | null = null;

  // State
  private mouseX: number = 0.5;
  private mouseY: number = 0.5;
  private progress: number = 0;
  private warmth: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.init();
  }

  private init(): void {
    this.gl = this.canvas.getContext('webgl', {
      antialias: true,
      preserveDrawingBuffer: true,
    });

    if (!this.gl) {
      console.warn('WebGL not supported, falling back to CSS background');
      this.canvas.style.background = 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)';
      return;
    }

    const gl = this.gl;

    // Create shaders
    const vertexShader = this.createShader(gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = this.createShader(gl.FRAGMENT_SHADER, fragmentShaderSource);

    if (!vertexShader || !fragmentShader) return;

    // Create program
    this.program = gl.createProgram()!;
    gl.attachShader(this.program, vertexShader);
    gl.attachShader(this.program, fragmentShader);
    gl.linkProgram(this.program);

    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(this.program));
      return;
    }

    // Set up geometry (full-screen quad)
    const positions = new Float32Array([
      -1, -1,
      1, -1,
      -1, 1,
      1, 1,
    ]);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(this.program, 'a_position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    // Get uniform locations
    this.timeLocation = gl.getUniformLocation(this.program, 'u_time');
    this.resolutionLocation = gl.getUniformLocation(this.program, 'u_resolution');
    this.mouseLocation = gl.getUniformLocation(this.program, 'u_mouse');
    this.progressLocation = gl.getUniformLocation(this.program, 'u_progress');
    this.warmthLocation = gl.getUniformLocation(this.program, 'u_warmth');

    this.resize();
    this.startTime = performance.now();
    this.render();

    // Event listeners
    window.addEventListener('resize', () => this.resize());
    window.addEventListener('mousemove', (e) => this.onMouseMove(e));

    // Mobile gyroscope support
    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', (e) => this.onDeviceOrientation(e));
    }
  }

  private createShader(type: number, source: string): WebGLShader | null {
    const gl = this.gl!;
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader compile error:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }

    return shader;
  }

  private resize(): void {
    const dpr = Math.min(window.devicePixelRatio, 2);
    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = window.innerHeight * dpr;
    this.canvas.style.width = window.innerWidth + 'px';
    this.canvas.style.height = window.innerHeight + 'px';

    if (this.gl) {
      this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  private onMouseMove(e: MouseEvent): void {
    this.mouseX = e.clientX / window.innerWidth;
    this.mouseY = 1 - e.clientY / window.innerHeight;
  }

  private onDeviceOrientation(e: DeviceOrientationEvent): void {
    if (e.gamma !== null && e.beta !== null) {
      this.mouseX = 0.5 + (e.gamma / 90) * 0.5;
      this.mouseY = 0.5 + (e.beta / 90) * 0.5;
    }
  }

  private render = (): void => {
    if (!this.gl || !this.program) return;

    const gl = this.gl;
    const time = (performance.now() - this.startTime) / 1000;

    gl.useProgram(this.program);

    // Update uniforms
    gl.uniform1f(this.timeLocation, time);
    gl.uniform2f(this.resolutionLocation, this.canvas.width, this.canvas.height);
    gl.uniform2f(this.mouseLocation, this.mouseX, this.mouseY);
    gl.uniform1f(this.progressLocation, this.progress);
    gl.uniform1f(this.warmthLocation, this.warmth);

    // Draw
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    this.animationId = requestAnimationFrame(this.render);
  };

  public setProgress(filled: number): void {
    this.progress = filled / 30;
  }

  public setWarmth(value: number): void {
    this.warmth = value;
  }

  public destroy(): void {
    cancelAnimationFrame(this.animationId);
    window.removeEventListener('resize', () => this.resize());
  }
}

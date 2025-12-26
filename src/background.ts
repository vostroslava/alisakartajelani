/**
 * WebGL Background Renderer for Dual-Universe Vision Board
 * Creates animated procedural background with travel and dev zones
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

// Fragment shader - creates dual-zone background
const fragmentShaderSource = `
  precision highp float;
  
  varying vec2 v_uv;
  uniform float u_time;
  uniform vec2 u_resolution;
  uniform vec2 u_mouse;
  uniform float u_progress;
  uniform float u_warmth;
  
  // Colors
  const vec3 COLOR_TRAVEL_WARM = vec3(0.91, 0.66, 0.49);   // #e8a87c
  const vec3 COLOR_TRAVEL_SOFT = vec3(0.98, 0.86, 0.76);   // soft peach
  const vec3 COLOR_DEV_YELLOW = vec3(0.96, 0.78, 0.26);    // #f5c842
  const vec3 COLOR_DEV_GRAY = vec3(0.25, 0.27, 0.30);      // graphite
  const vec3 COLOR_BG_WARM = vec3(0.96, 0.94, 0.91);       // #f5f0e8
  const vec3 COLOR_BG_COOL = vec3(0.94, 0.96, 0.97);
  
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
    for (int i = 0; i < 4; i++) {
      value += amplitude * noise(p);
      p *= 2.0;
      amplitude *= 0.5;
    }
    return value;
  }
  
  // Draw arc (flight path)
  float arc(vec2 uv, vec2 center, float radius, float width, float startAngle, float endAngle) {
    vec2 d = uv - center;
    float angle = atan(d.y, d.x);
    float dist = length(d);
    
    float angleInRange = smoothstep(startAngle - 0.1, startAngle, angle) * 
                         (1.0 - smoothstep(endAngle, endAngle + 0.1, angle));
    float ringDist = abs(dist - radius);
    
    return angleInRange * (1.0 - smoothstep(0.0, width, ringDist));
  }
  
  // Draw node (point on graph)
  float node(vec2 uv, vec2 pos, float radius) {
    float d = length(uv - pos);
    return 1.0 - smoothstep(radius * 0.5, radius, d);
  }
  
  // Draw line between two points
  float line(vec2 uv, vec2 a, vec2 b, float width) {
    vec2 pa = uv - a;
    vec2 ba = b - a;
    float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    float d = length(pa - ba * h);
    return 1.0 - smoothstep(0.0, width, d);
  }
  
  void main() {
    vec2 uv = v_uv;
    vec2 aspect = vec2(u_resolution.x / u_resolution.y, 1.0);
    
    // Parallax offset based on mouse
    vec2 parallax = (u_mouse - 0.5) * 0.02;
    uv += parallax;
    
    // Base background with subtle gradient
    vec3 bgColor = mix(COLOR_BG_COOL, COLOR_BG_WARM, 0.5 + u_warmth);
    
    // Add paper texture
    float paperNoise = fbm(uv * 50.0) * 0.02;
    bgColor += paperNoise;
    
    // Zone split - soft diagonal blend
    float zoneSplit = smoothstep(0.4, 0.6, uv.x + (uv.y - 0.5) * 0.2);
    
    // === TRAVEL ZONE (left) ===
    vec3 travelColor = bgColor;
    
    // Soft warm glow in travel zone
    float warmGlow = (1.0 - zoneSplit) * 0.1;
    travelColor = mix(travelColor, COLOR_TRAVEL_SOFT, warmGlow);
    
    // Flight arcs - animated
    float arcs = 0.0;
    
    // Arc 1 - large curve
    float t1 = u_time * 0.3;
    arcs += arc(uv, vec2(0.1, 0.8), 0.4, 0.003, -0.5 + sin(t1) * 0.1, 1.2);
    
    // Arc 2 - medium curve
    arcs += arc(uv, vec2(0.2, 0.3), 0.25, 0.002, 0.0, 2.0);
    
    // Arc 3 - small curve
    arcs += arc(uv, vec2(0.15, 0.6), 0.15, 0.002, -1.0, 0.5);
    
    // Animate arc visibility - base visibility + progress boost
    float travelProgress = 0.3 + 0.7 * smoothstep(0.0, 0.5, u_progress);
    arcs *= travelProgress * (0.5 + 0.5 * sin(u_time * 0.5));
    
    travelColor = mix(travelColor, COLOR_TRAVEL_WARM, arcs * 0.8 * (1.0 - zoneSplit));
    
    // Travel nodes (destinations) - always visible, pulsing
    float travelNodes = 0.0;
    travelNodes += node(uv, vec2(0.08, 0.25), 0.015) * (0.5 + 0.5 * sin(u_time * 2.0));
    travelNodes += node(uv, vec2(0.22, 0.15), 0.012) * (0.5 + 0.5 * sin(u_time * 2.3 + 1.0));
    travelNodes += node(uv, vec2(0.35, 0.35), 0.018) * (0.5 + 0.5 * sin(u_time * 1.8 + 2.0));
    travelNodes += node(uv, vec2(0.15, 0.55), 0.014) * (0.5 + 0.5 * sin(u_time * 2.5 + 0.5));
    travelNodes += node(uv, vec2(0.28, 0.7), 0.016) * (0.5 + 0.5 * sin(u_time * 2.1 + 1.5));
    
    travelColor = mix(travelColor, COLOR_TRAVEL_WARM, travelNodes * travelProgress * (1.0 - zoneSplit));
    
    // === DEV ZONE (right) ===
    vec3 devColor = bgColor;
    
    // Subtle gray tint in dev zone
    float grayTint = zoneSplit * 0.05;
    devColor = mix(devColor, COLOR_DEV_GRAY, grayTint);
    
    // Dependency graph lines - always visible with base intensity
    float graphLines = 0.0;
    float devProgress = 0.3 + 0.7 * smoothstep(0.0, 0.5, u_progress);
    
    // Graph connections
    graphLines += line(uv, vec2(0.6, 0.2), vec2(0.75, 0.35), 0.002);
    graphLines += line(uv, vec2(0.75, 0.35), vec2(0.9, 0.25), 0.002);
    graphLines += line(uv, vec2(0.75, 0.35), vec2(0.85, 0.5), 0.002);
    graphLines += line(uv, vec2(0.65, 0.5), vec2(0.85, 0.5), 0.002);
    graphLines += line(uv, vec2(0.85, 0.5), vec2(0.92, 0.65), 0.002);
    graphLines += line(uv, vec2(0.7, 0.65), vec2(0.85, 0.5), 0.002);
    graphLines += line(uv, vec2(0.7, 0.65), vec2(0.6, 0.8), 0.002);
    graphLines += line(uv, vec2(0.6, 0.8), vec2(0.8, 0.85), 0.002);
    
    // Animate graph lines - pulsing always
    float lineAnim = 0.3 + 0.7 * sin(u_time * 0.4);
    graphLines *= lineAnim * devProgress;
    
    devColor = mix(devColor, COLOR_DEV_YELLOW * 0.7, graphLines * 0.5 * zoneSplit);
    
    // Dev nodes (graph vertices)
    float devNodes = 0.0;
    devNodes += node(uv, vec2(0.6, 0.2), 0.02) * (0.6 + 0.4 * sin(u_time * 1.5));
    devNodes += node(uv, vec2(0.75, 0.35), 0.022) * (0.6 + 0.4 * sin(u_time * 1.8 + 1.0));
    devNodes += node(uv, vec2(0.9, 0.25), 0.018) * (0.6 + 0.4 * sin(u_time * 2.0 + 0.5));
    devNodes += node(uv, vec2(0.65, 0.5), 0.02) * (0.6 + 0.4 * sin(u_time * 1.6 + 1.5));
    devNodes += node(uv, vec2(0.85, 0.5), 0.024) * (0.6 + 0.4 * sin(u_time * 1.4 + 2.0));
    devNodes += node(uv, vec2(0.92, 0.65), 0.016) * (0.6 + 0.4 * sin(u_time * 2.2 + 0.8));
    devNodes += node(uv, vec2(0.7, 0.65), 0.02) * (0.6 + 0.4 * sin(u_time * 1.7 + 1.2));
    devNodes += node(uv, vec2(0.6, 0.8), 0.018) * (0.6 + 0.4 * sin(u_time * 1.9 + 1.8));
    devNodes += node(uv, vec2(0.8, 0.85), 0.02) * (0.6 + 0.4 * sin(u_time * 1.5 + 2.2));
    
    // Dev nodes always visible
    devColor = mix(devColor, COLOR_DEV_YELLOW, devNodes * devProgress * zoneSplit);
    
    // Abstract code patterns (rectangles)
    float codePattern = 0.0;
    for (float i = 0.0; i < 5.0; i++) {
      vec2 barPos = vec2(0.7 + i * 0.05, 0.4 + fbm(vec2(i, u_time * 0.1)) * 0.2);
      float barWidth = 0.02 + fbm(vec2(i * 10.0, 0.0)) * 0.03;
      float barHeight = 0.005;
      
      if (uv.x > barPos.x && uv.x < barPos.x + barWidth &&
          uv.y > barPos.y && uv.y < barPos.y + barHeight) {
        codePattern += 0.3;
      }
    }
    
    devColor = mix(devColor, COLOR_DEV_GRAY, codePattern * zoneSplit * devProgress * 0.3);
    
    // === COMBINE ZONES ===
    vec3 finalColor = mix(travelColor, devColor, zoneSplit);
    
    // Surprise mode effects
    if (u_progress >= 0.33) { // 10/30
      float warmthBoost = smoothstep(0.33, 0.4, u_progress) * 0.1;
      finalColor = mix(finalColor, COLOR_TRAVEL_WARM, warmthBoost);
    }
    
    if (u_progress >= 1.0) { // 30/30
      float celebration = 0.5 + 0.5 * sin(u_time * 3.0);
      vec3 celebrationColor = mix(COLOR_TRAVEL_WARM, COLOR_DEV_YELLOW, celebration);
      finalColor = mix(finalColor, celebrationColor, 0.15);
    }
    
    // Vignette
    float vignette = 1.0 - length((uv - 0.5) * 0.8);
    vignette = smoothstep(0.0, 1.0, vignette);
    finalColor *= 0.9 + vignette * 0.1;
    
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
      this.canvas.style.background = 'linear-gradient(135deg, #f5f0e8 0%, #f0f4f8 100%)';
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

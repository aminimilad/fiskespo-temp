/* Hero background, built the same way as lukebaffait.fr:
   a soft, blurred colour texture → a perlin flow field (8 steps) that bends the texture,
   centred on the pointer, with momentum → shown at low resolution so it stays soft.
   The texture is painted here with 2D radial gradients instead of loading an image. */
window.createGradient = function createGradient(canvas, opts = {}) {
  const gl = canvas.getContext('webgl', { antialias: false, premultipliedAlpha: false });
  if (!gl) return null;

  const o = Object.assign({ scale: 0.5, variant: 'hero' }, opts);

  /* ---- 1. paint the source texture ---- */
  const tex = document.createElement('canvas');
  tex.width = 1024; tex.height = 664;
  const c = tex.getContext('2d');
  c.fillStyle = '#060404';
  c.fillRect(0, 0, tex.width, tex.height);
  // ellipse made of a radial gradient: soft by nature, no filter needed
  function blob(x, y, rx, ry, color, alpha) {
    c.save();
    c.translate(x * tex.width, y * tex.height);
    c.scale(rx, ry);
    const g = c.createRadialGradient(0, 0, 0, 0, 0, 1);
    g.addColorStop(0, color.replace('A', alpha));
    g.addColorStop(0.55, color.replace('A', alpha * 0.55));
    g.addColorStop(1, color.replace('A', 0));
    c.fillStyle = g;
    c.beginPath(); c.arc(0, 0, 1, 0, Math.PI * 2); c.fill();
    c.restore();
  }
  if (o.variant === 'foot') {
    // footer: wine, ember and a violet haze rising from the bottom
    blob(0.20, 0.95, 300, 420, 'rgba(200,40,24,A)', 0.9);
    blob(0.70, 1.00, 340, 380, 'rgba(255,96,40,A)', 0.8);
    blob(0.50, 0.30, 420, 260, 'rgba(90,10,40,A)', 0.8);
    blob(0.90, 0.25, 220, 320, 'rgba(80,24,110,A)', 0.55);
    blob(0.10, 0.20, 220, 260, 'rgba(6,4,4,A)', 0.9);
    blob(0.55, 0.62, 160, 200, 'rgba(6,4,4,A)', 0.7);
  } else {
    // hero: red curtains hanging from the top, darker dips between them
    blob(0.30, 0.05, 190, 420, 'rgba(226,40,22,A)', 0.95);
    blob(0.62, 0.00, 260, 520, 'rgba(240,36,20,A)', 1);
    blob(0.88, 0.10, 170, 470, 'rgba(255,40,24,A)', 0.9);
    blob(0.55, 0.62, 95, 220, 'rgba(210,30,18,A)', 0.55);
    blob(0.64, 0.02, 230, 140, 'rgba(255,120,60,A)', 0.75);   // warm glow at the top
    blob(0.18, 0.35, 120, 260, 'rgba(120,16,10,A)', 0.6);
    blob(0.42, 0.55, 110, 260, 'rgba(6,4,4,A)', 0.85);        // dark dips
    blob(0.80, 0.62, 140, 240, 'rgba(6,4,4,A)', 0.8);
    blob(0.06, 0.70, 260, 300, 'rgba(6,4,4,A)', 0.9);
    blob(0.99, 0.60, 60, 260, 'rgba(70,30,120,A)', 0.35);     // a touch of violet at the edge
  }

  /* ---- 2. shaders ---- */
  const vert = `attribute vec2 p; varying vec2 vUv;
void main(){ vUv = p * .5 + .5; gl_Position = vec4(p, 0., 1.); }`;

  const frag = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uTexture;
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uMouse;
uniform float uIntro;

vec3 hash33(vec3 p3){
  p3 = fract(p3 * vec3(.1031, .11369, .13787));
  p3 += dot(p3, p3.yxz + 19.19);
  return -1. + 2. * fract(vec3((p3.x + p3.y) * p3.z, (p3.x + p3.z) * p3.y, (p3.y + p3.z) * p3.x));
}
float perlin(vec3 p){
  vec3 pi = floor(p), pf = p - pi;
  vec3 w = pf * pf * (3. - 2. * pf);
  float n000 = dot(pf - vec3(0,0,0), hash33(pi + vec3(0,0,0)));
  float n100 = dot(pf - vec3(1,0,0), hash33(pi + vec3(1,0,0)));
  float n010 = dot(pf - vec3(0,1,0), hash33(pi + vec3(0,1,0)));
  float n110 = dot(pf - vec3(1,1,0), hash33(pi + vec3(1,1,0)));
  float n001 = dot(pf - vec3(0,0,1), hash33(pi + vec3(0,0,1)));
  float n101 = dot(pf - vec3(1,0,1), hash33(pi + vec3(1,0,1)));
  float n011 = dot(pf - vec3(0,1,1), hash33(pi + vec3(0,1,1)));
  float n111 = dot(pf - vec3(1,1,1), hash33(pi + vec3(1,1,1)));
  return mix(mix(mix(n000, n100, w.x), mix(n010, n110, w.x), w.y),
             mix(mix(n001, n101, w.x), mix(n011, n111, w.x), w.y), w.z);
}

// flow field: walk the uv 8 steps along a noise-driven angle; the field is anchored to the pointer
vec2 flow(vec2 uv){
  float asp = uRes.x / uRes.y;
  vec2 av = vec2(asp, 1.);
  vec2 st = uv;
  vec2 inv = 1. - uMouse;
  float sprd = .168 / ((asp + 1.) / 2.);
  float freq = 5. * sprd;
  float t = .95 + uTime * .0166;
  float rad = 360. * 6. * 3.14159265 / 180.;
  for (int i = 0; i < 8; i++){
    vec2 s = (clamp(st, -1., 2.) - .5) * av + inv;
    float a = (perlin(vec3((s - .5) * freq, t)) - .5) * rad;
    st += vec2(cos(a), sin(a)) * .02;
  }
  return mix(uv, clamp(st, 0., 1.), .51);
}

void main(){
  vec2 uv = flow(vUv);
  vec3 col = texture2D(uTexture, vec2(uv.x, 1. - uv.y)).rgb;
  col *= uIntro;
  col += (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - .5) / 80.;  // deband
  gl_FragColor = vec4(col, 1.);
}`;

  function sh(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.error(gl.getShaderInfoLog(s)); return null; }
    return s;
  }
  const vs = sh(gl.VERTEX_SHADER, vert), fs = sh(gl.FRAGMENT_SHADER, frag);
  if (!vs || !fs) return null;
  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  gl.useProgram(prog);

  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const t = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, t);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  const u = {};
  ['uRes', 'uTime', 'uMouse', 'uIntro'].forEach((n) => { u[n] = gl.getUniformLocation(prog, n); });

  // GSAP animates these
  const state = { mouseX: 0.5, mouseY: 0.5, intro: 0 };

  function resize() {
    const r = canvas.getBoundingClientRect();
    const w = Math.max(1, Math.round(r.width * o.scale));
    const h = Math.max(1, Math.round(r.height * o.scale));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    gl.viewport(0, 0, w, h);
  }
  resize();
  window.addEventListener('resize', resize);

  let visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(canvas);

  function render(seconds) {
    if (!visible) return;
    gl.uniform2f(u.uRes, canvas.width, canvas.height);
    gl.uniform1f(u.uTime, seconds * 60 * 0.06);   // same pace as the reference (speed 0.06)
    gl.uniform2f(u.uMouse, state.mouseX, 1 - state.mouseY);
    gl.uniform1f(u.uIntro, state.intro);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  return { state, render, resize };
};

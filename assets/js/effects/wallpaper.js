// Deform the original illustration locally, keeping head and hair motion
// independent of the camera. Every sine completes a cycle within 12 seconds.
const WALLPAPER_CONFIG = {
  loopDurationMs: 12000,
  desktopFps: 30,
  lowQualityFps: 15,
  desktopPixelRatio: 1.5,
  maxWidth: 1920,
  maxHeight: 1200,
  reducedQualityScale: 0.65,
  reduceQualityAfterMs: 24,
  fallbackAfterMs: 50,
  fallbackFrameCount: 3,
};

window.mountPortfolioWallpaper = function (screen, signal, scene = 'skills') {
  const image = screen.querySelector(`.${scene}-wallpaper`);
  const canvas = screen.querySelector(`.${scene}-wallpaper-canvas`);
  const particles = screen.querySelector(`.${scene}-particles`);
  const sceneMotion =
    scene === 'projects'
      ? `
        if (p.x > .60 && p.x < .85 && p.y > .33 && p.y < .51) {
          // Projects animates only hair. Keep the nearby green leaves fixed.
          vec2 original = p;
          float kairiHair = region(original, vec2(.650, .429), vec2(.032, .036));
          float kairiEnds = max(region(original, vec2(.631, .471), vec2(.016, .029)),
                               region(original, vec2(.671, .473), vec2(.012, .027)));
          float kairiLeaf = rigidRegion(original, vec2(.682, .475), vec2(.012, .020));
          p -= (1. - kairiLeaf) * vec2(.0028 * kairiHair * sin(phase * 4. + original.y * 9.) + .0038 * kairiEnds * sin(phase * 4. + 1.7),
                                     .0013 * kairiEnds * sin(phase * 4. + .5));
          float soraHair = region(original, vec2(.791, .383), vec2(.038, .040));
          float soraTips = 1. - smoothstep(.355, .445, original.y);
          float soraLeaf = rigidRegion(original, vec2(.767, .499), vec2(.013, .016));
          p -= soraHair * (1. - soraLeaf) * vec2((.002 + .003 * soraTips) * sin(phase * 4. + original.y * 12.),
                                               .0016 * sin(phase * 4. + 2.));
        }
`
      : `
          // Sora: a small head tilt, with a stronger independent hair sway.
          p = head(p, vec2(.611, .171), vec2(.064, .132), vec2(.630, .267),
                   .014 * sin(phase * 2.), vec2(.0025 * sin(phase * 2.), .0015 * sin(phase * 2. + .6)));
          float hair = region(p, vec2(.609, .126), vec2(.061, .086));
          float tips = 1. - smoothstep(.06, .25, p.y);
          p -= hair * vec2((.003 + .005 * tips) * sin(phase * 4. + p.y * 11.),
                           .0032 * sin(phase * 4. + .8));
          // Kairi's face stays rigid. Only the crown and outer hair tips sway.
          p = head(p, vec2(.402, .252), vec2(.064, .126), vec2(.421, .340),
                   .007 * sin(phase * 2. + 1.4), vec2(.0012 * sin(phase * 2. + 1.4), 0.));
          float kairiFace = rigidRegion(p, vec2(.397, .278), vec2(.034, .052));
          float kairiTop = region(p, vec2(.400, .195), vec2(.045, .046));
          float kairiTips = region(p, vec2(.439, .257), vec2(.021, .067));
          float kairiHair = max(kairiTop, kairiTips) * (1. - kairiFace);
          p -= kairiHair * vec2(.0038 * sin(phase * 4. + 1.2), .0012 * sin(phase * 4.));
          p = head(p, vec2(.862, .139), vec2(.048, .071), vec2(.872, .207),
                   .011 * sin(phase * 2. + 3.), vec2(.0015 * sin(phase * 2. + 3.), 0.));
          float riku = region(p, vec2(.863, .116), vec2(.049, .054));
          p -= riku * vec2(.004 * sin(phase * 4. + 2.7), .0015 * sin(phase * 4. + 2.));
          // Donald: head and hat bob, with a small independent raised-hand wave.
          p = head(p, vec2(.512, .100), vec2(.060, .101), vec2(.524, .184),
                   .012 * sin(phase * 2. + .7), vec2(.0016 * sin(phase * 2. + .7), .0022 * sin(phase * 2. + 1.1)));
          vec2 donaldHand = head(p, vec2(.558, .110), vec2(.024, .052), vec2(.554, .163),
                                 .018 * sin(phase * 4. + 1.6), vec2(.001 * sin(phase * 4. + 1.6), 0.));
          float donaldFace = rigidRegion(p, vec2(.511, .100), vec2(.054, .094));
          p = mix(p, donaldHand, 1. - donaldFace);
          // Mickey: ears and face move as one; his glove waves separately.
          p = head(p, vec2(.211, .451), vec2(.079, .133), vec2(.249, .548),
                   .013 * sin(phase * 2. + 2.2), vec2(.0017 * sin(phase * 2. + 2.2), .0014 * sin(phase * 2. + 2.8)));
          vec2 mickeyHand = head(p, vec2(.293, .397), vec2(.037, .060), vec2(.287, .468),
                                 .026 * sin(phase * 4. + 2.6), vec2(.0013 * sin(phase * 4. + 2.6), 0.));
          float mickeyFace = rigidRegion(p, vec2(.211, .451), vec2(.070, .125));
          p = mix(p, mickeyHand, 1. - mickeyFace);
          // Goofy is upside down: pivot at his neck above the face and hat.
          p = head(p, vec2(.786, .748), vec2(.082, .137), vec2(.748, .653),
                   .014 * sin(phase * 2. + 4.1), vec2(.0018 * sin(phase * 2. + 4.1), .002 * sin(phase * 2. + 4.7)));
`;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (scene === 'projects') {
    // Shapes echo the existing upper-left pattern rather than generic dots.
    const ornaments = [
      '<circle cx="20" cy="23" r="12"/><circle cx="8" cy="9" r="8"/><circle cx="32" cy="9" r="8"/>',
      '<path d="M4 9 13 19 20 4 27 19 36 9 31 32Q20 36 9 32Z"/>',
      '<path d="M20 35C16 27 3 21 3 11C3 0 20 0 20 12C20 0 37 0 37 11C37 21 24 27 20 35Z" fill="none" stroke="currentColor" stroke-width="2"/>',
      '<path d="M17 4a7 7 0 1 0 0 14a7 7 0 1 0 0-14M17 18v18h8v-5h-8v-5h6" fill="none" stroke="currentColor" stroke-width="3"/>',
      '<path d="m20 2 4 13 14 5-14 4-4 14-5-14-13-4 13-5Z"/>',
    ];
    for (let i = 0; i < 30; i++) {
      const particle = document.createElement('span');
      particle.className = 'projects-particle';
      particle.innerHTML = `<svg viewBox="0 0 40 40" fill="currentColor" aria-hidden="true">${ornaments[i % ornaments.length]}</svg>`;
      const seed = ((i * 73) % 101) / 101;
      const values = {
        x: `${-5 + seed * 43}%`,
        y: `${-12 + ((i * 17) % 30)}%`,
        size: `${22 + (i % 5) * 6}px`,
        duration: `${9 + (i % 6)}s`,
        delay: `${-i * 0.83}s`,
        dx: `${24 + seed * 35}vw`,
        dy: `${48 + seed * 39}vh`,
        turn: `${i % 2 ? 55 : -45}deg`,
      };
      Object.entries(values).forEach(([key, value]) =>
        particle.style.setProperty(`--${key}`, value)
      );
      particles.append(particle);
    }
  } else {
    for (let i = 0; i < 32; i++) {
      const particle = document.createElement('span');
      particle.className = `skills-particle${i % 6 === 0 ? ' is-star' : ''}`;
      const seed = ((i * 73) % 101) / 101;
      const duration = 6 + (i % 7);
      const values = {
        x: `${66 + seed * 36}%`,
        y: `${-8 + ((i * 37) % 45)}%`,
        size: `${i % 6 === 0 ? 8 : 2 + (i % 3)}px`,
        duration: `${duration}s`,
        delay: `${-i * 0.61}s`,
        dx: `${-22 - seed * 32}vw`,
        dy: `${35 + seed * 53}vh`,
      };
      Object.entries(values).forEach(([key, value]) =>
        particle.style.setProperty(`--${key}`, value)
      );
      particles.append(particle);
    }
  }
  let gl, program, texture, buffer;
  let frame = 0,
    lastFrame = 0,
    elapsed = 0,
    previous = null,
    disposed = false;
  let locations;
  let projectRect = [0, 0, 1, 1];
  let frameInterval = 1000 / WALLPAPER_CONFIG.desktopFps;
  let quality = 1,
    slowFrames = 0;
  screen.dataset.wallpaperMode = 'fallback';
  function resize() {
    const fps = quality < 1 ? WALLPAPER_CONFIG.lowQualityFps : WALLPAPER_CONFIG.desktopFps;
    frameInterval = 1000 / fps;
    if (scene === 'projects') {
      const width = screen.clientWidth,
        height = screen.clientHeight;
      const imageAspect = (image.naturalWidth || 1280) / (image.naturalHeight || 720);
      // Cap both dimensions instead of enlarging a cover crop on narrow screens.
      const imageHeight = Math.min(height, (width * 2.28) / imageAspect);
      const imageWidth = imageHeight * imageAspect;
      const t = Math.max(0, Math.min(1, (width / height - 0.8) / 0.6));
      const bottom = 0.86 + 0.12 * t * t * (3 - 2 * t);
      projectRect = [
        (width - imageWidth) / width,
        bottom - imageHeight / height,
        imageWidth / width,
        imageHeight / height,
      ];
      // CSS reserves the image size immediately; transform avoids layout shift.
      image.style.setProperty('--project-y-offset', `${(bottom - 0.86) * height}px`);
    }
    if (!gl) return;
    const ratio =
      quality *
      Math.min(
        window.devicePixelRatio || 1,
        WALLPAPER_CONFIG.desktopPixelRatio,
        WALLPAPER_CONFIG.maxWidth / screen.clientWidth,
        WALLPAPER_CONFIG.maxHeight / screen.clientHeight
      );
    canvas.width = Math.round(screen.clientWidth * ratio);
    canvas.height = Math.round(screen.clientHeight * ratio);
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  function draw(phase) {
    gl.uniform1f(locations.phase, phase);
    gl.uniform1f(locations.aspect, canvas.width / canvas.height);
    gl.uniform1f(locations.imageAspect, image.naturalWidth / image.naturalHeight);
    gl.uniform1f(locations.focusX, 0.5);
    if (scene === 'projects') gl.uniform4f(locations.wallpaperRect, ...projectRect);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
  function tick(now) {
    if (disposed || document.hidden || reduced.matches) {
      previous = null;
      return;
    }
    frame = requestAnimationFrame(tick);
    if (now - lastFrame < frameInterval) return;
    if (previous !== null) elapsed += Math.min(now - previous, 100);
    previous = now;
    lastFrame = now;
    const started = performance.now();
    draw(loopPhase());
    const cost = performance.now() - started;
    if (quality === 1 && cost > WALLPAPER_CONFIG.reduceQualityAfterMs) {
      quality = WALLPAPER_CONFIG.reducedQualityScale;
      resize();
    }
    slowFrames =
      cost > WALLPAPER_CONFIG.fallbackAfterMs ? slowFrames + 1 : Math.max(0, slowFrames - 1);
    if (slowFrames >= WALLPAPER_CONFIG.fallbackFrameCount) {
      // Protect keyboard/input response on slow renderers; particles remain.
      cancelAnimationFrame(frame);
      canvas.classList.remove('is-ready');
      screen.dataset.wallpaperMode = 'fallback';
      releaseGraphics();
    }
  }
  function loopPhase() {
    return (
      ((elapsed % WALLPAPER_CONFIG.loopDurationMs) / WALLPAPER_CONFIG.loopDurationMs) * Math.PI * 2
    );
  }
  function resume() {
    cancelAnimationFrame(frame);
    previous = null;
    if (disposed) return;
    resize();
    if (!gl || !locations || gl.isContextLost()) return;
    draw(reduced.matches ? 0 : loopPhase());
    if (!document.hidden && !reduced.matches) frame = requestAnimationFrame(tick);
  }
  function shader(type, source) {
    const item = gl.createShader(type);
    gl.shaderSource(item, source);
    gl.compileShader(item);
    if (!gl.getShaderParameter(item, gl.COMPILE_STATUS)) {
      const error = gl.getShaderInfoLog(item);
      gl.deleteShader(item);
      throw new Error(error);
    }
    return item;
  }
  // WebGL refuses local file:// images as cross-origin. Pages opened from disk
  // use an embedded copy of the same texture; data: URIs are not cross-origin.
  function loadEmbeddedTextures() {
    return new Promise((resolve, reject) => {
      if (window.WALLPAPER_TEXTURES) return resolve(window.WALLPAPER_TEXTURES);
      const script = document.createElement('script');
      script.src = 'assets/data/wallpaper-textures.js';
      script.onload = () => resolve(window.WALLPAPER_TEXTURES);
      script.onerror = () => {
        script.remove();
        reject(new Error('Embedded wallpaper textures unavailable.'));
      };
      document.head.append(script);
    });
  }
  async function textureSource() {
    if (location.protocol !== 'file:') return image;
    const textures = await loadEmbeddedTextures();
    const source = new Image();
    source.src = textures[scene];
    await source.decode();
    return source;
  }
  async function init() {
    if (disposed || !image.naturalWidth) return;
    try {
      const source = await textureSource();
      if (disposed) return;
      // Keep the image and CSS particles on devices where WebGL would need
      // slow software rendering. Hardware-backed devices retain hair motion.
      gl = canvas.getContext('webgl', {
        alpha: false,
        antialias: false,
        depth: false,
        powerPreference: 'low-power',
        failIfMajorPerformanceCaveat: true,
      });
      if (!gl) return;
      const rendererInfo = gl.getExtension('WEBGL_debug_renderer_info');
      const renderer = rendererInfo ? gl.getParameter(rendererInfo.UNMASKED_RENDERER_WEBGL) : '';
      if (/swiftshader|llvmpipe|softpipe|software rasterizer/i.test(renderer)) {
        releaseGraphics();
        return;
      }
      const vertex = shader(
        gl.VERTEX_SHADER,
        `
        attribute vec2 position;
        varying vec2 uv;
        void main() {
          uv = vec2(position.x * .5 + .5, .5 - position.y * .5);
          gl_Position = vec4(position, 0., 1.);
        }
      `
      );
      const fragment = shader(
        gl.FRAGMENT_SHADER,
        `
        #ifdef GL_FRAGMENT_PRECISION_HIGH
        precision highp float;
        #else
        precision mediump float;
        #endif
        varying vec2 uv;
        uniform sampler2D illustration;
        uniform float phase, aspect, imageAspect, focusX;
        uniform vec4 wallpaperRect;
        float region(vec2 p, vec2 center, vec2 radius) {
          return 1. - smoothstep(.35, 1.15, length((p - center) / radius));
        }
        float rigidRegion(vec2 p, vec2 center, vec2 radius) {
          // Keep faces inside a constant-weight core: only rotate/translate.
          // Feather the motion outside the head, never across eyes or cheeks.
          return 1. - smoothstep(.80, 1.30, length((p - center) / radius));
        }
        vec2 head(vec2 p, vec2 center, vec2 radius, vec2 pivot, float angle, vec2 shift) {
          float w = rigidRegion(p, center, radius);
          if (w <= 0.) return p;
          vec2 d = p - pivot;
          // Correct the rotation for the illustration's aspect ratio.
          d.x *= imageAspect;
          vec2 r = mat2(cos(angle), -sin(angle), sin(angle), cos(angle)) * d;
          r.x /= imageAspect;
          return p + (r + pivot - p - shift) * w;
        }
        void main() {
          vec2 cover = vec2(min(1., aspect / imageAspect), min(1., imageAspect / aspect));
          ${scene === 'projects' ? '' : 'float zoom = 1.035 + .006 * sin(phase);'}
          vec2 p = ${scene === 'projects' ? '(uv - wallpaperRect.xy) / wallpaperRect.zw' : '(uv - .5) * cover / zoom + vec2(.5 + (focusX - .5) * (1. - cover.x), .5)'};
          ${scene === 'projects' ? '' : 'p += vec2(.0025 * sin(phase), .0015 * sin(phase * 2.));'}
          ${sceneMotion}
          vec2 sampleP = p;
          vec4 color = texture2D(illustration, clamp(sampleP, vec2(.001), vec2(.999)));
          ${scene === 'projects' ? 'float waterFade = smoothstep(.88, 1.015, p.y) * smoothstep(.52, .62, p.x); color.rgb = mix(color.rgb, vec3(1.), waterFade); float imageMask = smoothstep(-.03, .08, p.x) * (1. - smoothstep(.98, 1.03, p.x)) * smoothstep(0., .12, p.y) * (1. - smoothstep(.97, 1., p.y)); vec3 backdrop = mix(vec3(.71, .92, .95), vec3(1.), smoothstep(.0, .68, uv.x)); color.rgb = mix(backdrop, color.rgb, imageMask);' : ''}
          gl_FragColor = color;
        }
      `
      );
      program = gl.createProgram();
      gl.attachShader(program, vertex);
      gl.attachShader(program, fragment);
      gl.linkProgram(program);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS))
        throw new Error(gl.getProgramInfoLog(program));
      gl.useProgram(program);
      buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
        gl.STATIC_DRAW
      );
      const position = gl.getAttribLocation(program, 'position');
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
      texture = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, source);
      gl.uniform1i(gl.getUniformLocation(program, 'illustration'), 0);
      locations = {
        phase: gl.getUniformLocation(program, 'phase'),
        aspect: gl.getUniformLocation(program, 'aspect'),
        imageAspect: gl.getUniformLocation(program, 'imageAspect'),
        focusX: gl.getUniformLocation(program, 'focusX'),
        wallpaperRect: gl.getUniformLocation(program, 'wallpaperRect'),
      };
      resize();
      draw(0);
      canvas.classList.add('is-ready');
      screen.dataset.wallpaperMode = 'animated';
      resume();
    } catch (error) {
      releaseGraphics();
      canvas.classList.remove('is-ready');
      screen.dataset.wallpaperMode = 'fallback';
      console.warn('Animated wallpaper unavailable; using image.', error);
    }
  }
  window.addEventListener('resize', resume, { signal });
  document.addEventListener('visibilitychange', resume, { signal });
  reduced.addEventListener('change', resume, { signal });
  canvas.addEventListener(
    'webglcontextlost',
    (event) => {
      event.preventDefault();
      cancelAnimationFrame(frame);
      canvas.classList.remove('is-ready');
      screen.dataset.wallpaperMode = 'fallback';
    },
    { signal }
  );
  resize();
  if (image.complete) init();
  else image.addEventListener('load', init, { once: true, signal });
  function releaseGraphics() {
    if (gl) {
      gl.deleteTexture(texture);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      gl = null;
      locations = null;
    }
  }
  return () => {
    disposed = true;
    cancelAnimationFrame(frame);
    releaseGraphics();
  };
};

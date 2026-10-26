import { mount } from './vendor/paper-stack.js?v=5';

const entries = new Map();
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const canvasPixelBudget = 4_200_000;
const pendingImages = new WeakSet();
let proximityObserver;
let budgetFrame = 0;

function applyRenderBudget() {
  budgetFrame = 0;
  const active = [...entries.values()];
  if (!active.length) return;

  const cssPixels = active.reduce((sum, entry) => {
    const canvas = entry.engine.canvas;
    return sum + Math.max(1, canvas.clientWidth) * Math.max(1, canvas.clientHeight);
  }, 0);
  const combinedBudget = canvasPixelBudget * active.length;
  const ratio = Math.min(2, window.devicePixelRatio || 1, Math.sqrt(combinedBudget / cssPixels));
  active.forEach(({ engine }) => engine.renderer.setPixelRatio(ratio));
}

function queueRenderBudget() {
  if (!budgetFrame) budgetFrame = requestAnimationFrame(applyRenderBudget);
}

function cropToPhoto(image) {
  const width = image.naturalWidth || image.width;
  const height = image.naturalHeight || image.height;
  const targetRatio = 4 / 5;
  const sourceRatio = width / height;
  let sx = 0;
  let sy = 0;
  let sw = width;
  let sh = height;

  // Match the existing object-fit: cover crop in the 4:5 founder portrait.
  if (sourceRatio > targetRatio) {
    sw = height * targetRatio;
    sx = (width - sw) / 2;
  } else {
    sh = width / targetRatio;
    sy = (height - sh) / 2;
  }

  const crop = document.createElement('canvas');
  crop.width = Math.round(sw);
  crop.height = Math.round(sh);
  crop.getContext('2d').drawImage(image, sx, sy, sw, sh, 0, 0, crop.width, crop.height);
  return crop;
}

function progressFor(photo) {
  const value = Number.parseFloat(getComputedStyle(photo).getPropertyValue('--founder-paper-progress'));
  return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 1;
}

function sync(photo) {
  const entry = entries.get(photo);
  if (entry) entry.engine.setHead(progressFor(photo), false);
}

function disposeEntry(photo, entry, restoreImage = false) {
  if (entries.get(photo) !== entry) return;
  entry.pixelObserver.disconnect();
  entry.engine.dispose();
  entry.stage.remove();
  entries.delete(photo);
  if (restoreImage) photo.classList.remove('is-paper-ready');
  queueRenderBudget();
}

function init(photo) {
  if (entries.has(photo) || reduceMotion.matches) return;
  const image = photo.querySelector('img');
  if (!image || !image.complete || !image.naturalWidth) return;

  const stageScale = 3.5;
  const stage = document.createElement('div');
  stage.className = 'founder-paper-stage';
  photo.append(stage);

  let engine;
  try {
    engine = mount(stage, {
      driver: 'controlled',
      suspendWhenOffscreen: true,
      visibilityTarget: photo,
      // Chande's poster-stack-5 sheet uses from: -19 for this upper-right entrance.
      sheets: [{ img: cropToPhoto(image), x: 0, y: 0, rot: 0, scale: 1, from: -19 }],
      params: {
        frame: { ratio: '4:5', bg: 'transparent', margin: 0.06 },
        // Keep the finished portrait the same size while giving its flight a wider stage.
        stack: { size: 0.84 / stageScale, startLaid: false, scatter: 0 },
        motion: { damping: 0 },
        outro: { on: false },
      },
    });
  } catch {
    stage.remove();
    return;
  }

  const canvas = engine.canvas;
  canvas.classList.add('founder-paper-canvas');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none;background:transparent';
  const pixelObserver = new ResizeObserver(queueRenderBudget);
  pixelObserver.observe(canvas);
  const entry = { engine, image, stage, pixelObserver };
  entries.set(photo, entry);
  applyRenderBudget();

  engine.ready.then(() => {
    if (!photo.isConnected || reduceMotion.matches) {
      disposeEntry(photo, entry);
      return;
    }
    photo.classList.add('is-paper-ready');
    engine.setHead(progressFor(photo), true);
    engine.renderOnce();
  }).catch(() => {
    disposeEntry(photo, entry);
  });
}

function preparePhoto(photo) {
  const image = photo.querySelector('img');
  if (!image) return;
  if (image.complete) init(photo);
  else if (!pendingImages.has(image)) {
    pendingImages.add(image);
    image.addEventListener('load', () => {
      pendingImages.delete(image);
      init(photo);
    }, { once: true });
  }
}

function observeFounderPhotos() {
  if (reduceMotion.matches) return;
  proximityObserver?.disconnect();
  const photos = [...document.querySelectorAll('.founder-photo')].filter((photo) => !entries.has(photo));
  if (!photos.length) return;
  if (typeof IntersectionObserver === 'undefined') {
    photos.forEach(preparePhoto);
    return;
  }
  proximityObserver = new IntersectionObserver((records) => {
    records.forEach((record) => {
      if (!record.isIntersecting) return;
      proximityObserver.unobserve(record.target);
      preparePhoto(record.target);
    });
  }, { rootMargin: '150% 0px' });
  photos.forEach((photo) => proximityObserver.observe(photo));
}

observeFounderPhotos();
window.addEventListener('resize', queueRenderBudget, { passive: true });

if (window.ScrollTrigger) {
  ScrollTrigger.addEventListener('update', () => entries.forEach((_entry, photo) => sync(photo)));
  ScrollTrigger.addEventListener('refresh', () => entries.forEach((_entry, photo) => sync(photo)));
}

reduceMotion.addEventListener?.('change', (event) => {
  if (event.matches) {
    proximityObserver?.disconnect();
    entries.forEach((entry, photo) => disposeEntry(photo, entry, true));
  } else {
    observeFounderPhotos();
  }
});

window.LedexFounderPaper = { sync };

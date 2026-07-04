const canvas = document.getElementById('particles');
const ctx = canvas.getContext('2d');
let particles = [];
let mouse = { x: 0, y: 0 };

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

class Particle {
  constructor() { this.reset(); }
  reset() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.size = Math.random() * 1.5 + 0.5;
    this.speedX = (Math.random() - 0.5) * 0.3;
    this.speedY = (Math.random() - 0.5) * 0.3;
    this.opacity = Math.random() * 0.4 + 0.1;
  }
  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    const dx = mouse.x - this.x;
    const dy = mouse.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 120) {
      const force = (120 - dist) / 120 * 0.3;
      this.x -= dx / dist * force;
      this.y -= dy / dist * force;
    }
    if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) this.reset();
  }
  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(162, 155, 254, ${this.opacity})`;
    ctx.fill();
  }
}

for (let i = 0; i < 80; i++) particles.push(new Particle());

function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles.forEach(p => { p.update(); p.draw(); });
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const dx = particles[i].x - particles[j].x;
      const dy = particles[i].y - particles[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 100) {
        ctx.beginPath();
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(particles[j].x, particles[j].y);
        ctx.strokeStyle = `rgba(162, 155, 254, ${0.06 * (1 - dist / 100)})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    }
  }
  requestAnimationFrame(animate);
}
animate();

document.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });

const scrollHint = document.querySelector('.scroll-hint');
window.addEventListener('scroll', () => {
  if (window.scrollY > 20) {
    scrollHint?.classList.add('hidden');
  } else {
    scrollHint?.classList.remove('hidden');
  }
});

let CATS = [];
const zero = n => String(n).padStart(2, '0');

const IMG_EXTS = ['jpg', 'jpeg', 'png', 'webp'];
const VID_EXTS = ['mp4', 'webm', 'mov'];

function tryExts(n, exts, idx) {
  if (idx >= exts.length) return Promise.reject();
  const isVid = /^(mp4|webm|mov)$/.test(exts[idx]);
  return new Promise((resolve, reject) => {
    if (isVid) {
      const v = document.createElement('video');
      v.preload = 'auto';
      v.onloadeddata = () => resolve(`cat-${zero(n)}.${exts[idx]}`);
      v.onerror = () => tryExts(n, exts, idx + 1).then(resolve, reject);
      v.src = `res/cats/cat-${zero(n)}.${exts[idx]}`;
      v.load();
    } else {
      const img = new Image();
      img.onload = () => resolve(`cat-${zero(n)}.${exts[idx]}`);
      img.onerror = () => tryExts(n, exts, idx + 1).then(resolve, reject);
      img.src = `res/cats/cat-${zero(n)}.${exts[idx]}`;
    }
  });
}

function scanCats(n = 1, acc = []) {
  tryExts(n, [...IMG_EXTS, ...VID_EXTS], 0)
    .then(file => {
      acc.push(file);
      scanCats(n + 1, acc);
    })
    .catch(() => { if (acc.length) loadCats(acc); });
}

scanCats();

function loadCats(files) {
  CATS = files;
  const gallery = document.getElementById('cats-gallery');
  if (!gallery) return;

  let page = 0;
  let prevPage = 0;
  const items = [];

  files.forEach((f, i) => {
    const isVideo = /\.(mp4|webm|mov)$/i.test(f);
    let el;
    if (isVideo) {
      el = document.createElement('video');
      el.src = `res/cats/${f}`;
      el.muted = true;
      el.loop = true;
      el.addEventListener('mouseenter', () => el.play());
      el.addEventListener('mouseleave', () => { el.pause(); el.currentTime = 0; });
    } else {
      el = document.createElement('img');
      el.src = `res/cats/${f}`;
      el.loading = 'lazy';
      el.onerror = () => el.remove();
    }
    el.alt = 'cat';
    el.addEventListener('click', () => openLightbox(i));
    items.push(el);
  });

  const totalPages = Math.ceil(items.length / 3);
  const dotsContainer = document.getElementById('carousel-dots');

  function renderDots() {
    if (!dotsContainer) return;
    dotsContainer.innerHTML = '';
    for (let i = 0; i < totalPages; i++) {
      const dot = document.createElement('button');
      dot.className = 'dot' + (i === page ? ' active' : '');
      dot.addEventListener('click', () => { prevPage = page; page = i; render(); renderDots(); });
      dotsContainer.appendChild(dot);
    }
  }

  function render() {
    gallery.innerHTML = '';
    const start = page * 3;
    const count = Math.min(3, items.length - start);
    const forward = (page - prevPage + totalPages) % totalPages === 1;
    const anim = forward ? 'catSlideIn' : 'catSlideInRev';
    prevPage = page;
    for (let j = 0; j < count; j++) {
      const idx = start + j;
      const clone = items[idx].cloneNode(true);
      clone.style.animation = `${anim} .35s ease-out both`;
      clone.style.animationDelay = `${j * 0.08}s`;
      clone.addEventListener('click', () => openLightbox(idx));
      if (items[idx].tagName === 'VIDEO') {
        clone.muted = true;
        clone.loop = true;
        clone.addEventListener('mouseenter', () => clone.play());
        clone.addEventListener('mouseleave', () => { clone.pause(); clone.currentTime = 0; });
      }
      gallery.appendChild(clone);
    }
  }

  render();
  renderDots();

  const prevBtn = document.querySelector('.carousel-prev');
  const nextBtn = document.querySelector('.carousel-next');
  if (prevBtn) prevBtn.addEventListener('click', () => { prevPage = page; page = (page - 1 + totalPages) % totalPages; render(); renderDots(); });
  if (nextBtn) nextBtn.addEventListener('click', () => { prevPage = page; page = (page + 1) % totalPages; render(); renderDots(); });
}

function openLightbox(index) {
  const overlay = document.createElement('div');
  overlay.className = 'lightbox';

  function isVideoFile(f) { return /\.(mp4|webm|mov)$/i.test(f); }

  function mediaTag(idx) {
    const f = CATS[idx];
    if (isVideoFile(f)) {
      const v = document.createElement('video');
      v.src = `res/cats/${f}`;
      v.className = 'lb-img';
      v.controls = true;
      v.autoplay = true;
      return v;
    }
    const img = document.createElement('img');
    img.src = `res/cats/${f}`;
    img.className = 'lb-img';
    img.alt = 'cat';
    return img;
  }

  const prevBtn = document.createElement('button');
  prevBtn.className = 'lb-nav lb-prev';
  prevBtn.ariaLabel = 'Previous';
  const nextBtn = document.createElement('button');
  nextBtn.className = 'lb-nav lb-next';
  nextBtn.ariaLabel = 'Next';

  let current = mediaTag(index);
  overlay.append(prevBtn, current, nextBtn);

  function show(i) {
    const idx = (i + CATS.length) % CATS.length;
    const nuevo = mediaTag(idx);
    current.replaceWith(nuevo);
    current = nuevo;
    index = idx;
  }

  prevBtn.addEventListener('click', e => { e.stopPropagation(); show(index - 1); });
  nextBtn.addEventListener('click', e => { e.stopPropagation(); show(index + 1); });

  const keyHandler = e => {
    if (e.key === 'ArrowLeft') show(index - 1);
    else if (e.key === 'ArrowRight') show(index + 1);
    else if (e.key === 'Escape') overlay.remove();
  };
  document.addEventListener('keydown', keyHandler);

  overlay.addEventListener('click', e => {
    if (e.target === overlay) overlay.remove();
  });

  const observer = new MutationObserver(() => {
    if (!document.body.contains(overlay)) {
      document.removeEventListener('keydown', keyHandler);
      observer.disconnect();
    }
  });
  observer.observe(document.body, { childList: true });

  document.body.appendChild(overlay);
}

const burger = document.getElementById('burger');
const navLinks = document.getElementById('nav-links');
if (burger && navLinks) {
  burger.addEventListener('click', () => {
    burger.classList.toggle('open');
    navLinks.classList.toggle('open');
  });
  navLinks.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      burger.classList.remove('open');
      navLinks.classList.remove('open');
    });
  });
  document.addEventListener('click', e => {
    if (!navLinks.contains(e.target) && !burger.contains(e.target)) {
      burger.classList.remove('open');
      navLinks.classList.remove('open');
    }
  });
}

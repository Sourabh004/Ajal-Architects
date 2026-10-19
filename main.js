/* ==========================================================================
   AJAL ARCHITECTS — interaction engine
   The 3D hero is imported dynamically, so if WebGL or the CDN fails the rest
   of the site still works and the hero falls back to a photograph.
   ========================================================================== */

const root = document.documentElement;
root.classList.add('js');

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (t) => t * t * (3 - 2 * t);

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
const hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
const PROJECTS = (window.AJAL_PROJECTS || []).filter((p) => p && p.id);
const CATEGORY_LABEL = { residential: 'Residential', workplace: 'Workplace', hospitality: 'Hospitality', interiors: 'Interiors', public: 'Public' };

if (hasGsap) gsap.registerPlugin(ScrollTrigger);

/* ---------------------------------------------------------------- smooth scroll */
let lenis = null;
if (!reducedMotion && typeof window.Lenis !== 'undefined') {
  lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 1, smoothWheel: true });
  if (hasGsap) {
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  } else {
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }
  lenis.stop(); // released when the loader finishes
}

function scrollToTarget(target, immediate = false) {
  if (!target) return;
  if (lenis) lenis.scrollTo(target, { offset: 0, duration: 1.6, immediate, easing: (t) => 1 - Math.pow(1 - t, 4) });
  else (typeof target === 'number' ? window.scrollTo({ top: target, behavior: 'smooth' }) : target.scrollIntoView({ behavior: 'smooth' }));
}

/* ---------------------------------------------------------------- missing images → blueprint plate */
function plateFor(img) {
  const parent = img.parentElement;
  if (!parent || parent.querySelector(':scope > .plate')) return;
  const file = img.getAttribute('src') || '';
  const plate = document.createElement('div');
  plate.className = 'plate';
  const alt = img.getAttribute('alt') || '';
  const initials = alt.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('');
  plate.innerHTML = `<div><b>${initials || '+'}</b>Add image<br>${file}</div>`;
  if (getComputedStyle(parent).position === 'static') parent.style.position = 'relative';
  img.style.visibility = 'hidden';
  parent.appendChild(plate);
}
document.addEventListener('error', (e) => {
  if (e.target instanceof HTMLImageElement && !e.target.closest('.float-preview')) plateFor(e.target);
}, true);
const checkBrokenImages = (scope = document) =>
  $$('img', scope).forEach((img) => { if (img.complete && img.naturalWidth === 0 && img.getAttribute('src')) plateFor(img); });

/* ---------------------------------------------------------------- text splitting */
function splitWords(el) {
  const out = [];
  const make = (word, wrapperTag) => {
    const outer = document.createElement('span');
    outer.className = 'sw';
    const inner = document.createElement('span');
    if (wrapperTag) {
      const w = document.createElement(wrapperTag);
      w.textContent = word;
      inner.appendChild(w);
    } else inner.textContent = word;
    outer.appendChild(inner);
    out.push(inner);
    return outer;
  };
  const frag = document.createDocumentFragment();
  el.childNodes.forEach((node) => {
    if (node.nodeType === 3) {
      node.textContent.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        frag.appendChild(/^\s+$/.test(part) ? document.createTextNode(' ') : make(part));
      });
    } else if (node.nodeName === 'BR') {
      frag.appendChild(document.createElement('br'));
    } else {
      node.textContent.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        frag.appendChild(/^\s+$/.test(part) ? document.createTextNode(' ') : make(part, node.nodeName.toLowerCase()));
      });
    }
  });
  el.textContent = '';
  el.appendChild(frag);
  return out;
}
const swStyle = document.createElement('style');
swStyle.textContent = '.sw{display:inline-block;overflow:hidden;vertical-align:top;padding-bottom:.1em;margin-bottom:-.1em}.sw>span{display:inline-block;will-change:transform}';
document.head.appendChild(swStyle);

/* ---------------------------------------------------------------- loader */
function runLoader() {
  return new Promise((resolve) => {
    const count = $('#loaderCount');
    const bar = $('#loaderBar');
    const imgs = $$('img').filter((i) => i.loading !== 'lazy');
    let loaded = 0;
    const total = Math.max(imgs.length, 1);
    imgs.forEach((img) => {
      if (img.complete) loaded++;
      else { img.addEventListener('load', () => loaded++, { once: true }); img.addEventListener('error', () => loaded++, { once: true }); }
    });
    const minTime = reducedMotion ? 200 : 1700;
    const start = performance.now();
    let shown = 0;
    const tick = () => {
      const elapsed = performance.now() - start;
      const real = loaded / total;
      const timeCap = clamp(elapsed / minTime);
      const target = Math.min(real, timeCap);
      shown = lerp(shown, target, 0.12);
      if (target >= 1 && shown > 0.995) shown = 1;
      count.textContent = String(Math.round(shown * 100)).padStart(3, '0');
      bar.style.transform = `scaleX(${shown})`;
      if (shown >= 1 || elapsed > 4500) return finish();
      requestAnimationFrame(tick);
    };
    const finish = () => {
      count.textContent = '100';
      bar.style.transform = 'scaleX(1)';
      const loader = $('#loader');
      const done = () => { loader.remove(); document.body.classList.remove('is-loading'); resolve(); };
      if (hasGsap && !reducedMotion) {
        gsap.timeline({ onComplete: done })
          .to('.loader__frame', { y: -30, opacity: 0, duration: 0.6, ease: 'power3.in' })
          .to(loader, { clipPath: 'inset(0 0 100% 0)', duration: 1.0, ease: 'expo.inOut' }, '-=0.1');
      } else done();
      root.classList.add('is-ready');
    };
    requestAnimationFrame(tick);
  });
}

/* ---------------------------------------------------------------- hero (3D) */
async function initHero() {
  const canvas = $('#heroCanvas');
  const section = $('#hero');
  const stages = $$('.hero__stage');
  const bar = $('#heroBar');
  const step = $('#heroStep');
  const labelsEl = $('#heroLabels');
  const scaleEl = $('#heroScale');
  let hero = null;

  const webgl = (() => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; } })();
  if (webgl) {
    try {
      const mod = await import('./scene.js');
      hero = mod.createHeroScene(canvas, { reducedMotion });
    } catch (err) {
      console.warn('Hero 3D unavailable, using photo fallback.', err);
    }
  }
  if (!hero) { root.classList.add('no-webgl'); canvas.remove(); }

  // floor labels
  const levelNames = ['Plinth', 'Ground floor', 'First floor', 'Roof terrace', 'Roof'];
  const labelNodes = levelNames.map((n, i) => {
    const el = document.createElement('div');
    el.className = 'hero-label';
    el.innerHTML = `<b>L${String(i).padStart(2, '0')}</b> ${n}`;
    el.style.opacity = 0;
    labelsEl.appendChild(el);
    return el;
  });

  let progress = 0;
  let current = 0;
  const setStage = (i) => {
    if (i === current) return;
    current = i;
    stages.forEach((s, k) => s.classList.toggle('is-active', k === i));
    step.textContent = `0${i + 1} / 03`;
  };

  const onProgress = (p) => {
    progress = p;
    hero?.setProgress(p);
    bar.style.transform = `scaleX(${p})`;
    setStage(p < 0.28 ? 0 : p < 0.6 ? 1 : 2);
    scaleEl.textContent = p > 0.6 ? 'Exploded axonometric' : p > 0.28 ? 'Sun study' : 'Scale 1:100';
  };

  if (hasGsap) {
    ScrollTrigger.create({ trigger: section, start: 'top top', end: 'bottom bottom', onUpdate: (st) => onProgress(st.progress) });
  } else {
    addEventListener('scroll', () => {
      const r = section.getBoundingClientRect();
      onProgress(clamp(-r.top / (r.height - innerHeight)));
    }, { passive: true });
  }

  if (!hero) return;

  // pointer parallax
  addEventListener('pointermove', (e) => hero.setPointer((e.clientX / innerWidth) * 2 - 1, (e.clientY / innerHeight) * 2 - 1), { passive: true });

  // only render while visible
  new IntersectionObserver(([entry]) => hero.setActive(entry.isIntersecting), { rootMargin: '100px' }).observe(section);

  // label tracking
  const loop = () => {
    requestAnimationFrame(loop);
    if (progress < 0.5) { labelNodes.forEach((n) => (n.style.opacity = 0)); return; }
    const pos = hero.labels();
    pos.forEach((p, i) => {
      const n = labelNodes[i];
      n.style.opacity = p.visible;
      n.style.transform = `translate(${p.x}px, ${p.y}px) translate(-4px, -50%)`;
    });
  };
  loop();
}

/* ---------------------------------------------------------------- nav, menu, clock */
function initNav() {
  const nav = $('#nav');
  const menu = $('#menu');
  const btn = $('#menuBtn');
  let lastY = 0;

  const onScroll = (y) => {
    nav.classList.toggle('is-scrolled', y > 40);
    const goingDown = y > lastY && y > innerHeight * 0.8;
    if (!menu.classList.contains('is-open')) nav.classList.toggle('is-hidden', goingDown);
    lastY = y;
  };
  if (lenis) lenis.on('scroll', ({ scroll }) => onScroll(scroll));
  else addEventListener('scroll', () => onScroll(scrollY), { passive: true });

  const setMenu = (open) => {
    menu.classList.toggle('is-open', open);
    btn.setAttribute('aria-expanded', String(open));
    $('.nav__menu-label', btn).textContent = open ? 'Close' : 'Menu';
    if (open) { menu.removeAttribute('inert'); lenis?.stop(); nav.classList.remove('is-hidden'); }
    else { menu.setAttribute('inert', ''); lenis?.start(); }
  };
  btn.addEventListener('click', () => setMenu(!menu.classList.contains('is-open')));
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && menu.classList.contains('is-open')) setMenu(false); });

  // in-page anchors
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href');
    if (id === '#') { e.preventDefault(); return; }
    const target = id === '#top' ? 0 : $(id);
    if (target === null) return;
    e.preventDefault();
    const wasOpen = menu.classList.contains('is-open');
    if (wasOpen) setMenu(false);
    setTimeout(() => scrollToTarget(target), wasOpen ? 450 : 0);
  });

  // current section highlight
  const links = $$('.nav__links a');
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      links.forEach((l) => l.classList.toggle('is-current', l.getAttribute('href') === `#${en.target.id}`));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  links.forEach((l) => { const t = $(l.getAttribute('href')); if (t) io.observe(t); });

  // Bengaluru clock
  const clock = $('#clock');
  const fmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' });
  const tick = () => (clock.textContent = `BLR ${fmt.format(new Date())}`);
  tick(); setInterval(tick, 15000);

  $('#year').textContent = new Date().getFullYear();
  $('#toTop').addEventListener('click', () => scrollToTarget(0));
}

/* ---------------------------------------------------------------- cursor + magnetic + tilt */
function initPointerFx() {
  if (!finePointer) return;
  const cursor = $('#cursor');
  const dot = $('.cursor__dot', cursor);
  const ring = $('.cursor__ring', cursor);
  const label = $('#cursorLabel');
  let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;

  addEventListener('pointermove', (e) => { mx = e.clientX; my = e.clientY; dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`; }, { passive: true });
  const loop = () => {
    rx = lerp(rx, mx, 0.16); ry = lerp(ry, my, 0.16);
    ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
    requestAnimationFrame(loop);
  };
  loop();

  document.addEventListener('pointerover', (e) => {
    const labelled = e.target.closest('[data-cursor]');
    const hov = e.target.closest('a, button, label, [data-tilt]');
    cursor.classList.toggle('is-label', !!labelled);
    cursor.classList.toggle('is-hover', !!hov && !labelled);
    if (labelled) label.textContent = labelled.dataset.cursor;
  });

  // magnetic buttons
  $$('[data-magnetic]').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width / 2) * 0.25;
      const y = (e.clientY - r.top - r.height / 2) * 0.35;
      el.style.transform = `translate(${x}px, ${y}px)`;
    });
    el.addEventListener('pointerleave', () => {
      el.style.transition = 'transform .7s cubic-bezier(.22,1,.36,1)';
      el.style.transform = '';
      setTimeout(() => (el.style.transition = ''), 700);
    });
  });

  // 3D tilt cards
  document.addEventListener('pointermove', (e) => {
    const card = e.target.closest('[data-tilt]');
    if (!card) return;
    const r = card.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
    card.style.setProperty('--mx', `${px * 100}%`);
    card.style.setProperty('--my', `${py * 100}%`);
    card.style.transform = `rotateY(${(px - 0.5) * 10}deg) rotateX(${(0.5 - py) * 10}deg)`;
    card.style.transition = 'transform .15s ease-out';
  }, { passive: true });
  document.addEventListener('pointerout', (e) => {
    const card = e.target.closest('[data-tilt]');
    if (card && !card.contains(e.relatedTarget)) {
      card.style.transition = 'transform .8s cubic-bezier(.22,1,.36,1)';
      card.style.transform = '';
    }
  });
}

/* ---------------------------------------------------------------- reveals, split titles, words, counters */
function initReveals() {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const el = en.target;
      const siblings = [...el.parentElement.children].filter((c) => c.hasAttribute('data-reveal'));
      el.style.transitionDelay = `${Math.max(0, siblings.indexOf(el)) * 0.08}s`;
      el.classList.add('is-in');
      io.unobserve(el);
    });
  }, { rootMargin: '0px 0px -10% 0px' });
  $$('[data-reveal]').forEach((el) => io.observe(el));

  if (!hasGsap) { $$('[data-reveal]').forEach((el) => el.classList.add('is-in')); return; }

  $$('[data-split]').forEach((el) => {
    const words = splitWords(el);
    if (reducedMotion) return;
    gsap.from(words, {
      yPercent: 115, rotate: 4, duration: 1.2, ease: 'expo.out', stagger: 0.05,
      scrollTrigger: { trigger: el, start: 'top 88%' }
    });
  });

  // statement: words light up as you read
  $$('[data-words]').forEach((el) => {
    const text = el.textContent.trim().replace(/\s+/g, ' ');
    el.innerHTML = text.split(' ').map((w) => `<span class="w">${w}</span>`).join(' ');
    const words = $$('.w', el);
    ScrollTrigger.create({
      trigger: el, start: 'top 80%', end: 'bottom 45%',
      onUpdate: (st) => {
        const n = st.progress * words.length;
        words.forEach((w, i) => (w.style.opacity = i < n ? 1 : 0.14));
      }
    });
  });

  // counters
  $$('[data-count]').forEach((el) => {
    const end = +el.dataset.count;
    const obj = { v: 0 };
    ScrollTrigger.create({
      trigger: el, start: 'top 90%', once: true,
      onEnter: () => gsap.to(obj, { v: end, duration: 2, ease: 'power3.out', onUpdate: () => (el.textContent = Math.round(obj.v)) })
    });
  });

  // principles flip down into place like panels hinging open
  if (!reducedMotion) {
    $$('[data-flip]').forEach((el) => {
      gsap.fromTo(el, { rotateX: -75, opacity: 0, y: 40 }, {
        rotateX: 0, opacity: 1, y: 0, ease: 'none',
        scrollTrigger: { trigger: el, start: 'top 98%', end: 'top 62%', scrub: 0.6 }
      });
    });
  }

  // timeline spine
  gsap.to('#timelineFill', { scaleY: 1, ease: 'none', scrollTrigger: { trigger: '#timeline', start: 'top 65%', end: 'bottom 65%', scrub: true } });

  // footer wordmark rises letter by letter
  if (!reducedMotion) {
    gsap.from('#footerMark span', {
      yPercent: 100, rotateX: -60, stagger: 0.06, ease: 'none',
      scrollTrigger: { trigger: '#footerMark', start: 'top 100%', end: 'bottom 95%', scrub: 0.8 }
    });
    // service cards rise in 3D
    gsap.from('.svc', {
      y: 80, rotateX: -18, opacity: 0, duration: 1.3, ease: 'expo.out', stagger: 0.08,
      scrollTrigger: { trigger: '.services__grid', start: 'top 82%' }
    });
  }
}

/* ---------------------------------------------------------------- marquee driven by scroll velocity */
function initMarquee() {
  const track = $('#marquee');
  track.innerHTML += track.innerHTML;
  let x = 0, skew = 0, dir = 1;
  const loop = () => {
    const v = lenis ? lenis.velocity : 0;
    if (Math.abs(v) > 0.5) dir = Math.sign(v);
    const speed = (reducedMotion ? 0 : 0.6) + Math.min(Math.abs(v), 40) * 0.35;
    x -= speed * dir;
    const half = track.scrollWidth / 2;
    if (x <= -half) x += half;
    if (x > 0) x -= half;
    skew = lerp(skew, clamp(v * -0.25, -10, 10), 0.1);
    track.style.transform = `translate3d(${x}px,0,0) skewX(${skew}deg)`;
    requestAnimationFrame(loop);
  };
  loop();
}

/* ---------------------------------------------------------------- featured work (3D curved horizontal gallery) */
function initWork() {
  const track = $('#workTrack');
  const featured = PROJECTS.filter((p) => p.featured);
  const list = featured.length ? featured : PROJECTS.slice(0, 5);

  track.innerHTML = list.map((p, i) => `
    <article class="wcard" data-id="${p.id}" data-cursor="View" tabindex="0" aria-label="${p.title} — open project">
      <div class="wcard__media">
        <span class="wcard__tag">${CATEGORY_LABEL[p.category] || p.category} · ${p.status || p.year}</span>
        <img src="${p.cover}" alt="${p.title}" loading="eager">
      </div>
      <div class="wcard__meta">
        <div><h3>${p.title}</h3><p class="mono">${p.location} — ${p.year}</p></div>
        <span class="wcard__no">${String(i + 1).padStart(2, '0')}</span>
      </div>
    </article>`).join('') +
    `<div class="wcard wcard--end"><a href="#index">View all<br><em>projects</em> &rarr;</a></div>`;

  $('#workTotal').textContent = String(list.length).padStart(2, '0');
  const cards = $$('.wcard', track);
  const idx = $('#workIndex');
  const bar = $('#workBar');

  track.addEventListener('click', (e) => { const c = e.target.closest('.wcard[data-id]'); if (c) openCase(c.dataset.id, c); });
  track.addEventListener('keydown', (e) => { const c = e.target.closest('.wcard[data-id]'); if (c && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openCase(c.dataset.id, c); } });

  const shape = () => {
    const vw = innerWidth, half = vw / 2;
    let nearest = 0, best = Infinity;
    cards.forEach((c, i) => {
      const r = c.getBoundingClientRect();
      const d = (r.left + r.width / 2 - half) / half; // -1 left edge … 1 right edge
      const ad = Math.abs(d);
      if (c.dataset.id && ad < best) { best = ad; nearest = i; }
      if (reducedMotion) return;
      c.style.transform = `rotateY(${clamp(d, -1.6, 1.6) * -24}deg) translateZ(${-Math.min(ad, 1.6) * 160}px)`;
      const img = $('img', c);
      if (img) img.style.transform = `translateX(${clamp(d, -1.5, 1.5) * -7}%)`;
    });
    idx.textContent = String(nearest + 1).padStart(2, '0');
  };

  if (!hasGsap) return;
  const mm = gsap.matchMedia();
  mm.add('(min-width: 761px)', () => {
    const dist = () => track.scrollWidth - innerWidth;
    const st = ScrollTrigger.create({
      trigger: '#work', start: 'top top', end: 'bottom bottom', invalidateOnRefresh: true,
      onUpdate: (s) => {
        track.style.transform = `translate3d(${-s.progress * dist()}px,0,0)`;
        bar.style.transform = `scaleX(${s.progress})`;
        shape();
      },
      onRefresh: shape
    });
    shape();
    return () => { st.kill(); track.style.transform = ''; cards.forEach((c) => (c.style.transform = '')); };
  });
  mm.add('(max-width: 760px)', () => {
    const onS = () => shape();
    track.addEventListener('scroll', onS, { passive: true });
    shape();
    return () => track.removeEventListener('scroll', onS);
  });
}

/* ---------------------------------------------------------------- project index with filters + floating preview */
function initIndex() {
  const body = $('#indexBody');
  const filters = $('#filters');
  const preview = $('#floatPreview');
  const pImg = $('img', preview);

  body.innerHTML = PROJECTS.map((p, i) => `
    <div class="index__row" role="row" data-id="${p.id}" data-cat="${p.category}" data-img="${p.cover}" data-cursor="Open" tabindex="0">
      <span class="mono" role="cell">${String(i + 1).padStart(2, '0')}</span>
      <h3 role="cell">${p.title}</h3>
      <span role="cell">${CATEGORY_LABEL[p.category] || p.category}</span>
      <span role="cell">${p.location}</span>
      <span class="mono" role="cell">${p.year}</span>
    </div>`).join('');

  const counts = PROJECTS.reduce((m, p) => ((m[p.category] = (m[p.category] || 0) + 1), m), {});
  const cats = ['all', ...Object.keys(CATEGORY_LABEL).filter((c) => counts[c])];
  filters.innerHTML = cats.map((c) => `<button class="filter${c === 'all' ? ' is-active' : ''}" data-filter="${c}" role="tab" aria-selected="${c === 'all'}">${c === 'all' ? 'All' : CATEGORY_LABEL[c]}<sup>${c === 'all' ? PROJECTS.length : counts[c]}</sup></button>`).join('');

  filters.addEventListener('click', (e) => {
    const b = e.target.closest('.filter');
    if (!b) return;
    $$('.filter', filters).forEach((f) => { f.classList.toggle('is-active', f === b); f.setAttribute('aria-selected', String(f === b)); });
    const cat = b.dataset.filter;
    const rows = $$('.index__row[data-id]', body);
    rows.forEach((r) => r.classList.toggle('is-hidden', cat !== 'all' && r.dataset.cat !== cat));
    if (hasGsap && !reducedMotion) gsap.fromTo(rows.filter((r) => !r.classList.contains('is-hidden')), { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: 'expo.out', stagger: 0.04 });
    ScrollTrigger?.refresh?.();
  });

  body.addEventListener('click', (e) => { const r = e.target.closest('[data-id]'); if (r) openCase(r.dataset.id); });
  body.addEventListener('keydown', (e) => { const r = e.target.closest('[data-id]'); if (r && e.key === 'Enter') openCase(r.dataset.id); });

  bindFloatPreview(preview, pImg, body, '[data-id]', (el) => el.dataset.img);
  bindFloatPreview(preview, pImg, $('.awards__list'), '.award', (el) => el.dataset.preview);
}

function bindFloatPreview(preview, img, scope, selector, srcOf) {
  if (!finePointer || !scope) return;
  let x = 0, y = 0, cx = 0, cy = 0, on = false, raf = 0;
  const loop = () => {
    const vx = x - cx;
    cx = lerp(cx, x, 0.14); cy = lerp(cy, y, 0.14);
    preview.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%) rotate(${clamp(vx * 0.08, -12, 12)}deg) perspective(600px) rotateY(${clamp(vx * 0.12, -20, 20)}deg)`;
    if (on || Math.abs(vx) > 0.5) raf = requestAnimationFrame(loop); else raf = 0;
  };
  scope.addEventListener('pointermove', (e) => {
    x = e.clientX; y = e.clientY;
    const row = e.target.closest(selector);
    if (row && !row.classList.contains('index__row--head')) {
      const src = srcOf(row);
      if (img.getAttribute('src') !== src) img.src = src;
      if (!on) { cx = x; cy = y; }
      on = true;
      preview.classList.add('is-on');
    } else { on = false; preview.classList.remove('is-on'); }
    if (!raf) raf = requestAnimationFrame(loop);
  });
  scope.addEventListener('pointerleave', () => { on = false; preview.classList.remove('is-on'); });
  img.addEventListener('error', () => preview.classList.remove('is-on'));
}

/* ---------------------------------------------------------------- case study overlay */
const caseEl = $('#case');
let caseIndex = -1;

function fillCase(p) {
  $('#caseCover').src = p.cover;
  $('#caseCover').alt = p.title;
  $('#caseKicker').textContent = `( ${CATEGORY_LABEL[p.category] || p.category} )`;
  $('#caseTitle').textContent = p.title;
  const meta = [['Location', p.location], ['Year', p.year], ['Status', p.status], ['Area', p.area], ['Client', p.client]].filter(([, v]) => v);
  $('#caseMeta').innerHTML = meta.map(([k, v]) => `<div><dt class="mono">${k}</dt><dd>${v}</dd></div>`).join('');
  $('#caseSummary').textContent = p.summary || '';
  const imgs = (p.images || []).filter((s) => s && s !== p.cover);
  $('#caseGallery').innerHTML = imgs.map((s) => `<figure><img src="${s}" alt="${p.title}" loading="lazy"></figure>`).join('');
  // old placeholders must not survive into the next project
  $$('.plate', caseEl).forEach((pl) => pl.remove());
  $$('img', caseEl).forEach((i) => (i.style.visibility = ''));
  setTimeout(() => checkBrokenImages(caseEl), 400);
  $('#caseScroll').scrollTop = 0;
}

function openCase(id) {
  const i = PROJECTS.findIndex((p) => p.id === id);
  if (i < 0) return;
  caseIndex = i;
  fillCase(PROJECTS[i]);
  caseEl.hidden = false;
  lenis?.stop();
  document.body.style.overflow = 'hidden';
  if (hasGsap && !reducedMotion) {
    gsap.fromTo(caseEl, { clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0% 0 0 0)', duration: 1.1, ease: 'expo.inOut' });
    gsap.fromTo('#caseCover', { scale: 1.25 }, { scale: 1, duration: 1.8, ease: 'expo.out' });
    gsap.fromTo(['#caseKicker', '#caseTitle', '#caseMeta', '#caseSummary'], { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1, ease: 'expo.out', stagger: 0.07, delay: 0.45 });
  } else caseEl.style.clipPath = 'inset(0 0 0 0)';
  $('#caseClose').focus({ preventScroll: true });
}

function closeCase() {
  if (caseEl.hidden) return;
  const end = () => { caseEl.hidden = true; lenis?.start(); document.body.style.overflow = ''; };
  if (hasGsap && !reducedMotion) gsap.to(caseEl, { clipPath: 'inset(0 0 100% 0)', duration: 0.9, ease: 'expo.inOut', onComplete: end });
  else { caseEl.style.clipPath = 'inset(100% 0 0 0)'; end(); }
}

function stepCase(dir) {
  if (!PROJECTS.length) return;
  caseIndex = (caseIndex + dir + PROJECTS.length) % PROJECTS.length;
  const p = PROJECTS[caseIndex];
  if (hasGsap && !reducedMotion) {
    gsap.to('#caseScroll', { opacity: 0, duration: 0.3, onComplete: () => { fillCase(p); gsap.to('#caseScroll', { opacity: 1, duration: 0.5 }); } });
  } else fillCase(p);
}

function initCase() {
  $('#caseClose').addEventListener('click', closeCase);
  $('#casePrev').addEventListener('click', () => stepCase(-1));
  $('#caseNext').addEventListener('click', () => stepCase(1));
  addEventListener('keydown', (e) => {
    if (caseEl.hidden) return;
    if (e.key === 'Escape') closeCase();
    if (e.key === 'ArrowRight') stepCase(1);
    if (e.key === 'ArrowLeft') stepCase(-1);
  });
}

/* ---------------------------------------------------------------- process cube */
function initProcess() {
  const cube = $('#cube');
  const steps = $$('.step', $('#steps'));
  let active = 0;
  const update = (p) => {
    const raw = clamp(p) * 3.999;
    const i = Math.floor(raw);
    const frac = raw - i;
    // hold on each face, then turn quickly to the next
    const turn = i < 3 ? smooth(clamp((frac - 0.62) / 0.38)) : 0;
    const rotY = -28 - (i + turn) * 90;
    const rotX = -18 + Math.sin((i + turn) * Math.PI) * 8;
    cube.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`;
    const shown = turn > 0.5 ? i + 1 : i;
    if (shown !== active) { active = shown; steps.forEach((s, k) => s.classList.toggle('is-active', k === shown)); }
  };
  if (hasGsap) ScrollTrigger.create({ trigger: '#process', start: 'top top', end: 'bottom bottom', onUpdate: (st) => update(st.progress) });
  update(0);
}

/* ---------------------------------------------------------------- contact form (opens the visitor's mail app) */
function initForm() {
  const form = $('#contactForm');
  const status = $('#formStatus');
  const setErr = (input, msg) => {
    const f = input.closest('.field');
    f.classList.toggle('is-error', !!msg);
    $('small', f).textContent = msg || '';
  };
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = form.name.value.trim(), email = form.email.value.trim(), msg = form.message.value.trim();
    let ok = true;
    setErr(form.name, name ? '' : 'Please tell us your name.'); ok = ok && !!name;
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    setErr(form.email, emailOk ? '' : 'Please enter a valid email.'); ok = ok && emailOk;
    setErr(form.message, msg.length >= 10 ? '' : 'A line or two about the project, please.'); ok = ok && msg.length >= 10;
    if (!ok) { status.textContent = ''; return; }
    const type = form.querySelector('input[name="type"]:checked')?.value || '';
    const phone = form.phone.value.trim();
    const subject = `New ${type.toLowerCase()} enquiry — ${name}`;
    const bodyTxt = `${msg}\n\nName: ${name}\nEmail: ${email}${phone ? `\nPhone: ${phone}` : ''}\nProject type: ${type}`;
    location.href = `mailto:studio@ajalarchitects.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyTxt)}`;
    status.textContent = 'Opening your email app — just press send.';
  });
}

/* ---------------------------------------------------------------- boot */
(async function boot() {
  checkBrokenImages();
  initNav();
  initPointerFx();
  initMarquee();
  initWork();
  initIndex();
  initCase();
  initProcess();
  initForm();
  const heroReady = initHero();
  await runLoader();
  await heroReady;
  initReveals();
  lenis?.start();
  if (hasGsap) ScrollTrigger.refresh();
  checkBrokenImages();
})();

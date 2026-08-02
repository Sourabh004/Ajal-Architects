/* ============================================================
   AJAL ARCHITECTS — interaction engine
   No dependencies. Every module bails out safely if its
   markup is absent, so sections can be added or removed freely.
   ============================================================ */

(function () {
  'use strict';

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = window.matchMedia('(hover: none)').matches;

  const $  = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));
  const lerp = (a, b, n) => a + (b - a) * n;
  const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

  /* ==========================================================
     THEME — light (editorial) is the default; dark is opt-in
     ========================================================== */

  const Theme = {
    key: 'ajal-theme',

    init() {
      const saved = localStorage.getItem(this.key);
      this.apply(saved === 'dark' || saved === 'light' ? saved : 'dark');

      document.addEventListener('click', (e) => {
        if (e.target.closest('[data-theme-toggle]')) this.toggle();
      });
    },

    apply(mode) {
      document.documentElement.setAttribute('data-theme', mode);
      $$('[data-theme-toggle]').forEach((b) => {
        b.setAttribute('aria-label', mode === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
        b.setAttribute('data-mode', mode);
      });
    },

    toggle() {
      const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      localStorage.setItem(this.key, next);
      this.apply(next);
    }
  };

  /* ==========================================================
     PRELOADER
     ========================================================== */

  const Preloader = {
    init() {
      const el = $('#preloader');
      if (!el) return;

      const countEl = $('#preloaderCount');
      const barEl   = $('#preloaderBar');
      let value = 0;
      let done = false;

      const finish = () => {
        if (done) return;
        done = true;
        el.classList.add('is-done');
        document.documentElement.classList.remove('is-locked');
        document.documentElement.classList.add('is-ready');
        // let the hero animate only once the curtain is moving
        setTimeout(() => el.remove(), 1400);
      };

      if (reduced) { finish(); return; }

      document.documentElement.classList.add('is-locked');

      const tick = () => {
        // ease toward 100 so the counter decelerates near the end
        value += Math.max(1, (100 - value) * 0.06);
        if (value >= 99.5) value = 100;

        if (countEl) countEl.textContent = String(Math.floor(value)).padStart(2, '0');
        if (barEl) barEl.style.width = value + '%';

        if (value < 100) {
          requestAnimationFrame(tick);
        } else {
          setTimeout(finish, 260);
        }
      };

      requestAnimationFrame(tick);

      // rAF is paused in a backgrounded tab, which would otherwise leave
      // the curtain up and the body scroll-locked. Hard-release either way.
      setTimeout(finish, 4000);
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && value >= 100) finish();
      });
    }
  };

  /* ==========================================================
     SCROLL PROGRESS
     ========================================================== */

  const Progress = {
    init() {
      const bar = $('#scrollProgress');
      if (!bar) return;

      const update = () => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const pct = max > 0 ? (window.scrollY / max) * 100 : 0;
        bar.style.width = clamp(pct, 0, 100) + '%';
      };

      window.addEventListener('scroll', update, { passive: true });
      window.addEventListener('resize', update);
      update();
    }
  };

  /* ==========================================================
     NAVIGATION — stuck state, auto-hide, menu, active link
     ========================================================== */

  const Nav = {
    init() {
      const nav = $('#nav');
      const burger = $('#navBurger');
      const menu = $('#navMenu');
      if (!nav) return;

      /* --- stuck + auto-hide --- */
      let last = window.scrollY;

      window.addEventListener('scroll', () => {
        const y = window.scrollY;

        nav.classList.toggle('is-stuck', y > 40);

        // never hide while the menu is open
        const menuOpen = menu && menu.classList.contains('is-open');
        nav.classList.toggle('is-hidden', !menuOpen && y > last && y > 400);

        last = y;
      }, { passive: true });

      /* --- fullscreen menu --- */
      if (burger && menu) {
        const setMenu = (open) => {
          menu.classList.toggle('is-open', open);
          burger.setAttribute('aria-expanded', String(open));
          burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
          document.documentElement.classList.toggle('is-locked', open);
          if (open) menu.removeAttribute('inert');
          else menu.setAttribute('inert', '');
        };

        burger.addEventListener('click', () => {
          setMenu(!menu.classList.contains('is-open'));
        });

        $$('[data-menu-link]', menu).forEach((a) => {
          a.addEventListener('click', () => setMenu(false));
        });

        document.addEventListener('keydown', (e) => {
          if (e.key === 'Escape' && menu.classList.contains('is-open')) setMenu(false);
        });
      }

      /* --- smooth scroll with offset for the fixed bar --- */
      $$('[data-scroll]').forEach((a) => {
        a.addEventListener('click', (e) => {
          const id = a.getAttribute('href');
          if (!id || !id.startsWith('#')) return;
          const target = document.querySelector(id);
          if (!target) return;

          e.preventDefault();
          const top = target.getBoundingClientRect().top + window.scrollY - 72;
          window.scrollTo({ top, behavior: reduced ? 'auto' : 'smooth' });
          history.replaceState(null, '', id);
        });
      });

      /* --- active section highlight --- */
      const links = $$('[data-nav]');
      const sections = links
        .map((l) => document.querySelector(l.getAttribute('href')))
        .filter(Boolean);

      if (!sections.length) return;

      const spy = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          links.forEach((l) => {
            l.classList.toggle('is-current', l.getAttribute('href') === '#' + entry.target.id);
          });
        });
      }, { rootMargin: '-45% 0px -50% 0px' });

      sections.forEach((s) => spy.observe(s));
    }
  };

  /* ==========================================================
     SPLIT TEXT — wrap each word in a clipping mask
     ========================================================== */

  const Split = {
    init() {
      $$('[data-split]').forEach((el) => {
        // preserve intentional <br> line breaks while splitting words
        const html = el.innerHTML.replace(/<br\s*\/?>/gi, '\n<br>\n');
        const parts = html.split('\n');

        let out = '';
        let i = 0;

        parts.forEach((part) => {
          if (/^<br>$/i.test(part.trim())) { out += '<br>'; return; }

          part.trim().split(/\s+/).filter(Boolean).forEach((word) => {
            out += `<span class="word"><span style="--d:${i * 45}ms">${word}</span></span> `;
            i++;
          });
        });

        el.innerHTML = out;
      });
    }
  };

  /* ==========================================================
     REVEAL ON SCROLL
     ========================================================== */

  const Reveal = {
    init() {
      const targets = $$('.reveal, [data-split], .tl');
      if (!targets.length) return;

      if (reduced) {
        targets.forEach((t) => t.classList.add('is-inview'));
        return;
      }

      targets.forEach((t) => {
        if (t.dataset.delay) t.style.setProperty('--d', t.dataset.delay + 'ms');
      });

      const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-inview');
          io.unobserve(entry.target);
        });
      }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

      targets.forEach((t) => io.observe(t));
    }
  };

  /* ==========================================================
     MAGNETIC ELEMENTS
     ========================================================== */

  const Magnetic = {
    init() {
      if (reduced || isTouch) return;

      $$('[data-magnetic]').forEach((el) => {
        const strength = parseFloat(el.dataset.magnetic) || 0.28;

        el.addEventListener('mousemove', (e) => {
          const r = el.getBoundingClientRect();
          const x = (e.clientX - r.left - r.width / 2) * strength;
          const y = (e.clientY - r.top - r.height / 2) * strength;
          el.style.transform = `translate(${x}px, ${y}px)`;
        });

        el.addEventListener('mouseleave', () => { el.style.transform = ''; });
      });
    }
  };

  /* ==========================================================
     TILT — subtle 3D on project cards
     ========================================================== */

  const Tilt = {
    init() {
      if (reduced || isTouch) return;

      $$('[data-tilt]').forEach((el) => {
        el.addEventListener('mousemove', (e) => {
          const r = el.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width - 0.5;
          const py = (e.clientY - r.top) / r.height - 0.5;
          el.style.transform =
            `perspective(1000px) rotateX(${-py * 3.5}deg) rotateY(${px * 3.5}deg) translateZ(0)`;
        });

        el.addEventListener('mouseleave', () => { el.style.transform = ''; });
      });
    }
  };

  /* ==========================================================
     COUNTERS
     ========================================================== */

  const Counters = {
    init() {
      const els = $$('[data-count]');
      if (!els.length) return;

      const run = (el) => {
        const target = parseFloat(el.dataset.count) || 0;
        const suffix = el.dataset.suffix || '';

        if (reduced) { el.textContent = target + suffix; return; }

        const dur = 1600;
        const start = performance.now();

        const step = (now) => {
          const p = clamp((now - start) / dur, 0, 1);
          // easeOutExpo
          const eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
          el.textContent = Math.round(target * eased) + suffix;
          if (p < 1) requestAnimationFrame(step);
        };

        requestAnimationFrame(step);
      };

      const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          run(entry.target);
          io.unobserve(entry.target);
        });
      }, { threshold: 0.5 });

      els.forEach((el) => io.observe(el));
    }
  };

  /* ==========================================================
     HERO CANVAS — drifting node lattice, drawn like a survey plot
     ========================================================== */

  const Lattice = {
    init() {
      const canvas = $('#heroCanvas');
      if (!canvas) return;

      if (reduced) { canvas.remove(); return; }

      const ctx = canvas.getContext('2d');
      let w = 0, h = 0, dpr = 1;
      let nodes = [];
      let raf = null;
      const mouse = { x: -9999, y: -9999 };

      const accent = () =>
        getComputedStyle(document.documentElement).getPropertyValue('--accent-rgb').trim() || '201, 178, 108';

      const build = () => {
        const rect = canvas.getBoundingClientRect();
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        w = rect.width; h = rect.height;

        canvas.width = w * dpr;
        canvas.height = h * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        // density scales with area, capped so phones stay smooth
        const count = clamp(Math.round((w * h) / 22000), 24, 90);

        nodes = Array.from({ length: count }, () => ({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.22,
          vy: (Math.random() - 0.5) * 0.22,
          r: Math.random() * 1.4 + 0.6
        }));
      };

      const draw = () => {
        ctx.clearRect(0, 0, w, h);

        const rgb = accent();
        const linkDist = Math.min(w, h) * 0.18;

        for (let i = 0; i < nodes.length; i++) {
          const n = nodes[i];

          n.x += n.vx;
          n.y += n.vy;

          if (n.x < 0 || n.x > w) n.vx *= -1;
          if (n.y < 0 || n.y > h) n.vy *= -1;

          // gentle repulsion from the pointer
          const dx = n.x - mouse.x;
          const dy = n.y - mouse.y;
          const d = Math.hypot(dx, dy);
          if (d < 130 && d > 0) {
            n.x += (dx / d) * (130 - d) * 0.012;
            n.y += (dy / d) * (130 - d) * 0.012;
          }

          ctx.beginPath();
          ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${rgb}, 0.5)`;
          ctx.fill();

          // link to nearby nodes — the lattice reads as a survey mesh
          for (let j = i + 1; j < nodes.length; j++) {
            const m = nodes[j];
            const dist = Math.hypot(n.x - m.x, n.y - m.y);
            if (dist > linkDist) continue;

            ctx.beginPath();
            ctx.moveTo(n.x, n.y);
            ctx.lineTo(m.x, m.y);
            ctx.strokeStyle = `rgba(${rgb}, ${0.22 * (1 - dist / linkDist)})`;
            ctx.lineWidth = 0.7;
            ctx.stroke();
          }
        }

        raf = requestAnimationFrame(draw);
      };

      window.addEventListener('mousemove', (e) => {
        const r = canvas.getBoundingClientRect();
        mouse.x = e.clientX - r.left;
        mouse.y = e.clientY - r.top;
      }, { passive: true });

      window.addEventListener('resize', build);
      build();
      draw();

      // stop painting when the hero is off screen
      new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !raf) draw();
          else if (!entry.isIntersecting && raf) { cancelAnimationFrame(raf); raf = null; }
        });
      }).observe(canvas);
    }
  };

  /* ==========================================================
     PARALLAX
     ========================================================== */

  const Parallax = {
    init() {
      const els = $$('[data-parallax]');
      if (!els.length || reduced) return;

      let ticking = false;

      const update = () => {
        const y = window.scrollY;
        els.forEach((el) => {
          const speed = parseFloat(el.dataset.parallax) || 0.1;
          el.style.transform = `translate3d(0, ${y * speed}px, 0)`;
        });
        ticking = false;
      };

      window.addEventListener('scroll', () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(update);
      }, { passive: true });

      update();
    }
  };

  /* ==========================================================
     PROJECT FILTER
     ========================================================== */

  const Filter = {
    init() {
      const bar = $('.filters');
      const grid = $('#projectGrid');
      const empty = $('#gridEmpty');
      if (!bar || !grid) return;

      const cards = $$('.card', grid);

      bar.addEventListener('click', (e) => {
        const btn = e.target.closest('.filter');
        if (!btn) return;

        const cat = btn.dataset.filter;

        $$('.filter', bar).forEach((b) => {
          const on = b === btn;
          b.classList.toggle('is-active', on);
          b.setAttribute('aria-selected', String(on));
        });

        let shown = 0;

        cards.forEach((card) => {
          const match = cat === 'all' || card.dataset.cat === cat;
          card.classList.remove('is-in');
          card.classList.toggle('is-out', !match);

          if (match) {
            shown++;
            // restart the entry animation
            void card.offsetWidth;
            card.classList.add('is-in');
          }
        });

        if (empty) empty.hidden = shown > 0;
      });
    }
  };

  /* ==========================================================
     IMAGE SLOTS
     Missing images become labelled blueprint plates instead of
     broken-image icons, so unfinished sections still look
     deliberate. Drop the file in and it renders automatically.
     ========================================================== */

  const Slots = {
    init() {
      // corner brackets on project cards (kept out of the markup
      // so adding a card stays a copy-paste job)
      $$('.card__media').forEach((media) => {
        if ($('.bracket', media)) return;
        media.insertAdjacentHTML('beforeend',
          '<span class="bracket bracket--tl"></span><span class="bracket bracket--br"></span>');
      });

      const markEmpty = (img) => {
        const wrap = img.parentElement;
        if (!wrap || wrap.classList.contains('is-empty')) return;

        const name = (img.getAttribute('src') || '').split('/').pop() || 'image.jpg';

        img.classList.add('img-missing');
        wrap.classList.add('is-empty');
        wrap.insertAdjacentHTML('afterbegin',
          '<span class="slot-grid"></span>' +
          '<span class="slot-sheen"></span>' +
          `<span class="slot-label">${name}</span>`);
      };

      $$('img').forEach((img) => {
        // the preloader mark and the award preview are populated
        // dynamically — an empty src there is expected, not a gap
        if (img.closest('.preloader') || img.closest('#awardPreview')) return;
        if (!img.getAttribute('src')) return;

        // already failed before this script ran
        if (img.complete && img.naturalWidth === 0) markEmpty(img);
        else img.addEventListener('error', () => markEmpty(img), { once: true });
      });
    }
  };

  /* ==========================================================
     TIMELINE — the spine fills as the section scrolls past
     ========================================================== */

  const Timeline = {
    init() {
      const wrap = $('#timeline');
      const fill = $('#timelineFill');
      if (!wrap || !fill) return;

      if (reduced) { fill.style.height = '100%'; return; }

      let ticking = false;

      const update = () => {
        const r = wrap.getBoundingClientRect();
        const vh = window.innerHeight;

        // 0 when the top reaches 75% of the viewport, 1 when the bottom passes 25%
        const p = clamp((vh * 0.75 - r.top) / (r.height + vh * 0.5), 0, 1);
        fill.style.height = (p * 100).toFixed(2) + '%';
        ticking = false;
      };

      window.addEventListener('scroll', () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(update);
      }, { passive: true });

      window.addEventListener('resize', update);
      update();
    }
  };

  /* ==========================================================
     AWARD PREVIEW — image follows the pointer across the rows
     ========================================================== */

  const AwardPreview = {
    init() {
      const list = $('#awardList');
      const box = $('#awardPreview');
      if (!list || !box) return;

      if (reduced || isTouch) { box.remove(); return; }

      const img = $('img', box);
      let tx = 0, ty = 0, cx = 0, cy = 0, raf = null;

      const loop = () => {
        cx = lerp(cx, tx, 0.12);
        cy = lerp(cy, ty, 0.12);
        box.style.left = cx + 'px';
        box.style.top = cy + 'px';
        raf = requestAnimationFrame(loop);
      };

      list.addEventListener('mousemove', (e) => { tx = e.clientX; ty = e.clientY; });

      list.addEventListener('mouseover', (e) => {
        const row = e.target.closest('.award');
        if (!row || !row.dataset.awardImg) return;

        img.src = row.dataset.awardImg;
        box.classList.add('is-on');
        if (!raf) { cx = tx; cy = ty; loop(); }
      });

      list.addEventListener('mouseleave', () => {
        box.classList.remove('is-on');
        if (raf) { cancelAnimationFrame(raf); raf = null; }
      });

      // if the award image itself is missing, don't show an empty box
      img.addEventListener('error', () => box.classList.remove('is-on'));
    }
  };

  /* ==========================================================
     BOOT
     ========================================================== */

  const boot = () => {
    Theme.init();
    Split.init();       // must run before Reveal so words exist to observe
    Preloader.init();
    Progress.init();
    Nav.init();
    Reveal.init();
    Magnetic.init();
    Tilt.init();
    Counters.init();
    Lattice.init();
    Parallax.init();
    Filter.init();
    Slots.init();
    Timeline.init();
    AwardPreview.init();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();

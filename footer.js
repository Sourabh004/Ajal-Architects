/* ============================================================
   AJAL ARCHITECTS — footer, contact form, back-to-top
   ============================================================ */

(function () {
  'use strict';

  const $  = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));

  /* ==========================================================
     FOOTER MARKUP
     ========================================================== */

  const icons = {
    instagram: '<path d="M8 1.4c2.1 0 2.4 0 3.2.05.8.03 1.2.16 1.5.27.37.14.64.32.92.6.28.28.46.55.6.92.11.3.24.7.27 1.5.04.8.05 1.1.05 3.2s0 2.4-.05 3.2c-.03.8-.16 1.2-.27 1.5a2.5 2.5 0 0 1-.6.92c-.28.28-.55.46-.92.6-.3.11-.7.24-1.5.27-.8.04-1.1.05-3.2.05s-2.4 0-3.2-.05c-.8-.03-1.2-.16-1.5-.27a2.5 2.5 0 0 1-.92-.6 2.5 2.5 0 0 1-.6-.92c-.11-.3-.24-.7-.27-1.5C1.4 10.4 1.4 10.1 1.4 8s0-2.4.05-3.2c.03-.8.16-1.2.27-1.5.14-.37.32-.64.6-.92.28-.28.55-.46.92-.6.3-.11.7-.24 1.5-.27C5.6 1.4 5.9 1.4 8 1.4Zm0 3.4a3.2 3.2 0 1 0 0 6.4 3.2 3.2 0 0 0 0-6.4Zm0 5.28a2.08 2.08 0 1 1 0-4.16 2.08 2.08 0 0 1 0 4.16Zm4.07-5.4a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"/>',
    linkedin:  '<path d="M3.4 5.6H1.2V14h2.2V5.6ZM2.3 1.9a1.3 1.3 0 1 0 0 2.6 1.3 1.3 0 0 0 0-2.6ZM14.8 9.2c0-2.3-1.2-3.8-3.2-3.8a2.8 2.8 0 0 0-2.5 1.3V5.6H7V14h2.2V9.6c0-1.2.5-1.9 1.5-1.9s1.4.7 1.4 1.9V14h2.2c.3 0 .5-.2.5-.5V9.2Z"/>',
    behance:   '<path d="M6 3.2c1.5 0 2.5.7 2.5 2.1 0 .8-.4 1.4-1.1 1.7.9.3 1.4 1 1.4 2 0 1.6-1.2 2.4-2.9 2.4H1V3.2h5Zm-.3 3.3c.7 0 1.1-.3 1.1-.9s-.4-.9-1.1-.9H2.8v1.8h2.9Zm.2 3.5c.8 0 1.2-.4 1.2-1s-.4-1-1.2-1H2.8v2h3.1ZM10 3.9h4v1.1h-4V3.9Zm5 5.7h-4.3c.1.9.6 1.4 1.5 1.4.6 0 1-.2 1.3-.7h1.4c-.4 1.3-1.4 2-2.7 2-1.9 0-3-1.3-3-3.1s1.2-3.2 3-3.2c1.9 0 3 1.5 2.8 3.6Zm-4.3-1h2.7c-.1-.8-.6-1.3-1.3-1.3s-1.3.5-1.4 1.3Z"/>',
    pinterest: '<path d="M8 1.4a6.6 6.6 0 0 0-2.4 12.75c-.06-.5-.1-1.3.02-1.86l.75-3.2s-.19-.38-.19-.95c0-.9.52-1.56 1.17-1.56.55 0 .82.41.82.91 0 .55-.35 1.38-.53 2.15-.15.64.32 1.17.96 1.17 1.15 0 2.03-1.21 2.03-2.96 0-1.55-1.11-2.63-2.7-2.63-1.84 0-2.92 1.38-2.92 2.8 0 .56.21 1.16.48 1.48a.2.2 0 0 1 .05.19l-.18.73c-.03.12-.1.14-.22.09-.83-.39-1.35-1.6-1.35-2.57 0-2.1 1.52-4.02 4.4-4.02 2.3 0 4.1 1.64 4.1 3.84 0 2.29-1.45 4.14-3.45 4.14-.67 0-1.31-.35-1.53-.77l-.41 1.59c-.15.58-.56 1.3-.83 1.74A6.6 6.6 0 1 0 8 1.4Z"/>'
  };

  const socialLink = (href, name, key) =>
    `<a href="${href}" target="_blank" rel="noopener noreferrer" aria-label="${name}">
       <svg viewBox="0 0 16 16" aria-hidden="true">${icons[key]}</svg>
     </a>`;

  const buildFooter = () => {
    const footer = $('#footer');
    if (!footer) return;

    footer.innerHTML = `
      <span class="footer__ghost" aria-hidden="true">AJAL</span>

      <div class="footer__inner">
        <div class="footer__top">

          <div class="footer__brand-col">
            <div class="footer__brand">
              <img src="AJ_MAIN_LOGO.png" alt="" class="footer__logo">
              <span>
                <strong>AJAL</strong>
                <em>Architects</em>
              </span>
            </div>
            <p class="footer__blurb">
              An architecture and interior design practice working across
              residential, workplace and hospitality projects in India —
              drawn with restraint, built to age well.
            </p>
            <div class="footer__social">
              ${socialLink('https://www.instagram.com', 'Instagram', 'instagram')}
              ${socialLink('https://www.linkedin.com', 'LinkedIn', 'linkedin')}
              ${socialLink('https://www.behance.net', 'Behance', 'behance')}
              ${socialLink('https://www.pinterest.com', 'Pinterest', 'pinterest')}
            </div>
          </div>

          <div class="footer__col">
            <h4>Explore</h4>
            <ul>
              <li><a href="#projects"  data-scroll>Projects</a></li>
              <li><a href="#manifesto" data-scroll>Manifesto</a></li>
              <li><a href="#story"     data-scroll>Our Story</a></li>
              <li><a href="#team"      data-scroll>Team</a></li>
              <li><a href="#awards"    data-scroll>Awards</a></li>
            </ul>
          </div>

          <div class="footer__col">
            <h4>Services</h4>
            <ul>
              <li><span>Architecture</span></li>
              <li><span>Interior Design</span></li>
              <li><span>Master Planning</span></li>
              <li><span>Adaptive Reuse</span></li>
              <li><span>Turnkey Delivery</span></li>
            </ul>
          </div>

          <div class="footer__news">
            <h4>Studio notes</h4>
            <p class="footer__note">
              Two or three emails a year — new work, site photographs and
              the occasional detail drawing. Nothing else.
            </p>
            <form class="subscribe" id="subscribeForm" novalidate>
              <input type="email" id="subEmail" name="email" placeholder="your@email.com"
                     autocomplete="email" aria-label="Email address" required>
              <button type="submit" aria-label="Subscribe">
                <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4"/></svg>
              </button>
            </form>
            <small class="subscribe__status" id="subStatus" role="status" aria-live="polite"></small>
          </div>

        </div>

        <div class="footer__bottom">
          <span>&copy; <span id="year"></span> Ajal Architects. All rights reserved.</span>
          <nav aria-label="Legal">
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
            <a href="#contact" data-scroll>Contact</a>
          </nav>
          <span>Bengaluru, India</span>
        </div>
      </div>
    `;

    const year = $('#year');
    if (year) year.textContent = new Date().getFullYear();

    // footer links are injected after Nav.init() ran, so wire them here
    $$('[data-scroll]', footer).forEach((a) => {
      a.addEventListener('click', (e) => {
        const id = a.getAttribute('href');
        if (!id || !id.startsWith('#') || id === '#') return;
        const target = document.querySelector(id);
        if (!target) return;

        e.preventDefault();
        const top = target.getBoundingClientRect().top + window.scrollY - 72;
        window.scrollTo({
          top,
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
        });
      });
    });
  };

  /* ==========================================================
     CONTACT FORM
     No backend yet — validates, then reports success locally.
     Swap the setTimeout for a fetch() when an endpoint exists.
     ========================================================== */

  const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());

  const ContactForm = {
    init() {
      const form = $('#contactForm');
      if (!form) return;

      const status = $('#formStatus');

      const setError = (input, msg) => {
        const field = input.closest('.field');
        if (!field) return;
        field.classList.toggle('has-error', Boolean(msg));
        const err = $('[data-err]', field);
        if (err) err.textContent = msg || '';
        input.setAttribute('aria-invalid', msg ? 'true' : 'false');
      };

      const validate = (input) => {
        const v = input.value.trim();

        if (!v) {
          setError(input, 'This field is required');
          return false;
        }
        if (input.type === 'email' && !isEmail(v)) {
          setError(input, 'Enter a valid email address');
          return false;
        }
        setError(input, '');
        return true;
      };

      const inputs = $$('input, textarea, select', form);

      inputs.forEach((input) => {
        input.addEventListener('blur', () => validate(input));
        input.addEventListener('input', () => {
          if (input.closest('.field').classList.contains('has-error')) validate(input);
        });
      });

      form.addEventListener('submit', (e) => {
        e.preventDefault();

        const ok = inputs.map(validate).every(Boolean);

        if (!ok) {
          if (status) status.textContent = 'Please check the highlighted fields.';
          const firstBad = $('.field.has-error input, .field.has-error textarea, .field.has-error select', form);
          if (firstBad) firstBad.focus();
          return;
        }

        const btn = $('button[type="submit"]', form);
        const label = btn ? $('span', btn) : null;
        const original = label ? label.textContent : '';

        if (label) label.textContent = 'Sending…';
        if (btn) btn.disabled = true;
        if (status) status.textContent = '';

        // placeholder for the real submit
        setTimeout(() => {
          form.reset();
          inputs.forEach((i) => setError(i, ''));
          if (label) label.textContent = original;
          if (btn) btn.disabled = false;
          if (status) status.textContent = 'Thank you — we’ll reply within two working days.';
        }, 900);
      });
    }
  };

  /* ==========================================================
     NEWSLETTER
     ========================================================== */

  const Subscribe = {
    init() {
      const form = $('#subscribeForm');
      const status = $('#subStatus');
      if (!form) return;

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = $('#subEmail');
        if (!input || !status) return;

        if (!isEmail(input.value)) {
          status.textContent = 'Enter a valid email address.';
          input.focus();
          return;
        }

        status.textContent = 'Subscribed. Welcome aboard.';
        input.value = '';
      });
    }
  };

  /* ==========================================================
     BACK TO TOP
     ========================================================== */

  const ToTop = {
    init() {
      const btn = $('#toTop');
      if (!btn) return;

      window.addEventListener('scroll', () => {
        btn.classList.toggle('is-on', window.scrollY > window.innerHeight * 0.8);
      }, { passive: true });

      btn.addEventListener('click', () => {
        window.scrollTo({
          top: 0,
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
        });
      });
    }
  };

  const boot = () => {
    buildFooter();
    ContactForm.init();
    Subscribe.init();
    ToTop.init();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();

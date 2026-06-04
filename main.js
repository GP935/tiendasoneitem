const STRIPE_KEY  = 'PLACEHOLDER_pk_test_XXXXX';
const PRICE_ID    = 'PLACEHOLDER_price_XXXXX';
const SUCCESS_URL = window.location.origin + '/gracias.html';
const CANCEL_URL  = window.location.href;

// Carga Stripe una sola vez; devuelve la misma promesa a todos los callers
let stripePromise = null;

function loadStripe() {
  if (stripePromise) return stripePromise;
  stripePromise = new Promise(resolve => {
    const script = document.createElement('script');
    script.src = 'https://js.stripe.com/v3/';
    script.onload = () => resolve(window.Stripe(STRIPE_KEY));
    document.head.appendChild(script);
  });
  return stripePromise;
}

async function handleCtaClick(e) {
  e.preventDefault();
  const btn = e.currentTarget;
  btn.setAttribute('aria-disabled', 'true');
  const stripe = await loadStripe();
  const result = await stripe.redirectToCheckout({
    lineItems: [{ price: PRICE_ID, quantity: 1 }],
    mode: 'payment',
    successUrl: SUCCESS_URL,
    cancelUrl: CANCEL_URL,
  });
  if (result.error) {
    btn.removeAttribute('aria-disabled');
  }
}

// Preconecta Stripe cuando el primer CTA entra en viewport (rootMargin amplio = anticipa scroll)
function initStripeCheckout() {
  const buttons = document.querySelectorAll('.cta-button');
  if (!buttons.length) return;

  buttons.forEach(btn => btn.addEventListener('click', handleCtaClick));

  const preloadObserver = new IntersectionObserver((entries, obs) => {
    if (!entries[0].isIntersecting) return;
    loadStripe();
    obs.disconnect();
  }, { rootMargin: '400px' });

  preloadObserver.observe(buttons[0]);
}

// Lazy load para img[data-src] — swap cuando entra en viewport
function initLazyImages() {
  const images = document.querySelectorAll('img[data-src]');
  if (!images.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const img = entry.target;
      img.src = img.dataset.src;
      img.removeAttribute('data-src');
      observer.unobserve(img);
    });
  }, { rootMargin: '200px' });

  images.forEach(img => observer.observe(img));
}

// Oculta la sticky bar mientras el CTA del hero sea visible; la muestra al hacer scroll
function initStickyBar() {
  const stickyBar = document.querySelector('.sticky-cta-bar');
  if (!stickyBar) return;
  const heroCta = document.querySelector('.hero .cta-button');
  if (!heroCta) return;

  const observer = new IntersectionObserver((entries) => {
    stickyBar.classList.toggle('is-hidden', entries[0].isIntersecting);
  }, { threshold: 0.5 });

  observer.observe(heroCta);
}

// Acordeon FAQ
// Estructura HTML: button[data-faq-toggle] dentro de <dt>, la <dd> es hermana del <dt>
function initFaq() {
  const toggles = document.querySelectorAll('[data-faq-toggle]');
  if (!toggles.length) return;

  toggles.forEach(toggle => {
    toggle.addEventListener('click', () => {
      const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
      toggles.forEach(t => {
        t.setAttribute('aria-expanded', 'false');
        const answer = t.closest('dt').nextElementSibling;
        if (answer) answer.hidden = true;
      });
      if (!isExpanded) {
        toggle.setAttribute('aria-expanded', 'true');
        const answer = toggle.closest('dt').nextElementSibling;
        if (answer) answer.hidden = false;
      }
    });
  });
}

function initLightbox() {
  const lightbox    = document.getElementById('lightbox');
  if (!lightbox) return;

  const lightboxImg = lightbox.querySelector('.lightbox__imagen');
  const btnCerrar   = lightbox.querySelector('.lightbox__cerrar');
  let anteriorFoco  = null;

  document.querySelectorAll('[data-lightbox]').forEach(btn => {
    btn.addEventListener('click', () => {
      anteriorFoco      = btn;
      lightboxImg.src   = btn.dataset.lightbox;
      lightboxImg.alt   = btn.dataset.lightboxAlt || '';
      lightbox.removeAttribute('hidden');
      requestAnimationFrame(() => lightbox.classList.add('is-open'));
      btnCerrar.focus();
      document.body.style.overflow = 'hidden';
    });
  });

  function cerrar() {
    lightbox.classList.remove('is-open');
    lightbox.addEventListener('transitionend', () => {
      lightbox.setAttribute('hidden', '');
      lightboxImg.src = '';
      document.body.style.overflow = '';
      if (anteriorFoco) anteriorFoco.focus();
    }, { once: true });
  }

  btnCerrar.addEventListener('click', cerrar);

  lightbox.addEventListener('click', e => {
    if (e.target === lightbox) cerrar();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !lightbox.hasAttribute('hidden')) cerrar();
  });
}

function initFooterYear() {
  const el = document.getElementById('footer-year');
  if (el) el.textContent = new Date().getFullYear();
}

document.addEventListener('DOMContentLoaded', () => {
  initFooterYear();
  initLazyImages();
  initStripeCheckout();
  initStickyBar();
  initFaq();
  initLightbox();
});

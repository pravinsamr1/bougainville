/* ================================================================
   krishna.js — Page-specific scripts for home-v3.html (Krishna home)
   Initialises two kr- fade carousels:
     kr-hero   → slides 1–2 (above the fold, keyboard-enabled)
     kr-hero-2 → slides 3–4 (mid-page, after Donation section)
   Same pattern as hanuman.js (hanuman-s1 slider).
================================================================ */

function initKrSlider(id, enableKeyboard) {
  'use strict';

  var hero    = document.getElementById(id);
  if (!hero) return;

  var slides    = Array.from(hero.querySelectorAll('.kr-slide'));
  var dots      = Array.from(hero.querySelectorAll('.kr-dot'));
  var progress  = hero.querySelector('.kr-progress');
  var counterEl = hero.querySelector('.kr-counter-current');
  var current   = 0;
  var timer;
  var paused    = false;
  var DELAY     = 8000;   /* ms per slide */

  /* ── Activate slide n ── */
  function activate(n) {
    slides[current].classList.remove('is-active');
    slides[current].setAttribute('aria-hidden', 'true');
    dots[current].classList.remove('is-active');
    dots[current].setAttribute('aria-selected', 'false');

    current = (n + slides.length) % slides.length;

    slides[current].classList.add('is-active');
    slides[current].setAttribute('aria-hidden', 'false');
    dots[current].classList.add('is-active');
    dots[current].setAttribute('aria-selected', 'true');

    if (counterEl) {
      counterEl.textContent = String(current + 1).padStart(2, '0');
    }

    startProgress();
  }

  /* ── Progress bar: reset to 0, then animate to 100% over DELAY ms ── */
  function startProgress() {
    if (!progress) return;
    progress.style.transition = 'none';
    progress.style.width = '0%';
    void progress.offsetWidth;   /* force reflow so transition restarts cleanly */
    progress.style.transition = 'width ' + DELAY + 'ms linear';
    progress.style.width = '100%';
  }

  /* ── Autoplay ── */
  function resetTimer() {
    clearInterval(timer);
    if (!paused) {
      timer = setInterval(function () { activate(current + 1); }, DELAY);
    }
    startProgress();
  }

  /* ── Arrow clicks ── */
  var prev = hero.querySelector('.kr-prev');
  var next = hero.querySelector('.kr-next');
  if (prev) prev.addEventListener('click', function () { activate(current - 1); resetTimer(); });
  if (next) next.addEventListener('click', function () { activate(current + 1); resetTimer(); });

  /* ── Dot clicks ── */
  dots.forEach(function (dot, i) {
    dot.addEventListener('click', function () {
      if (i !== current) { activate(i); resetTimer(); }
    });
  });

  /* ── Keyboard (left / right arrows) — only for primary hero ── */
  if (enableKeyboard) {
    document.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft')  { activate(current - 1); resetTimer(); }
      if (e.key === 'ArrowRight') { activate(current + 1); resetTimer(); }
    });
  }

  /* ── Touch swipe ── */
  var touchX = 0;
  hero.addEventListener('touchstart', function (e) {
    touchX = e.touches[0].clientX;
  }, { passive: true });
  hero.addEventListener('touchend', function (e) {
    var diff = touchX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      activate(diff > 0 ? current + 1 : current - 1);
      resetTimer();
    }
  }, { passive: true });

  /* ── Pause on hover ── */
  hero.addEventListener('mouseenter', function () {
    paused = true;
    clearInterval(timer);
    if (progress) {
      var computed = getComputedStyle(progress).width;
      progress.style.transition = 'none';
      progress.style.width = computed;
      void progress.offsetWidth;
    }
  });
  hero.addEventListener('mouseleave', function () {
    paused = false;
    resetTimer();
  });

  /* ── Init ── */
  resetTimer();
}

/* Slides 1–2 above the fold — keyboard enabled */
initKrSlider('kr-hero',   true);
/* Slides 3–4 mid-page after Donation section */
initKrSlider('kr-hero-2', false);

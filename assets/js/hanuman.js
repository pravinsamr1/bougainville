/* ================================================================
   hanuman.js — Page-specific scripts for home-hanuman.html
   Initialises: testimonial slick slider, Slider 1 vanilla carousel,
                Slider 3 parallax scroll effect.
================================================================ */

/* ── Testimonial slider (Slick) ─────────────────────────── */
$(function () {
  if ($('.sigma_testimonial-slider').length) {
    $('.sigma_testimonial-slider').slick({
      slidesToShow: 1,
      slidesToScroll: 1,
      arrows: true,
      dots: false,
      prevArrow: $('.testimonial-section .slider-prev'),
      nextArrow: $('.testimonial-section .slider-next'),
      autoplay: true,
      autoplaySpeed: 4500,
      fade: true,
      cssEase: 'linear'
    });
  }
});


/* ── Slider 1 — vanilla fade carousel (no framework) ─────── */
(function () {
  if (!document.querySelector('.hanuman-s1-hero')) return;
  var slides  = Array.from(document.querySelectorAll('.hanuman-s1-slide'));
  var dots    = Array.from(document.querySelectorAll('.hanuman-s1-dot'));
  var current = 0;
  var timer;
  var DELAY   = 9000;

  function activate(n) {
    slides[current].classList.remove('is-active');
    dots[current].classList.remove('is-active');
    dots[current].setAttribute('aria-selected', 'false');

    current = (n + slides.length) % slides.length;

    slides[current].classList.add('is-active');
    dots[current].classList.add('is-active');
    dots[current].setAttribute('aria-selected', 'true');
  }

  function resetTimer() {
    clearInterval(timer);
    timer = setInterval(function () { activate(current + 1); }, DELAY);
  }

  /* Arrow buttons */
  document.querySelector('.hanuman-s1-prev').addEventListener('click', function () {
    activate(current - 1); resetTimer();
  });
  document.querySelector('.hanuman-s1-next').addEventListener('click', function () {
    activate(current + 1); resetTimer();
  });

  /* Dot buttons */
  dots.forEach(function (dot, i) {
    dot.addEventListener('click', function () {
      if (i !== current) { activate(i); resetTimer(); }
    });
  });

  /* Keyboard (left / right arrows) */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft')  { activate(current - 1); resetTimer(); }
    if (e.key === 'ArrowRight') { activate(current + 1); resetTimer(); }
  });

  /* Touch swipe */
  var touchX = 0;
  document.querySelector('.hanuman-s1-hero').addEventListener('touchstart', function (e) {
    touchX = e.touches[0].clientX;
  }, { passive: true });
  document.querySelector('.hanuman-s1-hero').addEventListener('touchend', function (e) {
    var diff = touchX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      activate(diff > 0 ? current + 1 : current - 1);
      resetTimer();
    }
  }, { passive: true });

  /* Start autoplay */
  resetTimer();
}());


/* ── Slider 3 parallax — moves bg-position-y on scroll ───── */
(function () {
  var hero = document.querySelector('.hanuman-s3-hero');
  var bg   = document.querySelector('.hanuman-s3-bg');
  if (!hero || !bg) return;
  function onScroll() {
    var rect     = hero.getBoundingClientRect();
    var progress = rect.top / window.innerHeight; /* +1 above vp, 0 entering, −1 below */
    var shift    = progress * 200;                /* ±200px range */
    bg.style.backgroundPositionY = 'calc(50% + ' + shift + 'px)';
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}());


/* ── Hanuman-3 rock-frame 3-slide carousel ── */
(function () {
  if (!document.querySelector('.h3-hero')) return;
  var slides  = Array.from(document.querySelectorAll('.h3-slide'));
  var dots    = Array.from(document.querySelectorAll('.h3-dot'));
  var current = 0;
  var timer;
  var DELAY   = 9000;

  function activate(n) {
    slides[current].classList.remove('is-active');
    dots[current].classList.remove('is-active');
    dots[current].setAttribute('aria-selected', 'false');

    current = (n + slides.length) % slides.length;

    slides[current].classList.add('is-active');
    dots[current].classList.add('is-active');
    dots[current].setAttribute('aria-selected', 'true');
  }

  function resetTimer() {
    clearInterval(timer);
    timer = setInterval(function () { activate(current + 1); }, DELAY);
  }

  /* Arrow buttons */
  document.querySelector('.h3-prev').addEventListener('click', function () {
    activate(current - 1);
    resetTimer();
  });
  document.querySelector('.h3-next').addEventListener('click', function () {
    activate(current + 1);
    resetTimer();
  });

  /* Dot buttons */
  dots.forEach(function (dot, i) {
    dot.addEventListener('click', function () {
      if (i !== current) { activate(i); resetTimer(); }
    });
  });

  /* Keyboard */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft')  { activate(current - 1); resetTimer(); }
    if (e.key === 'ArrowRight') { activate(current + 1); resetTimer(); }
  });

  /* Touch swipe */
  var touchX = 0;
  document.querySelector('.h3-hero').addEventListener('touchstart', function (e) {
    touchX = e.touches[0].clientX;
  }, { passive: true });
  document.querySelector('.h3-hero').addEventListener('touchend', function (e) {
    var diff = touchX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      activate(diff > 0 ? current + 1 : current - 1);
      resetTimer();
    }
  }, { passive: true });

  /* Start autoplay */
  resetTimer();
}());

(function($) {
  'use strict';

  /*-------------------------------------------------------------------------------
  Preloader
    -------------------------------------------------------------------------------*/
  $(window).on('load', function() {
    $('.sigma_preloader').addClass('hidden');
  });

  /*-------------------------------------------------------------------------------
  Subheader Trigger
  -------------------------------------------------------------------------------*/
  $(".subheader-toggler").on('click', function(e) {
    e.preventDefault();
    $(".sigma_subheader-extras").toggleClass('open');
  });

  /*-------------------------------------------------------------------------------
  volunteers Socials Trigger
  -------------------------------------------------------------------------------*/
  $("a.trigger-volunteers-socials").on('click', function(e) {
    e.preventDefault();
    $(this).closest('.sigma_sm').toggleClass('visible');
  });

  /*-------------------------------------------------------------------------------
  Cart Trigger
  -------------------------------------------------------------------------------*/
  $(".sigma_cart-trigger").on('click', function(e) {
    e.preventDefault();
    $("body").toggleClass('cart-open');
  });

  /*-------------------------------------------------------------------------------
  Search Trigger
  -------------------------------------------------------------------------------*/
  $(".sigma_search-trigger").on('click', function(e) {
    e.preventDefault();
    $(".sigma_search-form-wrapper").toggleClass('open');
  });

  /*-------------------------------------------------------------------------------
  Aside Menu
  -------------------------------------------------------------------------------*/
  $(".aside-trigger-right").on('click', function() {
    var $el = $(".sigma_aside-right-panel");
    $el.toggleClass('open');
    if ($el.hasClass('open')) {
      setTimeout(function() {
        $el.find('.sidebar').fadeIn();
      }, 300);
    } else {
      $el.find('.sidebar').fadeOut();
    }
  });

  $(".aside-trigger-left").on('click', function() {
    $(".sigma_aside-left").toggleClass('open');
  });

  $(".sigma_aside .menu-item-has-children > a").on('click', function(e) {
    var submenu = $(this).next(".sub-menu");
    e.preventDefault();

    submenu.slideToggle(200);
  });

  /*-------------------------------------------------------------------------------
  Sticky Header
    -------------------------------------------------------------------------------*/
  var header = $(".can-sticky");
  var headerHeight = header.innerHeight();

  function doSticky() {
    if (window.pageYOffset > headerHeight) {
      header.addClass("sticky");
    } else {
      header.removeClass("sticky");
    }
  }
  doSticky();

  /*-------------------------------------------------------------------------------
  Tooltips â€” Bootstrap 5 native API (no jQuery dependency)
  -------------------------------------------------------------------------------*/
  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach(function (el) {
      new bootstrap.Tooltip(el);
    });
  });

  /*-------------------------------------------------------------------------------
  Magnific Popup
  -------------------------------------------------------------------------------*/
  $('.popup-youtube').magnificPopup({type: 'iframe'});
  $('.popup-vimeo').magnificPopup({type: 'iframe'});
  $('.popup-video').magnificPopup({type: 'iframe'});
  $('.gallery-thumb').magnificPopup({
    type: 'image',
    gallery: {
      enabled: true
    }
  });

  /*-------------------------------------------------------------------------------
  ion Range Sliders (Price filter)
  -------------------------------------------------------------------------------*/
  $(".js-range-slider").ionRangeSlider();

  /*-------------------------------------------------------------------------------
  Countdown
  -------------------------------------------------------------------------------*/
  function makeTimer() {
    var endTime = new Date("01 January 2022 00:00:00 GMT+05:30");
    endTime = (Date.parse(endTime) / 1000);
    var now = new Date();
    now = (Date.parse(now) / 1000);
    var timeLeft = endTime - now;
    var days = Math.floor(timeLeft / 86400);
    var hours = Math.floor((timeLeft - (days * 86400)) / 3600);
    var minutes = Math.floor((timeLeft - (days * 86400) - (hours * 3600)) / 60);
    var seconds = Math.floor((timeLeft - (days * 86400) - (hours * 3600) - (minutes * 60)));
    if (hours < "10") {
      hours = "0" + hours;
    }
    if (minutes < "10") {
      minutes = "0" + minutes;
    }
    if (seconds < "10") {
      seconds = "0" + seconds;
    }
    $(".days").html(days);
    $(".hours").html(hours);
    $(".minutes").html(minutes);
    $(".seconds").html(seconds);
  }
  setInterval(function() {
    makeTimer();
  }, 1000);

  /*-------------------------------------------------------------------------------
  Counter
  -------------------------------------------------------------------------------*/

  $(".counter").each(function() {
    var $this = $(this);
    $this.one('inview', function(event, isInView) {
      if (isInView) {
        $this.countTo({speed: 2000});
      }
    });
  });

  /*-------------------------------------------------------------------------------
  Checkout Notices
  -------------------------------------------------------------------------------*/
  $(".sigma_notice a").on('click', function(e) {
    e.preventDefault();

    $(this).closest('.sigma_notice').next().slideToggle();
  });

  /*-------------------------------------------------------------------------------
  Progress bar on view
  -------------------------------------------------------------------------------*/
  $(".sigma_progress-round").each(function() {
    var animateTo = $(this).data('to'),
      $this = $(this);
    $this.one('inview', function(event, isInView) {
      if (isInView) {
        $this.css({'stroke-dashoffset': animateTo});
      }
    });
  });

  $(".sigma_progress").each(function() {
    var progressBar = $(this).find(".progress-bar");
    var progressCount = $(this).find(".sigma_progress-count");
    $(progressBar).one('inview', function(event, isInView) {
      if (isInView) {
        $(progressBar).animate({
          width: $(progressBar).attr("aria-valuenow") + "%"
        }, function() {
          $(progressCount).animate({
            left: $(progressBar).attr("aria-valuenow") + "%",
            opacity: 1
          });
        });
      }
    });
  });

  /*-------------------------------------------------------------------------------
  Testimonials slider
  -------------------------------------------------------------------------------*/
  $(".sigma_testimonial-slider").slick({
    slidesToShow: 2,
    slidesToScroll: 1,
    arrows: true,
    prevArrow: $('.testimonial-section .slider-prev'),
    nextArrow: $('.testimonial-section .slider-next'),
    dots: false,
    autoplay: true,
    responsive: [
      {
        breakpoint: 767,
        settings: {
          slidesToShow: 1
        }
      }
    ]
  });

  $(".sigma_testimonial-slider-1").slick({
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: false,
    dots: true,
    autoplay: true
  });

  /*-------------------------------------------------------------------------------
  Dots Slider
  -------------------------------------------------------------------------------*/
  $(".basic-dot-slider").slick({slidesToShow: 1, slidesToScroll: 1, arrows: false, dots: true, autoplay: true});

  /*-------------------------------------------------------------------------------
  Banner slider (Home v3)
  -------------------------------------------------------------------------------*/
  $(".banner-3 .sigma_banner-slider, .banner-1 .sigma_banner-slider, .banner-2 .sigma_banner-slider").slick({
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: true,
    dots: false,
    autoplay: false,
    responsive: [
      {
        breakpoint: 991,
        settings: {
          arrows: false
        }
      }
    ]
  });

  /*-------------------------------------------------------------------------------
  Product details slider
  -------------------------------------------------------------------------------*/
  $('.sigma_product-single-thumb .slider').slick({slidesToShow: 1, slidesToScroll: 1, arrows: false, fade: true, asNavFor: '.sigma_product-single-thumb .slider-nav'});

  $('.sigma_product-single-thumb .slider-nav').slick({
    slidesToShow: 3,
    slidesToScroll: 1,
    asNavFor: '.sigma_product-single-thumb .slider',
    dots: false,
    centerMode: false,
    arrows: false,
    focusOnSelect: false
  });

  /*-------------------------------------------------------------------------------
  portfolio slider
  -------------------------------------------------------------------------------*/
  $(".portfolio-slider").slick({
    slidesToShow: 2,
    slidesToScroll: 1,
    arrows: true,
    dots: false,
    autoplay: false,
    prevArrow: $('.portfolio-section .slider-prev'),
    nextArrow: $('.portfolio-section .slider-next'),
    responsive: [
      {
        breakpoint: 767,
        settings: {
          slidesToShow: 1
        }
      }
    ]
  });

  /*-------------------------------------------------------------------------------
  Masonry
  -------------------------------------------------------------------------------*/
  $('.masonry').imagesLoaded(function() {
    var isotopeContainer = $('.masonry');
    isotopeContainer.isotope({itemSelector: '.masonry-item'});
  });

  /*------------------------------------------------------------------------------
  Isotope
  ------------------------------------------------------------------------------*/

  function doIsotope() {
    var $portfolioGrid = '';

    $('.portfolio-filter').imagesLoaded(function() {
      $portfolioGrid = $('.portfolio-filter').isotope({
        itemSelector: '.col-lg-4',
        percentPosition: true,
        masonry: {
          columnWidth: '.col-lg-4'
        }
      });
    });

    $('.filter-items').on('click', '.portfolio-trigger', function() {
      var filterValue = $(this).attr('data-filter');
      $portfolioGrid.isotope({filter: filterValue});
    });

    $('.portfolio-trigger').on('click', function(e) {
      $(this).closest('.filter-items').find('.active').removeClass('active');
      $(this).addClass('active');
      event.preventDefault();
    });

  }
  doIsotope();

  /*-------------------------------------------------------------------------------
  Add / Subtract Quantity
  -------------------------------------------------------------------------------*/
  $(".qty span").on('click', function() {
    var qty = $(this).closest('.qty').find('input');
    var qtyVal = parseInt(qty.val());
    if ($(this).hasClass('qty-add')) {
      qty.val(qtyVal + 1);
    } else {
      return qtyVal > 1
        ? qty.val(qtyVal - 1)
        : 0;
    }
  })

  /*-----------------------------------
    Back to Top
    -----------------------------------*/

    function stickBackToTop() {
    if (window.pageYOffset > 400) {
      $('.sigma_top').addClass('active');
    } else {
      $('.sigma_top').removeClass('active');
    }
  }
  stickBackToTop();

  $('body').on('click', '.sigma_top', function() {
    $("html, body").animate({
      scrollTop: 0
    }, 600);
    return false;
  });

  // init wow js
  new WOW().init();

  //On scroll events
  $(window).on('scroll', function() {

    doSticky();

    // Back to top
    stickBackToTop();

  });

  //On resize events
  $(window).on('resize', function() {});


  /*-------------------------------------------------------------------------------
  Active Nav Link â€” auto-highlight current page menu item
  -------------------------------------------------------------------------------*/
  (function() {
    var page = (window.location.pathname.split('/').pop() || 'index.html').split('?')[0];
    if (!page) page = 'index.html';
    $('.navbar-nav .menu-item > a, .sigma_aside .menu-item > a').each(function() {
      var href = ($(this).attr('href') || '').split('/').pop().split('?')[0];
      if (href && href === page) {
        $(this).closest('.menu-item').addClass('current-menu-item');
      }
    });
  })();

  /*-------------------------------------------------------------------------------
  Theme Color Panel
  -------------------------------------------------------------------------------*/
  // Restore saved theme href immediately (#mht-color-link is in <head>, always present)


  // Restore active swatch after full page load (widgets are injected after script tags)
  // Mark first (default) colour swatch as active on page load
  $(window).on('load', function() {
    $('.mht-each-color').first().addClass('mht-active');
  });

  // Event delegation â€” widgets live after the script tags so direct selectors miss them
  $(document).on('click', '.mht-theme-switch', function() {
    $('.mht-color-theme').toggleClass('mht-slide-out');
  });

  $(document).on('click', '.mht-each-color', function() {
    var col  = $(this).data('color');
    var href = 'assets/css/theme-colors/' + col + '.css';
    $('#mht-color-link').attr('href', href);
    $('.mht-each-color').removeClass('mht-active');
    $(this).addClass('mht-active');
  });

  /*-------------------------------------------------------------------------------
  Buy Widget
  -------------------------------------------------------------------------------*/
  $(document).on('click', '.mht-buy-switch', function() {
    $('.mht-buy-widget').toggleClass('mht-buy-open');
  });

  /*-------------------------------------------------------------------------------
  WhatsApp button â€” show "not configured" notice when disabled
  -------------------------------------------------------------------------------*/
  $(document).on('click', '.mht-whatsapp-btn.mht-wa-disabled', function(e) {
    e.preventDefault();
    var $notice = $('#mht-wa-notice');
    if (!$notice.length) {
      $notice = $(
        '<div id="mht-wa-notice" class="mht-wa-notice">' +
          '<b>&#128241; WhatsApp not configured</b><br>' +
          'To activate, edit the WhatsApp button href in your HTML files.' +
        '</div>'
      );
      $('body').append($notice);
    }
    $notice.addClass('mht-wa-show');
    clearTimeout(window._mhtWaTimer);
    window._mhtWaTimer = setTimeout(function() {
      $notice.removeClass('mht-wa-show');
    }, 4500);
  });

  /*-------------------------------------------------------------------------------
  v1.3 â€” Dark Mode Toggle
  -------------------------------------------------------------------------------*/


  $(document).on('click', '#mht-darkmode-tab', function() {
    var isDark = $('body').toggleClass('mht-dark').hasClass('mht-dark');
    var $icon = $('#mht-darkmode-icon');
    // Light mode (default): sun icon  |  Dark mode active: moon icon
    $icon.toggleClass('fa-sun',  !isDark)
         .toggleClass('fa-moon',  isDark);
  });

  /*-------------------------------------------------------------------------------
  ARIA â€” Accessibility enhancements (v1.4)
  -------------------------------------------------------------------------------*/

  // 1. Offcanvas aside â€” initial aria-hidden + aria-expanded on togglers
  $(function() {
    $('.sigma_aside-left').attr('aria-hidden', 'true');
    $('.sigma_aside-right-panel').attr('aria-hidden', 'true');
    $('.aside-trigger-left').attr({'role': 'button', 'aria-expanded': 'false', 'aria-label': 'Open navigation menu'});
    $('.aside-trigger-right').attr({'role': 'button', 'aria-expanded': 'false', 'aria-label': 'Open sidebar'});
  });

  // Sync aria-hidden / aria-expanded on each toggle click
  $(document).on('click', '.aside-trigger-left', function() {
    setTimeout(function() {
      var open = $('.sigma_aside-left').hasClass('open');
      $('.sigma_aside-left').attr('aria-hidden', open ? 'false' : 'true');
      $('.aside-trigger-left').attr('aria-expanded', String(open));
    }, 10);
  });

  $(document).on('click', '.aside-trigger-right', function() {
    setTimeout(function() {
      var open = $('.sigma_aside-right-panel').hasClass('open');
      $('.sigma_aside-right-panel').attr('aria-hidden', open ? 'false' : 'true');
      $('.aside-trigger-right').attr('aria-expanded', String(open));
    }, 10);
  });

  // Escape key closes open asides
  $(document).on('keydown', function(e) {
    if (e.key === 'Escape') {
      if ($('.sigma_aside-left').hasClass('open')) {
        $('.sigma_aside-left').removeClass('open').attr('aria-hidden', 'true');
        $('.aside-trigger-left').attr('aria-expanded', 'false');
      }
      if ($('.sigma_aside-right-panel').hasClass('open')) {
        $('.sigma_aside-right-panel').removeClass('open').attr('aria-hidden', 'true');
        $('.aside-trigger-right').attr('aria-expanded', 'false');
      }
      if ($('.sigma_search-form-wrapper').hasClass('open')) {
        $('.sigma_search-form-wrapper').removeClass('open');
      }
    }
  });

  // 2. Slider prev/next controls â€” role + aria-label + keyboard activation
  $(function() {
    $('[class*="slider-prev"]').attr({'role': 'button', 'aria-label': 'Previous slide', 'tabindex': '0'});
    $('[class*="slider-next"]').attr({'role': 'button', 'aria-label': 'Next slide',     'tabindex': '0'});
    // Slick-generated prev/next buttons
    $('.slick-prev').attr({'aria-label': 'Previous slide'});
    $('.slick-next').attr({'aria-label': 'Next slide'});
  });

  // Keyboard activation for custom slider arrows (i.fal elements)
  $(document).on('keydown', '[class*="slider-prev"], [class*="slider-next"]', function(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      $(this).trigger('click');
    }
  });

  // 3. Social icon links â€” auto-label from Font Awesome icon class
  $(function() {
    var socialMap = [
      ['fa-facebook',  'Facebook'],
      ['fa-twitter',   'Twitter'],
      ['fa-instagram', 'Instagram'],
      ['fa-youtube',   'YouTube'],
      ['fa-linkedin',  'LinkedIn'],
      ['fa-pinterest', 'Pinterest'],
      ['fa-vimeo',     'Vimeo'],
      ['fa-tiktok',    'TikTok'],
      ['fa-google',    'Google'],
      ['fa-whatsapp',  'WhatsApp']
    ];
    $('a').each(function() {
      if ($(this).attr('aria-label') || $(this).text().trim()) return;
      var $icon = $(this).children('i').first();
      if (!$icon.length) return;
      var cls = $icon.attr('class') || '';
      for (var i = 0; i < socialMap.length; i++) {
        if (cls.indexOf(socialMap[i][0]) !== -1) {
          $(this).attr('aria-label', socialMap[i][1]);
          break;
        }
      }
    });
  });

  // 4. Other icon-only controls â€” search, cart, close, aside togglers
  $(function() {
    $('.sigma_search-trigger:not([aria-label])').attr({'aria-label': 'Open search'});
    $('.sigma_cart-trigger:not([aria-label])').attr({'aria-label':  'Open cart'});
    $('.close-btn:not([aria-label])').attr({'aria-label': 'Close', 'role': 'button', 'tabindex': '0'});
    $('a.trigger-volunteers-socials:not([aria-label])').attr({'aria-label': 'Show social links'});
    $('.sigma_search-form input[type="text"]:not([aria-label])').attr('aria-label', 'Search');
    $('.sigma_footer-newsletter input[type="text"]:not([aria-label])').attr('aria-label', 'Enter your email address');
  });

  // 5. Quantity spinners â€” role + aria-label + keyboard
  $(function() {
    $('.qty-subtract').attr({'role': 'button', 'tabindex': '0', 'aria-label': 'Decrease quantity'});
    $('.qty-add').attr(    {'role': 'button', 'tabindex': '0', 'aria-label': 'Increase quantity'});
    $('.qty input[type="text"]').attr('aria-label', 'Quantity');
  });

  $(document).on('keydown', '.qty-subtract, .qty-add', function(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      $(this).trigger('click');
    }
  });

  // 6. Color Panel toggle + swatches â€” role + aria-label + keyboard
  $(function() {
    $('.mht-theme-switch').attr({'role': 'button', 'tabindex': '0', 'aria-label': 'Open theme colors panel', 'aria-expanded': 'false'});
    $('.mht-buy-switch').attr( {'role': 'button', 'tabindex': '0', 'aria-label': 'Buy this template'});
    $('.mht-each-color').each(function() {
      var label = $(this).attr('title') || $(this).data('color') || 'Theme color';
      var checked = $(this).hasClass('mht-active') ? 'true' : 'false';
      $(this).attr({'role': 'radio', 'aria-label': label, 'aria-checked': checked, 'tabindex': '0'});
    });
  });

  // Update aria-expanded on theme panel toggle
  $(document).on('click', '.mht-theme-switch', function() {
    setTimeout(function() {
      var open = $('.mht-color-theme').hasClass('mht-slide-out');
      $('.mht-theme-switch').attr('aria-expanded', String(open));
    }, 10);
  });

  // Update aria-checked on swatch click
  $(document).on('click', '.mht-each-color', function() {
    $('.mht-each-color').attr('aria-checked', 'false');
    $(this).attr('aria-checked', 'true');
  });

  // Keyboard activation for panel controls
  $(document).on('keydown', '.mht-theme-switch, .mht-buy-switch, .mht-each-color, .close-btn', function(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      $(this).trigger('click');
    }
  });

  // 7. Quick-view modal â€” aria-modal + aria-label
  $(function() {
    $('#quickViewModal').attr({'aria-modal': 'true', 'aria-label': 'Quick view product'});
    $('#quickViewModal .close-btn').attr({'aria-label': 'Close quick view'});
  });

})(jQuery);


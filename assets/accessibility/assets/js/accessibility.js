/*-----------------------------------------------------------------------------------
    Accessibility Widget: Sigma — Cannaweed Cannabis Template
    Plugin URI: https://metropolitanhost.com/
    Author: Metropolitanhost
    Version: 2.0 — Flat Card UI

    Note: Sigma Accessibility Widget — Self-bootstrapping vanilla JS module.
          No jQuery dependency. Integrates with the Cannaweed template ecosystem.
          Single integration line (place before </body>, once per page):
            <script src="assets/accessibility/accessibility.js"></script>
-----------------------------------------------------------------------------------*/

/*---------------------------
    JS INDEX
    ===================
    01. Constants & Configuration
    02. Default Settings
    03. Profile Bundles
    04. Sigma ACW Module
        04a. Init
        04b. CSS Injection
        04c. HTML Partial Loading (XHR → inline fallback)
            — Logo Trigger
            — Overlay & Panel
            — Panel Header (navy)
            — Top Controls (pill buttons)
            — Panel Body
            — Profiles Section
            — Content Cards & Steppers
            — Color Section (filter grid + swatch circles)
            — Orientation Cards
            — Footer Bar
            — Statement Modal
        04d. Settings (Load / Save / Reset)
        04e. Event Binding
            — Logo Trigger
            — Show Again
            — Close / Overlay / Escape
            — Reset / Header Reset / Statement / Hide
            — Profile Buttons
            — Feature Cards (toggle)
            — Color Filter Cards
            — Color Circles
            — Cursor Cards
            — Steppers
            — Text Alignment
        04f. Panel Management
            — Activate
            — Open Panel
            — Close Panel
            — Deactivate
            — Focus Trap
        04g. Modal (Open / Close)
        04h. Apply All Settings
        04i. Dynamic CSS
        04j. Feature Apply
        04k. Profiles (Set / Clear)
        04l. Side Effects (Mute / Reading Guide / Mask / Magnifier)
        04m. UI Sync
        04n. ARIA Live Announcement
    05. Auto Init
-----------------------------*/

var sigmaACW;

(function () {
  'use strict';

  /*===========================
      01. CONSTANTS & CONFIGURATION
  ===========================*/
  var STORAGE_KEY      = 'acw-settings';
  var PANEL_ID         = 'acw-panel';
  var WRAP_ID          = 'acw-wrap';
  var DYNAMIC_STYLE_ID = 'acw-dynamic';

  /* Resolve script's own directory so CSS path works from any page depth */
  var _scriptSrc = (document.currentScript && document.currentScript.src) || (function () {
    var scripts = document.getElementsByTagName('script');
    for (var i = scripts.length - 1; i >= 0; i--) {
      if (scripts[i].src && scripts[i].src.indexOf('accessibility.js') !== -1) {
        return scripts[i].src;
      }
    }
    return '';
  })();
  var _scriptDir = _scriptSrc ? _scriptSrc.replace(/\/[^\/]+\.js$/, '/') : 'assets/accessibility/';

  /* SVG cursor data URIs — big black + big white */
  var CURSOR_BLACK = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Cpath d='M8 3l26 20-10 2 6 12-5 2-6-12-7 6z' fill='%23000' stroke='%23fff' stroke-width='2'/%3E%3C/svg%3E\") 4 4, auto";
  var CURSOR_WHITE = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Cpath d='M8 3l26 20-10 2 6 12-5 2-6-12-7 6z' fill='%23fff' stroke='%23000' stroke-width='2'/%3E%3C/svg%3E\") 4 4, auto";

  /*===========================
      02. DEFAULT SETTINGS
  ===========================*/
  var DEFAULTS = {
    hidden:          false,
    activated:       false,
    activeProfile:   null,
    /* Content */
    contentScale:    100,
    readableFont:    false,
    highlightTitles: false,
    highlightLinks:  false,
    textMagnifier:   false,
    fontSize:        0,
    lineHeight:      0,
    letterSpacing:   0,
    textAlign:       null,
    /* Colors */
    colorFilter:     null,
    textColor:       null,
    titleColor:      null,
    /* UX */
    muteSounds:      false,
    hideImages:      false,
    readMode:        false,
    readingGuide:    false,
    stopAnimations:  false,
    readingMask:     false,
    highlightHover:  false,
    highlightFocus:  false,
    cursorStyle:     null,
  };

  /*===========================
      03. PROFILE BUNDLES
  ===========================*/
  var PROFILES = {
    'seizure-safe':    { stopAnimations: true,  readableFont: true,   colorFilter: null },
    'vision-impaired': { contentScale: 125,     fontSize: 2,          colorFilter: 'high-contrast', highlightLinks: true },
    'adhd':            { readingGuide: true,    stopAnimations: true, highlightFocus: true },
    'cognitive':       { readableFont: true,    highlightTitles: true, highlightLinks: true, lineHeight: 1 },
    'keyboard-nav':    { highlightFocus: true,  highlightHover: true },
    'blind':           { readMode: true,        readableFont: true,   fontSize: 1 },
  };

  /* Color presets for text/title circle swatches */
  var COLOR_PRESETS = [
    { color: '#3b82f6', label: 'Blue'    },
    { color: '#9333ea', label: 'Purple'  },
    { color: '#db2777', label: 'Pink'    },
    { color: '#dc2626', label: 'Red'     },
    { color: '#ea580c', label: 'Orange'  },
    { color: '#ca8a04', label: 'Yellow'  },
    { color: '#16a34a', label: 'Green'   },
    { color: 'reset',   label: 'Default' },
  ];

  /*===========================
      04. SIGMA ACW MODULE
  ===========================*/
  var ACW = {

    settings:               {},
    _panelOpen:             false,
    _magnifierEl:           null,
    _readingGuideEl:        null,
    _maskTopEl:             null,
    _maskBottomEl:          null,
    _mouseMoveHandler:      null,
    _maskMoveHandler:       null,
    _magnifierMoveHandler:  null,
    _mutationObserver:      null,
    _focusTrapFirst:        null,
    _focusTrapLast:         null,

    /* ─── 04a. INIT ──────────────────────────────────────────────────────── */
    init: function () {
      if (document.getElementById(WRAP_ID)) return;
      this.injectCSS();
      this.injectDynamicStyle();
      this._injectSprite();
      this.settings = this.loadSettings();
      var self = this;
      /* Load the editable HTML partial; fall back to inline _buildHTML() on any error */
      this._loadPanel(function (html) { self._finishInit(html); });
    },

    /* ─── 04b. CSS INJECTION (local only — zero CDN) ─────────────────────── */
    injectCSS: function () {
      if (!document.getElementById('acw-stylesheet')) {
        var link  = document.createElement('link');
        link.id   = 'acw-stylesheet';
        link.rel  = 'stylesheet';
        link.href = _scriptDir + '../css/accessibility.css';
        document.head.appendChild(link);
      }
      /* Fonts are loaded via @font-face in accessibility.css (local WOFF2 files).
         No CDN fetch required. */
    },

    /* ─── 04c. SVG SPRITE INJECTION (inlined — works on file:// and http://) ─── */
    _injectSprite: function () {
      if (document.getElementById('acw-sprite')) return;
      var div = document.createElement('div');
      div.id  = 'acw-sprite';
      div.setAttribute('aria-hidden', 'true');
      div.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;';
      div.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" style="display:none" aria-hidden="true">'
        + '<symbol id="acw-universal-access" viewBox="0 0 512 512"><path d="M192 96a48 48 0 1 0 0-96 48 48 0 1 0 0 96zM120.5 247.2c12.4-4.7 18.7-18.5 14-30.9s-18.5-18.7-30.9-14C43.1 224.1 0 273.3 0 332c0 79.5 64.5 144 144 144c61.2 0 113.7-38.3 135.3-92.7c5-12.3-1-26.3-13.3-31.3s-26.3 1-31.3 13.3C220.5 397.7 185.3 424 144 424C82.1 424 32 373.9 32 312c0-40.4 22.4-75.8 55.5-94.3l12.4 77.5c3.5 22 26.5 33.5 46.3 24.1l100.8-46.7c15.5-7.2 22.3-25.5 15.2-41.1s-25.5-22.3-41.1-15.2L148.5 241l-28-93.8zM462 384H416V255.8c0-42.1-30.7-76.8-71.2-82.9L268.3 161l-7.9-49.6C256.8 89.2 236 74.1 213.7 76.8C199.3 78.5 186.9 86.4 179 97.9L156 136l61.2 20.4 19.5-29.7 13.8 86.2c3.8 23.8 24.5 40.2 48.3 38.2l34.6-2.8V384H328c-8.8 0-16 7.2-16 16v16c0 8.8 7.2 16 16 16H464c8.8 0 16-7.2 16-16V400c0-8.8-7.2-16-16-16H462z"/></symbol>'
        + '<symbol id="acw-times" viewBox="0 0 384 512"><path d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z"/></symbol>'
        + '<symbol id="acw-undo-alt" viewBox="0 0 512 512"><path d="M125.7 160H176c17.7 0 32 14.3 32 32s-14.3 32-32 32H48c-17.7 0-32-14.3-32-32V64c0-17.7 14.3-32 32-32s32 14.3 32 32v51.2L97.6 97.6c87.5-87.5 229.3-87.5 316.8 0s87.5 229.3 0 316.8s-229.3 87.5-316.8 0c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0c62.5 62.5 163.8 62.5 226.3 0s62.5-163.8 0-226.3s-163.8-62.5-226.3 0L125.7 160z"/></symbol>'
        + '<symbol id="acw-eye" viewBox="0 0 576 512"><path d="M288 32c-80.8 0-145.5 36.8-192.6 80.6C48.6 156 17.3 208 2.5 243.7c-3.3 7.9-3.3 16.7 0 24.6C17.3 304 48.6 356 95.4 399.4C142.5 443.2 207.2 480 288 480s145.5-36.8 192.6-80.6c46.8-43.5 78.1-95.4 93-131.1c3.3-7.9 3.3-16.7 0-24.6c-14.9-35.7-46.2-87.7-93-131.1C433.5 68.8 368.8 32 288 32zM144 256a144 144 0 1 1 288 0 144 144 0 1 1 -288 0zm144-64c0 35.3-28.7 64-64 64c-7.1 0-13.9-1.2-20.3-3.3c-5.5-1.8-11.9 1.6-11.7 7.4c.3 6.9 1.3 13.8 3.2 20.7c13.7 51.2 66.4 81.6 117.6 67.9s81.6-66.4 67.9-117.6c-11.1-41.5-47.8-69.4-88.6-71.1c-5.8-.2-9.2 6.1-7.4 11.7c2.1 6.4 3.3 13.2 3.3 20.3z"/></symbol>'
        + '<symbol id="acw-eye-slash" viewBox="0 0 640 512"><path d="M38.8 5.1C28.4-3.1 13.3-1.2 5.1 9.2S-1.2 34.7 9.2 42.9l592 464c10.4 8.2 25.5 6.3 33.7-4.1s6.3-25.5-4.1-33.7L525.6 386.7c39.6-40.6 66.4-86.1 79.9-118.4c3.3-7.9 3.3-16.7 0-24.6c-14.9-35.7-46.2-87.7-93-131.1C465.5 68.8 400.8 32 320 32c-68.2 0-125 26.3-169.3 60.8L38.8 5.1zM223 149.7c25.8-17.5 56.6-27.7 89-27.7c88.4 0 160 71.6 160 160c0 21.3-4.1 41.6-11.6 60.2L423 297.8c3.1-12.5 4.8-25.6 4.8-39.1c0-53-43-96-96-96c-5 0-9.9 .4-14.7 1c.7 6.3 1.1 12.7 1.1 19.2c0 10.4-.9 20.5-2.7 30.4L223 149.7zm-68.3 60.5L222 266.7c-3.7 11.5-5.7 23.8-5.7 36.6c0 88.4 71.6 160 160 160c22.8 0 44.5-4.8 64.1-13.3l-54.5-42.7c-2.9 .2-5.8 .3-8.7 .3c-53 0-96-43-96-96c0-7.5 .8-14.8 2.4-21.8L154.7 210.2z"/></symbol>'
        + '<symbol id="acw-bolt" viewBox="0 0 448 512"><path d="M349.4 44.6c5.9-13.7 1.5-29.7-10.6-38.5s-28.6-8-39.9 1.8l-256 224c-10 8.8-13.6 22.9-8.9 35.3S50.7 288 64 288H175.5L98.6 467.4c-5.9 13.7-1.5 29.7 10.6 38.5s28.6 8 39.9-1.8l256-224c10-8.8 13.6-22.9 8.9-35.3s-16.6-20.7-30-20.7H272.5L349.4 44.6z"/></symbol>'
        + '<symbol id="acw-brain" viewBox="0 0 512 512"><path d="M184 0c30.9 0 56 25.1 56 56V456c0 30.9-25.1 56-56 56c-28.9 0-52.7-21.9-55.7-50.1C104.2 409.5 96 388.4 96 368c0-15.1 3.5-29.4 9.7-42.2C96.7 313.4 64 280.4 64 240c0-35.3 28.7-64 64-64V168c0-35.3 28.7-64 64-64c9.4-4.1 17.4-11.4 22.1-21C214.5 83.1 215 82 215.1 80.9C210.2 71.4 208 60.6 208 48V32c0-17.7-14.3-32-32-32H168C155.8 0 145.1 5.4 138.1 14L104 56 69.9 14C62.9 5.4 52.2 0 40 0H32C14.3 0 0 14.3 0 32V480c0 17.7 14.3 32 32 32H40c12.2 0 22.9-5.4 29.9-14L104 456l34.1 42c7 8.6 17.7 14 29.9 14H184zM328 0c30.9 0 56 25.1 56 56V456c0 30.9-25.1 56-56 56c-28.9 0-52.7-21.9-55.7-50.1C248.2 409.5 240 388.4 240 368c0-15.1 3.5-29.4 9.7-42.2C240.7 313.4 208 280.4 208 240c0-35.3 28.7-64 64-64V168c0-35.3 28.7-64 64-64c9.4-4.1 17.4-11.4 22.1-21C358.5 83.1 359 82 359.1 80.9C354.2 71.4 352 60.6 352 48V32c0-17.7-14.3-32-32-32H312c-12.2 0-22.9 5.4-29.9 14L248 56 213.9 14C206.9 5.4 196.2 0 184 0H176c-17.7 0-32 14.3-32 32V480c0 17.7 14.3 32 32 32H184z"/></symbol>'
        + '<symbol id="acw-puzzle-piece" viewBox="0 0 512 512"><path d="M192 104.8c0-9.2-5.8-17.3-13.2-22.8C167.2 73.3 160 61.3 160 48c0-26.5 21.5-48 48-48s48 21.5 48 48c0 13.3-7.2 25.3-18.8 34c-7.4 5.4-13.2 13.5-13.2 22.8c0 12.3 10 22.8 22.8 22.8H336c17.7 0 32 14.3 32 32v57.6c0 12.3 10.4 22.8 22.8 22.8c9.2 0 17.3-5.8 22.8-13.2c8.7-11.6 20.7-18.8 34-18.8c26.5 0 48 21.5 48 48s-21.5 48-48 48c-13.3 0-25.3-7.2-34-18.8c-5.4-7.4-13.5-13.2-22.8-13.2c-12.3 0-22.8 10.4-22.8 22.8V432c0 17.7-14.3 32-32 32H257.7c-12.3 0-22.8-10-22.8-22.8c0-9.2 5.8-17.3 13.2-22.8c11.6-8.7 18.8-20.7 18.8-34c0-26.5-21.5-48-48-48s-48 21.5-48 48c0 13.3 7.2 25.3 18.8 34c7.4 5.4 13.2 13.5 13.2 22.8c0 12.3-10.4 22.8-22.8 22.8H144c-17.7 0-32-14.3-32-32V375.7c0-12.3-10-22.8-22.8-22.8c-9.2 0-17.3 5.8-22.8 13.2C57.3 377.9 45.3 385 32 385c-26.5 0-48-21.5-48-48s21.5-48 48-48c13.3 0 25.3 7.2 34 18.8c5.4 7.4 13.5 13.2 22.8 13.2c12.3 0 22.8-10.4 22.8-22.8V240c0-17.7 14.3-32 32-32H169.2c12.3 0 22.8-10 22.8-22.8z"/></symbol>'
        + '<symbol id="acw-keyboard" viewBox="0 0 576 512"><path d="M64 64C28.7 64 0 92.7 0 128V384c0 35.3 28.7 64 64 64H512c35.3 0 64-28.7 64-64V128c0-35.3-28.7-64-64-64H64zm16 96h32c8.8 0 16 7.2 16 16v32c0 8.8-7.2 16-16 16H80c-8.8 0-16-7.2-16-16V176c0-8.8 7.2-16 16-16zm0 96h32c8.8 0 16 7.2 16 16v32c0 8.8-7.2 16-16 16H80c-8.8 0-16-7.2-16-16V272c0-8.8 7.2-16 16-16zm16 96h64c8.8 0 16 7.2 16 16v32c0 8.8-7.2 16-16 16H96c-8.8 0-16-7.2-16-16V368c0-8.8 7.2-16 16-16zM160 176c0-8.8 7.2-16 16-16h32c8.8 0 16 7.2 16 16v32c0 8.8-7.2 16-16 16H176c-8.8 0-16-7.2-16-16V176zm16 80h32c8.8 0 16 7.2 16 16v32c0 8.8-7.2 16-16 16H176c-8.8 0-16-7.2-16-16V272c0-8.8 7.2-16 16-16zm80-80h32c8.8 0 16 7.2 16 16v32c0 8.8-7.2 16-16 16H256c-8.8 0-16-7.2-16-16V176c0-8.8 7.2-16 16-16zm16 80h32c8.8 0 16 7.2 16 16v32c0 8.8-7.2 16-16 16H272c-8.8 0-16-7.2-16-16V272c0-8.8 7.2-16 16-16zm-16 96h128c8.8 0 16 7.2 16 16v32c0 8.8-7.2 16-16 16H256c-8.8 0-16-7.2-16-16V368c0-8.8 7.2-16 16-16zm96-176h32c8.8 0 16 7.2 16 16v32c0 8.8-7.2 16-16 16H352c-8.8 0-16-7.2-16-16V176c0-8.8 7.2-16 16-16zm16 80h32c8.8 0 16 7.2 16 16v32c0 8.8-7.2 16-16 16H368c-8.8 0-16-7.2-16-16V272c0-8.8 7.2-16 16-16zm-16 96h64c8.8 0 16 7.2 16 16v32c0 8.8-7.2 16-16 16H352c-8.8 0-16-7.2-16-16V368c0-8.8 7.2-16 16-16zM432 176h32c8.8 0 16 7.2 16 16v32c0 8.8-7.2 16-16 16H432c-8.8 0-16-7.2-16-16V176c0-8.8 7.2-16 16-16zm16 80h32c8.8 0 16 7.2 16 16v32c0 8.8-7.2 16-16 16H448c-8.8 0-16-7.2-16-16V272c0-8.8 7.2-16 16-16zm16 96h32c8.8 0 16 7.2 16 16v32c0 8.8-7.2 16-16 16H464c-8.8 0-16-7.2-16-16V368c0-8.8 7.2-16 16-16z"/></symbol>'
        + '<symbol id="acw-low-vision" viewBox="0 0 640 512"><path d="M38.8 5.1C28.4-3.1 13.3-1.2 5.1 9.2S-1.2 34.7 9.2 42.9l592 464c10.4 8.2 25.5 6.3 33.7-4.1s6.3-25.5-4.1-33.7l-87.9-68.9C591.5 394.3 630 349.6 656.8 308.2c3.3-5.2 3.5-11.8 .4-17.2C629.6 238.3 573.6 176 496 136.9c-34.7-17.9-72.9-28.6-112-31.6l-36-28.2C319.8 63.3 289.1 56 256 56C149.6 56 57.9 115.1 14.8 202.6c-4.1 8.4-3.3 18.4 2.1 26C32.5 249.4 50.3 271.5 72 291.2L38.8 5.1zM576 256c0 26.8-9.3 51.5-24.6 71.1l-37-29C527.9 283.5 528 269.9 528 256c0-88.4-71.6-160-160-160c-10.5 0-20.7 1-30.6 3L298.5 75.5C316.7 70 335.6 68 356 68c88.4 0 160 71.6 160 160zM256 368c-61.9 0-113.3-43.3-126.3-101.3L51.4 204.1C33 226.7 17.5 251.2 5.2 277.1c-2.4 5.1-2.4 11 0 16.1C29.7 347.1 94.9 432 192 432c35.3 0 68.2-10.4 96.3-28.3L242.2 368H256z"/></symbol>'
        + '<symbol id="acw-font" viewBox="0 0 448 512"><path d="M254 52.8C249.3 40.3 237.3 32 224 32s-25.3 8.3-30 20.8L57.8 416H32c-17.7 0-32 14.3-32 32s14.3 32 32 32h96c17.7 0 32-14.3 32-32s-14.3-32-32-32h-1.8l48-128H272l48 128H320c-17.7 0-32 14.3-32 32s14.3 32 32 32h96c17.7 0 32-14.3 32-32s-14.3-32-32-32H390.2L254 52.8zm22.4 224H171.6L224 155.2l52.4 121.6z"/></symbol>'
        + '<symbol id="acw-heading" viewBox="0 0 448 512"><path d="M0 64C0 46.3 14.3 32 32 32H80h48c17.7 0 32 14.3 32 32s-14.3 32-32 32H112V208H336V96H320c-17.7 0-32-14.3-32-32s14.3-32 32-32h48 48c17.7 0 32 14.3 32 32s-14.3 32-32 32H400V240 416h16c17.7 0 32 14.3 32 32s-14.3 32-32 32H368 320c-17.7 0-32-14.3-32-32s14.3-32 32-32h16V272H112V416h16c17.7 0 32 14.3 32 32s-14.3 32-32 32H80 32c-17.7 0-32-14.3-32-32s14.3-32 32-32H48V240 96H32C14.3 96 0 81.7 0 64z"/></symbol>'
        + '<symbol id="acw-link" viewBox="0 0 640 512"><path d="M579.8 267.7c56.5-56.5 56.5-148 0-204.5c-50-50-128.8-56.5-186.3-15.4l-1.6 1.1c-14.4 10.3-17.7 30.3-7.4 44.6s30.3 17.7 44.6 7.4l1.6-1.1c32.1-22.9 76-19.3 103.8 8.6c31.5 31.5 31.5 82.5 0 114L422.3 334.8c-31.5 31.5-82.5 31.5-114 0c-27.9-27.9-31.5-71.8-8.6-103.8l1.1-1.6c10.3-14.4 6.9-34.4-7.4-44.6s-34.4-6.9-44.6 7.4l-1.1 1.6C206.5 251.2 213 330 263 380c56.5 56.5 148 56.5 204.5 0L579.8 267.7zM60.2 244.3c-56.5 56.5-56.5 148 0 204.5c50 50 128.8 56.5 186.3 15.4l1.6-1.1c14.4-10.3 17.7-30.3 7.4-44.6s-30.3-17.7-44.6-7.4l-1.6 1.1c-32.1 22.9-76 19.3-103.8-8.6C74 372.1 74 321.1 105.5 289.6L217.7 177.4c31.5-31.5 82.5-31.5 114 0c27.9 27.9 31.5 71.8 8.6 103.8l-1.1 1.6c-10.3 14.4-6.9 34.4 7.4 44.6s34.4 6.9 44.6-7.4l1.1-1.6C433.5 260.8 427 182 377 132c-56.5-56.5-148-56.5-204.5 0L60.2 244.3z"/></symbol>'
        + '<symbol id="acw-search-plus" viewBox="0 0 512 512"><path d="M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376c-34.4 25.2-76.8 40-122.7 40C93.1 416 0 322.9 0 208S93.1 0 208 0S416 93.1 416 208zM184 296c0 13.3 10.7 24 24 24s24-10.7 24-24V232h64c13.3 0 24-10.7 24-24s-10.7-24-24-24H232V120c0-13.3-10.7-24-24-24s-24 10.7-24 24v64H120c-13.3 0-24 10.7-24 24s10.7 24 24 24h64v64z"/></symbol>'
        + '<symbol id="acw-expand-arrows-alt" viewBox="0 0 512 512"><path d="M278.6 9.4c-12.5-12.5-32.8-12.5-45.3 0l-64 64c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l9.4-9.4V224H109.3l9.4-9.4c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-64 64c-12.5 12.5-12.5 32.8 0 45.3l64 64c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3l-9.4-9.4H224V402.7l-9.4-9.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l64 64c12.5 12.5 32.8 12.5 45.3 0l64-64c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-9.4 9.4V288H402.7l-9.4 9.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l64-64c12.5-12.5 12.5-32.8 0-45.3l-64-64c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l9.4 9.4H288V109.3l9.4 9.4c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3l-64-64z"/></symbol>'
        + '<symbol id="acw-text-height" viewBox="0 0 576 512"><path d="M151.1 57.6C148.4 49.7 140.9 44.4 132.5 44s-15.9 4.1-18.9 11.8L8.8 330.3c-4.9 12.9 1.6 27.4 14.5 32.3s27.4-1.6 32.3-14.5L90.7 288H168l-8.2 21.7c-4.9 12.9 1.6 27.4 14.5 32.3s27.4-1.6 32.3-14.5L224 233.3 151.1 57.6zm-22.4 166.4H73.1l37.5-99.6 18.1 48-1.9 5 1.9 46.6zM384 32c0-17.7-14.3-32-32-32s-32 14.3-32 32V480c0 17.7 14.3 32 32 32s32-14.3 32-32V32zM543 97l-63-63c-12.5-12.5-32.8-12.5-45.3 0l-63 63c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L448 111.3V400.7L417.4 369.7c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l63 63c12.5 12.5 32.8 12.5 45.3 0l63-63c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L480 400.7V111.3l30.7 30.1c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3z"/></symbol>'
        + '<symbol id="acw-arrows-alt-v" viewBox="0 0 320 512"><path d="M182.6 9.4c-12.5-12.5-32.8-12.5-45.3 0l-128 128c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L128 109.3V402.7L54.6 329.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l128 128c12.5 12.5 32.8 12.5 45.3 0l128-128c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 402.7V109.3l73.4 73.4c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3l-128-128z"/></symbol>'
        + '<symbol id="acw-text-width" viewBox="0 0 512 512"><path d="M28.9 64C46.6 64 64 71.2 77 83.8L128 133.7V64c0-17.7 14.3-32 32-32s32 14.3 32 32V192c0 17.7-14.3 32-32 32H32c-17.7 0-32-14.3-32-32s14.3-32 32-32h85.7L68 110.3C44.4 87.1 60.4 48 90.9 48zM448 448H64c-17.7 0-32 14.3-32 32s14.3 32 32 32H448c17.7 0 32-14.3 32-32s-14.3-32-32-32z"/></symbol>'
        + '<symbol id="acw-align-left" viewBox="0 0 448 512"><path d="M288 64c0 17.7-14.3 32-32 32H32C14.3 96 0 81.7 0 64S14.3 32 32 32H256c17.7 0 32 14.3 32 32zm0 256c0 17.7-14.3 32-32 32H32c-17.7 0-32-14.3-32-32s14.3-32 32-32H256c17.7 0 32 14.3 32 32zM0 192c0-17.7 14.3-32 32-32H416c17.7 0 32 14.3 32 32s-14.3 32-32 32H32c-17.7 0-32-14.3-32-32zM448 448c0 17.7-14.3 32-32 32H32c-17.7 0-32-14.3-32-32s14.3-32 32-32H416c17.7 0 32 14.3 32 32z"/></symbol>'
        + '<symbol id="acw-align-center" viewBox="0 0 448 512"><path d="M352 64c0-17.7-14.3-32-32-32H128c-17.7 0-32 14.3-32 32s14.3 32 32 32H320c17.7 0 32-14.3 32-32zm96 128c0-17.7-14.3-32-32-32H32c-17.7 0-32 14.3-32 32s14.3 32 32 32H416c17.7 0 32-14.3 32-32zM0 448c0 17.7 14.3 32 32 32H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H32c-17.7 0-32 14.3-32 32zM352 320c0-17.7-14.3-32-32-32H128c-17.7 0-32 14.3-32 32s14.3 32 32 32H320c17.7 0 32-14.3 32-32z"/></symbol>'
        + '<symbol id="acw-align-right" viewBox="0 0 448 512"><path d="M448 64c0 17.7-14.3 32-32 32H192c-17.7 0-32-14.3-32-32s14.3-32 32-32H416c17.7 0 32 14.3 32 32zm0 256c0 17.7-14.3 32-32 32H192c-17.7 0-32-14.3-32-32s14.3-32 32-32H416c17.7 0 32 14.3 32 32zM0 192c0-17.7 14.3-32 32-32H416c17.7 0 32 14.3 32 32s-14.3 32-32 32H32c-17.7 0-32-14.3-32-32zM448 448c0 17.7-14.3 32-32 32H32c-17.7 0-32-14.3-32-32s14.3-32 32-32H416c17.7 0 32 14.3 32 32z"/></symbol>'
        + '<symbol id="acw-moon" viewBox="0 0 384 512"><path d="M223.5 32C100 32 0 132.3 0 256S100 480 223.5 480c60.6 0 115.5-24.2 155.8-63.4c5-4.9 6.3-12.5 3.1-18.7s-10.1-9.7-17-8.5c-9.8 1.7-19.8 2.6-30.1 2.6c-96.9 0-175.5-78.8-175.5-176c0-65.8 36-123.1 89.3-153.3c6.1-3.5 9.2-10.5 7.7-17.3s-7.3-11.9-14.3-12.5c-6.3-.5-12.6-.8-19-.8z"/></symbol>'
        + '<symbol id="acw-sun" viewBox="0 0 512 512"><path d="M361.5 1.2c5 2.1 8.6 6.6 9.6 11.9L391 121l107.9 19.8c5.3 1 9.8 4.6 11.9 9.6s1.5 10.7-1.6 15.2L446.9 256l62.3 90.3c3.1 4.5 3.7 10.2 1.6 15.2s-6.6 8.6-11.9 9.6L391 391 371.1 498.9c-1 5.3-4.6 9.8-9.6 11.9s-10.7 1.5-15.2-1.6L256 446.9l-90.3 62.3c-4.5 3.1-10.2 3.7-15.2 1.6s-8.6-6.6-9.6-11.9L121 391 13.1 371.1c-5.3-1-9.8-4.6-11.9-9.6s-1.5-10.7 1.6-15.2L65.1 256 2.8 165.7c-3.1-4.5-3.7-10.2-1.6-15.2s6.6-8.6 11.9-9.6L121 121 140.9 13.1c1-5.3 4.6-9.8 9.6-11.9s10.7-1.5 15.2 1.6L256 65.1 346.3 2.8c4.5-3.1 10.2-3.7 15.2-1.6zM160 256a96 96 0 1 1 192 0 96 96 0 1 1 -192 0zm224 0a128 128 0 1 0 -256 0 128 128 0 1 0 256 0z"/></symbol>'
        + '<symbol id="acw-adjust" viewBox="0 0 512 512"><path d="M448 256c0-106-86-192-192-192V448c106 0 192-86 192-192zM0 256a256 256 0 1 1 512 0A256 256 0 1 1 0 256z"/></symbol>'
        + '<symbol id="acw-fire" viewBox="0 0 448 512"><path d="M159.3 5.4c7.8-7.3 19.9-7.2 27.7 .1c27.6 25.9 53.5 52.8 67.3 68.2c16.8-11.2 31.1-23.7 43.1-36.6c4-4.3 9.6-7.1 15.6-6.9c6 .2 11.5 3.3 15.2 8.1C348.4 88.3 360 128.1 360 190.3c0 28-4.4 56-14.7 81.9c-8.3 21.4-20.9 41.3-37.8 58.8L304 336c0 0 0 0 0 0c-.2-.1-.2-.2-.3-.3c7.6-23.3 14-46.1 16.7-68.9c.3-3 .7-5.9 .7-8.8c0-34.6-12.2-62.5-27.8-86.1c-.3 2.8-.7 5.6-1.2 8.4c-3.5 20.7-11.7 39.7-22.3 56.9L256 240c0 0 0 0 0 0l-16.1 25.4C231.1 281 224 298.9 224 318.3c0 47.8 31.2 69.6 47.2 81.7c7.4 5.6 9.3 16 4.3 23.7C259.7 444.4 229.8 464 192 464c-70.7 0-128-57.3-128-128c0-41.8 13.8-67 33.9-90.7c4.2-5 8.4-9.9 12.4-14.6c-1.1 1.3-2.2 2.6-3.2 3.9c-13 16-20.7 35.2-25.2 54.5c-4.5 19.3-5.9 39.5-5.9 58.9C75.9 361.6 85.1 384 96 400c15.1 22.9 25.7 46.4 25.7 72c0 7.6-.8 14.9-2.4 22.2c-3.7 17-18.9 27.8-36 27.8c-35.3 0-64-28.7-64-64c0-42.1 20.5-75.2 38.4-104c3.7-6.1 7.3-12.1 10.7-18C91.7 313.1 96 288.5 96 258.8c0-74.5-45.1-129.4-79.5-171.4c-3.5-4.2-6.5-9.2-7.5-14.8c-1-5.7 .5-11.8 4.7-15.8z"/></symbol>'
        + '<symbol id="acw-water" viewBox="0 0 384 512"><path d="M192 512C86 512 0 426 0 320C0 228.8 130.2 57.7 166.6 11.7C172.6 4.2 181.5 0 191 0l1 0c9.5 0 18.4 4.2 24.4 11.7C261.8 57.7 384 228.8 384 320c0 106-86 192-192 192z"/></symbol>'
        + '<symbol id="acw-palette" viewBox="0 0 512 512"><path d="M512 256c0 .9 0 1.8 0 2.7c-.4 36.5-33.6 61.3-70.1 61.3H344c-26.5 0-48 21.5-48 48c0 3.4 .4 6.7 1 9.9c2.1 10.2 6.5 20 10.8 29.9c6.1 13.8 12.1 27.5 12.1 42c0 31.8-21.6 60.4-53.4 62c-3.5 .2-7 .2-10.6 .2C114.6 512 0 397.4 0 256S114.6 0 256 0S512 114.6 512 256zM128 288a32 32 0 1 0 -64 0 32 32 0 1 0 64 0zm0-96a32 32 0 1 0 0-64 32 32 0 1 0 0 64zM288 96a32 32 0 1 0 -64 0 32 32 0 1 0 64 0zm96 96a32 32 0 1 0 0-64 32 32 0 1 0 0 64z"/></symbol>'
        + '<symbol id="acw-volume-mute" viewBox="0 0 576 512"><path d="M301.1 34.8C312.6 40 320 51.4 320 64V448c0 12.6-7.4 24-18.9 29.2s-25 3.1-34.4-5.3L131.8 352H64c-35.3 0-64-28.7-64-64V224c0-35.3 28.7-64 64-64h67.8L266.7 40.1c9.4-8.4 22.9-10.4 34.4-5.3zM425 167l55 55 55-55c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9l-55 55 55 55c9.4 9.4 9.4 24.6 0 33.9s-24.6 9.4-33.9 0l-55-55-55 55c-9.4 9.4-24.6 9.4-33.9 0s-9.4-24.6 0-33.9l55-55-55-55c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0z"/></symbol>'
        + '<symbol id="acw-image" viewBox="0 0 512 512"><path d="M0 96C0 60.7 28.7 32 64 32H448c35.3 0 64 28.7 64 64V416c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V96zM323.8 202.5c-4.5-6.6-11.9-10.5-19.8-10.5s-15.4 3.9-19.8 10.5l-87 127.6L170.7 297c-4.6-5.7-11.5-9-18.7-9s-14.2 3.3-18.7 9l-64 80c-5.8 7.2-6.9 17.1-2.9 25.4s12.4 13.6 21.6 13.6h96 32H424c8.9 0 17.1-4.9 21.2-12.8s3.6-17.4-1.4-24.7l-120-176zM112 192a48 48 0 1 0 0-96 48 48 0 1 0 0 96z"/></symbol>'
        + '<symbol id="acw-book-open" viewBox="0 0 576 512"><path d="M249.6 471.5c10.8 3.8 22.4-4.1 22.4-15.5V78.6c0-4.2-1.6-8.4-5-11C247.4 52 202.4 32 144 32C93.5 32 46.3 45.3 18.1 56.1C6.8 60.5 0 71.7 0 83.8V454.1c0 11.9 12.8 20.2 24.1 16.5C55.6 460.1 105.5 448 144 448c33.9 0 79 14 105.6 23.5zm76.8 0C353 462 398.1 448 432 448c38.5 0 88.4 12.1 119.9 22.6c11.3 3.8 24.1-4.6 24.1-16.5V83.8c0-12.1-6.8-23.3-18.1-27.6C529.7 45.3 482.5 32 432 32c-58.4 0-103.4 20-123 45.6c-3.3 2.6-5 6.8-5 11V456c0 11.4 11.7 19.3 22.4 15.5z"/></symbol>'
        + '<symbol id="acw-grip-lines" viewBox="0 0 448 512"><path d="M32 288c-17.7 0-32 14.3-32 32s14.3 32 32 32H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H32zm0-128c-17.7 0-32 14.3-32 32s14.3 32 32 32H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H32z"/></symbol>'
        + '<symbol id="acw-ban" viewBox="0 0 512 512"><path d="M367.2 412.5L99.5 144.8C77.1 176.1 64 214.5 64 256c0 106 86 192 192 192c41.5 0 79.9-13.1 111.2-35.5zm45.3-45.3C434.9 335.9 448 297.5 448 256c0-106-86-192-192-192c-41.5 0-79.9 13.1-111.2 35.5L412.5 367.2zM0 256a256 256 0 1 1 512 0A256 256 0 1 1 0 256z"/></symbol>'
        + '<symbol id="acw-mask" viewBox="0 0 576 512"><path d="M288 64C176 64 64 80 64 80V256c0 106 224 192 224 192s224-86 224-192V80s-112-16-224-16zM96 256V109.3C121.3 103.5 199.8 96 288 96s166.7 7.5 192 13.3V256c0 35.5-39 81.8-80 113.4c-33.3 26.1-79.6 52.8-112 63.5c-32.4-10.7-78.7-37.4-112-63.5C134.9 337.8 96 291.5 96 256z"/></symbol>'
        + '<symbol id="acw-mouse-pointer" viewBox="0 0 320 512"><path d="M0 55.2V426c0 12.2 9.9 22 22 22c6.3 0 12.4-2.7 16.6-7.5L121.2 346l58.1 116.3c7.9 15.8 27.1 22.2 42.9 14.3s22.2-27.1 14.3-42.9L194.2 318H320c12.2 0 22.1-9.9 22.1-22.1c0-6.3-2.7-12.3-7.5-16.5L38.6 38.9C34.3 35.1 28.8 33 23 33C10.3 33 0 43.3 0 56z"/></symbol>'
        + '<symbol id="acw-crosshairs" viewBox="0 0 512 512"><path d="M256 0c17.7 0 32 14.3 32 32V42.4c93.7 13.9 167.7 88 181.6 181.6H480c17.7 0 32 14.3 32 32s-14.3 32-32 32H469.6C455.7 381.6 381.7 455.7 288 469.6V480c0 17.7-14.3 32-32 32s-32-14.3-32-32V469.6C130.3 455.7 56.3 381.6 42.4 288H32c-17.7 0-32-14.3-32-32s14.3-32 32-32H42.4C56.3 130.4 130.3 56.3 224 42.4V32c0-17.7 14.3-32 32-32zM107.4 288c12.5 58.3 58.4 104.1 116.6 116.6V368c0-17.7 14.3-32 32-32s32 14.3 32 32v36.6c58.3-12.5 104.1-58.4 116.6-116.6H368c-17.7 0-32-14.3-32-32s14.3-32 32-32h36.6C392.1 165.7 346.3 119.9 288 107.4V144c0 17.7-14.3 32-32 32s-32-14.3-32-32V107.4C165.7 119.9 119.9 165.7 107.4 224H144c17.7 0 32 14.3 32 32s-14.3 32-32 32H107.4zM256 224a32 32 0 1 1 0 64 32 32 0 1 1 0-64z"/></symbol>'
        + '<symbol id="acw-hand-pointer" viewBox="0 0 448 512"><path d="M128 40c0-22.1 17.9-40 40-40s40 17.9 40 40V188.2c8.5-7.6 19.7-12.2 32-12.2c20.6 0 38.2 13 45 31.2c8.5-9.2 20.6-15 34.1-15c17.7 0 33 9.6 41.4 24c8.5-3.6 17.9-5.6 27.8-5.6c35.3 0 64 28.7 64 64V360c0 80-64 152-160 152H240c-79.5 0-144-64.5-144-144l0-88 0-72c0-22.1 17.9-40 40-40s40 17.9 40 40v16H168V40zM16 168C7.2 168 0 160.8 0 152C0 143.2 7.2 136 16 136H128c8.8 0 16 7.2 16 16c0 8.8-7.2 16-16 16H16zm0-96C7.2 72 0 64.8 0 56C0 47.2 7.2 40 16 40H112c8.8 0 16 7.2 16 16c0 8.8-7.2 16-16 16H16z"/></symbol>'
        + '</svg>';
      document.body.insertBefore(div, document.body.firstChild);
    },

    injectDynamicStyle: function () {
      if (document.getElementById(DYNAMIC_STYLE_ID)) return;
      var style    = document.createElement('style');
      style.id     = DYNAMIC_STYLE_ID;
      document.head.appendChild(style);
    },

    /* Load assets/html/panel.html via XHR; calls callback(html) or callback(null) on failure */
    _loadPanel: function (callback) {
      var url      = _scriptDir + '../html/panel.html';
      var done     = false;
      var fallback = function () { if (!done) { done = true; callback(null); } };
      try {
        var xhr       = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.timeout   = 3000;
        xhr.onreadystatechange = function () {
          if (done || xhr.readyState !== 4) return;
          done = true;
          callback(xhr.status === 200 ? xhr.responseText : null);
        };
        xhr.onerror   = fallback;
        xhr.ontimeout = fallback;
        xhr.send();
      } catch (e) { fallback(); }
    },

    /* Complete initialisation once HTML (partial or inline fallback) is available */
    _finishInit: function (partialHTML) {
      this.injectHTML(partialHTML);
      this.bindEvents();
      this.applyAllSettings();
      var wrap = document.getElementById(WRAP_ID);
      if (wrap) {
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            wrap.classList.remove('acw-loading');
          });
        });
      }
    },

    injectHTML: function (partialHTML) {
      var wrap       = document.createElement('div');
      wrap.id        = WRAP_ID;
      wrap.className = 'acw-wrap acw-loading';
      wrap.innerHTML = partialHTML || this._buildHTML();
      document.body.appendChild(wrap);
    },

    /* ─── 04c. HTML BUILDING ─────────────────────────────────────────────── */
    _buildHTML: function () {
      return [

        /* ── Logo Trigger ── */
        '<button class="acw-logo-trigger" id="acw-logo-trigger"',
        ' aria-label="Open Accessibility Widget"',
        ' aria-expanded="false"',
        ' aria-controls="acw-panel"',
        ' tabindex="0">',
          '<svg class="acw-icon" aria-hidden="true"><use href="#acw-universal-access"></use></svg>',
          '<span class="acw-logo-trigger-label">Access</span>',
        '</button>',

        /* Show-again restore button */
        '<button class="acw-show-again" id="acw-show-again"',
        ' aria-label="Show accessibility widget">',
          '<svg class="acw-icon" aria-hidden="true"><use href="#acw-universal-access"></use></svg>',
        '</button>',

        /* Overlay */
        '<div class="acw-overlay" id="acw-overlay" aria-hidden="true"></div>',

        /* ── Panel ── */
        '<div class="acw-panel" id="acw-panel"',
        ' role="dialog"',
        ' aria-modal="true"',
        ' aria-labelledby="acw-panel-title"',
        ' aria-hidden="true">',

          /* Panel Header — navy: X | Accessibility | reset */
          '<div class="acw-panel-header" role="banner">',
            '<button class="acw-close" id="acw-close"',
            ' aria-label="Close Accessibility Panel">',
              '<svg class="acw-icon" aria-hidden="true"><use href="#acw-times"></use></svg>',
            '</button>',
            '<h2 class="acw-panel-title" id="acw-panel-title">Accessibility</h2>',
            '<button class="acw-header-reset" id="acw-header-reset"',
            ' aria-label="Reset all accessibility settings">',
              '<svg class="acw-icon" aria-hidden="true"><use href="#acw-undo-alt"></use></svg>',
            '</button>',
          '</div>',

          /* Top Controls — 3 pill buttons */
          '<div class="acw-top-controls" role="toolbar" aria-label="Widget controls">',
            '<button class="acw-top-btn acw-top-btn--reset" id="acw-reset"',
            ' aria-label="Reset all accessibility settings">',
              '<svg class="acw-icon" aria-hidden="true"><use href="#acw-undo-alt"></use></svg>',
              '<span>Reset Settings</span>',
            '</button>',
            '<button class="acw-top-btn acw-top-btn--statement" id="acw-statement-btn"',
            ' aria-label="View accessibility statement"',
            ' aria-haspopup="dialog">',
              '<svg class="acw-icon" aria-hidden="true"><use href="#acw-eye"></use></svg>',
              '<span>Statement</span>',
            '</button>',
            '<button class="acw-top-btn acw-top-btn--hide" id="acw-hide-btn"',
            ' aria-label="Close accessibility interface">',
              '<svg class="acw-icon" aria-hidden="true"><use href="#acw-eye-slash"></use></svg>',
              '<span>Hide Interface</span>',
            '</button>',
          '</div>',

          /* Panel Body — single scrollable area */
          '<div class="acw-panel-body">',

            /* — Profiles — */
            '<div class="acw-section-header">Choose the right accessibility profile</div>',
            this._buildProfiles(),

            /* — Content Adjustments — */
            '<div class="acw-section-header">Content Adjustments</div>',
            this._buildContentCards(),

            /* — Color Adjustments — */
            '<div class="acw-section-header">Color Adjustments</div>',
            this._buildColorSection(),

            /* — Orientation Adjustments — */
            '<div class="acw-section-header">Orientation Adjustments</div>',
            this._buildOrientationGrid(),

          '</div>', /* end panel-body */

          /* Footer bar */
          '<div class="acw-panel-footer-bar">Accessibility Widget</div>',

        '</div>', /* end panel */

        /* Accessibility Statement Modal */
        this._buildStatementModal(),

        /* Screen reader live region */
        '<div class="acw-sr-only" id="acw-live" aria-live="polite" aria-atomic="true"></div>',

      ].join('');
    },

    /* ── Profiles list (toggle rows) ── */
    _buildProfiles: function () {
      var profiles = [
        { key: 'seizure-safe',    label: 'Seizure Safe Profile',        desc: 'Clear flashes &amp; reduces color',   icon: 'acw-bolt'         },
        { key: 'vision-impaired', label: 'Vision Impaired Profile',     desc: 'Enhances website\'s visuals',         icon: 'acw-eye'          },
        { key: 'adhd',            label: 'ADHD Friendly Profile',       desc: 'More focus &amp; fewer distractions', icon: 'acw-brain'        },
        { key: 'cognitive',       label: 'Cognitive Disability Profile', desc: 'Assists reading &amp; focusing',      icon: 'acw-puzzle-piece' },
        { key: 'keyboard-nav',    label: 'Keyboard Navigation',         desc: 'Use website with the keyboard',       icon: 'acw-keyboard'     },
        { key: 'blind',           label: 'Blind Users (Screen Reader)', desc: 'Optimize for screen-readers',         icon: 'acw-low-vision'   },
      ];
      var html = '<div class="acw-profiles-list" role="radiogroup" aria-label="Accessibility profiles">';
      profiles.forEach(function (p) {
        html += '<button class="acw-profile-btn" data-profile="' + p.key + '"' +
                ' role="radio" aria-checked="false" aria-label="' + p.label + '">' +
                '<span class="acw-toggle-switch" aria-hidden="true">' +
                  '<span class="acw-toggle-track"><span class="acw-toggle-thumb"></span></span>' +
                '</span>' +
                '<span class="acw-profile-info">' +
                  '<span class="acw-profile-name">' + p.label + '</span>' +
                  '<span class="acw-profile-desc">' + p.desc + '</span>' +
                '</span>' +
                '<span class="acw-profile-icon" aria-hidden="true">' +
                  '<svg class="acw-icon"><use href="#' + p.icon + '"></use></svg>' +
                '</span>' +
                '</button>';
      });
      html += '</div>';
      return html;
    },

    /* ── Content section: all cards in one 2-col grid (steppers + toggles + align) ── */
    _buildContentCards: function () {
      var html = '<div class="acw-feature-grid">';

      /* Content Scaling — stepper inside card */
      html += '<div class="acw-feature-card acw-feature-card--stepper">' +
              '<svg class="acw-icon" aria-hidden="true"><use href="#acw-expand-arrows-alt"></use></svg>' +
              '<span class="acw-card-label">Content Scaling</span>' +
              '<div class="acw-card-stepper" role="group" aria-labelledby="acw-label-scale">' +
                '<button class="acw-step-btn" data-action="scale-down" aria-label="Decrease content scale">&#8722;</button>' +
                '<span class="acw-step-val" id="acw-scale-val" aria-live="polite" aria-atomic="true">Default</span>' +
                '<button class="acw-step-btn" data-action="scale-up" aria-label="Increase content scale">+</button>' +
              '</div>' +
              '</div>';

      /* Toggle feature cards */
      var toggles = [
        { key: 'readableFont',    icon: 'acw-font',        label: 'Readable Font'    },
        { key: 'highlightTitles', icon: 'acw-heading',     label: 'Highlight Titles' },
        { key: 'highlightLinks',  icon: 'acw-link',        label: 'Highlight Links'  },
        { key: 'textMagnifier',   icon: 'acw-search-plus', label: 'Text Magnifier'   },
      ];
      toggles.forEach(function (c) {
        html += '<button class="acw-feature-card" data-toggle="' + c.key + '"' +
                ' role="switch" aria-checked="false" aria-label="' + c.label + '">' +
                '<svg class="acw-icon" aria-hidden="true"><use href="#' + c.icon + '"></use></svg>' +
                '<span class="acw-card-label">' + c.label + '</span>' +
                '</button>';
      });

      /* Font Size — stepper inside card */
      html += '<div class="acw-feature-card acw-feature-card--stepper">' +
              '<svg class="acw-icon" aria-hidden="true"><use href="#acw-text-height"></use></svg>' +
              '<span class="acw-card-label">Adjust Font Sizing</span>' +
              '<div class="acw-card-stepper" role="group" aria-labelledby="acw-label-font">' +
                '<button class="acw-step-btn" data-action="font-down" aria-label="Decrease font size">&#8722;</button>' +
                '<span class="acw-step-val" id="acw-font-val" aria-live="polite" aria-atomic="true">Default</span>' +
                '<button class="acw-step-btn" data-action="font-up" aria-label="Increase font size">+</button>' +
              '</div>' +
              '</div>';

      /* Line Height — stepper inside card */
      html += '<div class="acw-feature-card acw-feature-card--stepper">' +
              '<svg class="acw-icon" aria-hidden="true"><use href="#acw-arrows-alt-v"></use></svg>' +
              '<span class="acw-card-label">Adjust Line Height</span>' +
              '<div class="acw-card-stepper" role="group" aria-labelledby="acw-label-lh">' +
                '<button class="acw-step-btn" data-action="lh-down" aria-label="Decrease line height">&#8722;</button>' +
                '<span class="acw-step-val" id="acw-lh-val" aria-live="polite" aria-atomic="true">Default</span>' +
                '<button class="acw-step-btn" data-action="lh-up" aria-label="Increase line height">+</button>' +
              '</div>' +
              '</div>';

      /* Letter Spacing — stepper inside card */
      html += '<div class="acw-feature-card acw-feature-card--stepper">' +
              '<svg class="acw-icon" aria-hidden="true"><use href="#acw-text-width"></use></svg>' +
              '<span class="acw-card-label">Letter Spacing</span>' +
              '<div class="acw-card-stepper" role="group" aria-labelledby="acw-label-ls">' +
                '<button class="acw-step-btn" data-action="ls-down" aria-label="Decrease letter spacing">&#8722;</button>' +
                '<span class="acw-step-val" id="acw-ls-val" aria-live="polite" aria-atomic="true">Default</span>' +
                '<button class="acw-step-btn" data-action="ls-up" aria-label="Increase letter spacing">+</button>' +
              '</div>' +
              '</div>';

      /* Text Alignment — align group inside card */
      html += '<div class="acw-feature-card acw-feature-card--align">' +
              '<svg class="acw-icon" aria-hidden="true"><use href="#acw-align-left"></use></svg>' +
              '<span class="acw-card-label" id="acw-label-align">Text Alignment</span>' +
              '<div class="acw-align-group" role="group" aria-labelledby="acw-label-align">' +
                '<button class="acw-align-btn" data-align="left"   aria-label="Align left"   aria-pressed="false"><svg class="acw-icon" aria-hidden="true"><use href="#acw-align-left"></use></svg></button>' +
                '<button class="acw-align-btn" data-align="center" aria-label="Align center" aria-pressed="false"><svg class="acw-icon" aria-hidden="true"><use href="#acw-align-center"></use></svg></button>' +
                '<button class="acw-align-btn" data-align="right"  aria-label="Align right"  aria-pressed="false"><svg class="acw-icon" aria-hidden="true"><use href="#acw-align-right"></use></svg></button>' +
              '</div>' +
              '</div>';

      html += '</div>';
      return html;
    },

    /* ── Stepper rows — merged into _buildContentCards(); kept as no-op for back-compat ── */
    _buildStepperRows: function () { return ''; },

    /* ── Color filter cards — kept as helper used by _buildColorSection() ── */
    _buildColorFilterGrid: function () {
      var filters = [
        { key: 'dark-contrast',   label: 'Dark Contrast',   icon: 'acw-moon'    },
        { key: 'light-contrast',  label: 'Light Contrast',  icon: 'acw-sun'     },
        { key: 'high-contrast',   label: 'High Contrast',   icon: 'acw-adjust'  },
        { key: 'high-saturation', label: 'High Saturation', icon: 'acw-fire'    },
        { key: 'low-saturation',  label: 'Low Saturation',  icon: 'acw-water'   },
        { key: 'monochrome',      label: 'Monochrome',      icon: 'acw-palette' },
      ];
      var html = '<div class="acw-color-filter-tabs">';
      filters.forEach(function (f) {
        html += '<button class="acw-feature-card" data-filter="' + f.key + '"' +
                ' role="switch" aria-checked="false" aria-label="' + f.label + '">' +
                '<svg class="acw-icon" aria-hidden="true"><use href="#' + f.icon + '"></use></svg>' +
                '<span class="acw-card-label">' + f.label + '</span>' +
                '</button>';
      });
      html += '</div>';
      return html;
    },

    /* ── Color swatch section (8 circle presets) — helper used by _buildColorSection() ── */
    _buildColorSwatchSection: function (key, title) {
      var html = '<div class="acw-swatch-section">';
      html += '<span class="acw-swatch-title">' + title + '</span>';
      html += '<div class="acw-swatch-row">';
      COLOR_PRESETS.forEach(function (p) {
        var style = (p.color !== 'reset') ? ' style="background:' + p.color + '"' : '';
        var cls   = (p.color === 'reset')  ? ' acw-color-circle--reset' : '';
        html += '<button class="acw-color-circle' + cls + '"' +
                ' data-color-key="' + key + '"' +
                ' data-color="' + p.color + '"' +
                style +
                ' aria-label="Set ' + title.toLowerCase() + ' to ' + p.label + '">' +
                '</button>';
      });
      html += '</div></div>';
      return html;
    },

    /* ── Color section: filter tabs (full-width) above swatches (full-width) ── */
    _buildColorSection: function () {
      return this._buildColorFilterGrid() +
             '<div class="acw-color-swatches">' +
               this._buildColorSwatchSection('textColor',  'Adjust Text Colors') +
               this._buildColorSwatchSection('titleColor', 'Adjust Title Colors') +
             '</div>';
    },

    /* ── Orientation feature cards (8 toggles + 2 cursor cards) — 3-col grid ── */
    _buildOrientationGrid: function () {
      var cards = [
        { key: 'muteSounds',     icon: 'acw-volume-mute',   label: 'Mute Sounds'     },
        { key: 'hideImages',     icon: 'acw-image',         label: 'Hide Images'     },
        { key: 'readMode',       icon: 'acw-book-open',     label: 'Read Mode'       },
        { key: 'readingGuide',   icon: 'acw-grip-lines',    label: 'Reading Guide'   },
        { key: 'stopAnimations', icon: 'acw-ban',           label: 'Stop Animations' },
        { key: 'readingMask',    icon: 'acw-mask',          label: 'Reading Mask'    },
        { key: 'highlightHover', icon: 'acw-mouse-pointer', label: 'Highlight Hover' },
        { key: 'highlightFocus', icon: 'acw-crosshairs',    label: 'Highlight Focus' },
      ];
      var html = '<div class="acw-feature-grid acw-feature-grid--3col">';
      cards.forEach(function (c) {
        html += '<button class="acw-feature-card" data-toggle="' + c.key + '"' +
                ' role="switch" aria-checked="false" aria-label="' + c.label + '">' +
                '<svg class="acw-icon" aria-hidden="true"><use href="#' + c.icon + '"></use></svg>' +
                '<span class="acw-card-label">' + c.label + '</span>' +
                '</button>';
      });
      /* Cursor cards — mutually exclusive, not simple boolean */
      html += '<button class="acw-feature-card" data-cursor="big-black"' +
              ' role="switch" aria-checked="false" aria-label="Big Black Cursor">' +
              '<svg class="acw-icon" aria-hidden="true"><use href="#acw-mouse-pointer"></use></svg>' +
              '<span class="acw-card-label">Big Black Cursor</span></button>';
      html += '<button class="acw-feature-card" data-cursor="big-white"' +
              ' role="switch" aria-checked="false" aria-label="Big White Cursor">' +
              '<svg class="acw-icon" aria-hidden="true"><use href="#acw-hand-pointer"></use></svg>' +
              '<span class="acw-card-label">Big White Cursor</span></button>';
      html += '</div>';
      return html;
    },

    /* ── Accessibility Statement Modal ── */
    _buildStatementModal: function () {
      return [
        '<div class="acw-modal-overlay" id="acw-modal"',
        ' role="dialog" aria-modal="true"',
        ' aria-labelledby="acw-modal-title"',
        ' aria-hidden="true">',
          '<div class="acw-modal-box">',
            '<div class="acw-modal-header">',
              '<h2 class="acw-modal-title" id="acw-modal-title">Accessibility Statement</h2>',
              '<button class="acw-modal-close-btn" id="acw-modal-close" aria-label="Close accessibility statement">',
                '<svg class="acw-icon" aria-hidden="true"><use href="#acw-times"></use></svg>',
              '</button>',
            '</div>',
            '<div class="acw-modal-body">',
              '<h3>Our Commitment</h3>',
              '<p>We are committed to ensuring digital accessibility for people with disabilities. ',
              'We continually improve the user experience for everyone and apply relevant accessibility standards.</p>',
              '<h3>Conformance Status</h3>',
              '<p>We aim to conform to the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA.</p>',
              '<h3>Accessibility Features</h3>',
              '<ul>',
                '<li>Keyboard navigation support</li>',
                '<li>Screen reader compatibility</li>',
                '<li>Text resizing support</li>',
                '<li>High contrast mode</li>',
                '<li>Reduced motion support</li>',
                '<li>Alt text for images</li>',
                '<li>Semantic HTML structure</li>',
              '</ul>',
              '<h3>Known Limitations</h3>',
              '<p>Some third-party content may not meet full accessibility standards. ',
              'We are working to resolve these issues or provide alternatives.</p>',
              '<h3>Contact Us</h3>',
              '<ul>',
                '<li>Email: <a href="mailto:Example@example.com">Example@example.com</a></li>',
                '<li>Phone: +1 (555) 000-0000</li>',
              '</ul>',
              '<p><em>This statement was last updated on ' + new Date().getFullYear() + '.</em></p>',
            '</div>',
            '<div class="acw-modal-footer">',
              '<button class="acw-modal-ok-btn" id="acw-modal-ok">Close</button>',
            '</div>',
          '</div>',
        '</div>',
      ].join('');
    },

    /* ─── 04d. SETTINGS ──────────────────────────────────────────────────── */
    loadSettings: function () {
      /* No persistence — always start fresh on every page load / navigation */
      return this._cloneDefaults();
    },

    saveSettings: function () { /* no-op — settings are session-only, reset on page load */ },

    resetSettings: function () {
      this._teardownSideEffects();
      this.settings = this._cloneDefaults();
      this.saveSettings();
      this.applyAllSettings();
      this._syncUI();
      this.announce('All accessibility settings have been reset.');
    },

    _cloneDefaults: function () {
      var obj = {};
      for (var k in DEFAULTS) obj[k] = DEFAULTS[k];
      return obj;
    },

    /* ─── 04e. EVENT BINDING ─────────────────────────────────────────────── */
    bindEvents: function () {
      var self = this;
      var wrap = document.getElementById(WRAP_ID);

      /* Logo Trigger */
      var logoTrigger = document.getElementById('acw-logo-trigger');
      if (logoTrigger) {
        logoTrigger.addEventListener('click', function () { self.activate(); });
        logoTrigger.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); self.activate(); }
        });
      }

      /* Show Again */
      document.getElementById('acw-show-again').addEventListener('click', function () {
        self.settings.hidden = false;
        self.saveSettings();
        wrap.classList.remove('acw-hidden');
        self.announce('Accessibility widget is now visible.');
      });

      /* Close button */
      document.getElementById('acw-close').addEventListener('click', function () {
        self.deactivate();
      });

      /* Header reset button */
      document.getElementById('acw-header-reset').addEventListener('click', function () {
        self.resetSettings();
      });

      /* Overlay */
      document.getElementById('acw-overlay').addEventListener('click', function () {
        self.closePanel();
      });

      /* Escape key */
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
          var modal = document.getElementById('acw-modal');
          if (modal && modal.classList.contains('acw-modal-open')) {
            self.closeModal();
          } else if (self._panelOpen) {
            self.closePanel();
          }
        }
      });

      /* Reset button (top controls) */
      document.getElementById('acw-reset').addEventListener('click', function () {
        self.resetSettings();
      });

      /* Statement button */
      document.getElementById('acw-statement-btn').addEventListener('click', function () {
        self.openModal();
      });

      /* Hide Interface button */
      document.getElementById('acw-hide-btn').addEventListener('click', function () {
        self.deactivate();
      });

      /* Modal close */
      document.getElementById('acw-modal-close').addEventListener('click', function () { self.closeModal(); });
      document.getElementById('acw-modal-ok').addEventListener('click', function () { self.closeModal(); });
      document.getElementById('acw-modal').addEventListener('click', function (e) {
        if (e.target === this) self.closeModal();
      });

      /* Profile Buttons */
      wrap.querySelectorAll('.acw-profile-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var profile  = this.getAttribute('data-profile');
          var isActive = this.getAttribute('aria-checked') === 'true';
          if (isActive) { self.clearProfile(); } else { self.setProfile(profile); }
        });
      });

      /* Feature Cards — boolean toggles */
      wrap.querySelectorAll('.acw-feature-card[data-toggle]').forEach(function (card) {
        card.addEventListener('click', function () {
          var key = this.getAttribute('data-toggle');
          self.settings[key] = !self.settings[key];
          self.saveSettings();
          self._applyToggle(key, self.settings[key]);
          self._syncFeatureCards();
          self.announce((self.settings[key] ? 'Enabled: ' : 'Disabled: ') + key.replace(/([A-Z])/g, ' $1'));
        });
        card.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.click(); }
        });
      });

      /* Color Filter Cards */
      wrap.querySelectorAll('.acw-feature-card[data-filter]').forEach(function (card) {
        card.addEventListener('click', function () {
          var filter = this.getAttribute('data-filter');
          self.settings.colorFilter = (self.settings.colorFilter === filter) ? null : filter;
          self.saveSettings();
          self.updateDynamicCSS();
          self._syncColorFilterCards();
        });
        card.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.click(); }
        });
      });

      /* Color Circles */
      wrap.querySelectorAll('.acw-color-circle').forEach(function (circle) {
        circle.addEventListener('click', function () {
          var key = this.getAttribute('data-color-key');
          var val = this.getAttribute('data-color');
          self.settings[key] = (val === 'reset') ? null : val;
          self.saveSettings();
          self.updateDynamicCSS();
          self._syncColorCircles();
        });
        circle.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.click(); }
        });
      });

      /* Cursor Cards — mutually exclusive */
      wrap.querySelectorAll('.acw-feature-card[data-cursor]').forEach(function (card) {
        card.addEventListener('click', function () {
          var cursor = this.getAttribute('data-cursor');
          self.settings.cursorStyle = (self.settings.cursorStyle === cursor) ? null : cursor;
          self.saveSettings();
          self.updateDynamicCSS();
          self._syncCursorCards();
        });
        card.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.click(); }
        });
      });

      /* Steppers */
      var steppers = {
        'scale-up':   function () { if (self.settings.contentScale < 150) { self.settings.contentScale = Math.min(150, self.settings.contentScale + 5); self.saveSettings(); self._applyContentScale(); self._syncStepperVal('acw-scale-val', self.settings.contentScale + '%'); } },
        'scale-down': function () { if (self.settings.contentScale > 90)  { self.settings.contentScale = Math.max(90,  self.settings.contentScale - 5); self.saveSettings(); self._applyContentScale(); self._syncStepperVal('acw-scale-val', self.settings.contentScale + '%'); } },
        'font-up':    function () { if (self.settings.fontSize < 4)       { self.settings.fontSize++;      self.saveSettings(); self.updateDynamicCSS(); self._syncFontVal(); } },
        'font-down':  function () { if (self.settings.fontSize > -2)      { self.settings.fontSize--;      self.saveSettings(); self.updateDynamicCSS(); self._syncFontVal(); } },
        'lh-up':      function () { if (self.settings.lineHeight < 3)     { self.settings.lineHeight++;    self.saveSettings(); self.updateDynamicCSS(); self._syncLHVal(); } },
        'lh-down':    function () { if (self.settings.lineHeight > 0)     { self.settings.lineHeight--;    self.saveSettings(); self.updateDynamicCSS(); self._syncLHVal(); } },
        'ls-up':      function () { if (self.settings.letterSpacing < 3)  { self.settings.letterSpacing++; self.saveSettings(); self.updateDynamicCSS(); self._syncLSVal(); } },
        'ls-down':    function () { if (self.settings.letterSpacing > 0)  { self.settings.letterSpacing--; self.saveSettings(); self.updateDynamicCSS(); self._syncLSVal(); } },
      };
      wrap.querySelectorAll('[data-action]').forEach(function (btn) {
        var action = btn.getAttribute('data-action');
        if (steppers[action]) btn.addEventListener('click', steppers[action]);
      });

      /* Text Alignment */
      wrap.querySelectorAll('.acw-align-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var align = this.getAttribute('data-align');
          self.settings.textAlign = (self.settings.textAlign === align) ? null : align;
          self.saveSettings();
          self.updateDynamicCSS();
          self._syncAlignBtns();
        });
      });
    },

    /* ─── 04f. PANEL MANAGEMENT ──────────────────────────────────────────── */

    /* Activate — first click on logo trigger */
    activate: function () {
      var wrap = document.getElementById(WRAP_ID);
      this.settings.activated = true;
      this.saveSettings();
      wrap.classList.add('acw-activated');
      this.openPanel();
      this.announce('Accessibility widget opened.');
    },

    openPanel: function () {
      var panel       = document.getElementById(PANEL_ID);
      var overlay     = document.getElementById('acw-overlay');
      var wrap        = document.getElementById(WRAP_ID);
      var logoTrigger = document.getElementById('acw-logo-trigger');

      panel.classList.add('acw-open');
      panel.setAttribute('aria-hidden', 'false');
      overlay.classList.add('acw-visible');
      wrap.classList.add('acw-panel-open');
      this._panelOpen = true;

      if (logoTrigger) logoTrigger.setAttribute('aria-expanded', 'true');

      document.body.style.overflow = 'hidden';

      /* Focus first focusable element */
      var first = panel.querySelector('button, [tabindex="0"], input');
      if (first) setTimeout(function () { first.focus(); }, 50);
      this._setupFocusTrap(panel);
    },

    closePanel: function () {
      var panel       = document.getElementById(PANEL_ID);
      var overlay     = document.getElementById('acw-overlay');
      var wrap        = document.getElementById(WRAP_ID);
      var logoTrigger = document.getElementById('acw-logo-trigger');
      if (!panel) return;

      panel.classList.remove('acw-open');
      panel.setAttribute('aria-hidden', 'true');
      overlay.classList.remove('acw-visible');
      wrap.classList.remove('acw-panel-open');
      this._panelOpen = false;

      if (logoTrigger) logoTrigger.setAttribute('aria-expanded', 'false');

      document.body.style.overflow = '';

      if (logoTrigger) setTimeout(function () { logoTrigger.focus(); }, 50);
    },

    /* Deactivate — close panel + restore logo trigger */
    deactivate: function () {
      var panel       = document.getElementById(PANEL_ID);
      var overlay     = document.getElementById('acw-overlay');
      var wrap        = document.getElementById(WRAP_ID);
      var logoTrigger = document.getElementById('acw-logo-trigger');
      if (!wrap) return;

      if (panel) {
        panel.classList.remove('acw-open');
        panel.setAttribute('aria-hidden', 'true');
      }
      if (overlay) overlay.classList.remove('acw-visible');
      wrap.classList.remove('acw-panel-open');
      this._panelOpen = false;
      document.body.style.overflow = '';

      if (logoTrigger) logoTrigger.setAttribute('aria-expanded', 'false');

      wrap.classList.remove('acw-activated');
      this.settings.activated = false;
      this.saveSettings();

      if (logoTrigger) setTimeout(function () { logoTrigger.focus(); }, 50);

      this.announce('Accessibility panel closed.');
    },

    _setupFocusTrap: function (panel) {
      var focusable = panel.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable.length) return;
      this._focusTrapFirst = focusable[0];
      this._focusTrapLast  = focusable[focusable.length - 1];
      var self = this;
      panel.addEventListener('keydown', function (e) {
        if (e.key !== 'Tab') return;
        if (e.shiftKey) {
          if (document.activeElement === self._focusTrapFirst) {
            e.preventDefault();
            self._focusTrapLast.focus();
          }
        } else {
          if (document.activeElement === self._focusTrapLast) {
            e.preventDefault();
            self._focusTrapFirst.focus();
          }
        }
      });
    },

    /* ─── 04g. MODAL ─────────────────────────────────────────────────────── */
    openModal: function () {
      var modal = document.getElementById('acw-modal');
      modal.classList.add('acw-modal-open');
      modal.setAttribute('aria-hidden', 'false');
      var closeBtn = document.getElementById('acw-modal-close');
      if (closeBtn) setTimeout(function () { closeBtn.focus(); }, 50);
    },

    closeModal: function () {
      var modal = document.getElementById('acw-modal');
      modal.classList.remove('acw-modal-open');
      modal.setAttribute('aria-hidden', 'true');
      document.getElementById('acw-statement-btn').focus();
    },

    /* ─── 04h. APPLY ALL SETTINGS ────────────────────────────────────────── */
    applyAllSettings: function () {
      var s    = this.settings;
      var wrap = document.getElementById(WRAP_ID);

      /* Never restore 'activated' or 'hidden' on load — logo trigger must always be visible on fresh page load. */
      if (wrap) wrap.classList.remove('acw-activated');
      this.settings.activated = false;

      if (wrap) wrap.classList.remove('acw-hidden');
      this.settings.hidden = false;

      this._applyToggle('readableFont',    s.readableFont);
      this._applyToggle('highlightTitles', s.highlightTitles);
      this._applyToggle('highlightLinks',  s.highlightLinks);
      this._applyToggle('textMagnifier',   s.textMagnifier);
      this._applyToggle('muteSounds',      s.muteSounds);
      this._applyToggle('hideImages',      s.hideImages);
      this._applyToggle('readMode',        s.readMode);
      this._applyToggle('readingGuide',    s.readingGuide);
      this._applyToggle('stopAnimations',  s.stopAnimations);
      this._applyToggle('readingMask',     s.readingMask);
      this._applyToggle('highlightHover',  s.highlightHover);
      this._applyToggle('highlightFocus',  s.highlightFocus);

      this._applyContentScale();
      this.updateDynamicCSS();
      this._syncUI();
    },

    /* ─── 04i. DYNAMIC CSS ───────────────────────────────────────────────── */
    updateDynamicCSS: function () {
      var s   = this.settings;
      var css = '';

      if (s.contentScale !== 100) {
        css += 'html{zoom:' + s.contentScale + '%;}';
      }

      if (s.readableFont) {
        css += 'body,body *:not(i){font-family:Arial,Helvetica,sans-serif!important;}';
        css += '.acw-wrap,.acw-wrap *:not(i){font-family:Arial,Helvetica,sans-serif!important;}';
      }

      if (s.highlightTitles) {
        css += 'h1,h2,h3,h4,h5,h6{border-bottom:3px solid #89d32a!important;padding-bottom:4px!important;}';
      }

      if (s.highlightLinks) {
        css += 'a:not([class*="acw-"]){background:#ff0!important;color:#000!important;text-decoration:underline!important;padding:0 2px!important;}';
      }

      if (s.fontSize !== 0) {
        css += 'body{font-size:calc(1em + ' + (s.fontSize * 2) + 'px)!important;}';
      }

      if (s.lineHeight > 0) {
        css += 'body{line-height:' + (1.5 + s.lineHeight * 0.4).toFixed(1) + 'em!important;}';
      }

      if (s.letterSpacing > 0) {
        css += 'body{letter-spacing:' + s.letterSpacing + 'px!important;}';
      }

      if (s.textAlign) {
        css += 'body{text-align:' + s.textAlign + '!important;}';
      }

      var filterMap = {
        'dark-contrast':   'invert(1) hue-rotate(180deg)',
        'light-contrast':  'brightness(1.3) contrast(0.85)',
        'high-contrast':   'contrast(2.5)',
        'high-saturation': 'saturate(3)',
        'low-saturation':  'saturate(0.3)',
        'monochrome':      'grayscale(1)',
      };
      if (s.colorFilter && filterMap[s.colorFilter]) {
        css += 'html{filter:' + filterMap[s.colorFilter] + ';}';
        css += '.acw-wrap{filter:' + (s.colorFilter === 'dark-contrast' ? 'invert(1) hue-rotate(180deg)' : 'none') + ';}';
      }

      if (s.textColor) {
        css += 'body p,body span,body li,body td,body div{color:' + s.textColor + '!important;}';
      }

      if (s.titleColor) {
        css += 'h1,h2,h3,h4,h5,h6{color:' + s.titleColor + '!important;}';
      }

      if (s.hideImages) {
        css += 'img,figure img,video,canvas{opacity:0!important;visibility:hidden!important;}';
        css += '.acw-wrap img,.acw-wrap canvas{opacity:1!important;visibility:visible!important;}';
      }

      if (s.readMode) {
        css += 'header:not(.acw-wrap),nav:not(.acw-wrap),footer:not(.acw-wrap),aside:not(.acw-wrap),' +
               '[class*="banner-section"],[class*="slider"],[class*="slick"],' +
               '[class*="carousel"],[class*="gallery"],[class*="sidebar"],' +
               '[class*="mht-"],[class*="go-top"],' +
               'iframe:not(.acw-wrap){display:none!important;}';
        css += 'body{background:#fff!important;max-width:800px!important;margin:0 auto!important;padding:20px!important;}';
        css += '.acw-wrap{display:block!important;}';
      }

      if (s.stopAnimations) {
        css += '*,*::before,*::after{animation:none!important;transition:none!important;animation-duration:0s!important;transition-duration:0s!important;}';
      }

      if (s.highlightHover) {
        css += '*:not([class*="acw-"]):not(html):not(body):hover{outline:3px solid #89d32a!important;outline-offset:2px!important;}';
      }

      if (s.highlightFocus) {
        css += '*:not([class*="acw-"]):focus{outline:3px solid #e67e00!important;outline-offset:2px!important;box-shadow:0 0 0 2px rgba(230,126,0,0.3)!important;}';
      }

      if (s.cursorStyle === 'big-black') {
        css += '*{cursor:' + CURSOR_BLACK + '!important;}';
      } else if (s.cursorStyle === 'big-white') {
        css += '*{cursor:' + CURSOR_WHITE + '!important;}';
      }

      var styleTag = document.getElementById(DYNAMIC_STYLE_ID);
      if (styleTag) styleTag.textContent = css;
    },

    /* ─── 04j. FEATURE APPLY ─────────────────────────────────────────────── */
    _applyToggle: function (key, value) {
      switch (key) {
        case 'muteSounds':    this._setMuteSounds(value);    break;
        case 'readingGuide':  this._setReadingGuide(value);  break;
        case 'readingMask':   this._setReadingMask(value);   break;
        case 'textMagnifier': this._setTextMagnifier(value); break;
        default: this.updateDynamicCSS(); break;
      }
    },

    _applyContentScale: function () { this.updateDynamicCSS(); },

    /* ─── 04k. PROFILES ──────────────────────────────────────────────────── */
    setProfile: function (name) {
      if (!PROFILES[name]) return;
      this._teardownSideEffects();
      this.settings = this._cloneDefaults();
      var bundle = PROFILES[name];
      for (var k in bundle) { this.settings[k] = bundle[k]; }
      this.settings.activeProfile = name;
      this.saveSettings();
      this.applyAllSettings();
      this._syncUI();
      this.announce('Profile activated: ' + name.replace(/-/g, ' '));
    },

    clearProfile: function () {
      this.settings.activeProfile = null;
      this.saveSettings();
      this._syncUI();
      this.announce('Profile deactivated.');
    },

    /* ─── 04l. SIDE EFFECTS ──────────────────────────────────────────────── */

    _setMuteSounds: function (value) {
      var self = this;
      document.querySelectorAll('audio, video').forEach(function (el) { el.muted = value; });
      if (value) {
        if (!this._mutationObserver && window.MutationObserver) {
          this._mutationObserver = new MutationObserver(function (mutations) {
            mutations.forEach(function (m) {
              m.addedNodes.forEach(function (node) {
                if (node.nodeType === 1) {
                  if (node.tagName === 'AUDIO' || node.tagName === 'VIDEO') node.muted = true;
                  node.querySelectorAll && node.querySelectorAll('audio,video').forEach(function (el) { el.muted = true; });
                }
              });
            });
          });
          this._mutationObserver.observe(document.body, { childList: true, subtree: true });
        }
      } else {
        this._teardownMutationObserver();
      }
      this.updateDynamicCSS();
    },

    _teardownMutationObserver: function () {
      if (this._mutationObserver) {
        this._mutationObserver.disconnect();
        this._mutationObserver = null;
      }
    },

    _setReadingGuide: function (value) {
      var self = this;
      if (value) {
        if (!this._readingGuideEl) {
          var guide = document.createElement('div');
          guide.className = 'acw-reading-guide';
          guide.id        = 'acw-reading-guide';
          guide.setAttribute('aria-hidden', 'true');
          document.body.appendChild(guide);
          this._readingGuideEl = guide;
        }
        this._mouseMoveHandler = function (e) {
          if (self._readingGuideEl) self._readingGuideEl.style.top = e.clientY + 'px';
        };
        document.addEventListener('mousemove', this._mouseMoveHandler);
      } else {
        this._teardownReadingGuide();
      }
      this.updateDynamicCSS();
    },

    _teardownReadingGuide: function () {
      if (this._mouseMoveHandler) {
        document.removeEventListener('mousemove', this._mouseMoveHandler);
        this._mouseMoveHandler = null;
      }
      if (this._readingGuideEl && this._readingGuideEl.parentNode) {
        this._readingGuideEl.parentNode.removeChild(this._readingGuideEl);
      }
      this._readingGuideEl = null;
    },

    _setReadingMask: function (value) {
      var self = this;
      if (value) {
        if (!this._maskTopEl) {
          var top = document.createElement('div');
          top.className = 'acw-mask-top'; top.setAttribute('aria-hidden', 'true');
          var bot = document.createElement('div');
          bot.className = 'acw-mask-bottom'; bot.setAttribute('aria-hidden', 'true');
          document.body.appendChild(top);
          document.body.appendChild(bot);
          this._maskTopEl    = top;
          this._maskBottomEl = bot;
        }
        var bandHeight = 60;
        this._maskMoveHandler = function (e) {
          var y  = e.clientY;
          var vh = window.innerHeight;
          if (self._maskTopEl)    self._maskTopEl.style.height    = Math.max(0, y - bandHeight) + 'px';
          if (self._maskBottomEl) self._maskBottomEl.style.height = Math.max(0, vh - y - bandHeight) + 'px';
        };
        document.addEventListener('mousemove', this._maskMoveHandler);
      } else {
        this._teardownReadingMask();
      }
      this.updateDynamicCSS();
    },

    _teardownReadingMask: function () {
      if (this._maskMoveHandler) {
        document.removeEventListener('mousemove', this._maskMoveHandler);
        this._maskMoveHandler = null;
      }
      if (this._maskTopEl    && this._maskTopEl.parentNode)    this._maskTopEl.parentNode.removeChild(this._maskTopEl);
      if (this._maskBottomEl && this._maskBottomEl.parentNode) this._maskBottomEl.parentNode.removeChild(this._maskBottomEl);
      this._maskTopEl = this._maskBottomEl = null;
    },

    _setTextMagnifier: function (value) {
      var self = this;
      if (value) {
        if (!this._magnifierEl) {
          var mag = document.createElement('div');
          mag.className = 'acw-magnifier'; mag.id = 'acw-magnifier';
          mag.setAttribute('aria-hidden', 'true');
          document.body.appendChild(mag);
          this._magnifierEl = mag;
        }
        this._magnifierMoveHandler = function (e) {
          var target = e.target;
          if (!target || target.closest('.acw-wrap') || target === document.body) {
            if (self._magnifierEl) self._magnifierEl.style.display = 'none';
            return;
          }
          var text = target.textContent ? target.textContent.trim().substring(0, 80) : '';
          if (!text) { self._magnifierEl.style.display = 'none'; return; }
          var el = self._magnifierEl;
          el.textContent = text;
          el.style.display = 'block';
          var x = e.clientX + 16;
          var y = e.clientY - 60;
          if (x + 300 > window.innerWidth) x = e.clientX - 316;
          if (y < 0) y = e.clientY + 16;
          el.style.left = x + 'px';
          el.style.top  = y + 'px';
        };
        document.addEventListener('mousemove', this._magnifierMoveHandler);
      } else {
        this._teardownMagnifier();
      }
      this.updateDynamicCSS();
    },

    _teardownMagnifier: function () {
      if (this._magnifierMoveHandler) {
        document.removeEventListener('mousemove', this._magnifierMoveHandler);
        this._magnifierMoveHandler = null;
      }
      if (this._magnifierEl && this._magnifierEl.parentNode) {
        this._magnifierEl.parentNode.removeChild(this._magnifierEl);
      }
      this._magnifierEl = null;
    },

    _teardownSideEffects: function () {
      this._teardownMagnifier();
      this._teardownReadingGuide();
      this._teardownReadingMask();
      this._teardownMutationObserver();
    },

    /* ─── 04m. UI SYNC ───────────────────────────────────────────────────── */
    _syncUI: function () {
      this._syncProfiles();
      this._syncFeatureCards();
      this._syncColorFilterCards();
      this._syncColorCircles();
      this._syncCursorCards();
      this._syncStepperVal('acw-scale-val', this.settings.contentScale + '%');
      this._syncFontVal();
      this._syncLHVal();
      this._syncLSVal();
      this._syncAlignBtns();
    },

    _syncProfiles: function () {
      var active = this.settings.activeProfile;
      document.querySelectorAll('.acw-profile-btn').forEach(function (btn) {
        var isActive = btn.getAttribute('data-profile') === active;
        btn.setAttribute('aria-checked', isActive ? 'true' : 'false');
        btn.classList.toggle('acw-active', isActive);
      });
    },

    _syncFeatureCards: function () {
      var s = this.settings;
      document.querySelectorAll('.acw-feature-card[data-toggle]').forEach(function (card) {
        var key = card.getAttribute('data-toggle');
        if (key && s.hasOwnProperty(key)) {
          var on = !!s[key];
          card.setAttribute('aria-checked', on ? 'true' : 'false');
          card.classList.toggle('acw-active', on);
        }
      });
    },

    _syncColorFilterCards: function () {
      var active = this.settings.colorFilter;
      document.querySelectorAll('.acw-feature-card[data-filter]').forEach(function (card) {
        var isActive = card.getAttribute('data-filter') === active;
        card.setAttribute('aria-checked', isActive ? 'true' : 'false');
        card.classList.toggle('acw-active', isActive);
      });
    },

    _syncColorCircles: function () {
      var s = this.settings;
      document.querySelectorAll('.acw-color-circle').forEach(function (circle) {
        var key = circle.getAttribute('data-color-key');
        var val = circle.getAttribute('data-color');
        var isActive = val !== 'reset' && val === s[key];
        circle.classList.toggle('acw-active', isActive);
      });
    },

    _syncCursorCards: function () {
      var active = this.settings.cursorStyle;
      document.querySelectorAll('.acw-feature-card[data-cursor]').forEach(function (card) {
        var isActive = card.getAttribute('data-cursor') === active;
        card.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        card.classList.toggle('acw-active', isActive);
      });
    },

    _syncStepperVal: function (id, text) {
      var el = document.getElementById(id);
      if (el) el.textContent = text;
    },

    _syncFontVal: function () {
      var v = this.settings.fontSize;
      this._syncStepperVal('acw-font-val', v === 0 ? 'Default' : (v > 0 ? '+' + v : '' + v));
    },

    _syncLHVal: function () {
      var v = this.settings.lineHeight;
      this._syncStepperVal('acw-lh-val', v === 0 ? 'Default' : '+' + v);
    },

    _syncLSVal: function () {
      var v = this.settings.letterSpacing;
      this._syncStepperVal('acw-ls-val', v === 0 ? 'Default' : '+' + v + 'px');
    },

    _syncAlignBtns: function () {
      var active = this.settings.textAlign;
      document.querySelectorAll('.acw-align-btn').forEach(function (btn) {
        var isActive = btn.getAttribute('data-align') === active;
        btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        btn.classList.toggle('acw-active', isActive);
      });
    },

    /* ─── 04n. ARIA LIVE ANNOUNCEMENT ────────────────────────────────────── */
    announce: function (msg) {
      var region = document.getElementById('acw-live');
      if (!region) return;
      region.textContent = '';
      setTimeout(function () { region.textContent = msg; }, 50);
    },

  }; /* end ACW */

  /*===========================
      05. AUTO INIT
  ===========================*/
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { ACW.init(); });
  } else {
    ACW.init();
  }

  sigmaACW = ACW;

})();

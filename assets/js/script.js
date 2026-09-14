'use strict';

/*-----------------------------------*\
  #script.js — Zaid Shaikh Developer World
  Vanilla JS: theme switcher, sidebar toggle, start screen
  loader, project filters, contact form, avatar lightbox,
  and the card-3d mouse-parallax tilt effect.
\*-----------------------------------*/

(function () {

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var THEME_KEY = 'zs-dev-world-theme';
  var VALID_THEMES = ['night', 'day', 'neon', 'forest', 'ice', 'dark'];


  /*-----------------------------------*\
    #THEME SWITCHER
  \*-----------------------------------*/

  function initThemeSwitcher() {
    var root = document.querySelector('[data-theme-switcher]');
    if (!root) return;

    var toggleBtn = root.querySelector('[data-theme-toggle]');
    var menu = root.querySelector('[data-theme-menu]');
    var options = Array.prototype.slice.call(root.querySelectorAll('[data-theme-value]'));

    function applyTheme(theme, opts) {
      opts = opts || {};
      if (VALID_THEMES.indexOf(theme) === -1) theme = 'night';

      document.body.setAttribute('data-theme', theme);

      try { window.localStorage.setItem(THEME_KEY, theme); } catch (e) { /* storage unavailable */ }

      options.forEach(function (btn) {
        var li = btn.closest('[data-theme-option]');
        var isMatch = btn.getAttribute('data-theme-value') === theme;
        if (li) li.setAttribute('aria-selected', isMatch ? 'true' : 'false');
      });

      if (opts.pulse && !prefersReducedMotion) {
        root.classList.remove('is-pulsing');
        // force reflow so the animation can re-trigger
        void root.offsetWidth;
        root.classList.add('is-pulsing');
      }
    }

    function openMenu() {
      root.classList.add('is-open');
      toggleBtn.setAttribute('aria-expanded', 'true');
      menu.focus({ preventScroll: true });
    }

    function closeMenu(returnFocus) {
      root.classList.remove('is-open');
      toggleBtn.setAttribute('aria-expanded', 'false');
      if (returnFocus) toggleBtn.focus();
    }

    toggleBtn.addEventListener('click', function () {
      if (root.classList.contains('is-open')) {
        closeMenu(false);
      } else {
        openMenu();
      }
    });

    options.forEach(function (btn) {
      btn.addEventListener('click', function () {
        applyTheme(btn.getAttribute('data-theme-value'), { pulse: true });
        closeMenu(true);
      });
    });

    document.addEventListener('click', function (event) {
      if (!root.contains(event.target)) closeMenu(false);
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && root.classList.contains('is-open')) {
        closeMenu(true);
      }
    });

    // restore saved theme (falls back to whatever the page shipped with)
    var saved = null;
    try { saved = window.localStorage.getItem(THEME_KEY); } catch (e) { /* storage unavailable */ }
    if (saved && VALID_THEMES.indexOf(saved) !== -1) {
      applyTheme(saved, { pulse: false });
    } else {
      applyTheme(document.body.getAttribute('data-theme') || 'night', { pulse: false });
    }
  }


  /*-----------------------------------*\
    #SIDEBAR (player card) TOGGLE
  \*-----------------------------------*/

  function initSidebar() {
    var sidebar = document.querySelector('[data-sidebar]');
    var btn = document.querySelector('[data-sidebar-btn]');
    if (!sidebar || !btn) return;

    btn.addEventListener('click', function () {
      var isActive = sidebar.classList.toggle('active');
      btn.setAttribute('aria-expanded', isActive ? 'true' : 'false');
    });
  }


  /*-----------------------------------*\
    #START SCREEN LOADER
  \*-----------------------------------*/

  function initStartScreen() {
    var screen = document.querySelector('[data-start-screen]');
    if (!screen) return;

    var statusEl = screen.querySelector('[data-start-status]');
    var barFill = screen.querySelector('[data-start-bar]');
    var percentEl = screen.querySelector('[data-start-percent]');
    var detectedEl = screen.querySelector('[data-start-detected]');
    var nameEl = screen.querySelector('[data-start-name]');
    var actionsEl = screen.querySelector('[data-start-actions]');
    var enterBtn = screen.querySelector('[data-enter-world]');
    var skipBtn = screen.querySelector('[data-skip-intro]');

    function hideScreen() {
      screen.classList.add('is-hidden');
      window.setTimeout(function () {
        screen.setAttribute('aria-hidden', 'true');
      }, 320);
    }

    if (enterBtn) enterBtn.addEventListener('click', hideScreen);
    if (skipBtn) skipBtn.addEventListener('click', hideScreen);

    if (prefersReducedMotion) {
      if (percentEl) percentEl.textContent = '100%';
      if (barFill) barFill.style.width = '100%';
      if (statusEl) statusEl.textContent = 'WORLD READY';
      if (detectedEl) detectedEl.classList.add('is-visible');
      if (nameEl) nameEl.classList.add('is-visible');
      if (actionsEl) actionsEl.classList.add('is-visible');
      return;
    }

    var progress = 0;
    var messages = [
      [0, 'INITIALIZING WORLD...'],
      [30, 'LOADING TERRAIN...'],
      [55, 'SPAWNING ASSETS...'],
      [80, 'SCANNING PLAYER DATA...'],
      [100, 'WORLD READY']
    ];

    var timer = window.setInterval(function () {
      progress = Math.min(100, progress + Math.round(4 + Math.random() * 10));

      if (barFill) barFill.style.width = progress + '%';
      if (percentEl) percentEl.textContent = progress + '%';

      if (statusEl) {
        for (var i = messages.length - 1; i >= 0; i--) {
          if (progress >= messages[i][0]) {
            statusEl.textContent = messages[i][1];
            break;
          }
        }
      }

      if (progress >= 100) {
        window.clearInterval(timer);
        if (detectedEl) detectedEl.classList.add('is-visible');
        window.setTimeout(function () {
          if (nameEl) nameEl.classList.add('is-visible');
        }, 250);
        window.setTimeout(function () {
          if (actionsEl) actionsEl.classList.add('is-visible');
        }, 550);
      }
    }, 140);
  }


  /*-----------------------------------*\
    #PROJECT FILTERS (Project Worlds page)
  \*-----------------------------------*/

  function initProjectFilters() {
    var items = Array.prototype.slice.call(document.querySelectorAll('[data-filter-item]'));
    if (!items.length) return;

    var listButtons = Array.prototype.slice.call(document.querySelectorAll('[data-filter-btn]'));
    var selectBtn = document.querySelector('[data-select]');
    var selectValue = document.querySelector('[data-select-value]');
    var selectItems = Array.prototype.slice.call(document.querySelectorAll('[data-select-item]'));

    function applyFilter(filter, label) {
      items.forEach(function (item) {
        var match = filter === 'all' || item.getAttribute('data-category') === filter;
        item.classList.toggle('active', match);
      });

      listButtons.forEach(function (btn) {
        btn.classList.toggle('active', btn.getAttribute('data-filter') === filter);
      });

      if (selectValue && label) selectValue.textContent = label;
    }

    listButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        applyFilter(btn.getAttribute('data-filter'), btn.textContent.trim());
      });
    });

    selectItems.forEach(function (btn) {
      btn.addEventListener('click', function () {
        applyFilter(btn.getAttribute('data-filter'), btn.textContent.trim());
        if (selectBtn) selectBtn.classList.remove('active');
      });
    });

    if (selectBtn) {
      selectBtn.addEventListener('click', function () {
        selectBtn.classList.toggle('active');
      });

      document.addEventListener('click', function (event) {
        if (!selectBtn.contains(event.target) && !selectBtn.nextElementSibling.contains(event.target)) {
          selectBtn.classList.remove('active');
        }
      });
    }
  }


  /*-----------------------------------*\
    #CONTACT FORM
  \*-----------------------------------*/

  function initContactForm() {
    var form = document.querySelector('[data-form]');
    if (!form) return;

    var inputs = Array.prototype.slice.call(form.querySelectorAll('[data-form-input]'));
    var submitBtn = form.querySelector('[data-form-btn]');
    var statusEl = form.querySelector('[data-form-status]');

    function checkValidity() {
      var isValid = inputs.every(function (input) { return input.value.trim() !== ''; });
      if (submitBtn) submitBtn.disabled = !isValid;
      return isValid;
    }

    inputs.forEach(function (input) {
      input.addEventListener('input', checkValidity);
    });

    checkValidity();

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      if (!checkValidity()) return;

      var data = {};
      inputs.forEach(function (input) { data[input.name] = input.value.trim(); });

      var subject = 'Portfolio message from ' + data.fullname;
      var body = data.message + '\n\n— ' + data.fullname + ' (' + data.email + ')';
      var mailto = 'mailto:iamzaidshaikh2005@gmail.com'
        + '?subject=' + encodeURIComponent(subject)
        + '&body=' + encodeURIComponent(body);

      window.location.href = mailto;

      if (statusEl) statusEl.textContent = 'Opening your email app...';
    });
  }


  /*-----------------------------------*\
    #AVATAR LIGHTBOX (click-to-zoom preview)
    Opens a fullscreen glass-framed preview of the avatar.
    Handles: open/close, backdrop click, ESC, focus
    management, and body-scroll locking.
  \*-----------------------------------*/

  function initAvatarLightbox() {
    var trigger = document.querySelector('[data-avatar-trigger]');
    var lightbox = document.querySelector('[data-avatar-lightbox]');
    if (!trigger || !lightbox) return;

    var backdrop = lightbox.querySelector('[data-avatar-backdrop]');
    var dialog = lightbox.querySelector('[data-avatar-dialog]');
    var closeBtn = lightbox.querySelector('[data-avatar-close]');

    var isOpen = false;
    var lastFocusedEl = null;

    function getFocusableEls() {
      return Array.prototype.slice.call(
        dialog.querySelectorAll('button, [href], [tabindex]:not([tabindex="-1"])')
      ).filter(function (el) { return !el.hasAttribute('disabled'); });
    }

    function trapFocus(event) {
      if (event.key !== 'Tab') return;

      var focusable = getFocusableEls();
      if (!focusable.length) return;

      var first = focusable[0];
      var last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    function onKeydown(event) {
      if (event.key === 'Escape') {
        closeLightbox();
        return;
      }
      trapFocus(event);
    }

    function openLightbox() {
      if (isOpen) return;
      isOpen = true;

      lastFocusedEl = document.activeElement;

      lightbox.classList.add('is-open');
      lightbox.setAttribute('aria-hidden', 'false');
      document.body.classList.add('has-lightbox-open');

      document.addEventListener('keydown', onKeydown);

      // move focus into the dialog once the open transition starts
      window.requestAnimationFrame(function () {
        if (closeBtn) closeBtn.focus();
      });
    }

    function closeLightbox() {
      if (!isOpen) return;
      isOpen = false;

      lightbox.classList.remove('is-open');
      lightbox.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('has-lightbox-open');

      document.removeEventListener('keydown', onKeydown);

      if (lastFocusedEl && typeof lastFocusedEl.focus === 'function') {
        lastFocusedEl.focus();
      } else {
        trigger.focus();
      }
    }

    trigger.addEventListener('click', openLightbox);

    if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
    if (backdrop) backdrop.addEventListener('click', closeLightbox);
  }


  /*-----------------------------------*\
    #CARD-3D MOUSE PARALLAX TILT
  \*-----------------------------------*/

  function initCardTilt() {
    if (prefersReducedMotion) return;

    var supportsFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (!supportsFinePointer) return;

    var cards = Array.prototype.slice.call(document.querySelectorAll('.card-3d'));
    if (!cards.length) return;

    cards.forEach(function (card) {
      var inner = card.querySelector('.card-3d__inner');
      if (!inner) return;

      var maxTilt = parseFloat(getComputedStyle(card).getPropertyValue('--tilt-max')) || 8;
      var rafId = null;
      var pendingEvent = null;

      function update() {
        rafId = null;
        if (!pendingEvent) return;

        var rect = card.getBoundingClientRect();
        var relX = (pendingEvent.clientX - rect.left) / rect.width;
        var relY = (pendingEvent.clientY - rect.top) / rect.height;

        var tiltY = (relX - 0.5) * (maxTilt * 2);
        var tiltX = (0.5 - relY) * (maxTilt * 2);

        card.style.setProperty('--tilt-x', tiltX.toFixed(2) + 'deg');
        card.style.setProperty('--tilt-y', tiltY.toFixed(2) + 'deg');
      }

      card.addEventListener('mousemove', function (event) {
        pendingEvent = event;
        if (rafId === null) rafId = window.requestAnimationFrame(update);
      });

      card.addEventListener('mouseleave', function () {
        pendingEvent = null;
        if (rafId !== null) {
          window.cancelAnimationFrame(rafId);
          rafId = null;
        }
        card.style.setProperty('--tilt-x', '0deg');
        card.style.setProperty('--tilt-y', '0deg');
      });
    });
  }


  /*-----------------------------------*\
    #INIT
  \*-----------------------------------*/

  document.addEventListener('DOMContentLoaded', function () {
    initThemeSwitcher();
    initSidebar();
    initStartScreen();
    initProjectFilters();
    initContactForm();
    initAvatarLightbox();
    initCardTilt();
  });

})();
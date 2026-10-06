'use strict';

/* Quiet Worlds: local background music shared by the portfolio pages. */
(function () {
  function initMusic() {
    var audio = document.querySelector('[data-background-music]');
    var button = document.querySelector('[data-music-toggle]');
    var status = document.querySelector('[data-music-status]');
    if (!audio || !button) return;

    var storageKey = 'zs-dev-world-music';
    var enabled = true;
    var resumeAt = null;
    var pending = false;
    var requestId = 0;
    var listeningForGesture = false;
    var lastSaved = 0;
    var lastAnnouncement = '';
    var unavailable = false;

    try {
      var saved = JSON.parse(window.sessionStorage.getItem(storageKey));
      if (saved && typeof saved.enabled === 'boolean') {
        enabled = saved.enabled;
        if (typeof saved.time === 'number' && isFinite(saved.time) && saved.time >= 0) {
          resumeAt = saved.time;
        }
      }
    } catch (e) { /* Music also works when browser storage is unavailable. */ }

    audio.volume = 0.22;
    audio.loop = true;

    function announce(message) {
      if (status && message !== lastAnnouncement) {
        status.textContent = message;
        lastAnnouncement = message;
      }
    }

    function updateButton() {
      var playing = !audio.paused && !audio.ended && !unavailable;
      var canStop = enabled && (playing || pending);
      button.classList.toggle('is-playing', playing);
      button.setAttribute('aria-pressed', playing ? 'true' : 'false');
      button.setAttribute('aria-label', canStop ? 'Stop background music' : 'Play background music');
      button.title = unavailable ? 'Music could not load. Click to retry.' :
        (canStop ? 'Stop music — Quiet Worlds' : 'Play music — Quiet Worlds');
      if (playing) announce('Background music playing. Use the music button to stop it.');
    }

    function savePosition() {
      try {
        window.sessionStorage.setItem(storageKey, JSON.stringify({
          enabled: enabled,
          time: enabled ? (resumeAt !== null ? resumeAt : (audio.currentTime || 0)) : 0
        }));
      } catch (e) { /* Storage may be blocked, especially with file:// previews. */ }
    }

    function restorePosition() {
      if (resumeAt === null || !isFinite(audio.duration) || audio.duration <= 0) return;
      try {
        audio.currentTime = resumeAt % audio.duration;
        resumeAt = null;
      } catch (e) { /* Retry after metadata is available. */ }
    }

    function removeGestureListeners() {
      if (!listeningForGesture) return;
      document.removeEventListener('click', unlockOnGesture, true);
      document.removeEventListener('keydown', unlockOnGesture, true);
      listeningForGesture = false;
    }

    function waitForGesture() {
      if (listeningForGesture || !enabled) return;
      document.addEventListener('click', unlockOnGesture, true);
      document.addEventListener('keydown', unlockOnGesture, true);
      listeningForGesture = true;
      announce('Use the music button or interact with the page to start background music.');
    }

    function playMusic() {
      if (!enabled || pending) return;
      unavailable = false;
      restorePosition();
      var thisRequest = ++requestId;
      pending = true;
      updateButton();

      // Call play directly inside a click/key handler so browser activation is retained.
      var attempt;
      try {
        attempt = audio.play();
      } catch (error) {
        handleBlocked(error);
        return;
      }

      if (attempt && typeof attempt.then === 'function') {
        attempt.then(function () {
          if (thisRequest !== requestId) return;
          pending = false;
          if (!enabled) audio.pause();
          removeGestureListeners();
          updateButton();
          savePosition();
        }).catch(handleBlocked);
      } else {
        pending = false;
        removeGestureListeners();
        updateButton();
      }

      function handleBlocked(error) {
        if (thisRequest !== requestId) return;
        pending = false;
        updateButton();
        if (!enabled) return;
        if (error && error.name === 'NotAllowedError') {
          waitForGesture();
        } else if (!error || error.name !== 'AbortError') {
          unavailable = true;
          removeGestureListeners();
          updateButton();
          announce('Background music could not load. Use the music button to retry.');
        }
      }
    }

    function unlockOnGesture(event) {
      // The music button handles its own gesture, including an explicit stop.
      if (button.contains(event.target)) return;
      if (event.type === 'keydown' && event.key !== 'Enter' && event.key !== ' ') return;
      if (enabled) playMusic();
    }

    button.addEventListener('click', function () {
      if (enabled && (!audio.paused || pending)) {
        enabled = false;
        ++requestId;
        pending = false;
        removeGestureListeners();
        audio.pause();
        resumeAt = null;
        try { audio.currentTime = 0; } catch (e) { /* No metadata yet. */ }
        updateButton();
        savePosition();
        announce('Background music stopped.');
      } else {
        enabled = true;
        savePosition();
        if (audio.error) audio.load();
        playMusic();
      }
    });

    audio.addEventListener('loadedmetadata', restorePosition);
    audio.addEventListener('playing', function () {
      if (!enabled) {
        audio.pause();
        return;
      }
      updateButton();
      removeGestureListeners();
    });
    audio.addEventListener('pause', updateButton);
    audio.addEventListener('error', function () {
      unavailable = true;
      ++requestId;
      pending = false;
      removeGestureListeners();
      updateButton();
      announce('Background music could not load. Use the music button to retry.');
    });
    audio.addEventListener('timeupdate', function () {
      var now = Date.now();
      if (now - lastSaved >= 2000) {
        lastSaved = now;
        savePosition();
      }
    });

    window.addEventListener('pagehide', function () {
      savePosition();
      ++requestId;
      pending = false;
      audio.pause();
    });
    window.addEventListener('pageshow', function (event) {
      // Re-read the preference when Back/Forward restores a cached page.
      if (!event.persisted) return;
      try {
        var current = JSON.parse(window.sessionStorage.getItem(storageKey));
        if (current && typeof current.enabled === 'boolean') {
          enabled = current.enabled;
          resumeAt = enabled && typeof current.time === 'number' && isFinite(current.time) ?
            Math.max(0, current.time) : 0;
        }
      } catch (e) { /* Retain this page's preference if storage is unavailable. */ }
      updateButton();
      if (enabled) playMusic();
    });

    updateButton();
    if (enabled) playMusic();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMusic, { once: true });
  } else {
    initMusic();
  }
})();

// FailFixer Website - Main JS
(function () {
  'use strict';

  /* ── CTA link wiring ── */
  function wireCTAs() {
    const url = window.FAILFIXER_GUMROAD_URL;
    document.querySelectorAll('[data-cta]').forEach(function (el) {
      if (url) {
        el.href = url;
        el.removeAttribute('data-tooltip');
      } else {
        el.href = '#';
        el.setAttribute('data-tooltip', 'Purchase link coming soon!');
        el.addEventListener('click', function (e) {
          e.preventDefault();
          showToast('Purchase link coming soon — check back shortly!');
        });
      }
    });
  }

  /* ── Toast notification ── */
  function showToast(msg) {
    var existing = document.getElementById('ff-toast');
    if (existing) existing.remove();
    var toast = document.createElement('div');
    toast.id = 'ff-toast';
    toast.textContent = msg;
    document.body.appendChild(toast);
    requestAnimationFrame(function () { toast.classList.add('visible'); });
    setTimeout(function () {
      toast.classList.remove('visible');
      setTimeout(function () { toast.remove(); }, 300);
    }, 3000);
  }

  /* ── Mobile nav toggle ── */
  function wireNav() {
    var toggle = document.getElementById('nav-toggle');
    var menu = document.getElementById('nav-menu');
    if (!toggle || !menu) return;
    toggle.addEventListener('click', function () {
      menu.classList.toggle('open');
      toggle.setAttribute('aria-expanded', menu.classList.contains('open'));
    });
    menu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        menu.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ── FAQ accordion ── */
  function wireAccordion() {
    document.querySelectorAll('.faq-question').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var item = btn.parentElement;
        var wasOpen = item.classList.contains('open');
        document.querySelectorAll('.faq-item.open').forEach(function (el) {
          el.classList.remove('open');
          el.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
        });
        if (!wasOpen) {
          item.classList.add('open');
          btn.setAttribute('aria-expanded', 'true');
        }
      });
    });
  }

  /* ── Smooth scroll for anchor links ── */
  function wireSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      if (a.hasAttribute('data-cta')) return;
      a.addEventListener('click', function (e) {
        var target = document.querySelector(a.getAttribute('href'));
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  function wireBugReportMeta() {
    var browserField = document.getElementById('bug-browser-info');
    var timeField = document.getElementById('bug-time');
    if (browserField) browserField.value = navigator.userAgent || 'unknown';
    if (timeField) timeField.value = new Date().toISOString();
  }

  async function sha256Hex(input) {
    if (!window.crypto || !window.crypto.subtle || !window.TextEncoder) return 'unsupported';
    var data = new TextEncoder().encode(input);
    var hash = await window.crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash)).map(function (b) {
      return b.toString(16).padStart(2, '0');
    }).join('');
  }

  async function wireBetaForm() {
    var form = document.getElementById('beta-application-form');
    if (!form) return;

    if (window.FAILFIXER_BETA_FORM_ENDPOINT) {
      form.action = window.FAILFIXER_BETA_FORM_ENDPOINT;
    }

    var renderedAt = Date.now();
    var renderedAtField = document.getElementById('beta-rendered-at');
    if (renderedAtField) renderedAtField.value = new Date(renderedAt).toISOString();

    var meta = {
      ua: navigator.userAgent || 'unknown',
      tz: (Intl.DateTimeFormat && Intl.DateTimeFormat().resolvedOptions().timeZone) || 'unknown',
      platform: navigator.platform || 'unknown',
      language: navigator.language || 'unknown',
      languages: (navigator.languages || []).join(','),
      screen: window.screen ? [screen.width, screen.height, screen.availWidth, screen.availHeight].join('x') : 'unknown',
      viewport: [window.innerWidth, window.innerHeight].join('x'),
      colorDepth: window.screen ? String(screen.colorDepth) : 'unknown',
      hc: String(navigator.hardwareConcurrency || 'unknown'),
      dm: String(navigator.deviceMemory || 'unknown'),
      touch: String(navigator.maxTouchPoints || 0),
      cookie: String(navigator.cookieEnabled),
      dnt: String(navigator.doNotTrack || 'unspecified'),
      referrer: document.referrer || 'direct',
      page: window.location.href
    };

    function setField(id, value) {
      var field = document.getElementById(id);
      if (field) field.value = value;
    }

    setField('meta-user-agent', meta.ua);
    setField('meta-timezone', meta.tz);
    setField('meta-platform', meta.platform);
    setField('meta-language', meta.language);
    setField('meta-languages', meta.languages);
    setField('meta-screen', meta.screen);
    setField('meta-viewport', meta.viewport);
    setField('meta-color-depth', meta.colorDepth);
    setField('meta-hardware-concurrency', meta.hc);
    setField('meta-device-memory', meta.dm);
    setField('meta-touch-points', meta.touch);
    setField('meta-cookie-enabled', meta.cookie);
    setField('meta-do-not-track', meta.dnt);
    setField('meta-referrer', meta.referrer);
    setField('meta-page-url', meta.page);

    var fpSource = [
      meta.ua, meta.tz, meta.platform, meta.language, meta.languages, meta.screen,
      meta.viewport, meta.colorDepth, meta.hc, meta.dm, meta.touch
    ].join('|');
    var fpHash = await sha256Hex(fpSource);
    setField('meta-client-fingerprint', fpHash);

    form.addEventListener('submit', async function (e) {
      e.preventDefault();

      var honeypot = form.querySelector('input[name="company_name"]');
      if (honeypot && honeypot.value.trim() !== '') {
        showToast('Submission blocked. Please try again.');
        return;
      }

      var elapsedSec = (Date.now() - renderedAt) / 1000;
      if (elapsedSec < 4) {
        showToast('Please take a moment to review the form before submitting.');
        return;
      }

      var termsCheck = document.getElementById('beta-terms-accept');
      if (termsCheck && !termsCheck.checked) {
        showToast('You must accept the beta tester terms to apply.');
        return;
      }

      setField('beta-submitted-at', new Date().toISOString());
      setField('beta-seconds-elapsed', elapsedSec.toFixed(1));

      if (!form.reportValidity()) {
        return;
      }

      var submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.dataset.originalText = submitBtn.textContent;
        submitBtn.textContent = 'Submitting...';
      }

      try {
        var formData = new FormData(form);
        var payload = {};
        formData.forEach(function (value, key) {
          payload[key] = value;
        });

        var controller = new AbortController();
        var timeoutId = setTimeout(function () { controller.abort(); }, 15000);

        var response;
        try {
          response = await fetch(form.action, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload),
            signal: controller.signal
          });
        } finally {
          clearTimeout(timeoutId);
        }

        if (!response.ok) {
          var errBody = null;
          try { errBody = await response.json(); } catch (_) { }
          throw new Error((errBody && errBody.error) || 'Email delivery failed.');
        }

        form.reset();
        setField('beta-rendered-at', new Date().toISOString());
        showToast('Application submitted! We\'ll review and follow up by email.');
      } catch (err) {
        var timeoutMsg = err && err.name === 'AbortError';
        if (timeoutMsg) {
          showToast('Submission timed out. Please try again in a moment.');
        } else {
          showToast('Submission failed. Please try again in a minute or email betatester@failfixer.com.');
        }
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = submitBtn.dataset.originalText || 'Apply for Beta Access';
        }
      }
    });
  }

  /* ── Init ── */
  document.addEventListener('DOMContentLoaded', function () {
    wireCTAs();
    wireNav();
    wireAccordion();
    wireSmoothScroll();
    wireBugReportMeta();
    wireBetaForm().catch(function () { /* non-fatal */ });
  });
})();

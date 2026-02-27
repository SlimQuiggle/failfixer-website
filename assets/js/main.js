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
    // Close menu on link click (mobile)
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
        // close all
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

  /* ── Init ── */
  document.addEventListener('DOMContentLoaded', function () {
    wireCTAs();
    wireNav();
    wireAccordion();
    wireSmoothScroll();
  });
})();

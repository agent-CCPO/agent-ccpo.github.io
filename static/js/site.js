// Page chrome: analysis tabs, section highlighting, scroll reveal, figure zoom, copy.
(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  function trackSections() {
    const links = $$('.nav-links a');
    const byId = new Map(links.map((a) => [a.getAttribute('href').slice(1), a]));
    const sections = [...byId.keys()].map((id) => document.getElementById(id)).filter(Boolean);
    if (!('IntersectionObserver' in window) || !sections.length) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        links.forEach((a) => a.classList.remove('is-active'));
        const link = byId.get(e.target.id);
        link.classList.add('is-active');
        // On small screens the links are a strip that scrolls sideways: keep the current one in view.
        const strip = link.parentElement;
        if (strip.scrollWidth > strip.clientWidth) {
          strip.scrollTo({ left: link.offsetLeft - (strip.clientWidth - link.offsetWidth) / 2, behavior: 'smooth' });
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach((s) => io.observe(s));
  }

  function reveal() {
    const nodes = $$('.reveal');
    // Embedded views (previews, thumbnails) should be complete without scrolling.
    if (!('IntersectionObserver' in window) || window.self !== window.top) { nodes.forEach((n) => n.classList.add('is-in')); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    nodes.forEach((n) => io.observe(n));
  }

  function lightbox() {
    const box = $('#lightbox');
    const img = $('img', box);
    const cap = $('figcaption', box);
    let opener = null;
    const close = () => {
      box.classList.remove('is-on');
      document.body.style.overflow = '';
      if (opener) opener.focus();
    };
    document.addEventListener('click', (e) => {
      const trigger = e.target.closest('[data-zoom]');
      if (trigger) {
        opener = trigger;
        img.src = trigger.dataset.zoom;
        img.alt = trigger.dataset.caption || '';
        cap.textContent = trigger.dataset.caption || '';
        box.classList.add('is-on');
        document.body.style.overflow = 'hidden';
        $('.lightbox-close', box).focus();
      } else if (box.classList.contains('is-on') && e.target.closest('#lightbox')) {
        close();
      }
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && box.classList.contains('is-on')) close(); });
  }

  // Analysis: the five findings share one slot; the buttons above pick which one is shown.
  function findingTabs() {
    const tabs = $$('.finding-tab');
    if (!tabs.length) return;
    const show = (n) => {
      tabs.forEach((tab) => {
        const on = tab.dataset.finding === n;
        tab.classList.toggle('is-on', on);
        tab.setAttribute('aria-selected', String(on));
        tab.tabIndex = on ? 0 : -1;
        $('#finding-' + tab.dataset.finding).hidden = !on;
        const strip = tab.parentElement;
        if (on && strip.scrollWidth > strip.clientWidth) {
          strip.scrollTo({ left: tab.offsetLeft - (strip.clientWidth - tab.offsetWidth) / 2, behavior: 'smooth' });
        }
      });
    };
    const fromHash = () => {
      const m = /^#finding-(\d)$/.exec(location.hash);
      return m && tabs.some((tab) => tab.dataset.finding === m[1]) ? m[1] : null;
    };
    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => show(tab.dataset.finding));
      tab.addEventListener('keydown', (e) => {
        const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (!step) return;
        const next = tabs[(i + step + tabs.length) % tabs.length];
        next.focus();
        show(next.dataset.finding);
      });
    });
    addEventListener('hashchange', () => { const n = fromHash(); if (n) show(n); });
    show(fromHash() || tabs[0].dataset.finding);
  }

  function copyButtons() {
    $$('[data-copy]').forEach((btn) => {
      const label = btn.textContent;
      btn.addEventListener('click', async () => {
        const text = $(btn.dataset.copy).textContent;
        try {
          await navigator.clipboard.writeText(text);
        } catch {
          const range = document.createRange();
          range.selectNodeContents($(btn.dataset.copy));
          getSelection().removeAllRanges();
          getSelection().addRange(range);
          document.execCommand('copy');
        }
        btn.textContent = 'Copied';
        setTimeout(() => { btn.textContent = label; }, 1600);
      });
    });
  }

  const boot = () => { findingTabs(); trackSections(); reveal(); lightbox(); copyButtons(); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();

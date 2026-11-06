/* 체이서 테일즈 3D 소개 사이트 */
(function () {
  'use strict';

  /* ------------------------------------------------------------------
   * 스토어 링크 설정 — 이곳 한 곳만 고치면 된다.
   * TODO: 스토어 URL (원스토어 / Google Play / 앱인토스)
   * url이 빈 칸이면 해당 버튼은 만들지 않는다. 모두 비어 있으면
   * HTML에 적힌 대체 표시("전투 살펴보기", "게임 정보", 안내 문장)가 그대로 보인다.
   * ------------------------------------------------------------------ */
  var STORE_LINKS = [
    { id: 'onestore', name: '원스토어', label: '원스토어에서 받기', url: '' },
    { id: 'googleplay', name: 'Google Play', label: 'Google Play에서 받기', url: '' },
    { id: 'appsintoss', name: '앱인토스', label: '토스에서 플레이', url: '' }
  ];

  var doc = document.documentElement;
  doc.classList.remove('no-js');
  doc.classList.add('js');

  document.addEventListener('DOMContentLoaded', function () {
    applyStoreLinks();
    initNav();
    initReveal();
    initLightbox();
  });

  function makeStoreLink(store, className) {
    var a = document.createElement('a');
    a.className = className;
    a.href = store.url;
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = store.label;
    return a;
  }

  function applyStoreLinks() {
    var live = STORE_LINKS.filter(function (s) { return s.url && s.label; });
    if (!live.length) return;
    var first = live[0];

    document.querySelectorAll('[data-store-cta]').forEach(function (el) {
      el.href = first.url;
      el.target = '_blank';
      el.rel = 'noopener';
      el.textContent = first.label;
    });
    document.querySelectorAll('[data-store-fallback]').forEach(function (el) { el.hidden = true; });

    var buttons = document.querySelector('[data-store-buttons]');
    if (buttons) {
      live.forEach(function (s, i) {
        buttons.appendChild(makeStoreLink(s, i === 0 ? 'btn btn-primary' : 'btn btn-outline'));
      });
      buttons.hidden = false;
    }

    var row = document.querySelector('[data-store-row]');
    var list = document.querySelector('[data-store-list]');
    if (row && list) {
      live.forEach(function (s) {
        var a = makeStoreLink(s, '');
        a.textContent = s.name;
        list.appendChild(a);
      });
      row.hidden = false;
    }
  }

  /* 모바일 메뉴 토글 */
  function initNav() {
    var btn = document.querySelector('.nav-toggle');
    var nav = document.getElementById('site-nav');
    if (!btn || !nav) return;

    function setOpen(open) {
      btn.setAttribute('aria-expanded', String(open));
      btn.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
      nav.classList.toggle('is-open', open);
    }
    btn.addEventListener('click', function () {
      setOpen(btn.getAttribute('aria-expanded') !== 'true');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setOpen(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        setOpen(false);
        btn.focus();
      }
    });
    window.matchMedia('(min-width: 768px)').addEventListener('change', function (mq) {
      if (mq.matches) setOpen(false);
    });
  }

  /* 스크롤 등장 효과 */
  function initReveal() {
    var items = document.querySelectorAll('.reveal');
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !('IntersectionObserver' in window)) return; // 숨기지 않으면 그대로 보인다
    // main.js가 실행된 경우에만 숨김 처리를 켠다. 스크립트 로드에 실패하면 .reveal은 처음부터 보인다.
    doc.classList.add('reveal-ready');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.1 });
    items.forEach(function (el) { io.observe(el); });
  }

  /* 스크린샷 라이트박스: 좌우 이동, Esc 닫기, 초점 가두기 */
  function initLightbox() {
    var box = document.getElementById('lightbox');
    var links = Array.prototype.slice.call(document.querySelectorAll('.gallery-item'));
    if (!box || !links.length) return;

    var img = box.querySelector('.lb-img');
    var count = box.querySelector('.lb-count');
    var btnClose = box.querySelector('.lb-close');
    var btnPrev = box.querySelector('.lb-prev');
    var btnNext = box.querySelector('.lb-next');
    var index = 0;
    var opener = null;

    function show(i) {
      index = (i + links.length) % links.length;
      var link = links[index];
      var thumb = link.querySelector('img');
      img.src = link.getAttribute('href');
      img.alt = thumb ? thumb.alt : '';
      count.textContent = (index + 1) + ' / ' + links.length;
    }
    function open(i) {
      opener = document.activeElement;
      show(i);
      box.hidden = false;
      document.body.classList.add('lb-open');
      btnClose.focus();
    }
    function close() {
      box.hidden = true;
      document.body.classList.remove('lb-open');
      if (opener) opener.focus();
    }

    links.forEach(function (link, i) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        open(i);
      });
    });
    btnClose.addEventListener('click', close);
    btnPrev.addEventListener('click', function () { show(index - 1); });
    btnNext.addEventListener('click', function () { show(index + 1); });
    box.addEventListener('click', function (e) {
      if (e.target === box) close();
    });

    box.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { e.preventDefault(); close(); return; }
      if (e.key === 'ArrowLeft') { show(index - 1); return; }
      if (e.key === 'ArrowRight') { show(index + 1); return; }
      if (e.key === 'Tab') {
        var focusables = [btnClose, btnPrev, btnNext];
        var pos = focusables.indexOf(document.activeElement);
        e.preventDefault();
        var next = e.shiftKey ? pos - 1 : pos + 1;
        focusables[(next + focusables.length) % focusables.length].focus();
      }
    });
  }
})();

/* ============================================================
   CASE STUDY · scroll-driven motion (GSAP + ScrollTrigger)
   Patterns: P1 fade-up · P2 stagger · P3 pinned scrub · P5 progress
   Nav (progress + scrollspy + hamburger) is GSAP-independent so it
   always works — including with reduced motion or if GSAP fails.
   ============================================================ */
(function () {
  'use strict';

  var REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ============================================================
     NAV — progress bar · scrollspy · mobile menu   (vanilla)
     ============================================================ */
  (function nav() {
    var navEl = document.getElementById('nav');
    var bar = document.getElementById('progress');
    var burger = document.getElementById('navBurger');
    var links = Array.prototype.slice.call(document.querySelectorAll('.nav__links a[data-spy]'));
    var sections = links.map(function (a) { return document.getElementById(a.getAttribute('data-spy')); });

    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        // reading progress (0→1) — instant, no easing (fine for reduced motion)
        var doc = document.documentElement;
        var max = doc.scrollHeight - doc.clientHeight;
        var p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
        if (bar) bar.style.transform = 'scaleX(' + p + ')';

        // scrollspy — active = last anchor section whose top passed the line
        var line = (navEl ? navEl.offsetHeight : 60) + doc.clientHeight * 0.25;
        var activeIdx = 0;
        for (var i = 0; i < sections.length; i++) {
          if (sections[i] && sections[i].getBoundingClientRect().top <= line) activeIdx = i;
        }
        links.forEach(function (a, i) {
          if (i === activeIdx) a.setAttribute('aria-current', 'true');
          else a.removeAttribute('aria-current');
        });
        ticking = false;
      });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();

    // mobile hamburger
    if (burger && navEl) {
      burger.addEventListener('click', function () {
        var open = navEl.classList.toggle('is-open');
        burger.setAttribute('aria-expanded', String(open));
        burger.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
      });
      // close on link tap
      links.forEach(function (a) {
        a.addEventListener('click', function () {
          navEl.classList.remove('is-open');
          burger.setAttribute('aria-expanded', 'false');
          burger.setAttribute('aria-label', '메뉴 열기');
        });
      });
    }
  })();

  /* ============================================================
     FINAL DESIGN — 챕터형 데모 (vanilla · GSAP 독립)
     칩 클릭 → 패널 전환 + 영상 시킹, 재생 시 진행바·챕터 자동 하이라이트
     영상 파일이 없어도 칩으로 설명 패널은 전환됨
     ============================================================ */
  (function finalDemo() {
    var video = document.getElementById('fdVideo');
    var bar = document.getElementById('fdProgressBar');
    var chips = Array.prototype.slice.call(document.querySelectorAll('.fd-chip'));
    var bodies = Array.prototype.slice.call(document.querySelectorAll('.fd-panel__body'));
    if (!chips.length) return;

    function activate(ch) {
      chips.forEach(function (c) {
        var on = c.getAttribute('data-ch') === ch;
        c.classList.toggle('is-active', on);
        c.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      bodies.forEach(function (b) {
        b.classList.toggle('is-active', b.getAttribute('data-ch') === ch);
      });
    }

    chips.forEach(function (c) {
      c.addEventListener('click', function () {
        activate(c.getAttribute('data-ch'));
        if (video) {
          var start = parseFloat(c.getAttribute('data-start')) || 0;
          try { video.currentTime = start; var p = video.play(); if (p) p.catch(function () {}); } catch (e) {}
        }
      });
    });

    if (video) {
      var starts = chips.map(function (c) { return parseFloat(c.getAttribute('data-start')) || 0; });
      video.addEventListener('timeupdate', function () {
        if (video.duration && bar) {
          bar.style.width = (Math.min(1, video.currentTime / video.duration) * 100) + '%';
        }
        var idx = 0;
        for (var i = 0; i < starts.length; i++) { if (video.currentTime >= starts[i] - 0.15) idx = i; }
        var cur = String(idx);
        var active = document.querySelector('.fd-chip.is-active');
        if (!active || active.getAttribute('data-ch') !== cur) activate(cur);
      });
    }
  })();

  /* ============================================================
     Animations — require GSAP; skipped under reduced motion
     ============================================================ */
  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);

  if (REDUCED) {
    gsap.set('.reveal, .stagger > *', { clearProps: 'all', opacity: 1, y: 0 });
    gsap.set('[data-r], [data-pp], [data-dir]', { clearProps: 'all', opacity: 1 });
    gsap.set('.reading__words', { display: 'none' }); // 장식 단어만 숨김 · 의미 그리드는 정적으로 표시
    return;
  }

  /* ---- Hero intro · title → sub, on entry (not scroll-driven) ---- */
  (function heroIntro() {
    var items = gsap.utils.toArray('#hero [data-hero]');
    if (!items.length) return;
    gsap.from(items, {
      opacity: 0, y: 24, duration: 0.7, ease: 'power2.out',
      stagger: 0.12, delay: 0.15
    });
  })();

  /* ---- P1 · fade-up reveals ---- */
  gsap.utils.toArray('.reveal').forEach(function (el) {
    gsap.from(el, {
      opacity: 0, y: 20, duration: 0.6, ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 85%' }
    });
  });

  /* ---- P2 · stagger reveals (each .stagger container) ---- */
  gsap.utils.toArray('.stagger').forEach(function (group) {
    gsap.from(group.children, {
      opacity: 0, y: 16, stagger: 0.08, duration: 0.5, ease: 'power2.out',
      scrollTrigger: { trigger: group, start: 'top 78%' }
    });
  });

  /* ============================================================
     P3 · Pinned scrub — 3 · Reading Between the Lines
     original blurs → 6 words rise → meaning grid → problem def
     ============================================================ */
  (function reading() {
    var sec = document.getElementById('reading');
    if (!sec) return;
    sec.classList.add('is-scrub'); // 정적 흐름 → 100vh 핀 오버레이 레이아웃으로 전환

    gsap.set('[data-r="words"]', { display: 'block' });
    gsap.set('[data-r="words"] li', { xPercent: -50, yPercent: -50, opacity: 0, y: 14, scale: 0.94 });
    gsap.set('[data-r="grid"]', { opacity: 0, y: 24 });
    gsap.set('[data-r="problem"]', { opacity: 0, y: 24 });
    gsap.set('[data-r="docimg"]', { opacity: 1 });

    var tl = gsap.timeline({
      scrollTrigger: { trigger: sec, start: 'top top', end: '+=2800', scrub: true, pin: true }
    });

    // Step 2 · 원문 이미지 100→20% 흐려짐 + 실제 글씨 자리에서 핵심 단어 '한 번에' 부상
    tl.to('[data-r="docimg"]', { opacity: 0.2, filter: 'blur(2px)', duration: 1 })
      .to('[data-r="words"] li', { opacity: 1, y: 0, scale: 1, duration: 0.6 }, '<')
      // Step 3 · 원문(이미지+단어) 사라지고 → 의미 그리드 6쌍 동시 fade-in
      .to('[data-r="original"]', { opacity: 0, y: -18, duration: 0.6 }, '+=0.7')
      .to('[data-r="grid"]', { opacity: 1, y: 0, duration: 0.8 }, '<0.1')
      // Step 4 · 그리드 사라지고 Problem Recognition 인용 등장 (마지막 비트)
      .to('[data-r="grid"]', { opacity: 0, y: -18, duration: 0.6 }, '+=0.9')
      .to('[data-r="problem"]', { opacity: 1, y: 0, duration: 0.8 }, '<0.1');
  })();

  /* ============================================================
     Pinned scrub — 4 · Pain Points
     하나의 일 → 세 조각으로 분해 → 설명 → 세 카드 → 사람 등장 →
     ③②① 순서로 사람 위에 쌓임(눌림) → 요약 → 리서치로 브리지
     ============================================================ */
  (function pain() {
    var sec = document.getElementById('pain');
    if (!sec) return;
    sec.classList.add('is-scrub'); // 정적 흐름 → 100vh 핀 오버레이 안무로 전환

    var cards = gsap.utils.toArray('#pain [data-pp="card"]'); // [① 모으기, ② 비교하기, ③ 조율하기]

    // 초기 상태 — 세 카드는 중앙에 겹쳐(분해 전), 사람은 화면 아래
    gsap.set('[data-pp="whole"]', { display: 'block', xPercent: -50, yPercent: -50, left: '50%', top: '42%', opacity: 1, scale: 1 });
    gsap.set(cards, { xPercent: -50, yPercent: -50, left: '50%', top: '42%', scale: 0.9, opacity: 0 });
    gsap.set('[data-pp="desc"]', { opacity: 0, y: 10 });
    gsap.set('[data-pp="person"]', { xPercent: -50, yPercent: -50, left: '50%', top: '108%', opacity: 0, scale: 1 });
    gsap.set('[data-pp="text"]', { opacity: 0, y: 16 });
    gsap.set('[data-pp="bridge"]', { opacity: 0, y: 16 });

    var stage = sec.querySelector('.pin-stage'); // 섹션 타이틀은 위에 두고 스테이지만 핀
    var tl = gsap.timeline({
      scrollTrigger: { trigger: stage, start: 'top top', end: '+=5000', scrub: true, pin: stage }
    });

    // Step 2 · 한 카드가 세 조각으로 분해 (translate + scale)
    tl.to('[data-pp="whole"]', { opacity: 0, scale: 0.86, duration: 0.6 })
      .to(cards[0], { left: '18%', top: '34%', scale: 1, opacity: 1, duration: 0.8 }, '<')
      .to(cards[1], { left: '50%', top: '34%', scale: 1, opacity: 1, duration: 0.8 }, '<')
      .to(cards[2], { left: '82%', top: '34%', scale: 1, opacity: 1, duration: 0.8 }, '<')
      // Step 3 · 각 카드 설명 동시 등장 (stagger 0.08)
      .to('[data-pp="desc"]', { opacity: 1, y: 0, stagger: 0.08, duration: 0.6 }, '+=0.4')
      // Step 4 · 설명 사라지고 세 카드만
      .to('[data-pp="desc"]', { opacity: 0, y: 8, duration: 0.5 }, '+=0.7')
      // Step 5 · 화면 아래에서 한 사람 등장
      .to('[data-pp="person"]', { top: '60%', opacity: 1, duration: 0.8 }, '+=0.2')
      // Step 6 · ③ → ② → ① 순서로 사람 위에 쌓임 + 쌓일수록 사람 눌림
      .to(cards[2], { left: '50%', top: '52%', scale: 0.96, duration: 0.7 }, '+=0.2')
      .to('[data-pp="person"]', { scale: 0.993, duration: 0.4 }, '<0.2')
      .to(cards[1], { left: '50%', top: '48%', scale: 0.96, duration: 0.7 }, '+=0.1')
      .to('[data-pp="person"]', { scale: 0.986, duration: 0.4 }, '<0.2')
      .to(cards[0], { left: '50%', top: '44%', scale: 0.96, duration: 0.7 }, '+=0.1')
      .to('[data-pp="person"]', { scale: 0.98, duration: 0.4 }, '<0.2')
      // Step 7 · 카드 유지, 텍스트만 fade-in
      .to('[data-pp="text"]', { opacity: 1, y: 0, duration: 0.8 }, '+=0.5')
      // Transition → Research · 텍스트 물러나고 브리지 문장
      .to('[data-pp="text"]', { opacity: 0, y: -14, duration: 0.6 }, '+=0.9')
      .to('[data-pp="bridge"]', { opacity: 1, y: 0, duration: 0.8 }, '<0.1');
  })();

  /* ============================================================
     Pinned scrub — 6 · Design Direction
     Host의 ①②③ → System으로 이동 → ③이 추천/최종결정으로 분리 →
     닫는 문장 → 다이어그램 축소 + 솔루션으로 브리지
     ============================================================ */
  (function direction() {
    var sec = document.getElementById('direction');
    if (!sec) return;
    sec.classList.add('is-scrub'); // 정적 흐름 → 100vh 핀 안무로 전환

    // 초기 배치 (무대 좌표계: %). 두 레인 — System(top 12%) / Host(top 82%)
    gsap.set('[data-dir="system"]', { xPercent: 0, yPercent: -50, left: '0%', top: '12%', opacity: 0.35 });
    gsap.set('[data-dir="host"]',   { xPercent: 0, yPercent: -50, left: '0%', top: '82%', opacity: 1 });
    gsap.set('[data-dir="c1"]', { xPercent: -50, yPercent: -50, left: '34%', top: '82%', opacity: 1, scale: 1 });
    gsap.set('[data-dir="c2"]', { xPercent: -50, yPercent: -50, left: '58%', top: '82%', opacity: 1, scale: 1 });
    gsap.set('[data-dir="c3"]', { xPercent: -50, yPercent: -50, left: '82%', top: '82%', opacity: 1, scale: 1 });
    gsap.set('[data-dir="rec"]',    { xPercent: -50, yPercent: -50, left: '82%', top: '12%', opacity: 0, scale: 0.9 });
    gsap.set('[data-dir="decide"]', { xPercent: -50, yPercent: -50, left: '58%', top: '82%', opacity: 0, scale: 0.9 });
    gsap.set('[data-dir="flow"]',   { xPercent: -50, yPercent: -50, left: '50%', top: '47%', opacity: 0 });
    gsap.set('[data-dir="closing"]', { opacity: 0, y: 16 });

    var tl = gsap.timeline({
      scrollTrigger: { trigger: sec, start: 'top top', end: '+=3600', scrub: true, pin: true }
    });

    // Step 1 · ① 모으기 Host → System
    tl.to('[data-dir="c1"]', { left: '34%', top: '12%', duration: 1 })
      .to('[data-dir="system"]', { opacity: 1, duration: 0.5 }, '<')
      // Step 2 · ② 비교하기 → System
      .to('[data-dir="c2"]', { left: '58%', top: '12%', duration: 1 }, '+=0.3')
      // Step 3 · ③ 조율하기가 가운데로 이동 → 추천/최종결정으로 분리
      .to('[data-dir="c3"]', { left: '50%', top: '47%', scale: 1.02, duration: 0.8 }, '+=0.3')
      .to('[data-dir="c3"]', { opacity: 0, scale: 0.9, duration: 0.5 }, '+=0.2')
      .to('[data-dir="rec"]',    { opacity: 1, scale: 1, duration: 0.6 }, '<')
      .to('[data-dir="decide"]', { opacity: 1, scale: 1, duration: 0.6 }, '<0.1')
      .to('[data-dir="flow"]',   { opacity: 1, duration: 0.5 }, '<')
      // Step 4 · 닫는 문장 (마지막 · 브리지 삭제)
      .to('[data-dir="closing"]', { opacity: 1, y: 0, duration: 0.7 }, '+=0.4');
  })();

  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();

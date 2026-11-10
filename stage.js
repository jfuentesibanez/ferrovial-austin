/* Keyboard/click presentation controller. Content and step order live in HTML. */
(() => {
  'use strict';
  const slides = [...document.querySelectorAll('.slide')];
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  const root = document.documentElement;
  let index = -1, viaje = null, motionOff = media.matches, controlsTimer;
  const nav = document.createElement('nav');
  nav.className = 'deck-controls';
  nav.setAttribute('aria-label', 'Presentation controls');
  nav.innerHTML = '<button type="button" data-action="prev" aria-label="Previous step or slide" title="Previous · ←">←</button><button type="button" data-action="next" aria-label="Next step or slide" title="Next · →">→</button><button type="button" data-action="chapters" title="Slide navigator · G">Chapters</button><button type="button" data-action="motion" title="Toggle motion · M" aria-pressed="false">Motion</button><button type="button" data-action="fullscreen" aria-label="Toggle full screen" title="Full screen · F">⛶</button><button type="button" data-action="help" aria-label="Keyboard shortcuts" title="Keyboard shortcuts · ?">?</button>';
  document.body.append(nav);
  const status = document.createElement('div');
  status.className = 'deck-status'; status.setAttribute('aria-live', 'polite'); status.setAttribute('aria-atomic', 'true');
  document.body.append(status);
  const blackout = document.createElement('div');
  blackout.className = 'blackout'; blackout.setAttribute('aria-hidden', 'true'); document.body.append(blackout);

  function title(slide, n) {
    const el = slide.querySelector('.gigante,.statement') || slide.querySelector('.kicker,.num');
    const copy = el?.cloneNode(true);
    copy?.querySelectorAll('br').forEach(br => br.replaceWith(' '));
    return slide.dataset.title || copy?.textContent.trim().replace(/\s+/g, ' ') || `Slide ${n + 1}`;
  }
  slides.forEach((slide, n) => {
    slide.setAttribute('role', 'group'); slide.setAttribute('aria-roledescription', 'slide');
    slide.setAttribute('aria-label', `${n + 1} of ${slides.length}: ${title(slide, n)}`);
    const heading = slide.querySelector('.gigante,.statement');
    if (heading) { heading.setAttribute('role', 'heading'); heading.setAttribute('aria-level', '1'); }
    slide.querySelectorAll('.step').forEach(step => step.setAttribute('aria-hidden', String(!step.classList.contains('on'))));
  });

  function dialog(id, heading) {
    const el = document.createElement('dialog'); el.className = 'deck-dialog'; el.id = id;
    el.setAttribute('aria-labelledby', `${id}-title`);
    el.innerHTML = `<div class="dialog-head"><h2 id="${id}-title">${heading}</h2><button type="button" data-close>Close · Esc</button></div>`;
    el.querySelector('[data-close]').addEventListener('click', () => el.close());
    document.body.append(el); return el;
  }
  const chapters = dialog('chapters', 'Find your place');
  const links = document.createElement('div'); links.className = 'chapter-links';
  slides.forEach((slide, n) => {
    if (!slide.dataset.chapter) return;
    const button = document.createElement('button'); button.type = 'button';
    button.textContent = `${String(n + 1).padStart(2, '0')}  /  ${slide.dataset.chapter}`;
    button.addEventListener('click', () => { chapters.close(); go(n); }); links.append(button);
  });
  chapters.append(links);
  const jump = document.createElement('form'); jump.className = 'jump-form';
  jump.innerHTML = `<label for="slide-number">Go to slide</label><input id="slide-number" type="number" min="1" max="${slides.length}" required value="1"><span>of ${slides.length}</span><button type="submit">Go →</button>`;
  jump.addEventListener('submit', event => { event.preventDefault(); const n = Number(jump.querySelector('input').value); if (jump.reportValidity()) { chapters.close(); go(n - 1); } });
  chapters.append(jump);
  const help = dialog('shortcuts', 'Presenter shortcuts');
  help.insertAdjacentHTML('beforeend', '<dl class="shortcuts"><dt>→ / Space</dt><dd>Next reveal or slide</dd><dt>← / Page Up</dt><dd>Previous reveal or slide</dd><dt>Home / End</dt><dd>First / last slide</dd><dt>G</dt><dd>Chapter navigator and slide number</dd><dt>F</dt><dd>Toggle full screen</dd><dt>B / .</dt><dd>Black screen; press again to return</dd><dt>M</dt><dd>Turn motion off / on</dd><dt>?</dt><dd>Show these shortcuts</dd><dt>Click</dt><dd>Right side: next. Left 20%: previous.</dd></dl>');

  const travelSlide = slides.find(s => s.classList.contains('viaje'));
  const fallback = document.createElement('div'); fallback.className = 'travel-fallback';
  fallback.textContent = '2026'; travelSlide.append(fallback);
  const eras = [
    ['2026', 'city'], ['1750', 'ship'], ['12,000 BC', 'wheat'],
    ['100,000 BC', 'fire'], ['2026', 'city'], ['2045', 'future']
  ];
  let eraIndex = 0, webglFailed = false;
  function paintEra() {
    fallback.textContent = eras[eraIndex][0];
    fallback.style.backgroundImage = `linear-gradient(0deg,#000b,#0005),url('img/viaje-${eras[eraIndex][1]}.jpg')`;
  }
  function enterTravel() {
    if (motionOff || webglFailed || !window.THREE || !window.initViaje) {
      travelSlide.classList.add('fallback'); paintEra(); return;
    }
    try {
      if (!viaje) viaje = window.initViaje(travelSlide);
      travelSlide.classList.remove('fallback'); viaje.enter();
    } catch (error) {
      webglFailed = true; travelSlide.classList.add('fallback'); paintEra();
      console.warn('3D time journey unavailable; using the image sequence.', error);
    }
  }
  function setMotion(off) {
    motionOff = off; root.classList.toggle('motion-off', off);
    const button = nav.querySelector('[data-action="motion"]');
    button.setAttribute('aria-pressed', String(!off)); button.textContent = off ? 'Motion off' : 'Motion on';
    if (slides[index] === travelSlide) { if (viaje) viaje.leave(); enterTravel(); }
  }
  media.addEventListener('change', event => setMotion(event.matches));
  setMotion(motionOff);

  function go(n, updateHash = true) {
    n = Math.max(0, Math.min(slides.length - 1, Math.floor(n)));
    if (!Number.isFinite(n) || n === index) return;
    if (viaje && slides[index] === travelSlide) viaje.leave();
    index = n;
    slides.forEach((s, k) => {
      s.classList.toggle('on', k === index); s.setAttribute('aria-hidden', String(k !== index)); s.inert = k !== index;
    });
    const s = slides[index];
    document.body.classList.toggle('light-slide', s.matches('.chapter,.question,.claro'));
    if (s === travelSlide) enterTravel();
    document.getElementById('barra').style.width = `${(index + 1) / slides.length * 100}%`;
    document.getElementById('pag').textContent = `${String(index + 1).padStart(2, '0')} / ${slides.length}`;
    status.textContent = `Slide ${index + 1} of ${slides.length}. ${title(s, index)}`;
    jump.querySelector('input').value = index + 1;
    if (updateHash && location.hash !== `#${index + 1}`) history.replaceState(null, '', `#${index + 1}`);
  }
  function step(dir) {
    const current = slides[index];
    if (!current.classList.contains('steps')) return false;
    const steps = [...current.querySelectorAll('.step')];
    const target = dir > 0 ? steps.find(s => !s.classList.contains('on')) : steps.reverse().find(s => s.classList.contains('on'));
    if (!target) return false;
    target.classList.toggle('on', dir > 0); target.setAttribute('aria-hidden', String(dir < 0));
    if (dir > 0) status.textContent = target.textContent.trim() || target.querySelector('img')?.alt || 'Image revealed';
    return true;
  }
  function advance(dir) {
    if (slides[index] === travelSlide) {
      if (travelSlide.classList.contains('fallback')) {
        const next = eraIndex + dir;
        if (next >= 0 && next < eras.length) { eraIndex = next; paintEra(); return; }
      } else if (viaje && viaje.handle(dir)) return;
    }
    if (!step(dir)) go(index + dir);
  }
  function showControls() {
    document.body.classList.add('controls-visible'); clearTimeout(controlsTimer);
    controlsTimer = setTimeout(() => document.body.classList.remove('controls-visible'), 2200);
  }
  async function fullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (root.requestFullscreen) await root.requestFullscreen();
    } catch { status.textContent = 'Use your browser full-screen command.'; }
  }
  function openDialog(el) { el.showModal(); }
  nav.addEventListener('click', event => {
    const action = event.target.closest('button')?.dataset.action;
    if (action === 'prev') advance(-1);
    if (action === 'next') advance(1);
    if (action === 'chapters') openDialog(chapters);
    if (action === 'help') openDialog(help);
    if (action === 'motion') setMotion(!motionOff);
    if (action === 'fullscreen') fullscreen();
  });
  document.addEventListener('keydown', event => {
    if (chapters.open || help.open || event.target.closest('input,textarea,select') || event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.target.closest('button') && [' ', 'Enter'].includes(event.key)) return;
    if (event.repeat) return;
    if (document.body.classList.contains('is-blackout')) {
      if (['b', 'B', '.', 'Escape'].includes(event.key)) document.body.classList.remove('is-blackout');
      return;
    }
    if (['ArrowRight', ' ', 'PageDown', 'Enter'].includes(event.key)) { event.preventDefault(); advance(1); }
    else if (['ArrowLeft', 'PageUp', 'Backspace'].includes(event.key)) { event.preventDefault(); advance(-1); }
    else if (event.key === 'Home') { event.preventDefault(); go(0); }
    else if (event.key === 'End') { event.preventDefault(); go(slides.length - 1); }
    else if (event.key.toLowerCase() === 'f') fullscreen();
    else if (event.key.toLowerCase() === 'g') openDialog(chapters);
    else if (event.key.toLowerCase() === 'm') setMotion(!motionOff);
    else if (['b', 'B', '.'].includes(event.key)) document.body.classList.add('is-blackout');
    else if (event.key === '?') openDialog(help);
  });
  document.addEventListener('click', event => {
    if (event.target.closest('button,a,input,dialog,nav') || chapters.open || help.open) return;
    if (document.body.classList.contains('is-blackout')) { document.body.classList.remove('is-blackout'); return; }
    advance(event.clientX < innerWidth * .2 ? -1 : 1);
  });
  document.addEventListener('pointermove', showControls, { passive:true });
  document.addEventListener('focusin', showControls);
  function fromHash() {
    const hash = location.hash.slice(1);
    const n = /^\d+$/.test(hash) ? Number(hash) - 1 : 0;
    go(n);
  }
  window.addEventListener('hashchange', fromHash);
  document.addEventListener('visibilitychange', () => {
    if (slides[index] !== travelSlide || !viaje) return;
    if (document.hidden) viaje.leave(); else if (!motionOff) viaje.enter();
  });
  fromHash();
})();

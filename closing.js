/* Camera choreography for the closing portrait; standard deck arrows own the steps. */
(() => {
  'use strict';
  const slide = document.querySelector('.executive-close');
  if (!slide) return;
  const photo = slide.querySelector('.executive-photo');
  const beats = [...slide.querySelectorAll('.executive-beat')];
  const bars = [...slide.querySelectorAll('.executive-progress span')];
  const frames = {
    eyes: { x: .222, y: .235, scale: 2.75 },
    face: { x: .228, y: .29, scale: 2.1 },
    hands: { x: .268, y: .83, scale: 2.2 },
    wide: { x: .245, y: .50, scale: 1.12 },
    decision: { x: .229, y: .31, scale: 2.0 },
    closing: { x: .28, y: .47, scale: 1 }
  };
  let lastKey = '';
  function update(force = false) {
    const active = slide.classList.contains('on');
    const index = beats.reduce((n, beat, i) => beat.classList.contains('on') ? i : n, -1);
    const still = document.documentElement.classList.contains('motion-off');
    const key = [active,index,still].join(':');
    if (!force && key === lastKey) return;
    lastKey = key;
    slide.classList.toggle('has-beat', index >= 0);
    beats.forEach((beat,i) => beat.classList.toggle('executive-active', i === index));
    bars.forEach((bar,i) => { bar.classList.toggle('passed', i <= index); bar.classList.toggle('current', i === index); });
    const frame = active && index >= 0 && !still ? frames[beats[index].dataset.focus] : frames.closing;
    const w = slide.clientWidth, h = slide.clientHeight;
    const ratio = (photo.naturalWidth || 1672) / (photo.naturalHeight || 941);
    const renderedW = Math.max(w, h * ratio), renderedH = renderedW / ratio;
    const focusX = (w - renderedW) / 2 + frame.x * renderedW;
    const focusY = (h - renderedH) / 2 + frame.y * renderedH;
    const tx = frame.scale === 1 ? 0 : Math.min(0, Math.max(w * (1-frame.scale), w * .28 - focusX * frame.scale));
    const ty = frame.scale === 1 ? 0 : Math.min(0, Math.max(h * (1-frame.scale), h * .46 - focusY * frame.scale));
    slide.style.setProperty('--camera-scale', frame.scale);
    slide.style.setProperty('--camera-x', tx + 'px');
    slide.style.setProperty('--camera-y', ty + 'px');
  }
  const observer = new MutationObserver(() => update());
  observer.observe(slide, { attributes:true, attributeFilter:['class'] });
  beats.forEach(beat => observer.observe(beat, { attributes:true, attributeFilter:['class'] }));
  observer.observe(document.documentElement, { attributes:true, attributeFilter:['class'] });
  photo.addEventListener('load', () => update(true));
  window.addEventListener('resize', () => update(true));
  update();
})();

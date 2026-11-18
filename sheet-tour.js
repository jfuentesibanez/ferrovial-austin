/* Prezi-style camera over actual captures of the two-page process sheet. */
(() => {
  'use strict';
  const slide = document.querySelector('.sheet-tour');
  if (!slide) return;
  const viewport = slide.querySelector('.sheet-window');
  const world = slide.querySelector('.sheet-world');
  const focus = slide.querySelector('.sheet-focus');
  const beats = [...slide.querySelectorAll('.sheet-beat')];
  const bars = [...slide.querySelectorAll('.sheet-progress span')];
  const frames = {
    overview: { x:0, y:0, w:1624, h:1123 },
    process: { x:40, y:195, w:714, h:286 },
    steps: { x:40, y:476, w:714, h:343 },
    pain: { x:40, y:818, w:714, h:215 },
    layers: { x:870, y:148, w:714, h:208 },
    human: { x:870, y:354, w:714, h:158 },
    trial: { x:870, y:509, w:714, h:283 },
    priorities: { x:870, y:789, w:714, h:159 }
  };
  let lastKey = '';
  function update(force = false) {
    const index = beats.reduce((n, b, i) => b.classList.contains('on') ? i : n, -1);
    const key = [slide.classList.contains('on'), index].join(':');
    if (!force && key === lastKey) return;
    lastKey = key;
    const name = index < 0 ? 'overview' : beats[index].dataset.frame;
    const frame = frames[name];
    slide.classList.toggle('has-focus', index >= 0);
    beats.forEach((b,i) => {
      b.classList.toggle('sheet-active', i === index);
      b.setAttribute('aria-hidden', String(i !== index));
    });
    slide.querySelector('.sheet-intro').setAttribute('aria-hidden', String(index >= 0));
    bars.forEach((b,i) => { b.classList.toggle('passed', i <= index); b.classList.toggle('current', i === index); });
    const w = viewport.clientWidth, h = viewport.clientHeight;
    const scale = Math.min(w / frame.w, h / frame.h) * .94;
    const x = (w - frame.w * scale) / 2 - frame.x * scale;
    const y = (h - frame.h * scale) / 2 - frame.y * scale;
    world.style.transform = `translate(${x}px,${y}px) scale(${scale})`;
    Object.assign(focus.style, {left:frame.x+'px',top:frame.y+'px',width:frame.w+'px',height:frame.h+'px',opacity:name === 'overview' ? '0' : '1'});
  }
  const observer = new MutationObserver(() => update());
  observer.observe(slide, {attributes:true, attributeFilter:['class']});
  beats.forEach(b => observer.observe(b, {attributes:true, attributeFilter:['class']}));
  window.addEventListener('resize', () => update(true));
  update();
})();

/* The deck controller owns navigation. Each reveal reframes the same photo. */
(() => {
  'use strict';
  const slide = document.querySelector('.monday-tour');
  if (!slide) return;

  const photo = slide.querySelector('.monday-photo');
  const intro = slide.querySelector('.monday-intro');
  const beats = [...slide.querySelectorAll('.monday-beat')];
  const portrait = matchMedia('(max-aspect-ratio:1/1)');
  const frames = beats.map(beat => beat.dataset.frame?.split(' ').map(Number));
  let previous = -2;

  function update(resize = false) {
    if (!slide.classList.contains('on')) return;
    const index = beats.findLastIndex(beat => beat.classList.contains('on'));
    if (index === previous && !resize) return;
    previous = index;

    const beat = beats[index];
    if (beat) slide.dataset.view = beat.dataset.view;
    else delete slide.dataset.view;
    intro.setAttribute('aria-hidden', String(Boolean(beat)));
    beats.forEach((item, i) => {
      item.classList.toggle('monday-current', i === index);
      item.setAttribute('aria-hidden', String(i !== index));
    });

    const [x, y, zoom] = frames[index] || [.5, .5, 1];
    const w = slide.clientWidth;
    const h = slide.clientHeight;
    const ratio = photo.naturalWidth ? photo.naturalWidth / photo.naturalHeight : 1672 / 941;
    const imageWidth = Math.max(w, h * ratio);
    const imageHeight = imageWidth / ratio;
    const focusX = (w - imageWidth) / 2 + x * imageWidth;
    const focusY = (h - imageHeight) / 2 + y * imageHeight;
    const narrow = portrait.matches;
    const scale = narrow ? Math.min(zoom, 2.1) : zoom;
    const anchorX = narrow ? .5 : beat?.dataset.view === 'left' ? .72 : .30;
    const anchorY = narrow ? .35 : .51;
    const tx = Math.min(0, Math.max(w * (1 - scale), w * anchorX - focusX * scale));
    const ty = Math.min(0, Math.max(h * (1 - scale), h * anchorY - focusY * scale));
    slide.style.setProperty('--monday-x', `${tx}px`);
    slide.style.setProperty('--monday-y', `${ty}px`);
    slide.style.setProperty('--monday-scale', scale);
  }

  const observer = new MutationObserver(records => {
    if (records.some(record => record.target === slide)) previous = -2;
    update();
  });
  const options = { attributes:true, attributeFilter:['class'] };
  observer.observe(slide, options);
  beats.forEach(beat => observer.observe(beat, options));
  photo.addEventListener('load', () => update(true));
  window.addEventListener('resize', () => update(true));
  update();
})();

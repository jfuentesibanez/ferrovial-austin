(() => {
'use strict';
const slide=document.querySelector('.frontier-tour');
if(!slide)return;
const svg=slide.querySelector('svg'), beats=[...slide.querySelectorAll('.frontier-beat')];
// Keep each human circle and its AI boundary together. Large later boundaries
// must not cover the example currently being discussed.
const stages=[...svg.querySelectorAll(':scope > circle')].map(circle=>{
 const boundary=circle.nextElementSibling;
 const group=document.createElementNS('http://www.w3.org/2000/svg','g');
 svg.insertBefore(group,circle);group.append(circle,boundary);
 return group;
});
const arrows=[...svg.querySelectorAll(':scope > path')];
let previous='', raf=0, box=[0,-20,2000,740];
function update(force=false){
 const index=beats.reduce((last,e,i)=>e.classList.contains('on')?i:last,-1);
 const still=document.documentElement.classList.contains('motion-off');
 const key=[slide.classList.contains('on'),index,still].join(':');
 if(!force&&key===previous)return;previous=key;
 slide.classList.toggle('has-focus',index>=0);
 beats.forEach((e,i)=>e.classList.toggle('frontier-active',i===index));
 const focused=index>=0&&index<beats.length-1;
 const visible=focused?beats[index].dataset.focus.split(',').map(Number):null;
 stages.forEach((g,i)=>{g.style.transition=still?'none':'opacity .35s ease';g.style.opacity=!visible||visible.includes(i)?'1':'0';});
 arrows.forEach(p=>{p.style.opacity=focused?'0':'.45';});
 let target=[0,-20,2000,740];
 if(focused){
  const [cx,cy,w]=beats[index].dataset.camera.split(',').map(Number);
  const rect=svg.getBoundingClientRect(),aspect=rect.width/rect.height||2.77;
  const height=Math.max(w/aspect,Number(beats[index].dataset.minHeight)||0),width=height*aspect;
  target=[cx-width/2,cy-height/2,width,height];
 }
 cancelAnimationFrame(raf);
 const from=box.slice(),start=performance.now();
 function tick(now){
  const t=still?1:Math.min(1,(now-start)/1200),ease=1-Math.pow(1-t,3);
  box=from.map((v,i)=>v+(target[i]-v)*ease);
  svg.setAttribute('viewBox',box.join(' '));
  if(t<1)raf=requestAnimationFrame(tick);
 }
 raf=requestAnimationFrame(tick);
}
const obs=new MutationObserver(()=>update());
obs.observe(slide,{attributes:true,attributeFilter:['class']});
beats.forEach(e=>obs.observe(e,{attributes:true,attributeFilter:['class']}));
obs.observe(document.documentElement,{attributes:true,attributeFilter:['class']});
window.addEventListener('resize',()=>update(true));update();
})();

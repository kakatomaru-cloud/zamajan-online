/* ZAMAZONE_MOBILE_FIXED_CONTROLLER_V1_20261120
 * Thumb-friendly touch controller in a dedicated row below the playfield.
 * Uses the game's own `pressed` set, supports multi-touch, safe-area inset,
 * and never overlays shop or dialog modes. Desktop keyboard unchanged.
 */
(()=>{
'use strict';
const mobileQuery=window.matchMedia('(pointer:coarse) and (max-width: 900px)');
const style=document.createElement('style');
style.id='zama-mobile-controller-style';
style.textContent=`
#zama-mobile-controller{display:none;box-sizing:border-box;position:relative;bottom:auto;left:auto;right:auto;z-index:2;width:100%;
 padding:8px max(10px,env(safe-area-inset-right)) calc(9px + env(safe-area-inset-bottom)) max(10px,env(safe-area-inset-left));
 background:linear-gradient(180deg,#0b2048f7,#091027fd);
 border-top:3px solid #8edaff;box-shadow:0 -8px 28px #05102688;
 align-items:center;justify-content:space-between;gap:10px;touch-action:none;user-select:none;-webkit-user-select:none;overscroll-behavior:contain}
#zama-mobile-controller[hidden]{display:none!important}
#zama-mobile-controller .zama-dpad{display:grid;grid-template-columns:repeat(3,minmax(0,56px));
 grid-template-rows:repeat(2,54px);gap:5px;flex:0 1 auto}
#zama-mobile-controller button{appearance:none;-webkit-appearance:none;touch-action:none;
 background:linear-gradient(#28588d,#0d2b66);color:white;border:2px solid #b7eaff;
 border-radius:14px;box-shadow:inset 0 2px #ffffff55,0 4px 0 #061536;
 font-size:23px;font-weight:900;padding:0;min-height:50px;min-width:0;
 display:flex;justify-content:center;align-items:center;
 -webkit-tap-highlight-color:transparent}
#zama-mobile-controller button.zmc-pressed{transform:translateY(3px);background:linear-gradient(#ffbf76,#e66c9f);box-shadow:0 1px 0 #061536}
#zama-mobile-controller .zama-actions{display:flex;gap:9px;align-items:center;justify-content:flex-end;flex:1}
#zama-mobile-controller .zama-actions button{height:86px;min-width:74px;width:min(22vw,95px);
 font-size:16px;line-height:1.2;border-radius:22px;flex-shrink:0;white-space:pre-line}
#zama-mobile-controller .zama-actions button.zmc-shot{background:linear-gradient(#ffba64,#e45183);border-color:#fff3c6}
#zama-mobile-controller .zama-actions button.zmc-bomb{background:linear-gradient(#7bd5ff,#326acb);border-color:#c3f1ff}
#zama-mobile-controller .zama-actions button.zmc-pressed{background:linear-gradient(#ffeb9b,#fc6691)}
#zama-mobile-controller .zama-actions .zmc-sound{width:42px;min-width:42px;height:47px;font-size:18px;border-radius:12px}
body.zama-mobile-control-active{padding-bottom:0!important}
body.zama-mobile-control-active [data-key]{display:none!important}
body.zama-mobile-control-active #soundBtn{display:none!important}
body.zama-mobile-control-active #zama-mobile-legacy-row{display:none!important}
@media (max-width:400px){#zama-mobile-controller{gap:5px;padding-left:5px;padding-right:5px}
 #zama-mobile-controller .zama-dpad{grid-template-columns:repeat(3,49px);grid-template-rows:repeat(2,51px);gap:3px}
 #zama-mobile-controller .zama-actions{gap:5px}
 #zama-mobile-controller .zama-actions button{width:69px;min-width:65px;height:80px}
 #zama-mobile-controller .zama-actions .zmc-sound{width:34px;min-width:34px;height:45px}
}
@media (max-height:520px) and (orientation:landscape){
 #zama-mobile-controller .zama-dpad{grid-template-rows:repeat(2,42px);grid-template-columns:repeat(3,47px)}
 #zama-mobile-controller button{min-height:40px}
 #zama-mobile-controller .zama-actions button{height:70px}
 body.zama-mobile-control-active{padding-bottom:0!important}
}
`;
document.head.appendChild(style);
const dock=document.createElement('nav');
dock.id='zama-mobile-controller';dock.setAttribute('aria-label','ゲーム操作コントローラ');
const dpad=document.createElement('div');dpad.className='zama-dpad';
const actions=document.createElement('div');actions.className='zama-actions';
dock.append(dpad,actions);
const legacyKeys=[...document.querySelectorAll('[data-key]')];
// The existing controls are in the game panel already. Replace that row
// in normal document flow rather than adding a second viewport-fixed overlay.
const legacyRow=legacyKeys.length?legacyKeys[0].parentElement:null;
if(legacyRow&&legacyKeys.every(el=>legacyRow.contains(el))&&!legacyRow.querySelector('canvas')){
 legacyRow.id='zama-mobile-legacy-row';
 legacyRow.insertAdjacentElement('afterend',dock);
}else{
 const canvas=document.querySelector('canvas');
 if(canvas){canvas.insertAdjacentElement('afterend',dock);}
 else document.body.appendChild(dock);
}
let pressEvents=0;
const keys=[['ArrowLeft','◀',0,1],['ArrowUp','▲',1,0],['ArrowDown','▼',1,1],['ArrowRight','▶',2,1]];
const held=new Map();
function release(key,pointerId){
 const set=held.get(key);
 if(set){if(pointerId===undefined)set.clear();else set.delete(pointerId);
  if(set.size) return;
 }
 pressed.delete(key);
 const button=dock.querySelector('[data-zmc-key="'+key+'"]');
 if(button)button.classList.remove('zmc-pressed');
}
function makeButton(key,label,group,cls=''){
 const b=document.createElement('button');b.type='button';b.textContent=label;
 b.dataset.zmcKey=key;b.className=cls;b.setAttribute('aria-label',key==='j'?'ショット':key==='k'?'ボム':key);
 b.addEventListener('pointerdown',e=>{
  if(!mobileQuery.matches)return;
  e.preventDefault();e.stopPropagation();
  try{b.setPointerCapture(e.pointerId);}catch{}
  if(!held.has(key))held.set(key,new Set());
  held.get(key).add(e.pointerId);
  pressed.add(key);b.classList.add('zmc-pressed');pressEvents++;
 });
 for(const type of ['pointerup','pointercancel','lostpointercapture']){
  b.addEventListener(type,e=>{e.preventDefault();release(key,e.pointerId);});
 }
 b.addEventListener('contextmenu',e=>e.preventDefault());
 group.appendChild(b);return b;
}
for(const [key,label,col,row] of keys){
 const b=makeButton(key,label,dpad);
 b.style.gridColumn=String(col+1);b.style.gridRow=String(row+1);
}
makeButton('j','ショット\nJ',actions,'zmc-shot');
makeButton('k','ボム\nK',actions,'zmc-bomb');
const soundButton=document.createElement('button');soundButton.type='button';soundButton.className='zmc-sound';
soundButton.setAttribute('aria-label','サウンド切り替え');soundButton.textContent='🔊';
soundButton.addEventListener('click',()=>{
 const original=document.getElementById('soundBtn');if(original){original.click();soundButton.textContent=original.textContent||'🔊';}
});actions.appendChild(soundButton);
let wasVisible=false;
function refresh(){
 const mobile=mobileQuery.matches;
 const playable=mode==='play'||mode==='bossIntro';
 const visible=mobile&&playable&&panelWrap.classList.contains('hidden');
 if(visible!==wasVisible){
  wasVisible=visible;
  if(!visible){for(const key of held.keys())release(key);held.clear();}
 }
 dock.hidden=!visible;
 dock.style.display=visible?'flex':'none';
 document.body.classList.toggle('zama-mobile-control-active',mobile);
}
if(mobileQuery.addEventListener)mobileQuery.addEventListener('change',refresh);
window.addEventListener('blur',()=>{for(const key of held.keys())release(key);held.clear();});
const oldUpdate=update;
update=function(dt){oldUpdate(dt);refresh();};
refresh();
window.ZAMAZONE_MOBILE_CONTROLLER_QA=()=>({
 present:!!dock.isConnected,mobile:mobileQuery.matches,visible:!dock.hidden,pressEvents,legacyHidden:legacyRow?.id==='zama-mobile-legacy-row'&&getComputedStyle(legacyRow).display==='none',
 viewport:{width:innerWidth,height:innerHeight},keys:[...dock.querySelectorAll('[data-zmc-key]')].map(b=>b.dataset.zmcKey),
 held:[...held.entries()].filter(([k,p])=>p.size).map(([k])=>k),
 pointerStates:['ArrowLeft','ArrowUp','ArrowDown','ArrowRight','j','k'].filter(k=>pressed.has(k)),
 bounds:(()=>{const r=dock.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom};})(),layout:getComputedStyle(dock).position,hitKeys:[...dock.querySelectorAll('[data-zmc-key]')].every(b=>{const r=b.getBoundingClientRect();return r.width>35&&r.height>35&&document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)===b;})
});
})();

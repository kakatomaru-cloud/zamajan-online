// ZAMAZONE_PYRAMID_EYE_STAGE2_V1_20261116
// ZAMAZONE_PYRAMID_EYE_BALANCE_V2_20261116
// ZAMAZONE_PYRAMID_EYE_COMBAT_V3_20261116
// ZAMAZONE_PYRAMID_EYE_DEATH_ART_V4_20261116
// ZAMAZONE_PYRAMID_EYE_COMBAT_V5_20261117
// ZAMAZONE_PYRAMID_EYE_CHARGE_BOUNCE_V6_20261117
// ZAMAZONE_PYRAMID_EYE_VISIBLE_ATTACKS_V7_20261117
// ZAMAZONE_PYRAMID_EYE_INTRO_LASER_V8_20261117
// ZAMAZONE_UNIFIED_HIT_FEEDBACK_V1_20261117
// ZAMAZONE_LOCAL_RED_FLASH_V2_20261117
// ZAMAZONE_STONE_RECOVERY_V9_20261118
// ZAMAZONE_DEBUG_BOSS_SHOP_RETRY_V10_20261118
// Stage-2 real combat replacement. Uses images extracted from the approved MANA3 demo.
// Debug-boss-only preparation and retry flow. Regular campaign shop remains unchanged.
let zbPrepActive=false,zbPrepReturnMode='bossIntro',zbPrepChoice=null;
const zbOldAllowed=v2Allowed;
v2Allowed=function(i){
 if(!zbPrepActive)return zbOldAllowed(i);
 const saved=player.money;player.money=1000000000;
 const allowed=zbOldAllowed(i);player.money=saved;
 return allowed;
};
const zbOldBuy=v2Buy;
v2Buy=function(i){
 if(!zbPrepActive)return zbOldBuy(i);
 const saved=player.money;
 player.money=1000000000;
 zbOldBuy(i);
 player.money=saved;
 v2ShopRender();
};
function zbBeginPreparedBoss(){
 if(!zbPrepActive)return false;
 const nextMode=zbPrepReturnMode;
 zbPrepActive=false;
 mode=nextMode;
 pressed.clear();
 // The original shop owns an exit curtain; bypass it when launching a
 // debug boss that is already spawned, otherwise it can reopen the shop.
 const panel=document.getElementById('panel');
 if(panel)panel.classList.remove('shop','v2-shop');
 closePanel();
 panelWrap.classList.add('hidden');
 last=performance.now();
 return true;
}
const zbPrepStyles=document.createElement('style');
zbPrepStyles.textContent=`
#zb-debug-shop-toolbar{position:sticky;top:0;z-index:99;display:flex;gap:8px;
 flex-wrap:wrap;align-items:center;justify-content:center;background:#152944;
 border:2px solid #ffdd6b;border-radius:10px;padding:10px;margin:3px 0 12px}
#zb-debug-shop-start{cursor:pointer;background:#ffdf79;color:#17223e;border:2px solid white;
 padding:12px 22px;border-radius:10px;font-size:18px;font-weight:900;min-height:48px}
#zb-debug-shop-back{cursor:pointer;background:#e4effb;color:#1b3555;border:1px solid #8fb5e8;
 padding:10px 15px;border-radius:9px;font-weight:800}
`;
document.head.appendChild(zbPrepStyles);
function zbAttachShopControls(){
 if(!zbPrepActive)return;
 const bar=document.createElement('div');bar.id='zb-debug-shop-toolbar';
 const startBtn=document.createElement('button');startBtn.id='zb-debug-shop-start';startBtn.type='button';
 startBtn.textContent='▶ 装備を確定してボス戦へ';
 startBtn.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();zbBeginPreparedBoss();});
 const backBtn=document.createElement('button');backBtn.id='zb-debug-shop-back';backBtn.type='button';
 backBtn.textContent='← ボス選択に戻る';
 backBtn.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();
  zbPrepActive=false;debugBossRunning=false;debugBossMenu();
 });
 bar.append(startBtn,backBtn);
 contentEl.prepend(bar);
 mainAction.textContent='▶ 装備を確定してボス戦へ';
 mainAction.onclick=zbBeginPreparedBoss;
}
const zbOldShopRender=v2ShopRender;
v2ShopRender=function(){
 zbOldShopRender();
 if(!zbPrepActive)return;
 titleEl.textContent='BOSS DEBUG / FREE EQUIPMENT SHOP';
 const head=contentEl.querySelector('.shop12-head');
 if(head)head.textContent='ボス戦用の装備を選択 / 金額制限なし（性能上限は有効）';
 const foot=contentEl.querySelector('.shop12-foot');
 if(foot)foot.textContent='好きなだけ装備を購入してからボス戦へ。 所持金は消費しません。';
 zbAttachShopControls();
};
refreshShop=v2ShopRender;
// Stop existing shop key handlers from reopening the exit curtain in debug mode.
document.addEventListener('keydown',e=>{
 if(!zbPrepActive||mode!=='shop')return;
 if(e.code==='Escape'||e.code==='KeyB'||e.code==='Enter'&&e.target?.id==='zb-debug-shop-start'){
  e.preventDefault();e.stopImmediatePropagation();zbBeginPreparedBoss();
 }
},true);
let zbLastPadExit=false;
function zbPollPreparedShopPad(){
 if(zbPrepActive&&mode==='shop'){
  const pad=(navigator.getGamepads?.()||[])[0];
  const pressedExit=!!(pad?.buttons?.[1]?.pressed||pad?.buttons?.[9]?.pressed);
  if(pressedExit&&!zbLastPadExit)zbBeginPreparedBoss();
  zbLastPadExit=pressedExit;
 }else zbLastPadExit=false;
 requestAnimationFrame(zbPollPreparedShopPad);
}
requestAnimationFrame(zbPollPreparedShopPad);
const zbOldLaunchDebug=launchDebugBoss;
launchDebugBoss=function(n){
 zbPrepActive=false;
 zbOldLaunchDebug(n);
 if(riichiMode||!debugBossRunning||!boss)return;
 zbPrepChoice=+n;
 zbPrepReturnMode=mode;
 zbPrepActive=true;mode='shop';
 pressed.clear();
 v2ShopRender();
 panelWrap.classList.remove('hidden');
};
function zbDebugGameOver(){
 if(riichiMode||!debugBossRunning||mode==='debugGameOver')return false;
 const n=zbPrepChoice||debugBossChoice||3;
 zbPrepActive=false;mode='debugGameOver';
 enemyBullets.length=0;bullets.length=0;bombs.length=0;
 showPanel('BOSS DEBUG / GAME OVER',
  '<p>ボス戦でゲームオーバー</p><div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap"><button id="zb-debug-retry" type="button" style="padding:15px 24px;background:#ffe18e;color:#30224a;border-radius:10px;font-weight:bold">↻ リトライ</button><button id="zb-debug-select" type="button" style="padding:15px 24px;background:#8ed3ff;color:#172744;border-radius:10px;font-weight:bold">ボス選択へ戻る</button></div>',
  '↻ リトライ（装備ショップから）',()=>launchDebugBoss(n));
 const retry=document.getElementById('zb-debug-retry');
 const select=document.getElementById('zb-debug-select');
 if(retry)retry.onclick=()=>launchDebugBoss(n);
 if(select)select.onclick=()=>{debugBossRunning=false;debugBossMenu();};
 return true;
}
const zbOldDamage=damage;
damage=function(...args){
 const prev=player?.hp||0;
 const result=zbOldDamage(...args);
 if(!riichiMode&&debugBossRunning&&prev>0&&player?.hp<=0)zbDebugGameOver();
 return result;
};
// Some attack paths set HP to zero without passing through damage().
const zbOldMainUpdate=update;
update=function(dt){
 zbOldMainUpdate(dt);
 if(!riichiMode&&debugBossRunning&&player?.hp<=0&&mode!=='bossDeath'&&mode!=='clear'&&mode!=='debugGameOver')zbDebugGameOver();
};
window.ZAMAZONE_DEBUG_BOSS_QA=()=>({
 prep:zbPrepActive,choice:zbPrepChoice,returnMode:zbPrepReturnMode,
 active:!!debugBossRunning,mode,gameOver:mode==='debugGameOver',
 shopVisible:!panelWrap.classList.contains('hidden')&&mode==='shop',
 exitVisible:!!document.getElementById('zb-debug-shop-start'),
 money:player?.money??0,purchases:[...v2Purchased],
 retry:!!document.getElementById('zb-debug-retry'),select:!!document.getElementById('zb-debug-select')
});
if(new URLSearchParams(location.search).get('stage2_qa')==='1'){
 window.ZAMAZONE_DEBUG_BOSS_TEST={
  relaunch(n=3){launchDebugBoss(n);return window.ZAMAZONE_DEBUG_BOSS_QA();},
  forceGameOver(){
   if(!debugBossRunning)return false;
   player.hp=0;zbDebugGameOver();return window.ZAMAZONE_DEBUG_BOSS_QA();
  }
 };
}

const pyramidOldSpawn=spawnBoss,pyramidOldDraw=drawBoss,pyramidOldAttackUpdate=updateBossAttacks;
const pyramidOldAttackFx=drawBossAttackEffects,pyramidOldShot=applyRigShot,pyramidOldBomb=applyRigBomb;
const pyramidArt={body:[],orb:[],rock:null};
for(let i=0;i<16;i++){const im=new Image();im.src='assets/pyramid_eye/body_'+String(i).padStart(2,'0')+'.webp';pyramidArt.body.push(im);}
for(let i=0;i<8;i++){const im=new Image();im.src='assets/pyramid_eye/orb_'+String(i).padStart(2,'0')+'.webp';pyramidArt.orb.push(im);}
pyramidArt.rock=new Image();pyramidArt.rock.src='assets/pyramid_eye/rock.webp';
const pyramidOn=()=>!riichiMode&&stage===2&&boss?.alive&&boss.pyramid?.version===1;
const pyClamp=(x,a,b)=>Math.min(b,Math.max(a,x));
const pyEase=x=>{x=pyClamp(x,0,1);return x*x*(3-2*x);};
for(const im of [...pyramidArt.body,...pyramidArt.orb,pyramidArt.rock]){im.decoding='async';if(im.decode)im.decode().catch(()=>{});}
const pyImagesReady=()=>pyramidArt.body[0].complete&&pyramidArt.body[0].naturalWidth>0;
const pyFacing=z=>Math.cos(z.turn)>.72;
const pyEyeColor=z=>z.eyeHp/z.eyeMax>.75?'#ffffff':z.eyeHp/z.eyeMax>.5?'#3fbaff':z.eyeHp/z.eyeMax>.25?'#ffe02b':'#ff354d';
const pyScreenWorld=x=>wrapX(camera+x-W/2);
// Screen-space position is not wrapped during offscreen attacks / recovery.
const pyStoneX=s=>Number.isFinite(s.visualX)?s.visualX:screenX(s.x);
const pyStoneAt=(s,x,y)=>{s.x=pyScreenWorld(x);s.visualX=x;s.y=y;};
function pyRecoverStone(st,targetX,targetY,step){
 const x=pyStoneX(st),dx=targetX-x,dy=targetY-st.y,dist=Math.hypot(dx,dy);
 const maxStep=Math.min(step,.05)*780;
 if(dist<=maxStep)pyStoneAt(st,targetX,targetY);
 else pyStoneAt(st,x+dx/dist*maxStep,st.y+dy/dist*maxStep);
}
function pyBeginRecover(z){
 z.phase='recover';z.time=0;
 z.stones.forEach(st=>{if(st.alive)st.visible=true;});
}
function pyStartAttack(b){
 const z=b.pyramid;
 // Show signature attacks first: a visible body charge, then the billiard boulder.
 const attacks=['charge','merge','salvo','radial','charge','orbit','merge','aimed','spiral'];
 let attack=attacks[z.attackNo++%attacks.length];
 if(attack==='merge'&&z.stones.filter(s=>s.alive).length<8)attack='salvo';
 z.attack=attack;z.phase='warn';z.time=0;z.charge=null;z.chargeDisplayX=null;
 (z.attackHistory??=[]).push(attack);
 z.parts=z.stones.filter(s=>s.alive);z.starts=z.parts.map(s=>({x:s.x,y:s.y}));
 z.merge=null;z.boulder=null;z.fireClock=0;z.hitClock=0;
 z.stones.forEach(s=>{s.launched=false;});
 z.parts.forEach(s=>{s.visible=true;s.danger=false;});
 sound(580,.12,'triangle',.05);
}
spawnBoss=function(){
 pyramidOldSpawn();
 if(riichiMode||stage!==2||!boss?.alive||boss.z?.n!==3)return;
 // Keep legacy part inventory nonempty; it must never call its own all-broken rule.
 boss.z.parts=[{type:'core',i:99,hp:9999,maxHp:9999,dead:false,flash:0}];
 boss.hp=boss.maxHp=9999;
 boss.y=pyClamp(boss.y,235,ground-255);
 boss.pyramid={version:1,clock:0,attackNo:0,attack:null,phase:'idle',time:0,
    eyeHp:24,eyeMax:24,eyeFlash:0,eyeHitTime:0,eyeHitText:null,eyeExposed:1,turn:0,hitClock:0,fireClock:0,
    entranceTime:0,entranceComplete:false,deathTime:0,deathShards:[],charge:null,
    chargeDisplayX:null, chargeFrameMinX:Infinity, bounceCount:0,
    drawChargeFrames:0, drawRockFrames:0, attackHistory:[],
    introDrawY:null,introDrawX:null,introFrameMaxJump:0,introPreviousY:null,introExitJump:null,
    laserMode:'off',laserHits:0,laserDrawFrames:0,laserWarnings:0,
    stones:Array.from({length:16},(_,i)=>({id:i,alive:true,visible:true,hp:8,maxHp:8,
      x:wrapX(boss.x+Math.cos(i*Math.PI/8)*(i%2?235:188)),y:-95-i*13,angle:i*Math.PI/8,spin:i*.53,flash:0,danger:false,cracks:0})),
    parts:[],starts:[],merge:null,boulder:null};
};
function pyDamageStone(s,damage,x,y){
 if(!s.alive||!s.visible||s.flash>0)return;
 s.hp=Math.max(0,s.hp-damage);s.flash=.095;
 pop(x,y,'#ffe8b5',11,.5);sound(410,.08,'triangle',.04);
 if(s.hp===0){s.alive=false;s.visible=false;s.cracks=4;shake=Math.max(shake,12);
  pop(x,y,'#ffac6b',27,.9);sound(125,.24,'sawtooth',.095);}
 // Keep the destroyed stone in the fixed array, never respawn it.
}
function pyDamageEye(dmg,x,y){
 const z=boss.pyramid;
 if(z.eyeFlash>0||!pyFacing(z))return;
 z.eyeHp=Math.max(0,z.eyeHp-dmg);z.eyeFlash=.32;z.eyeHitTime=.44;
 z.eyeHitText={value:dmg,life:.65};boss.hitFlash=.24;
 pop(x,y,'#fff3af',20,.75);sound(260,.09,'square',.07);shake=Math.max(shake,8);
 if(z.eyeHp<=0){
  z.boulder=null;z.deathTime=0;
  z.deathShards=Array.from({length:28},(_,i)=>({angle:i*2.39996,rotation:i*.37,
    vx:Math.cos(i*2.39996)*(95+i%5*37),vy:Math.sin(i*2.39996)*(80+i%4*34)-125,
    x:screenX(boss.x),y:boss.y,life:1.9+(i%4)*.17,size:22+(i%6)*9}));
  boss.z.parts[0].dead=true;boss.z.parts[0].hp=0;boss.hp=0;
  defeatBoss();
}
}
function pyHitbox(b){const r=b.size*b.scale;return{x:b.x-r*.35,y:b.y-r*.34,w:r*.7,h:r*.68};}
function pyCircleRect(x,y,r,b){const h=pyHitbox(b);return Math.hypot(x-pyClamp(x,h.x,h.x+h.w),y-pyClamp(y,h.y,h.y+h.h))<=r;}
function pyContact(x,y,r,dt){
 const z=boss.pyramid;if(player.inv>0||z.hitClock>0)return;
 const px=screenX(player.x),py=player.y;
 if(Math.hypot(px-screenX(x),py-y)<r+17){damage('boss');z.hitClock=.74;}
}
function pyUpdate(dt){
 const z=boss.pyramid;
 const step=Math.min(dt,.05),t=(z.clock+=step);z.time+=step;z.turn+=step*1.28;
 z.hitClock=Math.max(0,z.hitClock-step);z.eyeFlash=Math.max(0,z.eyeFlash-step);
 z.eyeHitTime=Math.max(0,z.eyeHitTime-step);
 if(z.eyeHitText)z.eyeHitText.life=Math.max(0,z.eyeHitText.life-step);
 z.stones.forEach(s=>s.flash=Math.max(0,s.flash-step));
 // The older boss-introduction routine moves boss.y on its own timetable.
 // Keep our own continuous presentation trajectory to avoid its upward snap.
 if(mode==='bossIntro'){
  const progress=pyClamp(1-Math.max(0,boss.intro||0)/4.6,0,1);
  const yStart=ground+195,yEnd=260;
  const y=yStart+(yEnd-yStart)*pyEase(progress);
  if(z.introPreviousY!==null)z.introFrameMaxJump=Math.max(z.introFrameMaxJump,Math.abs(y-z.introPreviousY));
  z.introPreviousY=y;z.introDrawY=y;
  z.introDrawX=screenX(camera+330);
 }else{
  if(z.introDrawY!==null&&z.introExitJump===null)
   z.introExitJump=Math.abs(z.introDrawY-boss.y);
  z.introDrawY=null;z.introDrawX=null;
 }
 const bx=mode==='bossIntro'?z.introDrawX:z.attack==='charge'&&z.phase==='active'&&z.chargeDisplayX!==null?z.chargeDisplayX:screenX(boss.x);
 const by=mode==='bossIntro'?z.introDrawY:boss.y;
 // The 16 stones are stored permanently. Hiding is permitted only while the big rock exists.
 const home=(s,recover=false)=>{
  const a=s.angle+t*.92,r=s.id%2?226:180;
  const x=bx+Math.cos(a)*r,y=by+Math.sin(a)*(s.id%2?159:129);
  if(recover)pyRecoverStone(s,x,y,step);
  else pyStoneAt(s,x,y);
 };
 if(!z.entranceComplete){
  z.entranceTime+=step;
  const k=pyEase(z.entranceTime/1.65);
  z.stones.forEach(s=>{
   const a=s.angle+t*.45,r=s.id%2?226:180;
   pyStoneAt(s,bx+Math.cos(a)*r,-145-s.id*9+(by+Math.sin(a)*145+145+s.id*9)*k);
   s.visible=!!s.alive;
  });
  if(k>=1){z.entranceComplete=true;z.phase='idle';z.time=0;}
  return;
 }
 if(mode==='bossIntro'){
  z.stones.forEach(s=>{if(s.alive){s.visible=true;home(s);}});
  return;
 }
 if(z.phase==='idle'||z.phase==='warn'||z.phase==='recover'){
  z.stones.forEach(s=>{if(s.alive&&s.visible)home(s,z.phase==='recover');});
 }
 if(z.phase==='idle'&&z.time>.34){z.laserMode='off';pyStartAttack(boss);return;}
 if(z.phase==='warn'&&z.time>(z.attack==='charge'?.88:z.attack==='salvo'?.54:.67)){
  z.phase='active';z.time=0;
  z.starts=z.parts.map(s=>({x:screenX(s.x),y:s.y}));
  z.aimY=pyClamp(player.y,105,ground-65);
  if(z.attack==='charge'){
   z.charge={startX:screenX(boss.x),homeX:boss.x,homeY:boss.y};
   z.chargeDisplayX=z.charge.startX; z.chargeFrameMinX=Infinity;
  }
 }
 // When orbit stones leave the body, the eye warns and fires a wide horizontal laser.
 z.laserMode='off';
 const rocksAway=z.parts.some(st=>st.alive&&st.visible&&Math.abs(screenX(st.x)-bx)>245);
 if(z.phase==='active'&&z.attack!=='charge'&&rocksAway&&z.time>=.30&&z.time<1.38){
  z.laserMode=z.time<.63?'warning':'firing';
  if(z.laserMode==='warning')z.laserWarnings++;
  else{
   // Keep the eye facing the player for an unmistakable origin.
   const eyeY=by-23,px=screenX(player.x);
   const eyeX=bx-34;
   if(px<eyeX&&px>-20&&Math.abs(player.y-eyeY)<33&&player.inv<=0&&z.hitClock<=0){
    damage('boss');z.hitClock=.77;z.laserHits++;
   }
  }
 }
 if(z.phase==='active'){
  if(z.attack==='radial'){
   // 16 stones in four fast staggered lanes, travelling all the way to the left border.
   z.parts.forEach((s,i)=>{
    const stagger=Math.floor(i/4)*.11;
    const u=Math.max(0,z.time-stagger);
    const start=z.starts[i];if(!start)return;
    const x=start.x-(u*800),y=start.y+(i%4-1.5)*20*u;
    pyStoneAt(s,x,y);
    if(u>0&&x>20)pyContact(s.x,s.y,30,step);
   });
   if(z.time>1.95){pyBeginRecover(z);}
  }else if(z.attack==='orbit'){
   // Counter-clockwise double rings sweep from the boss to the far left.
   const sweep=z.time*500;
   z.parts.forEach(s=>{
    const a=s.angle+t*7.0,r=s.id%2?130:82;
    const x=bx-sweep+Math.cos(a)*r,y=z.aimY+Math.sin(a)*(s.id%2?143:93);
    pyStoneAt(s,x,pyClamp(y,95,ground-60));
    if(x>15)pyContact(s.x,s.y,30,step);
   });
   if(z.time>2.3){pyBeginRecover(z);}
  }else if(z.attack==='spiral'){
   // Fast rotating wheel expands into two rotating wings across the field.
   const sweep=z.time*565;
   z.parts.forEach(s=>{
    const a=s.angle+t*9.2;
    const radius=(s.id%2?170:112)+60*Math.sin(z.time*3);
    pyStoneAt(s,bx-sweep+Math.cos(a)*radius,by+Math.sin(a)*Math.min(210,radius));
    if(screenX(s.x)>15)pyContact(s.x,s.y,30,step);
   });
   if(z.time>2.05){pyBeginRecover(z);}
  }else if(z.attack==='aimed'){
   // Four diagonal sweeps aim at the player's position as captured after the warning.
   z.parts.forEach((s,i)=>{
    const wave=Math.floor(i/4),offset=wave*.17,u=Math.max(0,z.time-offset);
    const start=z.starts[i];if(!start)return;
    const y=start.y+(z.aimY-start.y)*pyEase(Math.min(1,u/.7))+(i%4-1.5)*36;
    const x=start.x-u*855;
    pyStoneAt(s,x,pyClamp(y,75,ground-55));
    if(u>0&&x>10)pyContact(s.x,s.y,30,step);
   });
   if(z.time>1.9){pyBeginRecover(z);}
  }else if(z.attack==='salvo'){
   // Each surviving stone launches separately at high speed, one per 0.105s.
   const interval=.105,speed=1080;
   z.parts.forEach((stone,i)=>{
    if(!stone.alive)return;
    const shotTime=z.time-i*interval,start=z.starts[i];if(!start)return;
    if(shotTime<0){pyStoneAt(stone,start.x,start.y);return;}
    if(!stone.launched){stone.launched=true;sound(360+(i%4)*85,.04,'triangle',.025);}
    const target=pyClamp(z.aimY+(i%4-1.5)*62,90,ground-60);
    const y=start.y+(target-start.y)*pyEase(Math.min(1,shotTime/.25));
    const x=start.x-shotTime*speed;pyStoneAt(stone,x,y);
    if(x>=-38&&x<=W+38)pyContact(stone.x,stone.y,30,step);
   });
   if(z.time>z.parts.length*interval+1.35){pyBeginRecover(z);}
  }else if(z.attack==='charge'){
   // Boss travels from its starting position to the far left, then returns.
   const charge=z.charge;
   if(!charge){pyBeginRecover(z);}
   else{
    const left=-185,out=.62,hold=.42,back=.85;let x;
    if(z.time<out)x=charge.startX+(left-charge.startX)*pyEase(z.time/out);
    else if(z.time<out+hold)x=left;
    else x=left+(charge.startX-left)*pyEase((z.time-out-hold)/back);
    z.chargeDisplayX=x;z.chargeFrameMinX=Math.min(z.chargeFrameMinX,x);
    boss.x=pyScreenWorld(x);boss.y=charge.homeY+Math.sin(z.time*18)*10;
    z.stones.forEach(st=>{if(st.alive){st.visible=true;home(st);}});
    if(z.time>=out+hold+back){
     boss.x=charge.homeX;boss.y=charge.homeY;z.charge=null;z.chargeDisplayX=null;
     pyBeginRecover(z);
    }
   }
  }else if(z.attack==='merge'){
   if(!z.merge)z.merge={phase:'merge',time:0,centerX:pyScreenWorld(bx-155),centerY:by+9,starts:z.parts.map(s=>({x:screenX(s.x),y:s.y}))};
   const m=z.merge;m.time+=step;
   if(m.phase==='merge'){
    if(z.parts.filter(s=>s.alive).length<8){z.merge=null;pyBeginRecover(z);return;}
    const k=pyEase(m.time/.78),cx=screenX(m.centerX);
    z.parts.forEach((s,i)=>{
      const src=m.starts[i];if(!src||!s.alive)return;
      pyStoneAt(s,src.x+(cx-src.x)*k,src.y+(m.centerY-src.y)*k);
    });
    if(k>=1){
     z.parts.forEach(s=>{s.visible=false;});
     z.boulder={x:m.centerX,y:m.centerY,size:235,scale:.55,rotation:0,glow:1,launched:false,alive:true,
       vy:(z.attackNo%2?1:-1)*1070,bounces:0};
     m.phase='bigrock';m.time=0;shake=Math.max(shake,11);
     pop(m.centerX,m.centerY,'#ffe9a4',32,1);sound(790,.16,'triangle',.085);
    }
   }else if(m.phase==='bigrock'){
    const rock=z.boulder;
    if(!rock){pyBeginRecover(z);}
    else if(!rock.launched){
     rock.scale=.55+.53*pyEase(m.time/.19);rock.glow=Math.max(0,1-m.time/.3);
     if(m.time>.21){rock.launched=true;m.time=0;sound(108,.31,'sawtooth',.13);}
    }else{
     // Fast billiard rebounds between the upper and lower arena walls.
     const top=96+rock.size*rock.scale*.39;
     const bottom=ground-rock.size*rock.scale*.39-7;
     rock.x=pyScreenWorld(screenX(rock.x)-720*step);
     rock.y+=rock.vy*step;
     for(let attempt=0;attempt<3&&(rock.y<top||rock.y>bottom);attempt++){
      if(rock.y<top){rock.y=2*top-rock.y;rock.vy=Math.abs(rock.vy);}
      else{rock.y=2*bottom-rock.y;rock.vy=-Math.abs(rock.vy);}
      rock.bounces++;z.bounceCount++;
      sound(170+Math.min(rock.bounces,7)*27,.085,'triangle',.055);
      pop(rock.x,rock.y,'#fff1af',11,.46);
     }
     rock.rotation+=step*(rock.vy>0?5.5:-5.5);
     const h=pyHitbox(rock),rx=screenX(rock.x),px=screenX(player.x),py=player.y;
     if(player.inv<=0&&z.hitClock<=0&&Math.abs(px-rx)<h.w*.5+18&&Math.abs(py-rock.y)<h.h*.5+18){
      damage('boss');z.hitClock=.7;
     }
     if(rx<-180||m.time>2.50){
      rock.alive=false;z.boulder=null;pyBeginRecover(z);
      z.stones.forEach(s=>s.visible=!!s.alive);
     }
    }
   }
  }
 }
 if(z.phase==='recover'){
  const allHome=z.stones.filter(s=>s.alive).every(s=>{
   const a=s.angle+t*.92,r=s.id%2?226:180;
   return Math.hypot(pyStoneX(s)-bx-Math.cos(a)*r,s.y-by-Math.sin(a)*(s.id%2?159:129))<38;
  });
  if((allHome&&z.time>.25)||z.time>5.6){z.phase='idle';z.time=0;}
 }
 if(player.inv<=0&&z.hitClock<=0&&Math.abs(screenX(player.x)-bx)<110&&Math.abs(player.y-by)<116){
  damage('boss');z.hitClock=.72;
 }
}
updateBossAttacks=function(dt){if(!pyramidOn())return pyramidOldAttackUpdate(dt);pyUpdate(dt);};
// Boss introduction uses the global update loop, not updateBossAttacks.
// Advance the 16 independent stones while the body rises from below.
const pyPrevMainUpdate=update;
update=function(dt){
 pyPrevMainUpdate(dt);
 if(!riichiMode&&stage===2&&boss?.pyramid?.version===1){
  // The legacy main update repositions boss.x every frame. Re-apply the active
  // charge's display coordinate after all older movement logic has completed.
  if(mode==='play'&&boss.pyramid.chargeDisplayX!==null&&boss.pyramid.phase==='active'&&boss.pyramid.attack==='charge'){
    boss.x=pyScreenWorld(boss.pyramid.chargeDisplayX);
  }
  if(mode==='bossIntro')pyUpdate(dt);
  if(mode==='bossDeath')boss.pyramid.deathTime+=Math.min(.05,dt);
 }
};
function pySprite(im,x,y,w,h,rot=0){if(!im?.complete||!im.naturalWidth)return;ctx.save();ctx.translate(x,y);ctx.rotate(rot);ctx.drawImage(im,-w/2,-h/2,w,h);ctx.restore();}
drawBoss=function(){
 if(!pyramidOn()){
  if(!riichiMode&&stage===2&&boss?.pyramid?.version===1&&boss.pyramid.eyeHp<=0)return;
  return pyramidOldDraw();
 }
 const z=boss.pyramid,bx=mode==='bossIntro'&&z.introDrawX!==null?z.introDrawX:z.chargeDisplayX!==null&&z.attack==='charge'&&z.phase==='active'?z.chargeDisplayX:screenX(boss.x),by=mode==='bossIntro'&&z.introDrawY!==null?z.introDrawY:boss.y,frame=(Math.floor((z.turn%(Math.PI*2))/(Math.PI*2)*16)+16)%16;
 if(z.attack==='charge'&&z.phase==='active'){
  z.drawChargeFrames++;
  ctx.save();ctx.globalAlpha=.35;ctx.strokeStyle='#ffe6a2';ctx.lineWidth=7;
  ctx.beginPath();ctx.moveTo(Math.min(W,bx+195),by);ctx.lineTo(Math.min(W,bx+410),by);ctx.stroke();ctx.restore();
 }
 ctx.save();ctx.shadowColor='#ffdc8a';ctx.shadowBlur=13;
 pySprite(pyramidArt.body[frame],bx,by,350,350);
 ctx.restore();
 // Eye damage stages: white > blue > yellow > red.
 const color=pyEyeColor(z);
 // The iris itself is repainted opaque so the damage-stage color is unmistakable.
 if(pyFacing(z)||z.laserMode==='firing'||z.laserMode==='warning'){
 ctx.save();ctx.translate(bx,by-23);
 if(z.eyeHitTime>0){ctx.shadowColor=color;ctx.shadowBlur=42;ctx.globalAlpha=.42+.42*Math.abs(Math.sin(z.clock*39));
  ctx.fillStyle='#ffffff';ctx.beginPath();ctx.ellipse(0,0,56,44,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;}
 ctx.shadowColor=color;ctx.shadowBlur=18;ctx.strokeStyle='#5c2d32';ctx.lineWidth=8;
 ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(0,0,35,26,0,0,Math.PI*2);ctx.fill();ctx.stroke();
 ctx.fillStyle='#1a162d';ctx.beginPath();ctx.ellipse(4+Math.sin(z.turn)*5,0,12,21,0,0,Math.PI*2);ctx.fill();
 ctx.fillStyle='#ffffff';ctx.beginPath();ctx.ellipse(-10,-8,6,5,-.3,0,Math.PI*2);ctx.fill();
 if(z.eyeHitText?.life>0){ctx.globalAlpha=Math.min(1,z.eyeHitText.life/.25);
  ctx.textAlign='center';ctx.font='bold 27px system-ui';ctx.lineWidth=5;ctx.strokeStyle='#4b2042';
  ctx.strokeText('HIT! -'+z.eyeHitText.value,0,-62-(.65-z.eyeHitText.life)*35);
  ctx.fillStyle='#fff6bf';ctx.fillText('HIT! -'+z.eyeHitText.value,0,-62-(.65-z.eyeHitText.life)*35);}
 ctx.restore();
 }
 const orbFrame=Math.floor(z.clock*8)%8;
 z.stones.forEach(s=>{if(!s.alive||!s.visible)return;
  const x=pyStoneX(s),y=s.y;if(x<-70||x>W+70)return;
  pySprite(pyramidArt.orb[orbFrame],x,y,74,74,s.spin+z.clock*1.3);
  if(s.cracks>0){ctx.save();ctx.translate(x,y);ctx.rotate(s.spin+z.clock*1.3);ctx.globalAlpha=Math.min(.7,s.cracks*.14);ctx.lineWidth=3;ctx.strokeStyle='#2c1b28';ctx.beginPath();ctx.moveTo(-13,-23);ctx.lineTo(1,-7);ctx.lineTo(-5,12);ctx.lineTo(13,24);ctx.stroke();ctx.restore();}
  if(s.zfxRedUntil&&zfxNow()<s.zfxRedUntil){ctx.save();ctx.globalAlpha=.60;ctx.fillStyle='#ff253b';ctx.shadowColor='#ff0000';ctx.shadowBlur=20;ctx.beginPath();ctx.arc(x,y,31,0,Math.PI*2);ctx.fill();ctx.restore();}
  if(s.flash>0){ctx.save();ctx.globalAlpha=s.flash*4;ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(x,y,30,0,2*Math.PI);ctx.fill();ctx.restore();}
 });
 const b=z.boulder;
 if(b?.alive){z.drawRockFrames++;const x=screenX(b.x),y=b.y;ctx.save();
  ctx.shadowColor='#ffe5aa';ctx.shadowBlur=b.glow>0?50:16;
  pySprite(pyramidArt.rock,x,y,b.size*b.scale,b.size*b.scale,b.rotation);
  if(b.glow>0){ctx.globalAlpha=b.glow*.4;ctx.fillStyle='#fff7cf';ctx.beginPath();ctx.arc(x,y,b.size*b.scale*.47,0,Math.PI*2);ctx.fill();}
  ctx.restore();}
};
drawBossAttackEffects=function(){
 if(!pyramidOn())return pyramidOldAttackFx();
 const z=boss.pyramid;
 if(z.laserMode==='warning'||z.laserMode==='firing'){
  const x=screenX(boss.x)-37,y=boss.y-23;
  ctx.save();ctx.lineCap='round';
  ctx.shadowColor='#12aaff';ctx.shadowBlur=23;
  ctx.strokeStyle=z.laserMode==='warning'?'#66d5ff':'#0069fa';
  ctx.globalAlpha=z.laserMode==='warning'?.45+.28*Math.sin(z.clock*23):.85;
  ctx.lineWidth=z.laserMode==='warning'?6:28;
  ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(0,y);ctx.stroke();
  if(z.laserMode==='firing'){
   ctx.shadowBlur=14;ctx.globalAlpha=1;ctx.strokeStyle='#83e7ff';ctx.lineWidth=16;
   ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(0,y);ctx.stroke();
   ctx.shadowBlur=0;ctx.strokeStyle='#f1ffff';ctx.lineWidth=5;
   ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(0,y);ctx.stroke();
   z.laserDrawFrames++;
  }
  ctx.restore();
 }
 if(z.phase!=='warn')return;
 if(z.attack==='charge'){
  ctx.save();ctx.strokeStyle='#ff656b';ctx.globalAlpha=.55+.4*Math.abs(Math.sin(z.clock*15));ctx.lineWidth=8;ctx.setLineDash([18,14]);
  ctx.beginPath();ctx.moveTo(screenX(boss.x)-130,boss.y);ctx.lineTo(10,boss.y);ctx.stroke();ctx.restore();return;
 }
 ctx.save();ctx.strokeStyle='#ffe8af';ctx.lineWidth=3;ctx.globalAlpha=.45+.28*Math.sin(z.clock*14);
 ctx.setLineDash([12,9]);ctx.beginPath();ctx.arc(screenX(boss.x),boss.y,218,0,2*Math.PI);ctx.stroke();ctx.restore();
};
applyRigShot=function(shot){
 if(!pyramidOn())return pyramidOldShot(shot);
 if(shot.life<=0)return false;
 if(shot.kind==='laser'&&shot.hitTargets?.has(boss))return true;
 const z=boss.pyramid,x=screenX(shot.x),y=shot.y,rad=shot.radius||4;
 const hit=()=>{
  if(shot.kind==='laser')(shot.hitTargets??=new Set()).add(boss);
  else{shot.life=0;shot.vx=0;shot.vy=0;}
 };
 for(const s of z.stones){if(!s.alive||!s.visible)continue;
  if(Math.hypot(x-screenX(s.x),y-s.y)<34+rad){hit();pyDamageStone(s,Math.max(1,shot.dmg||1),shot.x,shot.y);return true;}
 }
 const b=z.boulder;
 if(b?.alive&&pyCircleRect(shot.x,shot.y,rad,b)){hit();pop(shot.x,shot.y,'#ffe1a5',6,.38);sound(200,.06,'triangle',.025);return true;}
 if(Math.abs(x-screenX(boss.x))<123+rad&&Math.abs(y-boss.y)<134+rad){
  hit();const facing=pyFacing(z);
  if(facing&&Math.abs(x-screenX(boss.x))<65+rad&&Math.abs(y-(boss.y-23))<60+rad)pyDamageEye(Math.max(1,shot.dmg||1),shot.x,shot.y);
  else{pop(shot.x,shot.y,'#ffe2ab',6,.4);sound(710,.05,'triangle',.022);}
  return true;
 }
 return false;
};
applyRigBomb=function(b,rad){
 if(!pyramidOn())return pyramidOldBomb(b,rad);
 const z=boss.pyramid;let hit=false;
 for(const s of z.stones){if(!s.alive||!s.visible)continue;
  if(Math.hypot(screenX(b.x)-screenX(s.x),b.y-s.y)<rad+30){pyDamageStone(s,b.big?2:1,b.x,b.y);hit=true;}
 }
 if(pyFacing(z)&&Math.hypot(screenX(b.x)-screenX(boss.x),b.y-(boss.y-23))<rad+85){pyDamageEye(b.big?3:2,b.x,b.y);hit=true;}
 return hit;
};
window.ZAMAZONE_PYRAMID_EYE_QA=()=>({
 active:pyramidOn(),stage,mode,assetLoaded:pyImagesReady(),
 stones:boss?.pyramid?.stones.map(s=>({id:s.id,alive:s.alive,visible:s.visible,hp:s.hp,xScreen:screenX(s.x),y:s.y}))||[],
 attack:boss?.pyramid?.attack,phase:boss?.pyramid?.phase,
 mergePhase:boss?.pyramid?.merge?.phase||null,
 boulderCount:boss?.pyramid?.boulder?.alive?1:0,
 eyeHP:boss?.pyramid?.eyeHp,eyeColor:boss?.pyramid?pyEyeColor(boss.pyramid):null,
 facing:boss?.pyramid?pyFacing(boss.pyramid):false,
 entranceComplete:boss?.pyramid?.entranceComplete,
 deathShards:boss?.pyramid?.deathShards?.length||0,
 remainingStones:boss?.pyramid?.stones.filter(s=>s.alive).length||0,
 chargeTime:boss?.pyramid?.attack==='charge'?boss.pyramid.time:null,
 chargeDisplayX:boss?.pyramid?.chargeDisplayX??null,
 chargeFrameMinX:boss?.pyramid?.chargeFrameMinX??null,
 bigRockY:boss?.pyramid?.boulder?.y??null,
 bigRockBounces:boss?.pyramid?.boulder?.bounces??0,
 drawChargeFrames:boss?.pyramid?.drawChargeFrames??0,
 drawRockFrames:boss?.pyramid?.drawRockFrames??0,
 attackHistory:boss?.pyramid?.attackHistory||[],
 introDrawY:boss?.pyramid?.introDrawY??null,
 introFrameMaxJump:boss?.pyramid?.introFrameMaxJump??0,
 introExitJump:boss?.pyramid?.introExitJump??null,
 laserMode:boss?.pyramid?.laserMode??'off',
 laserDrawFrames:boss?.pyramid?.laserDrawFrames??0,
 laserHits:boss?.pyramid?.laserHits??0,
 laserWarnings:boss?.pyramid?.laserWarnings??0,
 totalBounces:boss?.pyramid?.bounceCount??0,
 bossX:boss?screenX(boss.x):null
});


function pyDrawDeath(){
 const z=boss?.pyramid;if(!z||!z.deathShards.length)return;
 const elapsed=pyClamp((performance.now()-(z.deathStarted||performance.now()))/1000,0,3.2);
 const bx=screenX(boss.x),by=boss.y;
 const im=pyramidArt.body[0],ready=im.complete&&im.naturalWidth>0;
 const tile=5,srcW=ready?im.naturalWidth/5:64,srcH=ready?im.naturalHeight/5:64;
 ctx.save();
 // Pyramid image is fragmented into original painted tiles, not replaced by an unrelated boss texture.
 for(let i=0;i<25;i++){
  const p=z.deathShards[i],time=elapsed;
  if(time>p.life)continue;
  const opacity=pyClamp((p.life-time)/.6,0,1);
  const col=i%5,row=Math.floor(i/5);
  const startX=(col-2)*63,startY=(row-2)*63;
  const x=bx+startX+p.vx*time*.75;
  const y=by+startY+p.vy*time*.8+125*time*time;
  const angle=p.rotation+time*(i%2?2.8:-3.1);
  ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.globalAlpha=opacity;
  ctx.shadowColor='#ffd978';ctx.shadowBlur=8;
  if(ready)ctx.drawImage(im,col*srcW,row*srcH,srcW,srcH,-35,-35,70,70);
  else{ctx.fillStyle='#c89b68';ctx.fillRect(-35,-35,70,70);}
  ctx.restore();
 }
 // The full 16-stone halo also breaks into rotating rubble, rather than vanishing abruptly.
 const orb=pyramidArt.orb[Math.floor(elapsed*9)%8];
 for(let i=0;i<16;i++){
  if(z.deathRemainingIds&&!z.deathRemainingIds.includes(i))continue;
  const a=i*Math.PI/8,rad=190+(i%2)*35;
  const speed=80+(i%4)*45;
  const x=bx+Math.cos(a)*(rad+elapsed*speed);
  const y=by+Math.sin(a)*(rad*.72+elapsed*speed*.5)+elapsed*elapsed*90;
  const opacity=pyClamp((2.4-elapsed)*.8,0,1);
  if(!opacity)continue;
  ctx.save();ctx.globalAlpha=opacity;
  pySprite(orb,x,y,68,68,i*.4+elapsed*4);
  ctx.restore();
 }
 const flash=Math.max(0,1-elapsed/.55);
 if(flash>0){ctx.globalAlpha=flash*.55;ctx.fillStyle='#fff3b5';
  ctx.beginPath();ctx.arc(bx,by,55+elapsed*240,0,Math.PI*2);ctx.fill();}
 ctx.restore();
}
const pyPrevBossDebris=drawBossDebris;
drawBossDebris=function(){
 // Never draw the original mana2/scarab fragments or legacy V4 sprite on the Pyramid Eye death.
 if(!riichiMode&&stage===2&&boss?.pyramid?.version===1&&boss.pyramid.eyeHp<=0){
  if(mode==='bossDeath'||mode==='endingSlow')pyDrawDeath();
  return;
 }
 return pyPrevBossDebris();
};
// Capture destruction before legacy death frames, then replace those frames rather than painting scarab art.
const pyOldDefeat=defeatBoss;
defeatBoss=function(){
 if(pyramidOn()&&boss?.pyramid){
  const z=boss.pyramid;z.deathStarted=performance.now();
  z.deathRemainingIds=z.stones.filter(st=>st.alive).map(st=>st.id);
  z.stones.forEach(st=>{st.visible=false;st.alive=false;});
  z.boulder=null;
 }
 return pyOldDefeat();
};

// Testing hooks use the normal gameplay damage routines and are only exposed with an explicit debug query.
if(new URLSearchParams(location.search).get('stage2_qa')==='1'){
 window.ZAMAZONE_PYRAMID_EYE_TEST={
  enableSpectator(){
   if(!pyramidOn())return false;
   player.inv=300;return true;
  },
  forceAttack(name){
   if(!pyramidOn()||!['radial','orbit','spiral','merge','aimed','salvo','charge'].includes(name))return false;
   if(name==='merge'&&boss.pyramid.stones.filter(s=>s.alive).length<8)return false;
   const z=boss.pyramid;player.inv=Math.max(player.inv||0,25);
   z.entranceComplete=true;pyStartAttack(boss);
   z.attack=name;z.phase='warn';z.time=0;return true;
  },
  eyeHit(damage=6,front=true){
   if(!pyramidOn())return false;
   const z=boss.pyramid;z.turn=front?0:Math.PI;z.eyeFlash=0;
   const before=z.eyeHp;pyDamageEye(damage,boss.x,boss.y-23);
   return {before,after:z.eyeHp,color:pyEyeColor(z),facing:pyFacing(z)};
  },
  breakStone(id){
   if(!pyramidOn())return false;
   const st=boss.pyramid.stones.find(x=>x.id===id);if(!st||!st.alive)return false;
   st.flash=0;pyDamageStone(st,st.hp,st.x,st.y);return !st.alive;
  },
  simulateBounce(){
   if(!pyramidOn()||boss.pyramid.stones.filter(s=>s.alive).length<8)return false;
   this.forceAttack('merge');
   const samples=[];
   for(let i=0;i<245;i++){
    pyUpdate(1/60);
    const rock=boss.pyramid.boulder;
    if(rock&&rock.launched&&i%10===0)samples.push({x:screenX(rock.x),y:rock.y,bounces:rock.bounces,vy:rock.vy});
   }
   return {samples,totalBounces:boss.pyramid.bounceCount};
  },
  simulateCharge(){
   if(!pyramidOn())return false;
   this.forceAttack('charge');
   const samples=[];
   for(let i=0;i<110;i++){
    pyUpdate(1/60);
    if(i%15===0)samples.push({t:boss.pyramid.time,x:screenX(boss.x),phase:boss.pyramid.phase});
   }
   return {minX:Math.min(...samples.map(s=>s.x)),samples,mode};
  },
  snap(){return window.ZAMAZONE_PYRAMID_EYE_QA();}
 };
}

// ---- SHARED HIT FEEDBACK: every enemy, base and boss uses the same rules ----
// A hit is classified by actual HP loss. Invulnerable armor -> metallic clank;
// successful damage -> slash sound and a red blinking target (including moving sprites).
const zfxStats={damage:0,blocked:0,enemy:0,base:0,boss:0};
const zfxSparks=[];
let zfxLastDamage=-10000,zfxLastBlocked=-10000;
const zfxNow=()=>performance.now();
function zfxPlay(kind){
 const now=zfxNow();
 if(kind==='damage'){
  if(now-zfxLastDamage<65)return;
  zfxLastDamage=now;
  // Sharp slashing transient followed by a descending rasp: "ズバッ".
  sound(420,.075,'sawtooth',.081);
  sound(190,.13,'triangle',.073);
  try{
   audioCtx??=new (window.AudioContext||window.webkitAudioContext)();
   if(muted)return;
   const ac=audioCtx,len=Math.floor(ac.sampleRate*.085),buf=ac.createBuffer(1,len,ac.sampleRate),data=buf.getChannelData(0);
   for(let i=0;i<len;i++)data[i]=(Math.random()*2-1)*(1-i/len);
   const src=ac.createBufferSource(),filter=ac.createBiquadFilter(),gain=ac.createGain();
   src.buffer=buf;filter.type='bandpass';filter.frequency.value=1050;filter.Q.value=.55;
   const t=ac.currentTime;
   gain.gain.setValueAtTime(.001,t);gain.gain.linearRampToValueAtTime(.096,t+.008);
   gain.gain.exponentialRampToValueAtTime(.0001,t+.083);
   src.connect(filter);filter.connect(gain);gain.connect(ac.destination);src.start(t);src.stop(t+.085);
  }catch{}
 }else{
  if(now-zfxLastBlocked<100)return;
  zfxLastBlocked=now;
  // Two consecutive metallic strikes, separated by 75 ms: "キン・キン".
  try{
   if(muted)return;
   audioCtx??=new (window.AudioContext||window.webkitAudioContext)();
   const ac=audioCtx,t=ac.currentTime;
   for(const [delay,freq] of [[0,1320],[.075,1760]]){
    const o=ac.createOscillator(),g=ac.createGain();
    o.type='triangle';
    o.frequency.setValueAtTime(freq,t+delay);
    o.frequency.exponentialRampToValueAtTime(freq*.79,t+delay+.095);
    g.gain.setValueAtTime(.0001,t+delay);
    g.gain.linearRampToValueAtTime(.076,t+delay+.003);
    g.gain.exponentialRampToValueAtTime(.0001,t+delay+.11);
    o.connect(g);g.connect(ac.destination);
    o.start(t+delay);o.stop(t+delay+.115);
   }
  }catch{sound(1220,.10,'triangle',.069);}
 }
}
function zfxReport(kind,target,x,y,category='boss'){
 const t=zfxNow();
 if(kind==='damage'){
  zfxStats.damage++;
  zfxStats[category]=(zfxStats[category]||0)+1;
  if(target&&typeof target==='object'){
   target.zfxRedUntil=t+250;
   // Hit location is world-space; only this local patch is recolored during blinking.
   target.zfxHitX=x;target.zfxHitY=y;
   target.zfxHitRadius=category==='boss'?48:54;
  }
  // No slash particles or drawn strokes on a successful hit: blinking only.
  zfxPlay('damage');
 }else{
  zfxStats.blocked++;
  zfxSparks.push({x,y,until:t+140,kind:'blocked'});
  zfxPlay('blocked');
 }
 if(zfxSparks.length>55)zfxSparks.splice(0,zfxSparks.length-55);
}
const zfxActive=o=>!!o?.zfxRedUntil&&zfxNow()<o.zfxRedUntil&&Math.floor(zfxNow()/68)%2===0;
const zfxRedFilter='brightness(0) saturate(100%) invert(18%) sepia(100%) saturate(6900%) hue-rotate(345deg) brightness(150%)';
const zfxBeforeBoss=()=>!boss?null:{
 target:boss,
 hp:boss.hp||0,
 eye:boss.pyramid?.eyeHp||0,
 stones:boss.pyramid?.stones.reduce((sum,p)=>sum+(p.hp||0),0)||0,
 parts:boss.z?.parts?.reduce((sum,p)=>sum+(p.hp||0),0)||0,
 wings:boss.wings?.reduce((sum,p)=>sum+(p.hp||0),0)||0
};
const zfxBossLoss=before=>before?Math.max(0,
 before.hp-(before.target?.hp||0))+
 Math.max(0,before.eye-(before.target?.pyramid?.eyeHp||0))+
 Math.max(0,before.stones-(before.target?.pyramid?.stones.reduce((n,p)=>n+(p.hp||0),0)||0))+
 Math.max(0,before.parts-(before.target?.z?.parts?.reduce((n,p)=>n+(p.hp||0),0)||0))+
 Math.max(0,before.wings-(before.target?.wings?.reduce((n,p)=>n+(p.hp||0),0)||0)):0;

// Bases already use a single hitBase() entrypoint, including direct shots and bombs.
const zfxOldHitBase=hitBase;
hitBase=function(base,amount){
 const before=base?.hp||0,wasAlive=!!base?.alive;
 const result=zfxOldHitBase(base,amount);
 if(wasAlive&&base&&base.hp<before)zfxReport('damage',base,base.x,base.y,'base');
 else if(wasAlive&&base)zfxReport('blocked',base,base.x,base.y,'base');
 return result;
};

// Bosses from all stages, including shields and the Pyramid Eye, share one classifier.
const zfxOldRigShot=applyRigShot,zfxOldRigBomb=applyRigBomb;
applyRigShot=function(shot){
 const before=zfxBeforeBoss(),x=shot.x,y=shot.y;
 const result=zfxOldRigShot(shot);
 if(before&&result){
  const loss=zfxBossLoss(before);
  zfxReport(loss>0?'damage':'blocked',before.target,x,y,'boss');
 }
 return result;
};
applyRigBomb=function(b,rad){
 const before=zfxBeforeBoss();
 const result=zfxOldRigBomb(b,rad);
 if(before&&result)zfxReport(zfxBossLoss(before)>0?'damage':'blocked',before.target,b.x,b.y,'boss');
 return result;
};

// The base engine subtracts enemy HP directly inside update(), instead of a hit function.
// Observe real HP differences after update; one notification per damaged enemy.
const zfxOldUpdate=update;
update=function(dt){
 const playing=mode==='play';
 const former=playing?enemies.map(e=>({e,hp:e.hp})):null;
 const oldBoss=playing?zfxBeforeBoss():null;
 const oldBaseHealth=playing?bases.map(b=>({b,hp:b.hp})):null;
 zfxOldUpdate(dt);
 if(!playing)return;
 for(const {e,hp} of former){
  if(e.hp<hp)zfxReport('damage',e,e.x,e.y,'enemy');
  else if(e.hp<=0&&hp>0)zfxReport('damage',e,e.x,e.y,'enemy');
 }
 // Stage 1 and legacy attack handlers also damage bosses outside applyRigShot().
 if(oldBoss&&zfxBossLoss(oldBoss)>0&&!zfxActive(oldBoss.target)){
  zfxReport('damage',oldBoss.target,oldBoss.target.x,oldBoss.target.y,'boss');
 }
 // Detect any direct base damage that bypassed hitBase().
 for(const {b,hp} of oldBaseHealth){
  if(b.hp<hp&&!b.zfxRedUntil)zfxReport('damage',b,b.x,b.y,'base');
 }
};

// Draw red blinking on the actual sprite, irrespective of stage-specific art overrides.
const zfxOldDrawEnemy=drawEnemy,zfxOldDrawBase=drawBase,zfxOldDrawBoss=drawBoss;
drawEnemy=function(e){if(!zfxActive(e))return zfxOldDrawEnemy(e);
 ctx.save();ctx.filter=zfxRedFilter;zfxOldDrawEnemy(e);ctx.restore();
};
drawBase=function(b){if(!zfxActive(b))return zfxOldDrawBase(b);
 ctx.save();ctx.filter=zfxRedFilter;zfxOldDrawBase(b);ctx.restore();
};
drawBoss=function(){
 // Never recolor the entire boss. Repaint only the struck piece within
 // a circular clip; all other areas retain their original colors.
 zfxOldDrawBoss();
 if(!zfxActive(boss))return;
 const x=screenX(boss.zfxHitX??boss.x),y=boss.zfxHitY??boss.y;
 const radius=boss.zfxHitRadius||48;
 ctx.save();ctx.beginPath();ctx.arc(x,y,radius,0,Math.PI*2);ctx.clip();
 ctx.filter=zfxRedFilter;
 zfxOldDrawBoss();
 ctx.restore();
};
const zfxOldDrawProjectiles=drawProjectiles;
drawProjectiles=function(){
 zfxOldDrawProjectiles();
 const now=zfxNow();
 for(let i=zfxSparks.length-1;i>=0;i--){
  const p=zfxSparks[i];if(p.until<=now){zfxSparks.splice(i,1);continue;}
  const x=screenX(p.x),y=p.y,fade=Math.min(1,(p.until-now)/110);
  if(x<-65||x>W+65)continue;
  ctx.save();ctx.globalAlpha=fade;
  // Blocked shots retain a restrained metallic glint; successful hits draw no slash.
  if(p.kind==='blocked'){
   ctx.strokeStyle='#ffe7aa';ctx.shadowColor='#fff4aa';ctx.shadowBlur=12;ctx.lineWidth=3;
   ctx.beginPath();ctx.arc(x,y,9,0,Math.PI*2);ctx.stroke();
  }
  ctx.restore();
 }
};
window.ZAMAZONE_HIT_FEEDBACK_QA=()=>({...zfxStats,flashes:zfxSparks.length,
 slashParticles:zfxSparks.filter(p=>p.kind==='damage').length,
 bossFlashLocal:boss?.zfxHitX!==undefined,
 bossFlashX:boss?.zfxHitX??null,bossFlashY:boss?.zfxHitY??null,
 bossFlashRadius:boss?.zfxHitRadius??null});
if(new URLSearchParams(location.search).get('stage2_qa')==='1'){
 window.ZAMAZONE_HIT_FEEDBACK_TEST={
  blockedBossShot(){
   if(!pyramidOn())return false;
   const z=boss.pyramid;z.turn=Math.PI;z.eyeFlash=0;
   const before={...zfxStats};
   const shot={x:boss.x,y:boss.y-23,life:1,vx:500,vy:0,dmg:1,radius:2,kind:'bullet'};
   applyRigShot(shot);
   return {before,after:{...zfxStats},red:zfxActive(boss),eye:z.eyeHp};
  },
  successfulBossShot(){
   if(!pyramidOn())return false;
   const z=boss.pyramid;z.turn=0;z.eyeFlash=0;
   const before={...zfxStats},eye=z.eyeHp;
   const shot={x:boss.x,y:boss.y-23,life:1,vx:500,vy:0,dmg:1,radius:2,kind:'bullet'};
   applyRigShot(shot);
   return {before,after:{...zfxStats},redUntil:boss.zfxRedUntil||0,eyeBefore:eye,eyeAfter:z.eyeHp};
  },
  baseHit(){
   // Test a representative base even when debug boss mode has cleared all six bases.
   const b={x:wrapX(camera+120),y:ground-100,hp:10,maxHp:10,alive:true,flash:0};
   const before={...zfxStats};
   hitBase(b,1);
   return {before,after:{...zfxStats},redUntil:b.zfxRedUntil||0,damage:b.hp===9};
  },
  enemyHit(){
   if(mode!=='play')return false;
   const x=wrapX(camera-300);
   const e={type:'jelly',hp:3,x,y:ground-42,baseY:ground-42,vx:0,phase:0,shot:100,dead:false};
   enemies.push(e);
   const old={...zfxStats};
   bullets.push({x,y:e.y,vx:0,vy:0,life:.65,dmg:1,radius:4,kind:'bullet'});
   update(1/60);
   const result={before:old,after:{...zfxStats},enemyHP:e.hp,redUntil:e.zfxRedUntil||0};
   enemies=enemies.filter(v=>v!==e);
   return result;
  }
 };
}

/* ZAMAZONE_BOARD_STAGE1356_V1_20261118
 * ZAMAZONE_BOARD_STAGE1356_V2_GRASSLAND_VISUAL_FIX_20261118
 * ZAMAZONE_STAGE1_VECTOR_REDRAW_V3_20261118
 * ZAMAZONE_STAGE1_SOURCE_ART_HQ_V4_20261118
 * Approved original sprite art cropped from the supplied five-row design board.
 * Each stage atlas is 7 transparent 48x48 sprites: five mobs, air base, ground base.
 * Stage 2 remains on the separately approved desert art.
 * Movement, collisions, projectiles and boss logic are preserved; visuals are animated.
 */
(()=>{
'use strict';
const artStages={1:'grass',3:'ocean',4:'snow',5:'neon',6:'digital'};
const labels={
 1:['ハッチ','リーフン','キノピー','フラワン','トゲマロン','フラワーフライヤー','グリーンツリー'],
 3:['クラゲン','フグリン','イカッチ','ヒトデン','シェリー','ドルフィンシップ','シェルドーム'],
 4:['ユキポン','アイスキューブ','ペンペン','ユキウサ','ヒョウガン','スノーマンシップ','アイスキャッスル'],
 5:['ヘリオン','モニタン','ネオゴースト','ホバカー','スピーキー','ビートDJクルーザー','ネオンタワー'],
 6:['データブロック','リングン','トライアイ','データワーム','ギアボン','データオービット','メインコア']
};
const accents={1:'#b7ff78',3:'#a0f5ff',4:'#dcfcff',5:'#ff60dd',6:'#6cfdf5'};
const atlas={};
Object.entries(artStages).forEach(([id,file])=>{
 const im=new Image();im.decoding='async';
 im.src='assets/board_stage1356/'+file+'.png';
 atlas[id]=im;
});
const grassHQ=new Image();
grassHQ.decoding='async';
grassHQ.src='assets/board_stage1356/grass_hq.webp';
const grassReady=()=>grassHQ.complete&&grassHQ.naturalWidth===1120&&grassHQ.naturalHeight===160;
const loaded=id=>id===1?grassReady():!!(atlas[id]?.complete&&atlas[id].naturalWidth===336&&atlas[id].naturalHeight===48);
let forceStage=0,spawnCount=0,lastStage=0,drawCount=Array(7).fill(0);
const deaths=[],counters={enemy:0,air:0,ground:0,enemyDefeats:0,baseDefeats:0,fragments:0,shots:0,grassSky:0,grassScenery:0};
const current=()=>forceStage||stage;
// The desert's own Stage-2 smoke harness can temporarily force its stage
// while the main level is grassland; respect that override without intercepting.
const enabled=()=>!riichiMode&&!!artStages[current()]&&
 !(window.ZAMAZONE_DESERT_REDESIGN_QA?.()?.active);
const src=i=>i*48;
const enemyScale={1:112,3:91,4:88,5:94,6:94};
const baseScale={1:164,3:194,4:196,5:206,6:202};
const redFilter='brightness(0) saturate(100%) invert(19%) sepia(99%) saturate(6470%) hue-rotate(345deg)';
const flashing=o=>(o?.zfxRedUntil&&performance.now()<o.zfxRedUntil&&Math.floor(performance.now()/70)%2===0)||
  (o?.flash>0&&Math.floor(performance.now()/70)%2===0);

// High-definition Stage 1 redraw, faithful to the seven named designs on the
// supplied concept board. Vector paths avoid enlarging 20px-wide thumbnails.
function grassVector(index,w,h,t){
 ctx.save();ctx.scale(w/120,h/120);
 const outline='#24204c',gold='#f9b728',shine='#fff9b1';
 function ellipse(x,y,rx,ry,c,stroke=outline,lw=3){
  ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);
  ctx.fillStyle=c;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=lw;ctx.stroke();}
 }
 function grad(c1,c2,y=-45){const g=ctx.createLinearGradient(0,y,0,55);g.addColorStop(0,c1);g.addColorStop(1,c2);return g;}
 function poly(points,color,stroke=outline,lw=3){
  ctx.beginPath();ctx.moveTo(...points[0]);
  for(const p of points.slice(1))ctx.lineTo(...p);
  ctx.closePath();ctx.fillStyle=color;ctx.fill();
  if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=lw;ctx.stroke();}
 }
 function eye(x,y,size=16){
  ellipse(x,y,size,size*.95,'#fffdfb',outline,3.3);
  ellipse(x+3,y,6.8*size/16,9*size/16,'#19132c',null);
  ellipse(x+1,y-5,3*size/16,3*size/16,'white',null);
 }
 function jewel(x,y,r=4){ellipse(x,y,r,r,'#75efff','#fff5d8',1.3);ellipse(x-1,y-1,r*.3,r*.3,'white',null);}
 function cannon(x,y,r=20){
  ellipse(x,y,r+6,r+6,grad('#fffba1','#ed8e1e'),outline,4);
  ellipse(x,y,r,r,'#f39e1d','#f9dd75',3);
  ellipse(x,y,r*.67,r*.67,'#3e1843','#b04c1b',3);
  ellipse(x-3,y-5,4.3,4.3,'#ffffbf',null);
 }
 const wave=Math.sin(t*7),wiggle=Math.sin(t*3.2);
 if(index===0){
  // HATCH: golden one-eyed bee, animated cyan glass wings.
  ellipse(18,6,31,24,grad('#fff365','#d47b13'),outline,3.3);
  for(const x of [14,27])poly([[x,-13],[x+9,-9],[x+11,20],[x+2,27]],'#4c2a2d',null);
  ellipse(-8,-26,20,28+wave*3,grad('#e9ffff','#37c7f8'),outline,3);
  ellipse(24,-30,20,27-wave*3,grad('#edffff','#6ddcff'),outline,3);
  ellipse(-11,-37,6,11,'#fff',null,0);
  ellipse(0,3,26,26,grad('#ffe954','#eeb019'),outline,4);
  eye(-9,2,19);
  ellipse(-2,35,5,5,gold);ellipse(20,34,5,5,gold);
  ctx.strokeStyle=outline;ctx.lineWidth=3;ctx.beginPath();
  ctx.moveTo(-7,-24);ctx.lineTo(-15,-38);ctx.moveTo(3,-22);ctx.lineTo(9,-37);ctx.stroke();
  ellipse(-15,-39,4,4,shine);ellipse(9,-38,4,4,shine);
 }else if(index===1){
  // LEAFUN: bright leaf creature and mobile seed eye.
  for(let i=0;i<5;i++){
   const a=-1.2+i*.55+wiggle*.05;
   ctx.save();ctx.rotate(a);
   ellipse(9,-30,18,32,grad('#c4ff6d','#2ead3c'),outline,3);
   ctx.strokeStyle='#e7ff9c';ctx.lineWidth=2;
   ctx.beginPath();ctx.moveTo(9,-48);ctx.lineTo(9,-14);ctx.stroke();
   ctx.restore();
  }
  ellipse(0,10,34,30,grad('#bfff46','#43b43c'),outline,4);
  eye(-10,8,19);
  ellipse(21,13,6,5,'#f4ffb4',null);
  ellipse(-8,40,7,4,'#f0c840',outline,2);ellipse(16,40,7,4,'#f0c840',outline,2);
 }else if(index===2){
  // KINOPI: red mushroom with cream spots and eye-like face.
  ellipse(0,16,25,30,grad('#fff6af','#dfa028'),outline,4);
  eye(0,14,19);
  ellipse(-15,45,8,5,'#ef9c30',outline,2);ellipse(15,45,8,5,'#ef9c30',outline,2);
  ctx.beginPath();ctx.moveTo(-46,-5);
  ctx.bezierCurveTo(-42,-60,40,-64,46,-5);
  ctx.quadraticCurveTo(0,16,-46,-5);ctx.closePath();
  ctx.fillStyle=grad('#ff7471','#d62340',-55);ctx.fill();
  ctx.strokeStyle=outline;ctx.lineWidth=4;ctx.stroke();
  ellipse(-20,-21,9,6,'#fff7d5',null);
  ellipse(5,-41,11,6,'#fff7d5',null);
  ellipse(28,-19,8,6,'#fff7d5',null);
 }else if(index===3){
  // FLOWAN: five glossy pink petals around one giant eye.
  for(let i=0;i<6;i++){
   const a=i*Math.PI/3+t*.12;
   ctx.save();ctx.rotate(a);
   ellipse(0,-27,20,26,grad('#fff5f8','#fb4fa4'),outline,3);
   ellipse(-6,-36,6,7,'#fff5fa',null);
   ctx.restore();
  }
  ellipse(0,0,27,27,grad('#fffda6','#f1ae31'),outline,4);
  eye(0,0,17);
  ctx.strokeStyle='#289b3b';ctx.lineWidth=10;ctx.beginPath();
  ctx.moveTo(0,35);ctx.lineTo(0,52);ctx.stroke();
  ellipse(11,43,14,6,'#50d84e',outline,2);
 }else if(index===4){
  // TOGEMARON: one-eyed orange spiked cog enemy.
  ctx.save();ctx.rotate(t*.18);
  for(let i=0;i<12;i++){
   const a=i*Math.PI/6;
   ctx.save();ctx.rotate(a);
   poly([[-10,-28],[0,-55],[11,-28]],grad('#ffd765','#ed611c'),outline,2.5);
   ctx.restore();
  }
  ellipse(0,0,36,36,grad('#ffc95a','#e96c13'),outline,4);
  for(let i=0;i<9;i++){const a=i*6.28/9;ellipse(Math.cos(a)*27,Math.sin(a)*27,3,3,'#fff3a0',null);}
  eye(0,0,19);
  ctx.restore();
 }else if(index===5){
  // FLOWER FLYER: pastel airborne flower/cannon fortress.
  for(let i=0;i<6;i++){
   const a=i*Math.PI/3+wiggle*.035;
   ctx.save();ctx.rotate(a);
   ellipse(0,-30,17,26,grad('#fff9bf','#ff70c2'),outline,3);
   ctx.restore();
  }
  ellipse(-41,7,18,12,grad('#ffea7b','#de7d32'),outline,3);
  ellipse(41,7,18,12,grad('#ffea7b','#de7d32'),outline,3);
  ellipse(0,-4,39,31,grad('#f9bbff','#ed55b7'),outline,4);
  poly([[-51,10],[-35,0],[35,0],[51,10],[39,21],[-39,21]],grad('#ffda67','#de7927'),outline,3);
  for(const i of [-30,-15,0,15,30])jewel(i,10,3.6);
  eye(0,-13,15);
  cannon(0,26,19);
  ctx.strokeStyle='#ad6826';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(0,-36);ctx.lineTo(0,-52);ctx.stroke();
  ctx.save();ctx.translate(0,-52);ctx.rotate(t*9);
  ellipse(0,0,30,5,'#ffe364',outline,2);ctx.restore();
 }else if(index===6){
  // GREEN TREE: planted leafy tower with single eye and golden cannon.
  poly([[-30,0],[-25,43],[27,43],[31,0]],grad('#e5a44d','#a06132'),outline,4);
  for(let i=0;i<9;i++){
   const a=i*2.399+wiggle*.015;
   const x=Math.sin(a)*35,y=-25+Math.cos(a)*27;
   ellipse(x,y,27,26,grad('#d9ff7f','#56b940'),outline,3);
  }
  ellipse(0,-31,40,35,grad('#b5fd65','#389e42'),outline,3.7);
  for(let i=0;i<12;i++){
   const a=i*2.399+wiggle*.06;
   const x=Math.sin(a)*42,y=-39+Math.cos(a)*31;
   ellipse(x,y,5,5,['#ff90ce','#fff7a8','#b9eaff'][i%3],outline,1.1);
  }
  ellipse(0,-9,32,23,grad('#fcce71','#d47c2d'),outline,4);
  eye(0,-15,18);
  for(const x of [-31,-16,0,16,31])jewel(x,11,4);
  cannon(0,32,17);
  ellipse(-35,40,10,5,'#58c756',outline,2);ellipse(35,40,10,5,'#58c756',outline,2);
 }
 ctx.restore();
}

function paint(index,x,y,w,h,opts={}){
 const id=current();if(!loaded(id))return false;
 const img=atlas[id],time=opts.time||performance.now()/1000;
 ctx.save();ctx.translate(x,y);
 if(opts.flip)ctx.scale(-1,1);
 if(opts.rotation)ctx.rotate(opts.rotation);
 if(opts.alpha!==undefined)ctx.globalAlpha=opts.alpha;
 if(opts.red)ctx.filter=redFilter;
 if(id===1){
  // Approved character board itself: full 160x160 alpha cut-outs, not vector substitutes.
  ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
  ctx.drawImage(grassHQ,index*160,0,160,160,-w/2,-h/2,w,h);
  ctx.restore();return true;
 }
 ctx.imageSmoothingEnabled=true;
 ctx.imageSmoothingQuality='high';
 // Source art is pre-separated into an alpha-matted single sprite per cell.
 ctx.drawImage(img,src(index),0,48,48,-w/2,-h/2,w,h);
 ctx.restore();
 return true;
}
function animate(id,obj){return (obj?.phase||0)+((obj?.x||0)%13)*.02;}
function spawnDeath(index,x,y,size,kind){
 if(!enabled()||!loaded(current()))return;
 const id=current(),count=kind==='base'?22:12;
 const seed=((Math.floor(x)*11+Math.floor(y)*37+index*1999)>>>0);
 const parts=Array.from({length:count},(_,i)=>{
   const q=(i*17+seed%23)%16,col=q%4,row=Math.floor(q/4),a=i*2.39996,sp=(kind==='base'?140:95)+(i%7)*31;
   return {sx:col*12,sy:row*12,
     vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-110,rot:(i%2?-1:1)*(1.5+i%5)};
 });
 deaths.push({id,index,x,y,size,kind,time:0,parts});
 if(deaths.length>36)deaths.shift();
 counters[kind==='base'?'baseDefeats':'enemyDefeats']++;
}

// Stage 1 art direction from the approved concept board: grassland, not a
// pink cosmic planet. Background follows the camera while character art
// remains sprite-based and belongs to its own draw wrappers below.
const boardOldScreenshotScenery=drawScreenshotScenery;
drawScreenshotScenery=function(){
 // Stage 1 used a pre-rendered planet backdrop, which bypassed both
 // drawSky and drawScenery and hid the approved meadow theme.
 if(stage===1&&!riichiMode)return false;
 return boardOldScreenshotScenery();
};
const boardOldSky=drawSky,boardOldScenery=drawScenery;
drawSky=function(){
 if(riichiMode||stage!==1)return boardOldSky();
 counters.grassSky++;
 const g=ctx.createLinearGradient(0,75,0,ground);
 g.addColorStop(0,'#4aaeff');g.addColorStop(.49,'#a1eaff');g.addColorStop(1,'#ecfff1');
 ctx.fillStyle=g;ctx.fillRect(0,82,W,ground-82);
 ctx.fillStyle='rgba(255,255,255,.82)';
 for(let j=0;j<8;j++){
  const px=(j*241+Math.sin(time*.11+j)*9-camera*.065)%(W+310)-105;
  const py=148+(j%3)*69;
  ctx.beginPath();ctx.ellipse(px,py,88,22,0,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.ellipse(px-36,py-8,36,29,0,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.ellipse(px+24,py-10,45,33,0,0,Math.PI*2);ctx.fill();
 }
};
drawScenery=function(){
 if(riichiMode||stage!==1)return boardOldScenery();
 counters.grassScenery++;
 // distant blue peaks and closer emerald rolling hills
 for(let layer=0;layer<3;layer++){
  const offset=layer===0?camera*.075:layer===1?camera*.19:camera*.32;
  const baseline=ground-(layer===0?175:layer===1?112:48);
  const colors=['#b2cad8','#78d4a5','#42b96b'];
  ctx.fillStyle=colors[layer];
  ctx.beginPath();ctx.moveTo(0,ground);
  for(let x=-120;x<=W+120;x+=35){
   const y=baseline+Math.sin((x+offset)*.009+layer)*36+
        Math.sin((x+offset)*.023+layer*1.4)*13;
   ctx.lineTo(x,y);
  }
  ctx.lineTo(W+120,ground);ctx.closePath();ctx.fill();
 }
 // Midground fantasy trees and green sandstone ruins
 for(let j=-1;j<11;j++){
  const x=((j*191-camera*.48)%(W+390)+(W+390))%(W+390)-160;
  if(x<-100||x>W+100)continue;
  const y=ground-28+Math.sin(j*2.1)*19;
  ctx.fillStyle='#876342';ctx.fillRect(x-8,y-93,16,74);
  const crown=ctx.createRadialGradient(x-18,y-108,8,x,y-120,72);
  crown.addColorStop(0,'#d8fa63');crown.addColorStop(.6,'#69d854');crown.addColorStop(1,'#258c5a');
  ctx.fillStyle=crown;
  for(const [ox,oy,r] of [[-31,-117,35],[28,-119,40],[1,-145,43]]){
   ctx.beginPath();ctx.arc(x+ox,y+oy,r,0,Math.PI*2);ctx.fill();
  }
  ctx.fillStyle='#ffda5d';for(let k=0;k<5;k++){
   const xx=x+Math.sin(k*6+j)*39,yy=y-122+Math.cos(k*2+j)*33;
   ctx.beginPath();ctx.arc(xx,yy,4,0,Math.PI*2);ctx.fill();
  }
 }
 const soil=ctx.createLinearGradient(0,ground,0,H);
 soil.addColorStop(0,'#a5d660');soil.addColorStop(.17,'#98734b');soil.addColorStop(1,'#4c3b56');
 ctx.fillStyle=soil;ctx.fillRect(0,ground,W,H-ground);
 ctx.fillStyle='#5acb47';ctx.fillRect(0,ground-12,W,17);
 ctx.fillStyle='#d1fa63';ctx.fillRect(0,ground-13,W,5);
 for(let j=0;j<100;j++){
  const x=((j*53-camera*.75)%(W+180)+(W+180))%(W+180)-90;
  const y=ground-12-(j%4)*3;
  ctx.strokeStyle=j%2?'#32aa50':'#8ee76a';ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(x,ground-10);ctx.lineTo(x-4,y-8);ctx.stroke();
  if(j%3===0){
   ctx.fillStyle=['#ff78be','#ffe36a','#f6faff'][j%3];
   ctx.beginPath();ctx.arc(x,y-9,4,0,Math.PI*2);ctx.fill();
  }
 }
};

const originalBase=drawBase;
drawBase=function(b){
 if(!enabled()||!b?.alive||!loaded(current()))return originalBase(b);
 const x=screenX(b.x),isAir=!!(b.flying||b.air);
 if(x<-190||x>W+190)return;
 const size=baseScale[current()],t=animate(current(),b);
 const y=isAir?b.y+Math.sin(t*2.5)*7:ground-size*.48+5;
 const index=isAir?5:6;
 // Idle animation: 4-phase bob, head tilt, rhythmic cannon/jewel gleam.
 const cyc=Math.floor((t%2.4)/.6);
 const ang=isAir?Math.sin(t*2.1)*.045:(cyc===2?.018:cyc===3?-.018:0);
 const pulse=(cyc===2?1.035:cyc===3?.985:1);
 if(!paint(index,x,y,size*pulse,size*pulse,{rotation:ang,red:flashing(b)}))return originalBase(b);
 if((cyc===2||cyc===3)&&!flashing(b)){
  ctx.save();ctx.globalAlpha=.15;ctx.fillStyle=accents[current()];
  ctx.beginPath();ctx.arc(x,y+size*.18,12+cyc*3,0,Math.PI*2);ctx.fill();ctx.restore();
 }
 counters[isAir?'air':'ground']++;
};
const originalEnemy=drawEnemy;
drawEnemy=function(e){
 if(!enabled()||!e||e.hp<=0||!loaded(current()))return originalEnemy(e);
 const id=current();
 if(e.boardStage!==id){
  e.boardStage=id;
  // First encounters visibly introduce mushrooms and flowers, rather than
  // looking like the legacy first-stage bee while the player starts moving.
  const spawnOrder=id===1?[2,3,1,4,0]:[0,1,2,3,4];
  e.boardVariant=spawnOrder[spawnCount++%5];
  e.boardLastShot=e.shot;e.boardAttack=0;
 }
 const x=screenX(e.x);
 if(x<-130||x>W+130)return;
 const t=animate(id,e),index=e.boardVariant;
 const size=enemyScale[id]*(index===4?.93:1),phase=Math.floor(t*6)%4;
 const attack=e.boardAttack>0;
 const wobble=index%2?Math.sin(t*4.5)*.095:Math.sin(t*6.0)*.065;
 const bob=Math.sin(t*(index===1?7:4.4))*5;
 const stretch=phase===0?1:phase===2?.94:1.04;
 const red=flashing(e);
 paint(index,x,e.y+bob,size*stretch,size/stretch,{rotation:wobble,flip:e.vx<0,red});
 // The muzzle lights up for an attack instead of drawing an unrelated stock projectile.
 if(attack){
  ctx.save();ctx.globalAlpha=Math.min(1,e.boardAttack/.12)*.86;
  ctx.fillStyle=accents[id];ctx.shadowColor=accents[id];ctx.shadowBlur=12;
  ctx.beginPath();ctx.arc(x+(e.vx<0?-27:27),e.y+bob+2,7,0,Math.PI*2);ctx.fill();ctx.restore();
  counters.shots++;
 }
 counters.enemy++;
};
const originalHitBase=hitBase;
hitBase=function(b,damageAmount){
 if(!enabled()||!b?.alive)return originalHitBase(b,damageAmount);
 const before=b.alive,idx=b.flying||b.air?5:6,origX=b.x,
 y=b.flying||b.air?b.y:ground-baseScale[current()]*.48+5,sz=baseScale[current()];
 const result=originalHitBase(b,damageAmount);
 if(before&&!b.alive)spawnDeath(idx,origX,y,sz,'base');
 return result;
};
const previousUpdate=update;
update=function(dt){
 const id=current(),before=(enabled()&&mode==='play')?enemies.slice():null;
 previousUpdate(dt);
 const d=Math.min(.05,Math.max(0,dt));
 deaths.forEach(a=>a.time+=d);
 for(let i=deaths.length-1;i>=0;i--)if(deaths[i].time>1.5)deaths.splice(i,1);
 if(!enabled())return;
 if(id!==lastStage){spawnCount=0;lastStage=id;}
 if(before){
  const surviving=new Set(enemies);
  for(const e of before){
   if(!surviving.has(e)&&e.boardStage===id&&e.boardVariant>=0)
    spawnDeath(e.boardVariant,e.x,e.y,enemyScale[id],'enemy');
  }
 }
 for(const e of enemies){
  if(e.boardStage!==id)continue;
  if(typeof e.shot==='number'&&typeof e.boardLastShot==='number'&&
     e.shot-e.boardLastShot>.5)e.boardAttack=.2;
  e.boardLastShot=e.shot;
  e.boardAttack=Math.max(0,(e.boardAttack||0)-d);
 }
};
const originalDrawProjectiles=drawProjectiles;
drawProjectiles=function(){
 originalDrawProjectiles();
 if(!enabled())return;
 // Reuse tiles from the actual attached sprite, never generic geometric stickers.
 for(const d of deaths){
  if(!loaded(d.id))continue;
  const x=screenX(d.x),t=d.time,progress=Math.min(1,t/1.3);
  if(x<-200||x>W+200)continue;
  const alpha=Math.min(1,Math.max(0,(1.5-t)/.38));
  const sz=d.size/4;
  ctx.save();ctx.imageSmoothingEnabled=true;
  for(const p of d.parts){
   const i=(p.sy/12)*4+(p.sx/12),tx=x+((p.sx-18)*d.size/48)+p.vx*t*.8,
     ty=d.y+((p.sy-18)*d.size/48)+p.vy*t*.8+210*t*t;
   ctx.save();ctx.globalAlpha=alpha;
   ctx.translate(tx,ty);ctx.rotate(t*p.rot);
   if(d.id===1 && grassReady())
     ctx.drawImage(grassHQ,d.index*160+p.sx/12*40,p.sy/12*40,40,40,-sz*.5,-sz*.5,sz,sz);
   else
     ctx.drawImage(atlas[d.id],src(d.index)+p.sx,p.sy,12,12,-sz*.5,-sz*.5,sz,sz);
   ctx.restore();counters.fragments++;
  }
  if(t<.32){
   ctx.save();ctx.globalAlpha=(.32-t)/.32*.8;
   ctx.strokeStyle=accents[d.id];ctx.shadowColor=accents[d.id];ctx.shadowBlur=20;
   ctx.lineWidth=5;ctx.beginPath();ctx.arc(x,d.y,(d.size*.2)+t*130,0,Math.PI*2);
   ctx.stroke();ctx.restore();
  }
  ctx.restore();
 }
};
function status(){
 return {active:enabled(),stage:current(),loaded:Object.fromEntries(Object.keys(artStages).map(x=>[x,loaded(+x)])),
  names:labels[current()]||[],...counters,activeDeaths:deaths.length,
  renderedVariants:drawCount.slice(0,5),grassHQ:grassReady(),grassArtVersion:'source-HQ-160px',size:Object.fromEntries(Object.keys(artStages).map(x=>[x,x==='1'?grassHQ.naturalWidth:atlas[x].naturalWidth]))};
}
window.ZAMAZONE_BOARD_STAGE1356_QA=status;
if(new URLSearchParams(location.search).get('stage2_qa')==='1'){
 window.ZAMAZONE_BOARD_STAGE1356_TEST={
  smoke(sid){
   if(riichiMode||!artStages[sid])return {error:'invalid stage'};
   const old=forceStage;forceStage=sid;
   const prior={...counters};
   const x=wrapX(camera+130);
   const samples=[];
   try{
    for(let i=0;i<5;i++){
      const e={x:wrapX(camera+130+i*80),y:250,phase:i*.34,hp:3,
       type:'wasp',vx:i%2?60:-60,boardStage:sid,boardVariant:i,boardAttack:.12};
      drawEnemy(e);samples.push(e.boardVariant);drawCount[i]++;
    }
    const groundBase={x,y:ground-45,flying:false,alive:true,hp:2,maxHp:2,phase:.4,flash:0};
    const airBase={x:wrapX(camera+400),y:255,flying:true,alive:true,hp:2,maxHp:2,phase:.6,flash:0};
    drawBase(groundBase);drawBase(airBase);
    // Don't apply hitBase here: it may trigger the next boss when there are no live bases.
    spawnDeath(6,x,ground-85,baseScale[sid],'base');
    spawnDeath(5,airBase.x,airBase.y,baseScale[sid],'base');
    spawnDeath(0,x,255,enemyScale[sid],'enemy');
    drawProjectiles();
    return {stage:sid,loaded:loaded(sid),variants:samples,
      delta:{enemy:counters.enemy-prior.enemy,air:counters.air-prior.air,
        ground:counters.ground-prior.ground,fragments:counters.fragments-prior.fragments},
      names:labels[sid],activeDeaths:deaths.length};
   }finally{forceStage=old;}
  }
 };
}
})();
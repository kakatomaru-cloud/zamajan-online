/* ZAMAZONE_BOARD_STAGE1356_V1_20261118
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
const loaded=id=>!!(atlas[id]?.complete&&atlas[id].naturalWidth===336&&atlas[id].naturalHeight===48);
let forceStage=0,spawnCount=0,lastStage=0,drawCount=Array(7).fill(0);
const deaths=[],counters={enemy:0,air:0,ground:0,enemyDefeats:0,baseDefeats:0,fragments:0,shots:0};
const current=()=>forceStage||stage;
const enabled=()=>!riichiMode&&!!artStages[current()];
const src=i=>i*48;
const enemyScale={1:91,3:91,4:88,5:94,6:94};
const baseScale={1:194,3:194,4:196,5:206,6:202};
const redFilter='brightness(0) saturate(100%) invert(19%) sepia(99%) saturate(6470%) hue-rotate(345deg)';
const flashing=o=>(o?.zfxRedUntil&&performance.now()<o.zfxRedUntil&&Math.floor(performance.now()/70)%2===0)||
  (o?.flash>0&&Math.floor(performance.now()/70)%2===0);
function paint(index,x,y,w,h,opts={}){
 const id=current();if(!loaded(id))return false;
 const img=atlas[id],time=opts.time||0;
 ctx.save();ctx.translate(x,y);
 if(opts.flip)ctx.scale(-1,1);
 if(opts.rotation)ctx.rotate(opts.rotation);
 if(opts.alpha!==undefined)ctx.globalAlpha=opts.alpha;
 if(opts.red)ctx.filter=redFilter;
 ctx.imageSmoothingEnabled=true;
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
  e.boardStage=id;e.boardVariant=spawnCount++%5;
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
  renderedVariants:drawCount.slice(0,5),size:Object.fromEntries(Object.keys(artStages).map(x=>[x,atlas[x].naturalWidth]))};
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
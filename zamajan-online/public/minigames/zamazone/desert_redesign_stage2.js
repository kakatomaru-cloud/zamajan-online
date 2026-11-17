/* ZAMAZONE_STAGE2_DESERT_BASE_ENEMY_REDESIGN_V1_20261117
 * 28 independent transparent WebP animation frames. Stage 2 only.
 * Preserve all legacy hit boxes, projectile behavior, boss attacks, and stages 1,3-6.
 */
(()=>{
 'use strict';
 const ROOT='assets/desert_redesign/';
 const types={ground_idle:4,air_idle:4,ground_death:6,air_death:6,enemy:8};
 const images={};
 for(const [kind,count] of Object.entries(types)){
   images[kind]=Array.from({length:count},(_,i)=>{
     const im=new Image();im.decoding='async';
     im.src=ROOT+kind+'_'+i+'.webp';
     if(im.decode)im.decode().catch(()=>{});
     return im;
   });
 }
 const ready=im=>!!(im?.complete&&im.naturalWidth>0);
 let qaForceStage2=false;
 const active=()=>(stage===2||qaForceStage2)&&!riichiMode;
 const deaths=[];
 const counters={groundDraw:0,airDraw:0,enemyDraw:0,deathDraw:0,groundDestroyed:0,airDestroyed:0};
 const red=o=>o?.zfxRedUntil&&performance.now()<o.zfxRedUntil&&Math.floor(performance.now()/68)%2===0;
 const redFilter='brightness(0) saturate(100%) invert(18%) sepia(100%) saturate(6900%) hue-rotate(345deg) brightness(150%)';
 let warned=false;
 function sprite(im,x,y,w,h,flash){
   if(!ready(im))return false;
   ctx.save();
   if(flash)ctx.filter=redFilter;
   ctx.drawImage(im,x-w/2,y-h/2,w,h);
   ctx.restore();
   return true;
 }
 const prevBase=drawBase;
 drawBase=function(b){
   if(!active()||!b?.alive)return prevBase(b);
   const x=screenX(b.x);
   if(x<-145||x>W+145)return;
   const air=!!(b.flying||b.air),phase=b.phase||0,cyc=phase%3.3;
   const frame=cyc<2.03?0:cyc<2.19?1:cyc<2.68?2:3;
   const ok=air?
      sprite(images.air_idle[frame],x,b.y+Math.sin(phase*2.7)*7,204,204,red(b)):
      sprite(images.ground_idle[frame],x,ground-100,210,202,red(b));
   if(ok){counters[air?'airDraw':'groundDraw']++;return;}
   if(!warned){console.warn('ZAMAZONE desert art not ready; showing original until decoded.');warned=true;}
   return prevBase(b);
 };
 const prevEnemy=drawEnemy;
 const pairs={bird:0,wasp:0,scout:0,bouncer:2,bat:2,jelly:4,crawler:4,laserjelly:6,turret:6};
 drawEnemy=function(e){
   if(!active()||!e||e.hp<=0)return prevEnemy(e);
   const x=screenX(e.x),y=e.y;
   if(x<-140||x>W+140)return;
   const group=pairs[e.type]??0;
   const frame=group+(Math.floor((e.phase||0)*6.5)%2),im=images.enemy[frame];
   if(!ready(im))return prevEnemy(e);
   ctx.save();
   ctx.translate(x,y);
   if((e.vx||0)<0)ctx.scale(-1,1);
   if(group===0||group===2)ctx.rotate(Math.sin((e.phase||0)*4)*.045);
   sprite(im,0,group===4?0:Math.sin((e.phase||0)*5)*3,group===4?120:118,group===4?109:group===2?104:100,red(e));
   ctx.restore();
   counters.enemyDraw++;
 };
 // Destruction animations continue for six visible frames after HP reaches zero.
 const prevHitBase=hitBase;
 hitBase=function(b,amount){
   if(!active()||!b?.alive)return prevHitBase(b,amount);
   const before=b.hp,wasAlive=b.alive;
   const result=prevHitBase(b,amount);
   if(wasAlive&&!b.alive&&before>0){
     const air=!!(b.flying||b.air);
     deaths.push({x:b.x,y:air?b.y:ground+2,air,time:0});
     counters[air?'airDestroyed':'groundDestroyed']++;
   }
   return result;
 };
 const prevUpdate=update;
 update=function(dt){
   prevUpdate(dt);
   if(!active())return;
   const step=Math.max(0,Math.min(dt,.055));
   for(const d of deaths)d.time+=step;
   for(let i=deaths.length-1;i>=0;i--)if(deaths[i].time>1.47)deaths.splice(i,1);
 };
 const prevShots=drawProjectiles;
 drawProjectiles=function(){
   prevShots();
   if(!active())return;
   for(const d of deaths){
     const frame=Math.min(5,Math.floor(d.time/.16));
     const im=images[d.air?'air_death':'ground_death'][frame];
     if(!ready(im))continue;
     const x=screenX(d.x),size=d.air?216:228;
     if(x<-160||x>W+160)continue;
     ctx.save();
     ctx.globalAlpha=d.time>1.02?Math.max(0,1-(d.time-1.02)/.45):1;
     // Ground sprites sit on the arena floor; flying sprites center on the old air base.
     ctx.drawImage(im,x-size/2,d.air?d.y-size/2:d.y-size,size,size);
     ctx.restore();
     counters.deathDraw++;
   }
 };
 const state=()=>({
   active:active(),...counters,activeDestructions:deaths.length,
   assets:Object.fromEntries(Object.entries(images).map(([kind,a])=>[kind,a.filter(ready).length+'/'+a.length]))
 });
 window.ZAMAZONE_DESERT_REDESIGN_QA=state;
 if(new URLSearchParams(location.search).get('stage2_qa')==='1'){
   window.ZAMAZONE_DESERT_REDESIGN_TEST={
     smoke(){
       if(riichiMode)return {error:'Riichi mode cannot be used for desert test'};
       const before=state(),baselineX=screenX(camera+140);
       const groundBase={x:camera+140,y:ground,hp:2,maxHp:2,alive:true,phase:2.08,flying:false,flash:0};
       const airBase={x:camera+390,y:250,hp:2,maxHp:2,alive:true,phase:2.8,flying:true,flash:0};
       const sentinel={x:camera+1300,y:ground,hp:99,maxHp:99,alive:true,flying:false};
       try{
         qaForceStage2=true;
         drawBase(groundBase);drawBase(airBase);
         for(const [type,i] of [['bird',0],['bouncer',1],['jelly',2],['laserjelly',3]]){
           drawEnemy({type,x:camera+520+i*110,y:260,phase:.13,hp:3,vx:-40});
           drawEnemy({type,x:camera+520+i*110,y:260,phase:.30,hp:3,vx:-40});
         }
         bases.push(sentinel);
         try{hitBase(groundBase,3);hitBase(airBase,3);}finally{
           const idx=bases.indexOf(sentinel);if(idx>=0)bases.splice(idx,1);
         }
         update(.17);
         drawProjectiles();
         return {before,after:state(),groundDead:!groundBase.alive,airDead:!airBase.alive,
           allLoaded:Object.entries(images).every(([k,v])=>v.every(ready))};
       }finally{qaForceStage2=false;}
     }
   };
 }
})();
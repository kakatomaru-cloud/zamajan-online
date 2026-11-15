// STAGE2_SCARAB_COMBAT_V7_20261115
// Cohesive 12-frame boss, larger visible silhouette, six reachable armor parts,
// nonpenetrating ricochets and five high-visibility, collidable frontal attacks.
const combatV7PreviousDraw=drawBoss;
const combatV7PreviousShot=applyRigShot;
const combatV7PreviousBomb=applyRigBomb;
const combatV7PreviousAttackUpdate=updateBossAttacks;
const combatV7PreviousAttackDraw=drawBossAttackEffects;
const combatV7PreviousSpawn=spawnBoss;
const combatV7PreviousUpdate=update;
const combatV7On=()=>!riichiMode&&stage===2&&boss?.alive&&boss.z?.n===3;
const combatV7Width=484,combatV7Height=484;
const combatV7Parts={
 armL:{x:-163,y:68,rx:76,ry:66},
 armR:{x:163,y:68,rx:76,ry:66},
 wingL:{x:-146,y:-112,rx:82,ry:61},
 wingR:{x:146,y:-112,rx:82,ry:61},
 tail:{x:0,y:157,rx:66,ry:55},
 core:{x:0,y:-21,rx:65,ry:63}
};
const combatV7Kind=p=>p.type==='core'?'core':p.type==='tail'?'tail':p.type==='wing'?(p.i===2?'wingL':'wingR'):(p.i===0?'armL':'armR');
const combatV7Pose=()=>({
 x:screenX(boss.x),y:boss.y+Math.sin((boss.z.elapsed||0)*2.8)*5
});
const combatV7Targets=()=>{
 const pose=combatV7Pose();
 return boss.z.parts.map(p=>{
  const name=combatV7Kind(p),r=combatV7Parts[name];
  return {p,name,x:pose.x+r.x,y:pose.y+r.y,rx:r.rx,ry:r.ry};
 });
};
function combatV7Bounce(x,y,volume=.03){
 sound(940,.038,'square',volume);sound(590,.076,'triangle',volume*.8);
 pop(x,y,'#fef7c9',7,.36);
}
function combatV7Damage(p,x,y,amount){
 if(p.dead)return;
 if(p.flash>0){combatV7Bounce(x,y,.012);return;}
 p.hp=Math.max(0,p.hp-Math.max(1,Math.floor(amount)));
 p.flash=.12;boss.hitFlash=.17;boss.z.recoil=.21;
 pop(x,y,'#ffdb87',12,.65);sound(240,.11,'sawtooth',.042);
 if(p.hp<=0){
  p.dead=true;shake=Math.max(shake,13);
  pop(x,y,'#ff6caf',38,1.35);sound(107,.26,'sawtooth',.07);
  if(boss.z.parts.every(q=>q.dead)){boss.hp=0;defeatBoss();}
 }
}
spawnBoss=function(){
 combatV7PreviousSpawn();
 if(!combatV7On())return;
 boss.z.parts=[
  {type:'arm',i:0,hp:17,maxHp:17,flash:0,dead:false},
  {type:'arm',i:1,hp:17,maxHp:17,flash:0,dead:false},
  {type:'wing',i:2,hp:15,maxHp:15,flash:0,dead:false},
  {type:'wing',i:3,hp:15,maxHp:15,flash:0,dead:false},
  {type:'tail',i:4,hp:14,maxHp:14,flash:0,dead:false},
  {type:'core',i:99,hp:22,maxHp:22,flash:0,dead:false}
 ];
 boss.hp=boss.maxHp=9999;
 boss.z.attack=null;boss.z.state='IDLE';boss.z.t=0;
 boss.z.combatV7={seq:0,damageClock:0,activeTime:0,chargeHome:boss.x,lockY:boss.y,lockX:0,bulletFlash:0,shield:0,chargeElapsed:0};
};
function combatV7Collision(sx,sy,r=0){
 const targets=combatV7Targets();
 const front=targets.filter(t=>!t.p.dead&&t.name!=='core').sort((a,b)=>a.x-b.x);
 for(const t of front){
  const dx=(sx-t.x)/(t.rx+r),dy=(sy-t.y)/(t.ry+r);
  if(dx*dx+dy*dy<=1)return {...t,kind:'damage'};
 }
 const core=targets.find(t=>t.name==='core');
 if(core&&!core.p.dead){
  const dx=(sx-core.x)/(core.rx+r),dy=(sy-core.y)/(core.ry+r);
  if(dx*dx+dy*dy<=1)return {...core,kind:front.length?'armor':'damage'};
 }
 const pose=combatV7Pose(),dx=(sx-pose.x)/(combatV7Width*.48+r),dy=(sy-pose.y)/(combatV7Height*.39+r);
 if(dx*dx+dy*dy<=1)return {kind:'armor',x:sx,y:sy};
 return null;
}
applyRigShot=function(shot){
 if(!combatV7On())return combatV7PreviousShot(shot);
 if(shot.life<=0)return false;
 const sx=screenX(shot.x),sy=shot.y,r=Math.min(16,shot.radius||5);
 // Swept tests prevent very fast bullets tunnelling through the enlarged sprite.
 const vx=(shot.vx||0),step=Math.sign(vx)*Math.min(90,Math.abs(vx)*.024);
 let hit=null;
 for(let i=0;i<=6;i++){
  const x=sx-step*(1-i/6);
  hit=combatV7Collision(x,sy,r);
  if(hit)break;
 }
 if(!hit)return false;
 const laser=shot.kind==='laser';
 if(laser){shot.hitTargets??=new Set();if(shot.hitTargets.has(boss))return true;shot.hitTargets.add(boss);}
 else{shot.life=0;shot.vx=0;shot.vy=0;}
 if(hit.kind==='armor'){combatV7Bounce(hit.x,hit.y);return true;}
 combatV7Damage(hit.p,hit.x,hit.y,shot.dmg||1);
 return true;
};
applyRigBomb=function(b,radius){
 if(!combatV7On())return combatV7PreviousBomb(b,radius);
 const x=screenX(b.x),y=b.y;let hit=false;
 const parts=combatV7Targets();
 for(const t of parts){
  if(t.p.dead)continue;
  if(t.name==='core'&&parts.some(q=>q.name!=='core'&&!q.p.dead))continue;
  const dist=Math.hypot(Math.max(0,Math.abs(x-t.x)-t.rx),Math.max(0,Math.abs(y-t.y)-t.ry));
  if(dist>radius)continue;
  combatV7Damage(t.p,t.x,t.y,b.big?4:3);hit=true;
 }
 return hit;
};
const combatV7RenderFrame=()=>{
 const a=boss.z.attack?.[0],z=boss.z,t=z.elapsed||0;
 if(z.recoil>.06||boss.hitFlash>.04)return 8+Math.floor(t*11)%2;
 if(z.state==='TELEGRAPH')return a==='claw-laser'?5:a==='frontal-fan'?3:a==='tail-bombs'?6:7;
 if(z.state==='ATTACK')return a==='claw-laser'?5:a==='frontal-fan'?4:a==='tail-bombs'?7:7;
 if(z.state==='RECOVERY')return 2+Math.floor(z.t*4)%2;
 return Math.floor(t*4)%4;
};
drawBoss=function(){
 if(!combatV7On())return combatV7PreviousDraw();
 const pose=combatV7Pose(),x=pose.x,y=pose.y;
 if(x<-350||x>W+350)return;
 const index=combatV7RenderFrame(),img=_poseActualSheet;
 ctx.save();
 ctx.shadowColor='#e07bc3';ctx.shadowBlur=14;
 if(img.complete&&img.naturalWidth===1448&&img.naturalHeight===1086){
  ctx.drawImage(img,(index%4)*362,Math.floor(index/4)*362,362,362,x-combatV7Width/2,y-combatV7Height/2,combatV7Width,combatV7Height);
 }else if(_poseFrameImages[index]?.complete&&_poseFrameImages[index].naturalWidth){
  ctx.drawImage(_poseFrameImages[index],x-combatV7Width/2,y-combatV7Height/2,combatV7Width,combatV7Height);
 }else combatV7PreviousDraw();
 ctx.shadowBlur=0;
 // Highlight breakable part locations; the visible body remains a single connected sprite.
 for(const t of combatV7Targets()){
  if(t.p.dead)continue;
  const health=t.p.hp/t.p.maxHp;
  if(health>.72&&t.p.flash<=0)continue;
  ctx.save();ctx.globalAlpha=t.p.flash>0?.85:health<.3?.55:.30;
  ctx.strokeStyle=t.p.flash>0?'#fffbea':health<.3?'#ff476f':'#ffa856';
  ctx.lineWidth=health<.3?5:3;ctx.shadowColor=ctx.strokeStyle;ctx.shadowBlur=15;
  ctx.beginPath();ctx.ellipse(t.x,t.y,t.rx*.52,t.ry*.52,0,0,Math.PI*2);ctx.stroke();ctx.restore();
 }
 ctx.restore();
};
const combatV7AttackList=['frontal-fan','claw-laser','shell-dash','tail-bombs','sand-columns'];
function combatV7ActiveAttack(z){
 const a=z.attack?.[0]||'',v=z.combatV7,phase=z.state;
 const t=z.t||0,pose=combatV7Pose();
 const fired=phase==='ATTACK';
 if(!fired)return [];
 const effects=[];
 if(a==='claw-laser'){
  for(const dy of [-47,47]){
   const y=v.lockY+dy;
   effects.push({kind:'beam',x1:Math.max(22,pose.x-780),x2:pose.x-100,y,width:23});
  }
 }else if(a==='frontal-fan'){
  for(let i=-2;i<=2;i++){
   const k=t-.09*Math.abs(i);if(k<0||k>2.3)continue;
   effects.push({kind:'orb',x:pose.x-175-k*440,y:pose.y+50+i*(23+k*29),r:22});
  }
 }else if(a==='tail-bombs'){
  for(let i=0;i<5;i++){
   const k=t-i*.18;if(k<0||k>2)continue;
   effects.push({kind:'orb',x:pose.x-60-(i%3)*44-k*270,y:pose.y+120-300*k+380*k*k,r:24});
  }
 }else if(a==='sand-columns'){
  for(let i=0;i<4;i++){
   const x=190+i*310;
   const rise=Math.max(0,Math.min(1,(t-i*.18)*4));
   effects.push({kind:'column',x,y:ground-rise*230,w:90,h:rise*230,active:t>i*.18&&t<i*.18+1.13});
  }
 }else if(a==='shell-dash'){
  effects.push({kind:'body',x:pose.x,y:pose.y,rx:205,ry:175});
 }
 return effects;
}
function combatV7Hits(e,px,py){
 if(e.kind==='beam')return px>=Math.min(e.x1,e.x2)-16&&px<=Math.max(e.x1,e.x2)+16&&Math.abs(py-e.y)<e.width;
 if(e.kind==='orb')return Math.hypot(px-e.x,py-e.y)<e.r+23;
 if(e.kind==='column')return e.active&&Math.abs(px-e.x)<e.w/2+18&&py>e.y-18&&py<ground+24;
 if(e.kind==='body')return Math.pow((px-e.x)/(e.rx+18),2)+Math.pow((py-e.y)/(e.ry+18),2)<1;
 return false;
}
updateBossAttacks=function(dt){
 if(!combatV7On())return combatV7PreviousAttackUpdate(dt);
 const z=boss.z,v=z.combatV7;if(!v)return;
 z.elapsed=(z.elapsed||0)+dt;z.recoil=Math.max(0,(z.recoil||0)-dt);
 for(const p of z.parts)p.flash=Math.max(0,p.flash-dt);
 if(!z.attack){
  z.t=(z.t||0)+dt;
  if(z.t>.66){
   let name=combatV7AttackList[v.seq++%combatV7AttackList.length];
   if(name==='claw-laser'&&z.parts.filter(p=>p.type==='arm'&&!p.dead).length===0)name='frontal-fan';
   if(name==='tail-bombs'&&z.parts.find(p=>p.type==='tail')?.dead)name='frontal-fan';
   z.attack=[name,name];z.state='TELEGRAPH';z.t=0;
   v.lockY=Math.max(175,Math.min(ground-80,player.y));
   v.lockX=screenX(player.x);v.chargeHome=boss.x;v.activeTime=0;v.hitClock=0;
   sound(420,.09,'triangle',.035);
  }
  return;
 }
 z.t+=dt;
 if(z.state==='TELEGRAPH'&&z.t>=1.05){
  z.state='ATTACK';z.t=0;sound(195,.17,'sawtooth',.07);
 }else if(z.state==='ATTACK'&&z.t>=1.62){
  z.state='RECOVERY';z.t=0;
 }else if(z.state==='RECOVERY'&&z.t>=.95){
  z.state='IDLE';z.t=0;z.attack=null;boss.x=v.chargeHome;
 }
 if(z.attack?.[0]==='shell-dash'){
  if(z.state==='ATTACK'){
   // Sudden broad frontal lunge, then return to the anchored arena.
   boss.x=wrapX(v.chargeHome-Math.sin(Math.PI*Math.min(1,z.t/1.62))*365);
  }else if(z.state==='RECOVERY')boss.x=v.chargeHome;
 }
 if(z.state!=='ATTACK'||player.inv>0)return;
 v.hitClock-=dt;
 const px=screenX(player.x),py=player.y;
 if(v.hitClock<=0&&combatV7ActiveAttack(z).some(e=>combatV7Hits(e,px,py))){
  damage('boss');v.hitClock=.72;
 }
 // All boss exterior is solid during motion, including during cannon firing.
 if(v.hitClock<=0){
  const p=combatV7Pose(),dx=(px-p.x)/208,dy=(py-p.y)/177;
  if(dx*dx+dy*dy<1){damage('boss');v.hitClock=.72;}
 }
};
drawBossAttackEffects=function(){
 if(!combatV7On()||!boss.z.attack)return combatV7PreviousAttackDraw();
 const z=boss.z,a=z.attack[0],v=z.combatV7,pose=combatV7Pose();
 if(!v)return;
 ctx.save();
 if(z.state==='TELEGRAPH'){
  ctx.globalAlpha=.45+.22*Math.sin(z.t*15);
  ctx.strokeStyle='#ffe9a2';ctx.lineWidth=4;ctx.setLineDash([14,11]);
  if(a==='claw-laser'){
   for(const dy of [-47,47]){ctx.beginPath();ctx.moveTo(36,v.lockY+dy);ctx.lineTo(pose.x-110,v.lockY+dy);ctx.stroke();}
  }else if(a==='frontal-fan'||a==='tail-bombs'){
   ctx.beginPath();ctx.arc(pose.x-165,pose.y+50,60+z.t*27,Math.PI*.45,Math.PI*1.55);ctx.stroke();
  }else if(a==='shell-dash'){
   ctx.beginPath();ctx.moveTo(35,pose.y);ctx.lineTo(pose.x-145,pose.y);ctx.stroke();
  }else{
   for(let i=0;i<4;i++){ctx.beginPath();ctx.ellipse(190+i*310,ground-7,52,13,0,0,Math.PI*2);ctx.stroke();}
  }
  ctx.setLineDash([]);
 }
 for(const e of combatV7ActiveAttack(z)){
  if(e.kind==='beam'){
   const g=ctx.createLinearGradient(e.x1,e.y,e.x2,e.y);g.addColorStop(0,'#fa69db');g.addColorStop(1,'#fff9d6');
   ctx.shadowColor='#fa55df';ctx.shadowBlur=24;ctx.strokeStyle=g;ctx.lineWidth=28;
   ctx.beginPath();ctx.moveTo(e.x1,e.y);ctx.lineTo(e.x2,e.y);ctx.stroke();
   ctx.strokeStyle='#fff8e6';ctx.lineWidth=7;ctx.stroke();ctx.shadowBlur=0;
  }else if(e.kind==='orb'){
   const g=ctx.createRadialGradient(e.x-5,e.y-5,2,e.x,e.y,e.r);
   g.addColorStop(0,'#fffde8');g.addColorStop(.35,'#fa9dea');g.addColorStop(1,'#7f31a7');
   ctx.fillStyle=g;ctx.strokeStyle='#ffe7ad';ctx.lineWidth=3;ctx.shadowColor='#fc5bd9';ctx.shadowBlur=13;
   ctx.beginPath();ctx.arc(e.x,e.y,e.r,0,2*Math.PI);ctx.fill();ctx.stroke();ctx.shadowBlur=0;
  }else if(e.kind==='column'&&e.active){
   const g=ctx.createLinearGradient(e.x-45,0,e.x+45,0);g.addColorStop(0,'#855479');g.addColorStop(.45,'#f5d59a');g.addColorStop(1,'#8f5975');
   ctx.fillStyle=g;ctx.fillRect(e.x-e.w/2,e.y,e.w,e.h);
   ctx.fillStyle='#fff1ba';ctx.fillRect(e.x-e.w/2,e.y,e.w,9);
  }else if(e.kind==='body'){
   ctx.strokeStyle='#ffb8ec';ctx.lineWidth=8;ctx.globalAlpha=.48;
   for(let i=0;i<7;i++){const y=e.y-110+i*37;ctx.beginPath();ctx.moveTo(e.x-220,y);ctx.lineTo(e.x-390,y);ctx.stroke();}
   ctx.globalAlpha=1;
  }
 }
 ctx.restore();
};
window.ZAMAZONE_STAGE2_COMBAT_V7_QA=()=>({
 version:'scarab-combat-v7',stage,mode,
 frame:combatV7On()?combatV7RenderFrame():null,
 size:[combatV7Width,combatV7Height],
 parts:combatV7On()?combatV7Targets().map(t=>({role:t.name,hp:t.p.hp,dead:t.p.dead,x:t.x,y:t.y})):[],
 attack:combatV7On()?boss.z.attack?.[0]||null:null,
 attackState:combatV7On()?boss.z.state:null,
 hazards:combatV7On()?combatV7ActiveAttack(boss.z).map(e=>e.kind):[]
});
if(new URLSearchParams(location.search).get('stage2_qa')==='1'){
 window.ZAMAZONE_STAGE2_COMBAT_V7_TEST=function(){
  if(!combatV7On())return {error:'boss not running'};
  const z=boss.z,parts=[];
  const blocker={x:wrapX(boss.x),y:boss.y-24,life:1,vx:700,dmg:1,radius:1};
  const oldCore=z.parts.find(p=>p.type==='core').hp;
  const blocked=applyRigShot(blocker),blockedConsumed=blocker.life===0,coreSafe=z.parts.find(p=>p.type==='core').hp===oldCore;
  // Hit each reachable plate in visual coordinates without overriding the collision pipeline.
  for(const name of ['armL','armR','wingL','wingR','tail']){
   const hit=combatV7Targets().find(t=>t.name===name);
   hit.p.flash=0;
   const s={x:wrapX(boss.x+combatV7Parts[name].x),y:boss.y+combatV7Parts[name].y,life:1,vx:500,dmg:1,radius:1};
   const before=hit.p.hp,collided=applyRigShot(s);
   parts.push({name,collided,consumed:s.life===0,damaged:hit.p.hp<before});
  }
  return {blocked,blockedConsumed,coreSafe,parts};
 };
 window.ZAMAZONE_STAGE2_COMBAT_V7_FORCE_ATTACK=(name)=>{
  if(!combatV7On()||!combatV7AttackList.includes(name))return false;
  const z=boss.z;z.attack=[name,name];z.state='ATTACK';z.t=.35;z.combatV7.lockY=player.y;z.combatV7.chargeHome=boss.x;return true;
 };
}

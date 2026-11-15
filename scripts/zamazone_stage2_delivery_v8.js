// STAGE2_DELIVERY_V8_20261115
// Full-body collision, large choreography, readable physical warnings and real projectile hazards.
const v8oldSpawn=spawnBoss,v8oldDraw=drawBoss,v8oldUpdate=updateBossAttacks,v8oldShot=applyRigShot,v8oldBomb=applyRigBomb,v8oldFX=drawBossAttackEffects;
const v8On=()=>!riichiMode&&stage===2&&boss?.alive&&boss.z?.n===3&&!!boss.v8;
const v8Sheet=new Image();v8Sheet.src='assets/scarab_boss_12poses.webp';
const v8Size=510,v8Rad={wingL:[-138,-115,83,76],wingR:[138,-115,83,76],armL:[-137,66,78,86],armR:[137,66,78,86],tail:[0,147,64,56],core:[0,-18,73,75]};
const v8Role=p=>p.type==='core'?'core':p.type==='tail'?'tail':p.type==='wing'?(p.i===2?'wingL':'wingR'):(p.i===0?'armL':'armR');
const v8At=()=>({x:screenX(boss.x),y:boss.y+Math.sin(boss.v8.clock*2.4)*9});
function v8Parts(){const q=v8At();return boss.z.parts.map(p=>{const a=v8Rad[v8Role(p)];return {p,x:q.x+a[0],y:q.y+a[1],rx:a[2],ry:a[3],role:v8Role(p)};});}
function v8Particles(x,y,color,qty=12){pop(wrapX(camera+(x-W/2)),y,color,qty,.6);}
function v8SoundBounce(x,y){sound(1020,.036,'square',.05);sound(570,.09,'triangle',.028);v8Particles(x,y,'#fff3b8',9);}
function v8Hitbox(x,y,rx,ry,px,py,r=0){return Math.pow((px-x)/(rx+r),2)+Math.pow((py-y)/(ry+r),2)<=1;}
function v8Feedback(txt,x,y,col='#ffebac'){boss.v8.floats.push({txt,x,y,life:.75,col});}
function v8Damage(part,amount,x,y){
 if(part.dead||part.flash>0)return false;
 part.hp=Math.max(0,part.hp-amount);part.flash=.115;boss.hitFlash=.15;boss.z.recoil=.22;boss.v8.pulse=.23;
 v8Feedback('-'+amount,x,y,'#fff6e5');v8Particles(x,y,'#ffc4f0',15);sound(265,.105,'sawtooth',.057);
 if(!part.hp){part.dead=true;v8Feedback('BREAK!',x,y-28,'#ffe9a2');v8Particles(x,y,'#ff6ebf',33);shake=Math.max(shake,13);sound(115,.28,'sawtooth',.09);}
 if(boss.z.parts.every(p=>p.dead)){boss.hp=0;defeatBoss();}
 return true;
}
spawnBoss=function(){
 v8oldSpawn();
 if(riichiMode||stage!==2||!boss?.alive||boss.z?.n!==3)return;
 boss.z.parts=[
  {type:'arm',i:0,hp:15,maxHp:15,dead:false,flash:0},
  {type:'arm',i:1,hp:15,maxHp:15,dead:false,flash:0},
  {type:'wing',i:2,hp:13,maxHp:13,dead:false,flash:0},
  {type:'wing',i:3,hp:13,maxHp:13,dead:false,flash:0},
  {type:'tail',i:4,hp:12,maxHp:12,dead:false,flash:0},
  {type:'core',i:99,hp:20,maxHp:20,dead:false,flash:0}
 ];
 boss.hp=boss.maxHp=9999;boss.z.attack=null;boss.z.state='IDLE';boss.z.t=0;
 boss.v8={clock:0,seq:0,phase:'idle',timer:.7,attack:null,lockY:300,homeX:boss.x,hitClock:0,pulse:0,floats:[],projectiles:[],physicalClock:0};
};
function v8Collision(shot){
 const q=v8At(),sx=screenX(shot.x),sy=shot.y,r=shot.radius||5;
 const front=v8Parts().filter(o=>!o.p.dead&&o.role!=='core');
 for(const p of front)if(v8Hitbox(p.x,p.y,p.rx,p.ry,sx,sy,r))return {type:'part',p};
 const core=v8Parts().find(o=>o.role==='core');
 if(core&&!core.p.dead&&v8Hitbox(core.x,core.y,core.rx,core.ry,sx,sy,r))return front.length?{type:'armor',x:sx,y:sy}:{type:'part',p:core};
 // Full coherent silhouette (armor) remains solid even between or after broken plates.
 if(v8Hitbox(q.x,q.y,236,218,sx,sy,r))return {type:'armor',x:sx,y:sy};
 return null;
}
applyRigShot=function(shot){
 if(!v8On())return v8oldShot(shot);
 if(shot.life<=0)return false;
 const laser=shot.kind==='laser';
 if(laser){shot.hitTargets??=new Set();if(shot.hitTargets.has(boss))return true;}
 let target=null;
 const current=screenX(shot.x),y=shot.y,previousX=current-Math.max(-74,Math.min(74,(shot.vx||0)*.024));
 for(let i=0;i<=10;i++){
   const sx=previousX+(current-previousX)*i/10;
   const virtual={...shot,x:wrapX(camera+(sx-W/2))};
   target=v8Collision(virtual);
   if(target)break;
 }
 if(!target)return false;
 // All projectiles are stopped. Lasers stay drawn, but cannot deal repeat damage in one pass.
 if(laser)shot.hitTargets.add(boss);else{shot.life=0;shot.vx=0;shot.vy=0;}
 if(target.type==='armor'){v8SoundBounce(target.x,target.y);return true;}
 if(!v8Damage(target.p.p,Math.max(1,shot.dmg||1),target.p.x,target.p.y))v8SoundBounce(target.p.x,target.p.y);
 return true;
};
applyRigBomb=function(b,rad){
 if(!v8On())return v8oldBomb(b,rad);
 const x=screenX(b.x),y=b.y;let hit=false;
 const targets=v8Parts();
 for(const t of targets){
  if(t.p.dead||t.p.flash>0)continue;
  if(t.role==='core'&&targets.some(p=>p.role!=='core'&&!p.p.dead))continue;
  const dx=Math.max(0,Math.abs(x-t.x)-t.rx),dy=Math.max(0,Math.abs(y-t.y)-t.ry);
  if(Math.hypot(dx,dy)<=rad){v8Damage(t.p,b.big?4:3,t.x,t.y);hit=true;}
 }
 if(!hit&&v8Hitbox(v8At().x,v8At().y,236+rad*.3,218+rad*.3,x,y)){v8SoundBounce(x,y);hit=true;}
 return hit;
};
const v8Order=['front-barrage','double-laser','ram','claw-wave','sky-meteors'];
function v8Projectiles(){
 const v=boss.v8,p=v8At(),t=v.timer;
 if(v.phase!=='active')return[];
 if(v.attack==='double-laser')return [-55,54].map(dy=>({kind:'beam',x1:28,x2:p.x-125,y:v.lockY+dy,width:29}));
 if(v.attack==='front-barrage'){
  return v.projectiles.filter(o=>o.life>0).map(o=>({kind:'orb',x:o.x,y:o.y,r:o.r}));
 }
 if(v.attack==='claw-wave')return v.projectiles.filter(o=>o.life>0).map(o=>({kind:'slash',x:o.x,y:o.y,rx:48,ry:44}));
 if(v.attack==='sky-meteors')return v.projectiles.filter(o=>o.life>0).map(o=>({kind:'orb',x:o.x,y:o.y,r:o.r}));
 if(v.attack==='ram')return [{kind:'body',x:p.x,y:p.y,rx:235,ry:207}];
 return [];
}
function v8HazardHit(o,x,y){
 if(o.kind==='beam')return x>=Math.min(o.x1,o.x2)-12&&x<=Math.max(o.x1,o.x2)+12&&Math.abs(y-o.y)<o.width+16;
 if(o.kind==='orb')return Math.hypot(x-o.x,y-o.y)<=o.r+18;
 if(o.kind==='slash')return Math.abs(x-o.x)<o.rx+19&&Math.abs(y-o.y)<o.ry+19;
 if(o.kind==='body')return v8Hitbox(o.x,o.y,o.rx,o.ry,x,y,15);
 return false;
}
function v8Launch(){
 const v=boss.v8,p=v8At(),attack=v.attack;v.projectiles=[];
 if(attack==='front-barrage')for(let i=-2;i<=2;i++)v.projectiles.push({x:p.x-170,y:p.y+i*38,vx:-430,vy:i*55,r:25,life:2.6,kind:'orb'});
 if(attack==='claw-wave')for(let i=-1;i<=1;i++)v.projectiles.push({x:p.x-160,y:p.y+45+i*67,vx:-485,vy:0,r:44,life:1.8,kind:'slash'});
 if(attack==='sky-meteors')for(let i=0;i<7;i++)v.projectiles.push({x:135+i*166,y:90-i*27,vx:-35,vy:150+i*18,r:26,life:3.5,kind:'meteor'});
 sound(165,.19,'sawtooth',.095);
}
function v8StepProjectiles(dt){
 const v=boss.v8;
 for(const o of v.projectiles){
  o.x+=(o.vx||0)*dt;o.y+=(o.vy||0)*dt;
  if(o.kind==='meteor')o.vy+=300*dt;
  o.life-=dt;
 }
 v.projectiles=v.projectiles.filter(o=>o.life>0&&o.x>-100&&o.x<W+110&&o.y<ground+110);
}
updateBossAttacks=function(dt){
 if(!v8On())return v8oldUpdate(dt);
 const v=boss.v8,z=boss.z;
 v.clock+=dt;z.elapsed+=dt;v.pulse=Math.max(0,v.pulse-dt);
 v.hitClock=Math.max(0,v.hitClock-dt);
 for(const p of z.parts)p.flash=Math.max(0,p.flash-dt);
 for(const o of v.floats){o.y-=dt*35;o.life-=dt;}
 v.floats=v.floats.filter(o=>o.life>0);
 // The boss never remains stationary: slow sweeping hover, big telegraphed lunges.
 if(v.phase==='idle'){
  boss.x=wrapX(boss.x-.45*dt*75);
  boss.y+=(305+Math.sin(v.clock*1.9)*39-boss.y)*Math.min(1,dt*2.8);
  v.timer-=dt;
  if(v.timer<=0){
   v.attack=v8Order[v.seq++%v8Order.length];v.phase='warn';v.timer=1.05;
   v.lockY=Math.max(200,Math.min(ground-100,player.y));v.homeX=boss.x;
   v.projectiles=[];sound(520,.16,'triangle',.035);
  }
 }else if(v.phase==='warn'){
  v.timer-=dt;
  if(v.attack==='ram')boss.x=wrapX(boss.x-80*dt);
  boss.y+=(v.lockY-boss.y)*Math.min(1,dt*1.9);
  if(v.timer<=0){v.phase='active';v.timer=v.attack==='ram'?.86:v.attack==='sky-meteors'?1.85:1.4;v8Launch();}
 }else if(v.phase==='active'){
  v.timer-=dt;
  if(v.attack==='ram'){boss.x=wrapX(boss.x-655*dt);boss.y+=Math.sin(v.clock*13)*3;}
  if(v.attack==='double-laser')v.lockY+=Math.sin(v.clock*3)*95*dt;
  v8StepProjectiles(dt);
  if(v.timer<=0){v.phase='recover';v.timer=.85;}
 }else if(v.phase==='recover'){
  v.timer-=dt;
  boss.x=wrapX(boss.x+nearDelta(v.homeX,boss.x)*Math.min(1,dt*3.2));
  v8StepProjectiles(dt);
  if(v.timer<=0){v.phase='idle';v.timer=.65;v.attack=null;v.projectiles=[];}
 }
 const px=screenX(player.x),py=player.y;
 const q=v8At();
 const bodyCollision=v8Hitbox(q.x,q.y,230,207,px,py,17);
 if(v.hitClock<=0&&player.inv<=0&&(bodyCollision||v8Projectiles().some(o=>v8HazardHit(o,px,py)))){
  damage('boss');v.hitClock=.75;
 }
};
drawBoss=function(){
 if(!v8On())return v8oldDraw();
 const v=boss.v8,p=v8At();if(p.x<-350||p.x>W+350)return;
 const t=v.clock;
 let i=v.phase==='warn'?(v.attack==='ram'?3:v.attack==='double-laser'?6:4):v.phase==='active'?(v.attack==='ram'?8:v.attack==='double-laser'?7:5):Math.floor(t*4)%4;
 if(v.pulse>0)i=9;
 const image=v8Sheet.complete&&v8Sheet.naturalWidth===1448?v8Sheet:_poseFrameImages[i];
 ctx.save();ctx.shadowColor='#ff9ada';ctx.shadowBlur=v.pulse>0?30:11;
 if(image===v8Sheet)ctx.drawImage(image,(i%4)*362,Math.floor(i/4)*362,362,362,p.x-v8Size/2,p.y-v8Size/2,v8Size,v8Size);
 else if(image?.complete&&image.naturalWidth)ctx.drawImage(image,p.x-v8Size/2,p.y-v8Size/2,v8Size,v8Size);
 ctx.shadowBlur=0;
 // The full-body animation is not cut apart. Damage appears at actual hitbox locations.
 for(const o of v8Parts()){
   if(o.p.dead)continue;
   const r=o.p.hp/o.p.maxHp;
   if(r>.8&&o.p.flash<=0)continue;
   ctx.save();ctx.globalAlpha=o.p.flash>0?.85:Math.max(.25,(1-r)*.65);
   ctx.strokeStyle=o.p.flash>0?'#fff5c7':r<.3?'#ff4967':'#ffad69';
   ctx.shadowColor=ctx.strokeStyle;ctx.shadowBlur=14;ctx.lineWidth=o.p.flash>0?7:5;
   ctx.beginPath();ctx.ellipse(o.x,o.y,o.rx*.72,o.ry*.72,0,0,Math.PI*2);ctx.stroke();ctx.restore();
 }
 for(const f of v.floats){ctx.save();ctx.globalAlpha=Math.min(1,f.life/.35);ctx.font='bold 23px system-ui';ctx.textAlign='center';ctx.strokeStyle='#3e2559';ctx.lineWidth=5;ctx.strokeText(f.txt,f.x,f.y);ctx.fillStyle=f.col;ctx.fillText(f.txt,f.x,f.y);ctx.restore();}
 ctx.restore();
};
drawBossAttackEffects=function(){
 if(!v8On())return v8oldFX();
 const v=boss.v8,p=v8At();ctx.save();
 if(v.phase==='warn'){
  ctx.globalAlpha=.65;ctx.strokeStyle='#ffedb4';ctx.lineWidth=5;ctx.setLineDash([13,10]);
  if(v.attack==='double-laser')for(const dy of [-55,54]){ctx.beginPath();ctx.moveTo(24,v.lockY+dy);ctx.lineTo(p.x-125,v.lockY+dy);ctx.stroke();}
  else if(v.attack==='ram'){ctx.beginPath();ctx.moveTo(p.x-160,p.y);ctx.lineTo(25,p.y);ctx.stroke();ctx.beginPath();ctx.ellipse(p.x,p.y,250,223,0,0,Math.PI*2);ctx.stroke();}
  else if(v.attack==='sky-meteors')for(let j=0;j<7;j++){ctx.beginPath();ctx.ellipse(135+j*166,ground-8,45,14,0,0,Math.PI*2);ctx.stroke();}
  else{ctx.beginPath();ctx.arc(p.x-150,p.y,90,Math.PI*.65,Math.PI*1.36);ctx.stroke();}
  ctx.setLineDash([]);ctx.globalAlpha=1;
 }
 for(const a of v8Projectiles()){
   if(a.kind==='beam'){ctx.strokeStyle='#f355e8';ctx.shadowColor='#fa3fe7';ctx.shadowBlur=23;ctx.lineWidth=34;ctx.beginPath();ctx.moveTo(a.x1,a.y);ctx.lineTo(a.x2,a.y);ctx.stroke();ctx.strokeStyle='#fffaf4';ctx.lineWidth=8;ctx.stroke();ctx.shadowBlur=0;}
   else if(a.kind==='orb'){const g=ctx.createRadialGradient(a.x-6,a.y-6,1,a.x,a.y,a.r);g.addColorStop(0,'#fffaf1');g.addColorStop(.42,'#ff9edb');g.addColorStop(1,'#a53fc5');ctx.fillStyle=g;ctx.shadowColor='#fa66ef';ctx.shadowBlur=15;ctx.beginPath();ctx.arc(a.x,a.y,a.r,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;}
   else if(a.kind==='slash'){ctx.strokeStyle='#ff85e8';ctx.shadowColor='#ff6de5';ctx.shadowBlur=23;ctx.lineWidth=20;ctx.beginPath();ctx.moveTo(a.x+50,a.y-43);ctx.lineTo(a.x-43,a.y+43);ctx.stroke();ctx.shadowBlur=0;}
   else if(a.kind==='body'){ctx.strokeStyle='#ffd1f3';ctx.globalAlpha=.5;ctx.lineWidth=8;for(let j=0;j<6;j++){let y=a.y-130+j*48;ctx.beginPath();ctx.moveTo(a.x-170,y);ctx.lineTo(a.x-420,y);ctx.stroke();}ctx.globalAlpha=1;}
   else if(a.kind==='column'){ctx.fillStyle='#e7ac88';ctx.fillRect(a.x-a.w/2,a.y,a.w,a.h);}
 }
 ctx.restore();
};
window.ZAMAZONE_STAGE2_V8_QA=()=>{
 if(!v8On())return {active:false};
 const v=boss.v8;return {active:true,stage,parts:v8Parts().map(o=>({name:o.role,hp:o.p.hp,dead:o.p.dead,x:o.x,y:o.y})),attack:v.attack,phase:v.phase,hazards:v8Projectiles().map(o=>o.kind),imageLoaded:v8Sheet.complete&&v8Sheet.naturalWidth===1448};
};
if(new URLSearchParams(location.search).get('stage2_qa')==='1'){
 window.ZAMAZONE_STAGE2_V8_TEST=()=>{
  if(!v8On())return {error:'boss missing'};
  const seen=[];
  for(const role of ['armL','armR','wingL','wingR','tail']){
   let part=v8Parts().find(q=>q.role===role);const hp=part.p.hp;
   part.p.flash=0;
   const bullet={x:wrapX(camera+(part.x-W/2)),y:part.y,life:1,vx:500,dmg:2,radius:1};
   const collided=applyRigShot(bullet);
   seen.push({role,collided,consumed:bullet.life===0,damage:hp-part.p.hp});
  }
  const armor={x:boss.x,y:boss.y,life:1,vx:500,dmg:2,radius:1},core=v8Parts().find(p=>p.role==='core').p.hp;
  const blocked=applyRigShot(armor);
  return {seen,blocked,blockedConsumed:armor.life===0,coreSafe:v8Parts().find(p=>p.role==='core').p.hp===core};
 };
 window.ZAMAZONE_STAGE2_V8_FORCE=a=>{
  if(!v8On()||!v8Order.includes(a))return false;
  let v=boss.v8;v.attack=a;v.phase='active';v.timer=1.3;v.lockY=player.y;v.homeX=boss.x;v8Launch();return true;
 };
}

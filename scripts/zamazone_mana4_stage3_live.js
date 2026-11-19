/* ZAMAZONE_MANA4_STAGE3_LIVE_V1_20261119
 * Stage 3 mana4 real encounter. Reuses the approved animated standalone
 * boss body/tentacle drawing with integrated projectile, bomb and player damage.
 * Keeps stage 2 and stages 1/4/5/6 unchanged. No image collage.
 */
(()=>{
'use strict';
const TAU=Math.PI*2,g=ctx;
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t)};
const rand=(a,b)=>a+Math.random()*(b-a);
const palette=['#e944f6','#b134dd','#fb75ef','#8b2cc8','#d444ed','#c72dd6','#ed4cdd','#9c27c9'];
const TOTAL=.90,WARN=.17,EXTEND=.19,HOLD=.22,RETRACT=.32;
let clock=0,state='intro',body={x:640,y:-215};
const arms=[],bubbles=[],shards=[];
let introTime=0,phaseTime=0,nextVolley=.8,bubbleWave=0,safeLane=640,attackCount=0,lastGroup=0,hitCooldown=0,coreHP=22,coreMax=22,drawFrames=0,damageCount=0,shotsHit=0,bubbleHits=0,defeated=false;
function on(){return !riichiMode&&stage===3&&!!boss?.alive&&boss.mana4Live===true;}
function reset(){
 clock=0;state='intro';body={x:640,y:-215};introTime=0;phaseTime=0;nextVolley=.8;bubbleWave=0;safeLane=640;attackCount=0;lastGroup=0;hitCooldown=0;coreHP=22;damageCount=0;shotsHit=0;bubbleHits=0;defeated=false;
 arms.length=0;bubbles.length=0;shards.length=0;
 for(let i=0;i<8;i++)arms.push({i,hp:3,max:3,angle:(i+.45)*TAU/8,
 flash:0,broken:false,attack:0,warning:0,edge:0,aimX:0,aimY:0});
}
function spawn(){const live=on();if(!live)return;
 boss.z.parts=[{type:'core',i:99,hp:9999,maxHp:9999,dead:false,flash:0}];
 boss.hp=boss.maxHp=9999;
 reset();
}
function motionTip(a){
 const angle=a.angle+.12*Math.sin(clock*.8+a.i),len=200+(a.i%3)*24;
 if(state==='bubble')return{x:body.x+Math.cos(a.angle)*58,y:body.y+Math.sin(a.angle)*46};
 if(state==='final'||a.broken)return{x:body.x,y:body.y};
 const home={x:body.x+Math.cos(angle)*len,y:body.y+Math.sin(angle)*(len*.86)+Math.sin(clock*2.3+a.i)*19};
 if(a.attack<=0)return home;
 const elapsed=TOTAL-a.attack;
 let reach=0;
 if(elapsed<WARN)reach=0;
 else if(elapsed<WARN+EXTEND)reach=smooth((elapsed-WARN)/EXTEND);
 else if(elapsed<WARN+EXTEND+HOLD)reach=1;
 else reach=1-smooth((elapsed-WARN-EXTEND-HOLD)/RETRACT);
 const e=a.edge;
 const target=e===0?{x:-45,y:clamp(a.aimY,34,H-35)}:
 e===1?{x:W+45,y:clamp(a.aimY,34,H-35)}:
 e===2?{x:clamp(a.aimX,35,W-35),y:-50}:
 {x:clamp(a.aimX,35,W-35),y:H+65};
 return {x:lerp(home.x,target.x,reach),y:lerp(home.y,target.y,reach)};
}
function getCenter(arm){return {x:body.x+Math.cos(arm.angle)*88,y:body.y+Math.sin(arm.angle)*72};}
function getTip(arm){return motionTip(arm);}
function curve(arm){const s=getCenter(arm),t=getTip(arm);const dx=t.x-s.x,dy=t.y-s.y,mag=Math.hypot(dx,dy);const wave=(state==='final'?0:1)*(state==='bubble'?.3:1);const swirl=Math.sin(clock*1.7+arm.i*1.75)*35*wave;const perpendicular={x:-dy/(mag||1),y:dx/(mag||1)};
 const cp1={x:s.x+dx*.28+perpendicular.x*(swirl+36),y:s.y+dy*.28+perpendicular.y*(swirl+36)};
 const cp2={x:s.x+dx*.72-perpendicular.x*(swirl*1.9+28),y:s.y+dy*.72-perpendicular.y*(swirl*1.9+28)};
 if(arm.attack>0){const thrust=smooth((ATTACK_TOTAL-arm.attack)/.38);cp1.x+=perpendicular.x*75*thrust;cp1.y+=perpendicular.y*75*thrust;cp2.x-=perpendicular.x*80*thrust;cp2.y-=perpendicular.y*80*thrust;}
 return {s,cp1,cp2,t};}
function bez(p,u){let v=1-u;return{x:p.s.x*v*v*v+3*p.cp1.x*v*v*u+3*p.cp2.x*v*u*u+p.t.x*u*u*u,y:p.s.y*v*v*v+3*p.cp1.y*v*v*u+3*p.cp2.y*v*u*u+p.t.y*u*u*u};}
function pathArm(p){g.moveTo(p.s.x,p.s.y);g.bezierCurveTo(p.cp1.x,p.cp1.y,p.cp2.x,p.cp2.y,p.t.x,p.t.y)}
function drawArm(arm){if(arm.broken||state==='final')return;const p=curve(arm),scale=state==='bubble'?.36:1,red=arm.flash>0&&Math.floor(clock*22)%2===0;let w=48*scale;
 g.save();g.lineCap='round';g.lineJoin='round';g.shadowBlur=arm.warning>0?29:state==='bubble'?5:10;g.shadowColor=arm.warning>0?'#fff8a5':'#22045a';
 g.beginPath();pathArm(p);g.lineWidth=w+19*scale;g.strokeStyle='#41157a';g.stroke();
 const warn=arm.warning>0&&Math.floor(clock*32)%2===0;const grad=g.createLinearGradient(p.s.x,p.s.y,p.t.x,p.t.y);grad.addColorStop(0,red?'#ff2e46':warn?'#fffbd1':palette[arm.i]);grad.addColorStop(.5,red?'#ff678a':warn?'#ffff78':'#f951ee');grad.addColorStop(1,red?'#ea1237':warn?'#ffedaa':'#8f1bce');g.lineWidth=w+10*scale;g.strokeStyle=grad;g.stroke();
 g.beginPath();pathArm(p);g.lineWidth=19*scale;g.strokeStyle=red?'#ff9fa9':'#f8a8ef';g.stroke();
 for(let k=1;k<=10;k++){const u=k/12,q=bez(p,u);const b=bez(p,Math.min(.99,u+.017));const angle=Math.atan2(b.y-q.y,b.x-q.x)+Math.PI/2;
 g.save();g.translate(q.x,q.y);g.rotate(angle);g.fillStyle=red?'#ffc1cf':'#ffd0b3';g.strokeStyle='#8a3189';g.lineWidth=2*scale;g.beginPath();g.ellipse(0,19*scale,10*scale,7*scale,0,0,TAU);g.fill();g.stroke();g.fillStyle='#ac528c';g.beginPath();g.ellipse(0,19*scale,4*scale,3*scale,0,0,TAU);g.fill();g.restore();}
 for(let k=0;k<5;k++){const u=(k+.4)/6,q=bez(p,u);g.fillStyle='#fff2ff';g.globalAlpha=.72;g.beginPath();g.ellipse(q.x-7,q.y-9,5*scale,3*scale,0,0,TAU);g.fill();}
 g.restore();}
function gold(gx,gy,r){let gr=g.createRadialGradient(gx-r*.3,gy-r*.4,0,gx,gy,r);gr.addColorStop(0,'#ffffab');gr.addColorStop(.34,'#ffe347');gr.addColorStop(.7,'#f59b10');gr.addColorStop(1,'#87330e');return gr}
function drawBody(){let r=state==='final'?57:state==='bubble'?108:163;let x=body.x,y=body.y;
 g.save();g.translate(x,y);const sc=r/163;g.scale(sc,sc);
 g.shadowColor='#0c0632';g.shadowBlur=24;
 const gr=g.createRadialGradient(-60,-66,8,0,0,190);gr.addColorStop(0,'#ff87fb');gr.addColorStop(.55,'#d32dd9');gr.addColorStop(.85,'#67228d');gr.addColorStop(1,'#341262');g.beginPath();g.ellipse(0,6,147,145,0,0,TAU);g.fillStyle=gr;g.fill();g.lineWidth=10;g.strokeStyle='#3a0c72';g.stroke();g.shadowBlur=0;
 for(let i=0;i<26;i++){let a=i*2.399,rp=70+((i*11)%53),xx=Math.cos(a)*rp,yy=Math.sin(a)*rp+10;if(Math.abs(xx)<55&&yy>-66&&yy<53)continue;g.fillStyle=i%4===0?'#70e7ff':'#ffcaff';g.globalAlpha=.6;g.beginPath();g.arc(xx,yy,4+(i%3),0,TAU);g.fill();}g.globalAlpha=1;
 // Ornate octopus crown, protective gold ring and blue central gemstone.
 g.save();g.translate(0,-88);g.fillStyle='#482176';g.strokeStyle='#ffad55';g.lineWidth=8;g.beginPath();g.moveTo(-129,25);g.quadraticCurveTo(-120,-65,-38,-54);g.lineTo(0,-85);g.lineTo(40,-54);g.quadraticCurveTo(120,-67,129,25);g.quadraticCurveTo(0,54,-129,25);g.closePath();g.fill();g.stroke();
 g.fillStyle='#d645d2';g.beginPath();g.moveTo(-118,23);g.quadraticCurveTo(-120,-43,-48,-43);g.lineTo(0,-65);g.lineTo(48,-43);g.quadraticCurveTo(120,-45,117,22);g.quadraticCurveTo(0,43,-118,23);g.fill();
 for(let i=-4;i<=4;i++){g.fillStyle=i===0?'#ffe87d':'#ffbb69';g.beginPath();g.arc(i*27,20-Math.abs(i)*4,5,0,TAU);g.fill();}
 g.fillStyle=gold(0,6,23);g.beginPath();g.moveTo(0,-93);g.lineTo(26,-60);g.lineTo(16,-17);g.lineTo(0,-5);g.lineTo(-16,-17);g.lineTo(-26,-60);g.closePath();g.fill();g.strokeStyle='#4f2382';g.lineWidth=5;g.stroke();g.fillStyle='#00e7f9';g.beginPath();g.moveTo(0,-80);g.lineTo(17,-57);g.lineTo(8,-27);g.lineTo(0,-18);g.lineTo(-8,-27);g.lineTo(-17,-57);g.closePath();g.fill();g.restore();
 // Single eye and moving pupil.
 g.fillStyle='#260f4b';g.beginPath();g.ellipse(0,-22,69,73,0,0,TAU);g.fill();g.fillStyle='#fefaff';g.beginPath();g.ellipse(0,-22,56,60,0,0,TAU);g.fill();g.lineWidth=4;g.strokeStyle='#a460ad';g.stroke();
 const pupil=state==='final'?{x:Math.sin(clock*9)*15,y:Math.cos(clock*6)*12}:{x:Math.sin(clock*.8)*12,y:Math.cos(clock*1.2)*7};g.fillStyle='#8b4a17';g.beginPath();g.ellipse(pupil.x,-21+pupil.y,26,34,0,0,TAU);g.fill();g.fillStyle='#140820';g.beginPath();g.ellipse(pupil.x+2,-21+pupil.y,16,25,0,0,TAU);g.fill();g.fillStyle='white';g.beginPath();g.arc(pupil.x-6,-34+pupil.y,8,0,TAU);g.fill();
 if(state!=='final'){
 // Lower golden firing port.
 g.fillStyle='#57107b';g.beginPath();g.ellipse(0,102,61,57,0,0,TAU);g.fill();g.fillStyle=gold(0,99,58);g.beginPath();g.ellipse(0,99,52,52,0,0,TAU);g.fill();g.strokeStyle='#9a4410';g.lineWidth=5;g.stroke();g.fillStyle='#22081b';g.beginPath();g.ellipse(0,103,28,31,0,0,TAU);g.fill();let gg=g.createRadialGradient(-2,93,2,0,103,30);gg.addColorStop(0,'#f8a13c');gg.addColorStop(.3,'#5d1b1f');gg.addColorStop(1,'#12020a');g.fillStyle=gg;g.beginPath();g.ellipse(0,104,22,25,0,0,TAU);g.fill();
 }
 g.restore();}

function drawBubble(b){let x=b.x,y=b.y,r=b.r;g.save();g.globalAlpha=clamp(b.life/1.3,0,.85);const grad=g.createRadialGradient(x-r*.3,y-r*.3,1,x,y,r);grad.addColorStop(0,'#ffffff44');grad.addColorStop(.6,'#66b9f522');grad.addColorStop(.85,'#dd91ff44');grad.addColorStop(1,'#9feaffcc');g.beginPath();g.arc(x,y,r,0,TAU);g.fillStyle=grad;g.fill();g.strokeStyle='#e2e7ff';g.lineWidth=r*.075;g.stroke();g.strokeStyle='#fff';g.lineWidth=r*.09;g.beginPath();g.arc(x,y,r*.65,3.7,5.1);g.stroke();g.restore();}


function volley(){
 const valid=arms.filter(a=>!a.broken&&a.attack<=0);
 if(!valid.length)return;
 for(let i=valid.length-1;i>0;i--){const j=Math.floor(rand(0,i+1));[valid[i],valid[j]]=[valid[j],valid[i]];}
 const count=Math.min(valid.length,Math.random()<.75?4:Math.random()<.5?3:5);
 valid.slice(0,count).forEach((a,i)=>{
  a.attack=TOTAL;a.warning=WARN;a.edge=(attackCount+i)%4;
  a.aimX=rand(80,W-80);a.aimY=rand(75,H-75);
 });
 attackCount++;lastGroup=count;sound(930,.12,'triangle',.038);
}
function bubblePhase(){
 state='bubble';phaseTime=0;nextVolley=0;bubbleWave=0;
 safeLane=clamp(screenX(player.x),175,W-175);
 arms.forEach(a=>{a.attack=0;a.warning=0;});
 sound(670,.25,'triangle',.04);
}
function spawnBubbles(){
 bubbleWave++;
 // Narrow random drift keeps the corridor safely passable in real combat.
 safeLane=clamp(safeLane+rand(-46,46),170,W-170);
 const columns=16,step=W/columns;
 for(let i=0;i<columns;i++){
  const x=(i+.5)*step+rand(-9,9),r=i%5===0?rand(27,40):rand(10,30),vx=rand(-10,10);
  if(Math.abs(x+vx*2-safeLane)<155+r+18)continue;
  bubbles.push({x,y:rand(-145,-24),r,vy:rand(285,425),vx,life:3.8});
 }
 if(bubbles.length>145)bubbles.splice(0,bubbles.length-145);
}
function finalPhase(){
 state='final';phaseTime=0;arms.forEach(a=>{a.hp=0;a.broken=true;a.attack=0;});
 bubbles.length=0;body.x=640;body.y=325;
 body.vx=810;body.vy=625;
 boss.hp=coreHP;
 pop(boss.x,boss.y,'#ff70df',50,1.4);sound(145,.5,'sawtooth',.11);
}
function armDamage(a,dmg,wx,wy){
 if(!a||a.broken||state==='final')return;
 a.hp=Math.max(0,a.hp-dmg);a.flash=.24;shotsHit++;damageCount++;
 pop(wx,wy,'#ffc7f1',11,.65);sound(350,.11,'triangle',.06);
 if(a.hp<=0){a.broken=true;a.attack=0;
  const p=curve(a),q=bez(p,.75);
  pop(wx,wy,'#ff77ee',34,1.25);
  shards.push({x:q.x,y:q.y,time:0});
  if(arms.every(v=>v.broken))finalPhase();
 }
}
function coreDamage(n,wx,wy){
 if(state!=='final'||coreHP<=0)return;
 coreHP=Math.max(0,coreHP-n);boss.hp=coreHP;
 damageCount++;pop(wx,wy,'#fce7ff',18,.9);sound(480,.12,'triangle',.07);
 if(coreHP<=0){defeated=true;boss.z.parts[0].dead=true;boss.z.parts[0].hp=0;defeatBoss();}
}
function contact(x,y,r){
 if(mode!=='play'||player.inv>0||hitCooldown>0||state==='intro')return;
 if(Math.hypot(screenX(player.x)-x,player.y-y)<r+18){
  damage('tentacle');hitCooldown=.77;
 }
}
function advance(dt){
 const d=Math.min(Math.max(0,dt),.05);clock+=d;phaseTime+=d;hitCooldown=Math.max(0,hitCooldown-d);
 if(state==='intro'){
  introTime+=d;body.x=640;
  const p=smooth(introTime/3.9);
  body.y=lerp(-215,325,p);
  if(introTime>=3.9&&mode==='play'){state='normal';phaseTime=0;nextVolley=.7;}
 }else if(state==='normal'){
  body.x=640+Math.sin(clock*.72)*15;body.y=325+Math.sin(clock*1.15)*7;
  if(phaseTime>=nextVolley){volley();nextVolley=phaseTime+rand(1.5,2.0);}
  if(phaseTime>12.2)bubblePhase();
 }else if(state==='bubble'){
  body.x=640+Math.sin(clock*1.1)*26;body.y=325+Math.sin(clock*1.9)*8;
  if(Math.floor((phaseTime-d)/.24)!==Math.floor(phaseTime/.24))spawnBubbles();
  if(phaseTime>=5.1){state='normal';phaseTime=0;nextVolley=.7;}
 }else if(state==='final'){
  body.x+=body.vx*d;body.y+=body.vy*d;
  if(body.x<65||body.x>W-65){body.x=clamp(body.x,65,W-65);body.vx*=-1;shake=6;}
  if(body.y<80||body.y>H-100){body.y=clamp(body.y,80,H-100);body.vy*=-1;shake=6;}
 }
 for(const a of arms){
  a.flash=Math.max(0,a.flash-d);a.attack=Math.max(0,a.attack-d);
  a.warning=a.attack>TOTAL-WARN?a.attack-(TOTAL-WARN):0;
 }
 for(const b of bubbles){b.x+=b.vx*d;b.y+=b.vy*d;b.life-=d;
  if(state==='bubble'&&mode==='play'&&b.life>0&&b.y>0)contact(b.x,b.y,b.r*.72);
 }
 for(let i=bubbles.length-1;i>=0;i--)if(bubbles[i].life<=0||bubbles[i].y>H+80)bubbles.splice(i,1);
 for(const sh of shards)sh.time+=d;
 for(let i=shards.length-1;i>=0;i--)if(shards[i].time>1.2)shards.splice(i,1);
 if(state==='normal'&&mode==='play'){
  for(const a of arms){
   if(a.broken||a.attack<=0||a.attack>TOTAL-WARN)continue;
   const p=curve(a);
   for(let j=2;j<19;j++){
    const q=bez(p,j/19);
    contact(q.x,q.y,19);
    if(player.inv>0)break;
   }
  }
 }
 if(state==='final')contact(body.x,body.y,51);
}
function renderBody(){
 if(!on())return;
 g.save();
 // Never remove the player: use normal game background and camera.
 if(state==='final'){
  g.globalAlpha=.2;
  for(let i=1;i<=5;i++){g.beginPath();g.fillStyle='#f68df2';g.arc(body.x-body.vx*.012*i,body.y-body.vy*.012*i,Math.max(8,55-i*8),0,TAU);g.fill();}
  g.globalAlpha=1;
 }else{
  for(const a of arms)drawArm(a);
 }
 drawBody();
 if(state==='final'){
  g.save();g.strokeStyle='#ffdd8a';g.shadowColor='#f9f6b8';g.shadowBlur=20;g.lineWidth=6;
  g.beginPath();g.arc(body.x,body.y,61,0,TAU);g.stroke();g.restore();
 }
 g.restore();drawFrames++;
}
function renderAttacks(){
 if(!on())return;
 for(const b of bubbles)drawBubble(b);
 for(const sh of shards){
  const t=sh.time;
  g.save();g.globalAlpha=1-t/1.2;g.translate(sh.x,sh.y);
  g.rotate(t*7);g.fillStyle='#ff80e9';g.fillRect(-15-t*40,-8,30,16);g.restore();
 }
 if(state==='final'){
  g.save();g.textAlign='center';g.font='900 19px system-ui';g.fillStyle='#fff0a2';g.strokeStyle='#210b4d';g.lineWidth=4;
  g.strokeText('CORE '+coreHP+'/'+coreMax,body.x,body.y-83);g.fillText('CORE '+coreHP+'/'+coreMax,body.x,body.y-83);g.restore();
 }
 // Integrated boss status: intact arms and effective core state.
 g.save();g.fillStyle='#0f144acb';g.fillRect(W/2-225,24,450,24);
 g.fillStyle='#ed4ad8';g.fillRect(W/2-218,30,(436*((state==='final'?coreHP/coreMax*.16:(.16+.84*arms.reduce((a,v)=>a+v.hp,0)/24))),12);
 g.fillStyle='white';g.font='bold 17px system-ui';g.textAlign='center';g.fillText('mana4 | '+(state==='final'?'CORE '+coreHP:'触手 '+arms.filter(a=>!a.broken).length+'/8'),W/2,19);
 g.restore();
}
function shotHit(shot){
 if(!on()||mode!=='play'||shot.life<=0)return false;
 const x=screenX(shot.x),y=shot.y,r=shot.radius||6;
 if(state==='final'){
  if(Math.hypot(x-body.x,y-body.y)>59+r)return false;
  shot.life=0;coreDamage(Math.max(1,shot.dmg||1),shot.x,y);return true;
 }
 const amount=Math.max(1,shot.dmg||1);
 for(const a of arms){
  if(a.broken)continue;
  const p=curve(a);
  for(let i=3;i<31;i++){
   const q=bez(p,i/31);
   if(Math.hypot(x-q.x,y-q.y)<20+r){
    if(shot.kind==='laser'){
     if(shot.hitTargets?.has(a))return true;
     (shot.hitTargets??=new Set()).add(a);
    }else shot.life=0;
    armDamage(a,amount,shot.x,y);return true;
   }
  }
 }
 if(Math.hypot(x-body.x,y-body.y)<123+r){
  shot.life=0;pop(shot.x,shot.y,'#fff3ad',3,.3);sound(760,.07,'triangle',.035);return true;
 }
 return false;
}
function bombHit(b,radius){
 if(!on()||mode!=='play')return false;
 let hit=false,amount=Math.max(1,(b.big||1)*2),x=screenX(b.x);
 if(state==='final'){
  if(Math.hypot(x-body.x,b.y-body.y)<radius+57){coreDamage(amount,b.x,b.y);return true;}
  return false;
 }
 for(const a of arms){
  if(a.broken)continue;
  const p=curve(a);
  for(let i=3;i<16;i++){
   const q=bez(p,i/16);
   if(Math.hypot(x-q.x,b.y-q.y)<radius+23){armDamage(a,amount,b.x,b.y);hit=true;break;}
  }
 }
 return hit;
}
const oldSpawn=spawnBoss;
spawnBoss=function(){oldSpawn();if(!riichiMode&&stage===3&&boss?.z?.n===4&&boss.alive){boss.mana4Live=true;spawn();}};
const oldAttack=updateBossAttacks;
updateBossAttacks=function(dt){if(!on())return oldAttack(dt);if(mode==='play')advance(dt);};
const oldUpdate=update;
update=function(dt){oldUpdate(dt);if(on()&&mode==='bossIntro')advance(dt);};
const oldBossDraw=drawBoss;
drawBoss=function(){if(on()){renderBody();return;}return oldBossDraw();};
const oldFx=drawBossAttackEffects;
drawBossAttackEffects=function(){if(on()){renderAttacks();return;}return oldFx();};
const oldShot=applyRigShot;
applyRigShot=function(s){if(on())return shotHit(s);return oldShot(s);};
const oldBomb=applyRigBomb;
applyRigBomb=function(b,r){if(on())return bombHit(b,r);return oldBomb(b,r);};
function snapshot(){
 return {active:on(),stage,mode,state,drawFrames,attackCount,lastGroup,
  arms:arms.map(a=>({i:a.i,hp:a.hp,attack:a.attack,warning:a.warning,broken:a.broken})),
  bubbles:bubbles.length,bubbleWave,safeLane,coreHP,damageCount,shotsHit,bubbleHits,
  bossAlive:!!boss?.alive,introTime,playerHP:player?.hp||0};
}
window.ZAMAZONE_MANA4_LIVE_QA=snapshot;
if(new URLSearchParams(location.search).get('stage2_qa')==='1'){
 window.ZAMAZONE_MANA4_LIVE_TEST={
  enter(){launchDebugBoss(4);return snapshot();},
  startFight(){if(typeof zbBeginPreparedBoss==='function')zbBeginPreparedBoss(true);return snapshot();},
  forceVolley(){state='normal';phaseTime=0;volley();return snapshot();},
  forceBubble(){bubblePhase();return snapshot();},
  forceFinal(){finalPhase();return snapshot();},
  damageArm(i,n=1){const a=arms[i];if(a&&!a.broken)armDamage(a,n,boss.x,boss.y);return snapshot();},
  hitCore(n=1){coreDamage(n,boss.x,boss.y);return snapshot();},
  setPlayer(x,y){player.x=wrapX(camera+x-W/2);player.y=y;return snapshot();},
  actualShot(i){
   const a=arms[i];if(!a||a.broken)return snapshot();
   const p=curve(a),q=bez(p,.55);
   const shot={x:wrapX(camera+q.x-W/2),y:q.y,radius:6,dmg:1,life:1};
   applyRigShot(shot);return {...snapshot(),shotLife:shot.life};
  }
 };
}
})();

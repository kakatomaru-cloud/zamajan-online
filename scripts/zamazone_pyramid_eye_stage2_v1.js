// ZAMAZONE_PYRAMID_EYE_STAGE2_V1_20261116
// ZAMAZONE_PYRAMID_EYE_BALANCE_V2_20261116
// ZAMAZONE_PYRAMID_EYE_COMBAT_V3_20261116
// Stage-2 real combat replacement. Uses images extracted from the approved MANA3 demo.
const pyramidOldSpawn=spawnBoss,pyramidOldDraw=drawBoss,pyramidOldAttackUpdate=updateBossAttacks;
const pyramidOldAttackFx=drawBossAttackEffects,pyramidOldShot=applyRigShot,pyramidOldBomb=applyRigBomb;
const pyramidArt={body:[],orb:[],rock:null};
for(let i=0;i<16;i++){const im=new Image();im.src='assets/pyramid_eye/body_'+String(i).padStart(2,'0')+'.webp';pyramidArt.body.push(im);}
for(let i=0;i<8;i++){const im=new Image();im.src='assets/pyramid_eye/orb_'+String(i).padStart(2,'0')+'.webp';pyramidArt.orb.push(im);}
pyramidArt.rock=new Image();pyramidArt.rock.src='assets/pyramid_eye/rock.webp';
const pyramidOn=()=>!riichiMode&&stage===2&&boss?.alive&&boss.pyramid?.version===1;
const pyClamp=(x,a,b)=>Math.min(b,Math.max(a,x));
const pyEase=x=>{x=pyClamp(x,0,1);return x*x*(3-2*x);};
const pyImagesReady=()=>pyramidArt.body[0].complete&&pyramidArt.body[0].naturalWidth>0;
const pyFacing=z=>Math.cos(z.turn)>.72;
const pyEyeColor=z=>z.eyeHp/z.eyeMax>.75?'#ffffff':z.eyeHp/z.eyeMax>.5?'#3fbaff':z.eyeHp/z.eyeMax>.25?'#ffe02b':'#ff354d';
const pyScreenWorld=x=>wrapX(camera+x-W/2);
const pyStoneAt=(s,x,y)=>{s.x=pyScreenWorld(x);s.y=y;};
function pyStartAttack(b){
 const z=b.pyramid;
 z.attack=['radial','orbit','spiral','merge','aimed'][z.attackNo++%5];z.phase='warn';z.time=0;
 z.parts=z.stones.filter(s=>s.alive);z.starts=z.parts.map(s=>({x:s.x,y:s.y}));
 z.merge=null;z.boulder=null;z.fireClock=0;z.hitClock=0;
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
    entranceTime:0,entranceComplete:false,deathTime:0,deathShards:[],
    stones:Array.from({length:16},(_,i)=>({id:i,alive:true,visible:true,hp:12,maxHp:12,
      x:wrapX(boss.x+Math.cos(i*Math.PI/8)*(i%2?235:188)),y:-95-i*13,angle:i*Math.PI/8,spin:i*.53,flash:0,danger:false,cracks:0})),
    parts:[],starts:[],merge:null,boulder:null};
};
function pyDamageStone(s,damage,x,y){
 if(!s.alive||!s.visible||s.flash>0)return;
 s.hp=Math.max(0,s.hp-damage);s.flash=.095;
 pop(x,y,'#ffe8b5',11,.5);sound(410,.08,'triangle',.04);
 if(!s.hp){s.hp=s.maxHp;s.cracks=Math.min(4,s.cracks+1);shake=Math.max(shake,6);
  pop(x,y,'#ffac6b',15,.55);sound(170,.12,'sawtooth',.055);}
 // Stone armor is reusable; never hide/remove a stone from combat due to damage.
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
 const bx=screenX(boss.x),by=boss.y;
 // The 16 stones are stored permanently. Hiding is permitted only while the big rock exists.
 const home=(s,progress=1)=>{
  const a=s.angle+t*.92,r=(s.id%2?226:180);
  const x=bx+Math.cos(a)*r,y=by+Math.sin(a)*((s.id%2)?159:129);
  const k=pyEase(progress);
  pyStoneAt(s,screenX(s.x)+(x-screenX(s.x))*k,s.y+(y-s.y)*k);
 };
 if(!z.entranceComplete){
  z.entranceTime+=step;
  const k=pyEase(z.entranceTime/1.65);
  z.stones.forEach(s=>{
   const a=s.angle+t*.45,r=s.id%2?226:180;
   pyStoneAt(s,bx+Math.cos(a)*r,-145-s.id*9+(by+Math.sin(a)*145+145+s.id*9)*k);
   s.alive=true;s.visible=true;
  });
  if(k>=1){z.entranceComplete=true;z.phase='idle';z.time=0;}
  return;
 }
 if(z.phase==='idle'||z.phase==='warn'||z.phase==='recover'){
  z.stones.forEach(s=>{if(s.alive&&s.visible)home(s,z.phase==='recover'?Math.min(1,step*10):1);});
 }
 if(z.phase==='idle'&&z.time>.34){pyStartAttack(boss);return;}
 if(z.phase==='warn'&&z.time>.67){
  z.phase='active';z.time=0;
  z.starts=z.parts.map(s=>({x:screenX(s.x),y:s.y}));
  z.aimY=pyClamp(player.y,105,ground-65);
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
   if(z.time>1.95){z.phase='recover';z.time=0;}
  }else if(z.attack==='orbit'){
   // Counter-clockwise double rings sweep from the boss to the far left.
   const sweep=z.time*500;
   z.parts.forEach(s=>{
    const a=s.angle+t*7.0,r=s.id%2?130:82;
    const x=bx-sweep+Math.cos(a)*r,y=z.aimY+Math.sin(a)*(s.id%2?143:93);
    pyStoneAt(s,x,pyClamp(y,95,ground-60));
    if(x>15)pyContact(s.x,s.y,30,step);
   });
   if(z.time>2.3){z.phase='recover';z.time=0;}
  }else if(z.attack==='spiral'){
   // Fast rotating wheel expands into two rotating wings across the field.
   const sweep=z.time*565;
   z.parts.forEach(s=>{
    const a=s.angle+t*9.2;
    const radius=(s.id%2?170:112)+60*Math.sin(z.time*3);
    pyStoneAt(s,bx-sweep+Math.cos(a)*radius,by+Math.sin(a)*Math.min(210,radius));
    if(screenX(s.x)>15)pyContact(s.x,s.y,30,step);
   });
   if(z.time>2.05){z.phase='recover';z.time=0;}
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
   if(z.time>1.9){z.phase='recover';z.time=0;}
  }else if(z.attack==='merge'){
   if(!z.merge)z.merge={phase:'merge',time:0,centerX:pyScreenWorld(bx-155),centerY:by+9,starts:z.parts.map(s=>({x:screenX(s.x),y:s.y}))};
   const m=z.merge;m.time+=step;
   if(m.phase==='merge'){
    const k=pyEase(m.time/.78),cx=screenX(m.centerX);
    z.parts.forEach((s,i)=>{
      const src=m.starts[i];if(!src||!s.alive)return;
      pyStoneAt(s,src.x+(cx-src.x)*k,src.y+(m.centerY-src.y)*k);
    });
    if(k>=1){
     z.parts.forEach(s=>{s.visible=false;});
     z.boulder={x:m.centerX,y:m.centerY,size:235,scale:.55,rotation:0,glow:1,launched:false,alive:true};
     m.phase='bigrock';m.time=0;shake=Math.max(shake,11);
     pop(m.centerX,m.centerY,'#ffe9a4',32,1);sound(790,.16,'triangle',.085);
    }
   }else if(m.phase==='bigrock'){
    const rock=z.boulder;
    if(!rock){z.phase='recover';z.time=0;}
    else if(!rock.launched){
     rock.scale=.55+.53*pyEase(m.time/.19);rock.glow=Math.max(0,1-m.time/.3);
     if(m.time>.21){rock.launched=true;m.time=0;sound(108,.31,'sawtooth',.13);}
    }else{
     rock.x=wrapX(rock.x-850*step);rock.rotation+=step*2.5;
     const h=pyHitbox(rock),rx=screenX(rock.x),px=screenX(player.x),py=player.y;
     if(player.inv<=0&&z.hitClock<=0&&Math.abs(px-rx)<h.w*.5+18&&Math.abs(py-rock.y)<h.h*.5+18){
      damage('boss');z.hitClock=.7;
     }
     if(rx<-180||m.time>2.05){
      rock.alive=false;z.boulder=null;z.phase='recover';z.time=0;
      z.stones.forEach(s=>s.visible=!!s.alive);
     }
    }
   }
  }
 }
 if(z.phase==='recover'&&z.time>.50){
  z.phase='idle';z.time=0;
  z.stones.forEach(s=>{s.visible=!!s.alive;});
 }
 if(player.inv<=0&&z.hitClock<=0&&Math.abs(screenX(player.x)-bx)<110&&Math.abs(player.y-by)<116){
  damage('boss');z.hitClock=.72;
 }
}
updateBossAttacks=function(dt){if(!pyramidOn())return pyramidOldAttackUpdate(dt);pyUpdate(dt);};
function pySprite(im,x,y,w,h,rot=0){if(!im?.complete||!im.naturalWidth)return;ctx.save();ctx.translate(x,y);ctx.rotate(rot);ctx.drawImage(im,-w/2,-h/2,w,h);ctx.restore();}
drawBoss=function(){
 if(!pyramidOn()){
  if(!riichiMode&&stage===2&&boss?.pyramid?.version===1&&boss.pyramid.eyeHp<=0){pyDrawDeath();return;}
  return pyramidOldDraw();
 }
 const z=boss.pyramid,bx=screenX(boss.x),by=boss.y,frame=(Math.floor((z.turn%(Math.PI*2))/(Math.PI*2)*16)+16)%16;
 ctx.save();ctx.shadowColor='#ffdc8a';ctx.shadowBlur=13;
 pySprite(pyramidArt.body[frame],bx,by,350,350);
 ctx.restore();
 // Eye damage stages: white > blue > yellow > red.
 const color=pyEyeColor(z);
 // The iris itself is repainted opaque so the damage-stage color is unmistakable.
 if(pyFacing(z)){
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
  const x=screenX(s.x),y=s.y;if(x<-70||x>W+70)return;
  pySprite(pyramidArt.orb[orbFrame],x,y,74,74,s.spin+z.clock*1.3);
  if(s.cracks>0){ctx.save();ctx.translate(x,y);ctx.rotate(s.spin+z.clock*1.3);ctx.globalAlpha=Math.min(.7,s.cracks*.14);ctx.lineWidth=3;ctx.strokeStyle='#2c1b28';ctx.beginPath();ctx.moveTo(-13,-23);ctx.lineTo(1,-7);ctx.lineTo(-5,12);ctx.lineTo(13,24);ctx.stroke();ctx.restore();}
  if(s.flash>0){ctx.save();ctx.globalAlpha=s.flash*4;ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(x,y,30,0,2*Math.PI);ctx.fill();ctx.restore();}
 });
 const b=z.boulder;
 if(b?.alive){const x=screenX(b.x),y=b.y;ctx.save();
  ctx.shadowColor='#ffe5aa';ctx.shadowBlur=b.glow>0?50:16;
  pySprite(pyramidArt.rock,x,y,b.size*b.scale,b.size*b.scale,b.rotation);
  if(b.glow>0){ctx.globalAlpha=b.glow*.4;ctx.fillStyle='#fff7cf';ctx.beginPath();ctx.arc(x,y,b.size*b.scale*.47,0,Math.PI*2);ctx.fill();}
  ctx.restore();}
};
drawBossAttackEffects=function(){
 if(!pyramidOn())return pyramidOldAttackFx();
 const z=boss.pyramid;if(z.phase!=='warn')return;
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
 stones:boss?.pyramid?.stones.map(s=>({id:s.id,alive:s.alive,visible:s.visible,hp:s.hp}))||[],
 attack:boss?.pyramid?.attack,phase:boss?.pyramid?.phase,
 mergePhase:boss?.pyramid?.merge?.phase||null,
 boulderCount:boss?.pyramid?.boulder?.alive?1:0,
 eyeHP:boss?.pyramid?.eyeHp,eyeColor:boss?.pyramid?pyEyeColor(boss.pyramid):null,
 facing:boss?.pyramid?pyFacing(boss.pyramid):false,
 entranceComplete:boss?.pyramid?.entranceComplete,
 deathShards:boss?.pyramid?.deathShards?.length||0
});


function pyDrawDeath(){
 const z=boss?.pyramid;if(!z||!z.deathShards.length)return;
 const elapsed=Math.min(2.7,(performance.now()-(z.deathStarted||performance.now()))/1000);
 const bx=screenX(boss.x),by=boss.y;
 ctx.save();
 for(let i=0;i<z.deathShards.length;i++){
  const p=z.deathShards[i],time=elapsed;
  if(time>p.life)continue;
  const opacity=Math.max(0,1-time/p.life);
  const x=bx+p.vx*time,y=by+p.vy*time+170*time*time;
  ctx.save();ctx.translate(x,y);ctx.rotate(p.rotation+time*3*(i%2?1:-1));
  ctx.globalAlpha=opacity;
  ctx.shadowColor='#ffe2a0';ctx.shadowBlur=9;
  ctx.fillStyle=i%3?'#b5825c':'#e9c67d';ctx.strokeStyle='#6a493b';ctx.lineWidth=3;
  ctx.beginPath();ctx.moveTo(-p.size*.6,-p.size*.5);ctx.lineTo(p.size*.58,-p.size*.38);
  ctx.lineTo(p.size*.52,p.size*.42);ctx.lineTo(-p.size*.3,p.size*.63);ctx.closePath();
  ctx.fill();ctx.stroke();ctx.restore();
 }
 const fade=Math.max(0,1-elapsed/1.8);
 if(fade){ctx.globalAlpha=fade*.30;ctx.fillStyle='#fff2b0';ctx.beginPath();ctx.arc(bx,by,60+elapsed*165,0,Math.PI*2);ctx.fill();}
 ctx.restore();
}
// Capture destruction before legacy death frames, then replace those frames rather than painting scarab art.
const pyOldDefeat=defeatBoss;
defeatBoss=function(){
 if(pyramidOn()&&boss?.pyramid){
  const z=boss.pyramid;z.deathStarted=performance.now();
  z.stones.forEach(st=>{st.visible=false;st.alive=false;});
  z.boulder=null;
 }
 return pyOldDefeat();
};
if(typeof drawBossDeath==='function'){
 const pyOldDrawBossDeath=drawBossDeath;
 drawBossDeath=function(){
  if(!riichiMode&&stage===2&&boss?.pyramid?.eyeHp<=0)return pyDrawDeath();
  return pyOldDrawBossDeath();
 };
}
// Testing hooks use the normal gameplay damage routines and are only exposed with an explicit debug query.
if(new URLSearchParams(location.search).get('stage2_qa')==='1'){
 window.ZAMAZONE_PYRAMID_EYE_TEST={
  forceAttack(name){
   if(!pyramidOn()||!['radial','orbit','spiral','merge','aimed'].includes(name))return false;
   const z=boss.pyramid;z.entranceComplete=true;pyStartAttack(boss);
   z.attack=name;z.phase='warn';z.time=0;return true;
  },
  eyeHit(damage=6,front=true){
   if(!pyramidOn())return false;
   const z=boss.pyramid;z.turn=front?0:Math.PI;z.eyeFlash=0;
   const before=z.eyeHp;pyDamageEye(damage,boss.x,boss.y-23);
   return {before,after:z.eyeHp,color:pyEyeColor(z),facing:pyFacing(z)};
  },
  snap(){return window.ZAMAZONE_PYRAMID_EYE_QA();}
 };
}

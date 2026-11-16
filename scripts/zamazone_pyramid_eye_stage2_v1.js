// ZAMAZONE_PYRAMID_EYE_STAGE2_V1_20261116
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
function pyStartAttack(b){
 const z=b.pyramid;
 z.attack=['radial','orbit','merge'][z.attackNo++%3];z.phase='warn';z.time=0;
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
    eyeHp:14,eyeMax:14,eyeFlash:0,eyeExposed:1,turn:0,hitClock:0,fireClock:0,
    stones:Array.from({length:16},(_,i)=>({id:i,alive:true,visible:true,hp:2,
      x:boss.x,y:boss.y,angle:i*Math.PI/8,spin:i*.53,flash:0,danger:false})),
    parts:[],starts:[],merge:null,boulder:null};
};
function pyDamageStone(s,damage,x,y){
 if(!s.alive||!s.visible||s.flash>0)return;
 s.hp=Math.max(0,s.hp-damage);s.flash=.11;
 pop(x,y,'#ffe8b5',11,.5);sound(410,.08,'triangle',.04);
 if(!s.hp){s.alive=false;s.visible=false;shake=Math.max(shake,6);
  pop(x,y,'#ffac6b',18,.65);sound(170,.12,'sawtooth',.055);}
}
function pyDamageEye(dmg,x,y){
 const z=boss.pyramid;
 if(z.eyeFlash>0)return;
 z.eyeHp=Math.max(0,z.eyeHp-dmg);z.eyeFlash=.15;boss.hitFlash=.14;
 pop(x,y,'#fff3af',20,.75);sound(260,.09,'square',.07);shake=Math.max(shake,8);
 if(z.eyeHp<=0){z.stones.forEach(s=>{s.alive=false;s.visible=false;});z.boulder=null;
  boss.z.parts[0].dead=true;boss.z.parts[0].hp=0;boss.hp=0;defeatBoss();}
}
function pyHitbox(b){const r=b.size*b.scale;return{x:b.x-r*.35,y:b.y-r*.34,w:r*.7,h:r*.68};}
function pyCircleRect(x,y,r,b){const h=pyHitbox(b);return Math.hypot(x-pyClamp(x,h.x,h.x+h.w),y-pyClamp(y,h.y,h.y+h.h))<=r;}
function pyContact(x,y,r,dt){
 const z=boss.pyramid;if(player.inv>0||z.hitClock>0)return;
 const px=screenX(player.x),py=player.y;
 if(Math.hypot(px-screenX(x),py-y)<r+17){damage('boss');z.hitClock=.74;}
}
function pyUpdate(dt){
 const z=boss.pyramid;z.clock+=dt;z.time+=dt;z.turn+=dt*.49;
 z.hitClock=Math.max(0,z.hitClock-dt);z.eyeFlash=Math.max(0,z.eyeFlash-dt);
 z.stones.forEach(s=>s.flash=Math.max(0,s.flash-dt));
 // All stones persist in memory: alive/visible are the only visibility controls.
 const t=z.clock, bx=boss.x,by=boss.y,orbitR=203;
 if(z.phase==='idle'||z.phase==='warn'||z.phase==='recover'){
  z.stones.forEach(s=>{if(!s.alive)return;
   const a=s.angle+t*.43;s.x=wrapX(bx+Math.cos(a)*orbitR);s.y=by+Math.sin(a)*145;});
 }
 if(z.phase==='idle'&&z.time>1.05){pyStartAttack(boss);return;}
 if(z.phase==='warn'&&z.time>1.05){z.phase='active';z.time=0;z.starts=z.parts.map(s=>({x:s.x,y:s.y}));}
 if(z.phase==='active'){
  if(z.attack==='radial'){
   for(let i=0;i<z.parts.length;i++){const s=z.parts[i];if(!s.alive)continue;
    const q=pyEase(Math.min(1,z.time/1.4)),start=z.starts[i];
    s.x=wrapX(start.x+(Math.cos(s.angle)*115-100)*q);
    s.y=start.y+Math.sin(s.angle)*55*q;
    pyContact(s.x,s.y,31,dt);
   }
   if(z.time>=1.5){z.phase='recover';z.time=0;}
  }else if(z.attack==='orbit'){
   z.stones.forEach(s=>{if(!s.alive)return;
    const a=s.angle+z.clock*2.3;s.x=wrapX(bx+Math.cos(a)*205);s.y=by+Math.sin(a)*152;
    pyContact(s.x,s.y,31,dt);
   });
   if(z.time>2.65){z.phase='recover';z.time=0;}
  }else if(z.attack==='merge'){
   if(!z.merge){z.merge={phase:'merge',time:0,centerX:wrapX(bx-180),centerY:by+10,starts:z.parts.map(s=>({x:s.x,y:s.y}))};}
   const m=z.merge;m.time+=dt;
   if(m.phase==='merge'){
    const k=pyEase(m.time/1.7);
    z.parts.forEach((s,i)=>{if(!s.alive)return;s.x=wrapX(m.starts[i].x+nearDelta(m.centerX,m.starts[i])*k);s.y=m.starts[i].y+(m.centerY-m.starts[i].y)*k;});
    if(k>=1){
     // Exactly one boulder appears atomically after the last individual stone disappears.
     z.parts.forEach(s=>{s.visible=false;});
     z.boulder={x:m.centerX,y:m.centerY,size:215,scale:.55,rotation:0,glow:1,launched:false,alive:true};
     m.phase='bigrock';m.time=0;shake=Math.max(shake,9);pop(m.centerX,m.centerY,'#ffe8af',30,1);
     sound(760,.19,'triangle',.08);
    }
   }else if(m.phase==='bigrock'){
    const b=z.boulder;if(!b){z.phase='recover';z.time=0;return;}
    if(!b.launched){b.scale=.55+.52*pyEase(m.time/.3);b.glow=Math.max(0,1-m.time/.35);
     if(m.time>=.32){b.launched=true;m.time=0;sound(115,.27,'sawtooth',.12);}}
    else{b.x=wrapX(b.x-385*dt);b.rotation+=dt*1.8;
     const h=pyHitbox(b),px=screenX(player.x),py=player.y,x=screenX(b.x);
     if(player.inv<=0&&z.hitClock<=0&&Math.abs(px-x)<h.w*.5+18&&Math.abs(py-b.y)<h.h*.5+18){damage('boss');z.hitClock=.75;}
     if(m.time>2.8||nearDelta(b.x,bx)<-900){b.alive=false;z.boulder=null;z.phase='recover';z.time=0;z.stones.forEach(s=>{s.visible=!!s.alive;});}
    }
   }
  }
 }
 if(z.phase==='recover'&&z.time>.72){z.phase='idle';z.time=0;z.stones.forEach(s=>{s.visible=!!s.alive;});}
 // Body is a coherent collision target, independent from individual rocks.
 if(player.inv<=0&&z.hitClock<=0&&Math.abs(screenX(player.x)-screenX(boss.x))<109&&Math.abs(player.y-boss.y)<116){damage('boss');z.hitClock=.75;}
}
updateBossAttacks=function(dt){if(!pyramidOn())return pyramidOldAttackUpdate(dt);pyUpdate(dt);};
function pySprite(im,x,y,w,h,rot=0){if(!im?.complete||!im.naturalWidth)return;ctx.save();ctx.translate(x,y);ctx.rotate(rot);ctx.drawImage(im,-w/2,-h/2,w,h);ctx.restore();}
drawBoss=function(){
 if(!pyramidOn())return pyramidOldDraw();
 const z=boss.pyramid,bx=screenX(boss.x),by=boss.y,frame=(Math.floor((z.turn%(Math.PI*2))/(Math.PI*2)*16)+16)%16;
 ctx.save();ctx.shadowColor='#ffdc8a';ctx.shadowBlur=13;
 pySprite(pyramidArt.body[frame],bx,by,350,350);
 ctx.restore();
 // Eye damage stages: white > blue > yellow > red.
 const ratio=z.eyeHp/z.eyeMax,color=ratio>.75?'#fff':ratio>.5?'#72d6ff':ratio>.25?'#ffe36d':'#ff6467';
 ctx.save();ctx.globalAlpha=z.eyeFlash>0?.6:.24;ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(bx,by-23,35,24,0,0,Math.PI*2);ctx.fill();ctx.restore();
 const orbFrame=Math.floor(z.clock*8)%8;
 z.stones.forEach(s=>{if(!s.alive||!s.visible)return;
  const x=screenX(s.x),y=s.y;if(x<-70||x>W+70)return;
  pySprite(pyramidArt.orb[orbFrame],x,y,74,74,s.spin+z.clock*1.3);
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
  hit();const facing=Math.cos(z.turn)>.1;
  if(facing&&Math.abs(x-screenX(boss.x))<56+rad&&Math.abs(y-(boss.y-23))<55+rad)pyDamageEye(Math.max(1,shot.dmg||1),shot.x,shot.y);
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
 if(Math.hypot(screenX(b.x)-screenX(boss.x),b.y-boss.y)<rad+100){pyDamageEye(b.big?3:2,b.x,b.y);hit=true;}
 return hit;
};
window.ZAMAZONE_PYRAMID_EYE_QA=()=>({
 active:pyramidOn(),stage,mode,assetLoaded:pyImagesReady(),
 stones:boss?.pyramid?.stones.map(s=>({id:s.id,alive:s.alive,visible:s.visible,hp:s.hp}))||[],
 attack:boss?.pyramid?.attack,phase:boss?.pyramid?.phase,
 mergePhase:boss?.pyramid?.merge?.phase||null,
 boulderCount:boss?.pyramid?.boulder?.alive?1:0,
 eyeHP:boss?.pyramid?.eyeHp
});

// STAGE2_SCARAB_ATTACKS_20261115: Four visibly different, slow-telegraphed attacks.
const s2AttackOldUpdate=updateBossAttacks,s2AttackOldEffects=drawBossAttackEffects,s2AttackOldPartPos=getPartPos;
const s2Order=["claw-laser","sand-columns","tail-bombs","shell-dash"];
function s2AtkLive(){return !riichiMode&&stage===2&&boss?.alive&&boss.z?.n===3;}
function s2AtkWarning(z){return z.state==="TELEGRAPH";}
function s2AtkPhase(z,dt){const ac=z.attack?.[0];if(!ac)return;z.t+=dt;z.elapsed+=dt;z.recoil=Math.max(0,z.recoil-dt);for(const p of z.parts)p.flash=Math.max(0,p.flash-dt);if(z.state==="TELEGRAPH"&&z.t>=1.35){z.state="ATTACK";z.t=0;sound(310,.11,"sawtooth",.04);}else if(z.state==="ATTACK"&&z.t>=1.75){z.state="RECOVERY";z.t=0;}else if(z.state==="RECOVERY"&&z.t>=1.25){z.state="IDLE";z.t=0;z.attack=null;}}
updateBossAttacks=function(dt){
 if(!s2AtkLive())return s2AttackOldUpdate(dt);
 const z=boss.z;boss.attack=null;boss.y=435;const live=z.parts.filter(p=>!p.dead&&p.type!=="core");
 if(!z.attack){z.t=(z.t||0)+dt;z.elapsed+=dt;z.recoil=Math.max(0,z.recoil-dt);z.parts.forEach(p=>p.flash=Math.max(0,p.flash-dt));if(z.t>.9){let name=s2Order[z.seq++%4];if(name==="claw-laser"&&!live.some(p=>p.type==="arm"))name="sand-columns";if(name==="tail-bombs"&&!live.some(p=>p.type==="tail"))name="sand-columns";if(name==="shell-dash"&&!live.some(p=>p.type==="wing"))name="sand-columns";z.attack=[name,name];z.state="TELEGRAPH";z.t=0;z.lockX=screenX(player.x);z.lockY=player.y;z.hitClock=0;z.seed=Math.random()*6;}return;}
 s2AtkPhase(z,dt);if(!z.attack||z.state!=="ATTACK")return;
 const a=z.attack[0],t=z.t,px=screenX(player.x),py=player.y,bx=screenX(boss.x),by=boss.y;
 if(a==="claw-laser"){
  // Alternating horizontal laser beams. A single wide beam, no bullet spam.
  const y=by+68+Math.sin(t*2)*12;
  if(Math.abs(py-y)<21&&px<bx-110&&px>70&&player.inv<=0){z.hitClock-=dt;if(z.hitClock<=0){damage("laser");z.hitClock=.7;}}
 }else if(a==="sand-columns"){
  for(let i=0;i<3;i++){const x=220+i*365;if(t>.24*i&&t<1.35&&Math.abs(px-x)<55&&py>ground-230&&player.inv<=0){z.hitClock-=dt;if(z.hitClock<=0){damage("sand");z.hitClock=.72;}}}
 }else if(a==="tail-bombs"){
  for(let i=0;i<3;i++){const q=t-i*.29;if(q<=0||q>1.7)continue;const x=bx-100-i*140-q*110,y=by+114-300*q+310*q*q;
   if(Math.hypot(px-x,py-y)<34&&player.inv<=0){z.hitClock-=dt;if(z.hitClock<=0){damage("bomb");z.hitClock=.65;}}}
 }else if(a==="shell-dash"){
  // Boss charges forward only during ATTACK; returning to initial arena position later.
  const dash=Math.sin(Math.PI*Math.min(1,t/1.75))*280;
  boss.x=wrapX((boss.arenaCamera??camera)+330-dash);
  if(Math.abs(nearDelta(player.x,boss.x))<115&&Math.abs(py-by)<105&&player.inv<=0){z.hitClock-=dt;if(z.hitClock<=0){damage("boss");z.hitClock=.7;}}
 }
};
getPartPos=function(p){if(!s2AtkLive())return s2AttackOldPartPos(p);const q=s2AttackOldPartPos(p),z=boss.z,a=z.attack?.[0]||"",v=z.t||0;
 if(p.type==="arm"&&a==="claw-laser"&&z.state!=="RECOVERY"){q.y-=32*Math.min(1,v*2);q.x+=(p.i===0?-1:1)*24*Math.min(1,v);}
 if(p.type==="wing"&&a==="shell-dash"){q.x+=(p.i===2?-1:1)*35*Math.min(1,v*2);q.y-=16*Math.min(1,v);}
 if(p.type==="tail"&&a==="tail-bombs")q.y-=39*Math.min(1,v*2);
 return q;
};
drawBossAttackEffects=function(){if(!s2AtkLive())return s2AttackOldEffects();const z=boss.z;if(!z.attack)return;const a=z.attack[0],t=z.t,warning=z.state==="TELEGRAPH",active=z.state==="ATTACK",by=boss.y,bx=screenX(boss.x);
 ctx.save();
 if(a==="claw-laser"){
  const yy=by+68+Math.sin(t*2)*12;ctx.strokeStyle=warning?"#fff2a6":"#ff6de3";ctx.lineWidth=warning?5:27;ctx.globalAlpha=warning?.8:1;ctx.shadowColor="#ff55ca";ctx.shadowBlur=warning?0:28;ctx.beginPath();ctx.moveTo(60,yy);ctx.lineTo(bx-115,yy);ctx.stroke();if(active){ctx.strokeStyle="#fff9e3";ctx.lineWidth=5;ctx.stroke();}
 }else if(a==="sand-columns"){
  for(let i=0;i<3;i++){const x=220+i*365;ctx.globalAlpha=warning?.45:1;ctx.fillStyle=warning?"#ffec8a":"#b27b62";const raise=active?Math.min(1,Math.max(0,(t-i*.24)*6)):0;if(active){ctx.fillRect(x-43,ground-210*raise,86,210*raise);ctx.fillStyle="#efd2a4";ctx.fillRect(x-35,ground-200*raise,12,190*raise);}else{ctx.fillRect(x-51,ground-16,102,8);} }
 }else if(a==="tail-bombs"){
  if(warning){ctx.strokeStyle="#ffdf86";ctx.lineWidth=4;ctx.setLineDash([9,8]);ctx.beginPath();ctx.arc(bx+8,by+115,56,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);}
  else if(active){for(let i=0;i<3;i++){const q=t-i*.29;if(q<=0||q>1.7)continue;const x=bx-100-i*140-q*110,y=by+114-300*q+310*q*q;ctx.fillStyle="#b05ad1";ctx.shadowColor="#ff77e9";ctx.shadowBlur=18;ctx.beginPath();ctx.arc(x,y,24,0,Math.PI*2);ctx.fill();ctx.strokeStyle="#ffe4a9";ctx.lineWidth=5;ctx.stroke();}}
 }else if(a==="shell-dash"){
  ctx.globalAlpha=warning?.35:.65;ctx.strokeStyle="#fff2af";ctx.lineWidth=warning?4:11;for(let i=0;i<4;i++){const yy=by-84+i*51;ctx.beginPath();ctx.moveTo(bx-195,yy);ctx.lineTo(bx-355,yy);ctx.stroke();}}
 ctx.restore();
};
window.ZAMAZONE_STAGE2_ATTACK_QA=()=>({mode,attack:boss?.z?.n===3?boss.z.attack?.[0]||null:null,state:boss?.z?.state||null});

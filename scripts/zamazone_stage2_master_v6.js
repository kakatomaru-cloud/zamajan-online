// STAGE2_MASTER_ASSET_RIG_V6_20261115
// Production-quality candidate: source artwork from the actual concept sheets,
// not procedural substitutes or an atlas glued to the game screen.
const zm6PrevBg=drawScreenshotScenery,zm6PrevBase=drawBase,zm6PrevEnemy=drawEnemy,zm6PrevBoss=drawBoss;
const zm6PrevSpawn=spawnBoss,zm6PrevPartPos=getPartPos,zm6PrevShot=applyRigShot,zm6PrevBomb=applyRigBomb;
const zm6Names=['bg_sky','bg_distant','bg_middle','bg_foreground','torso',
 ...Array.from({length:5},(_,i)=>'eye_'+i),
 ...['wing_L','wing_R','claw_L','claw_R','tail_','enemy_beetle_','enemy_ray_','enemy_balloon_','base_ground_','base_air_','collapse_'].flatMap(k=>Array.from({length:6},(_,i)=>k+i)),
 ...['base_destroy_0','base_destroy_1','base_destroy_2']];
const zm6Imgs={};for(const name of zm6Names){const img=new Image();img.decoding='async';img.src='assets/stage2_master/'+name+'.webp';zm6Imgs[name]=img;}
function zm6Ready(n){const a=zm6Imgs[n];return a?.complete&&a.naturalWidth>0;}
const zm6Stage=()=>stage===2&&!riichiMode;
function zm6Sprite(name,x,y,w,h){if(!zm6Ready(name))return false;ctx.drawImage(zm6Imgs[name],x,y,w,h);return true;}
function zm6Layer(name,y,h,rate){
 if(!zm6Ready(name))return false;
 const shift=((camera*rate)%W+W)%W;
 ctx.save();ctx.imageSmoothingEnabled=true;
 for(let k=-1;k<3;k++)ctx.drawImage(zm6Imgs[name],k*W-shift,y,W,h);
 ctx.restore();return true;
}
drawScreenshotScenery=function(){
 if(!zm6Stage())return zm6PrevBg();
 const grd=ctx.createLinearGradient(0,82,0,ground);
 grd.addColorStop(0,'#5547ac');grd.addColorStop(.37,'#ab86b7');grd.addColorStop(.72,'#eeb7ad');grd.addColorStop(1,'#da9772');
 ctx.fillStyle=grd;ctx.fillRect(0,82,W,H-82);
 // Cropped native source regions only: titles, gold borders and labels were removed.
 zm6Layer('bg_sky',82,300,.008);
 zm6Layer('bg_distant',230,256,.055);
 zm6Layer('bg_middle',342,274,.18);
 zm6Layer('bg_foreground',448,ground-448,.38);
 const g=ctx.createLinearGradient(0,ground-24,0,H);
 g.addColorStop(0,'#f6c68c00');g.addColorStop(.14,'#d5a16ab8');g.addColorStop(.8,'#987078');g.addColorStop(1,'#5e466b');
 ctx.fillStyle=g;ctx.fillRect(0,ground-24,W,H-ground+24);
 ctx.fillStyle='#ffe2a2';ctx.fillRect(0,ground-3,W,3);
 ctx.save();
 for(let i=0;i<30;i++){const x=((i*83-camera*.65)%(W+90)+(W+90))%(W+90)-40,y=ground+11+(i*41)%65;
 ctx.globalAlpha=.3;ctx.fillStyle=i%3?'#ffdc9c':'#513d6a';ctx.fillRect(x,y,9+i%4*6,2);}
 for(let i=0;i<36;i++){const x=((i*171+themeTick*(12+i%4*8)-camera*.2)%(W+60)+(W+60))%(W+60)-40,y=145+(i*67)%(ground-190);
 ctx.globalAlpha=.14+i%4*.045;ctx.fillStyle='#fff3c9';ctx.fillRect(x,y,2,2);}
 ctx.restore();
 // Extra speed information is a transparent streak only during boss combat.
 if(boss?.alive&&mode!=='bossDeath'){ctx.save();ctx.strokeStyle='#fff1c9';ctx.globalAlpha=.10;for(let j=0;j<16;j++){
 const x=((j*133-themeTick*450)%(W+240)+(W+240))%(W+240)-100,y=126+(j*61)%(ground-171);
 ctx.lineWidth=1+j%2;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+48+j%3*29,y);ctx.stroke();}ctx.restore();}
 return true;
};
drawBase=function(b){
 if(!zm6Stage()||!zm6Ready('base_ground_0'))return zm6PrevBase(b);
 if(!b.alive)return;const x=screenX(b.x),t=b.phase||0,air=!!(b.air||b.flying);
 if(x<-195||x>W+195)return;
 const y=air?b.y+Math.sin(t*2.7)*8:ground;
 ctx.save();
 ctx.fillStyle='#3b28514a';ctx.beginPath();ctx.ellipse(x,ground-6,air?69:95,air?11:14,0,0,Math.PI*2);ctx.fill();
 if(air){const jet=ctx.createLinearGradient(0,b.y+32,0,b.y+114);jet.addColorStop(0,'#c677ffb8');jet.addColorStop(1,'#72deff00');
 ctx.fillStyle=jet;for(const xx of [-52,0,52]){ctx.beginPath();ctx.moveTo(x+xx-11,y+37);ctx.lineTo(x+xx+11,y+37);ctx.lineTo(x+xx,y+86+Math.sin(t*12+xx)*7);ctx.fill();}}
 const n=Math.floor(t*5)%6;
 const w=air?206:208,h=air?148:146;
 // Solid stone foundation is always on the sand. The floating base has working engines.
 zm6Sprite('base_'+(air?'air_':'ground_')+n,x-w/2,air?y-h/2:ground-h,w,h);
 if(b.flash>0){ctx.globalAlpha=Math.min(.45,b.flash*2);ctx.globalCompositeOperation='screen';ctx.fillStyle='#fff0c0';ctx.fillRect(x-w/2,air?y-h/2:ground-h,w,h);}
 ctx.restore();
};
drawEnemy=function(e){
 if(!zm6Stage()||!zm6Ready('enemy_beetle_0'))return zm6PrevEnemy(e);
 const x=screenX(e.x);if(x<-125||x>W+125)return;
 const kind=(e.type==='wasp'||e.type==='bird')?'ray':(e.type==='laserjelly'||e.type==='bouncer')?'balloon':'beetle';
 const f=Math.floor((e.phase||0)*(kind==='beetle'?9:kind==='ray'?7:5))%6;
 const w=kind==='ray'?126:kind==='balloon'?89:109,h=kind==='ray'?92:kind==='balloon'?123:94;
 ctx.save();ctx.translate(x,e.y+Math.sin((e.phase||0)*3)*5);if(e.vx<0)ctx.scale(-1,1);
 ctx.rotate(Math.sin((e.phase||0)*(kind==='ray'?7:3))*.048);
 ctx.shadowColor='#3e2457';ctx.shadowBlur=9;ctx.shadowOffsetY=3;
 zm6Sprite('enemy_'+kind+'_'+f,-w/2,-h/2,w,h);ctx.restore();
};
const zm6Anchors={armL:[-139,52],armR:[139,52],wingL:[-117,-74],wingR:[117,-74],tail:[0,124],core:[0,-8]};
function zm6Role(p){return p.type==='core'?'core':p.type==='tail'?'tail':p.type==='wing'?(p.i===2?'wingL':'wingR'):(p.i===0?'armL':'armR');}
const zm6HitR={armL:66,armR:66,wingL:68,wingR:68,tail:51,core:52};
spawnBoss=function(){
 zm6PrevSpawn();
 if(!zm6Stage()||boss?.z?.n!==3)return;
 boss.hp=boss.maxHp=9999;
 boss.z.parts=[
 {type:'arm',i:0,hp:16,maxHp:16,dead:false,flash:0},
 {type:'arm',i:1,hp:16,maxHp:16,dead:false,flash:0},
 {type:'wing',i:2,hp:14,maxHp:14,dead:false,flash:0},
 {type:'wing',i:3,hp:14,maxHp:14,dead:false,flash:0},
 {type:'tail',i:4,hp:14,maxHp:14,dead:false,flash:0},
 {type:'core',i:99,hp:22,maxHp:22,dead:false,flash:0}];
 boss.z.expose=0;
};
getPartPos=function(p){
 if(!zm6Stage()||boss?.z?.n!==3)return zm6PrevPartPos(p);
 const role=zm6Role(p),anchor=zm6Anchors[role],t=boss.z.elapsed||0;
 const warning=boss.z.state==='TELEGRAPH';
 const phase=role==='armL'?.1:role==='armR'?1.5:role==='wingL'?1.2:role==='wingR'?2.4:0;
 let x=anchor[0],y=anchor[1];
 if(role.startsWith('wing')){x+=Math.sin(t*1.6+phase)*5;y+=Math.cos(t*2+phase)*12+(warning?-13:0);}
 if(role.startsWith('arm')){x+=Math.sin(t*2.5+phase)*12;y+=Math.cos(t*2.6+phase)*8+(warning?-22:0);}
 if(role==='tail'){x+=Math.sin(t*2.3)*15;y+=Math.cos(t*2.2)*7+(warning?-18:0);}
 if(role==='core')y+=Math.sin(t*2.1)*3;
 return{x,y};
};
function zm6DrawPart(p,t,x,y){
 if(p.dead)return;const role=zm6Role(p),pos=getPartPos(p),dam=p.hp/Math.max(p.maxHp,1);
 let name,w,h,angle=0;
 if(role==='core'){name='eye_'+((p.flash>0)?4:Math.floor(t*2.3)%4);w=108;h=104;}
 else if(role==='tail'){name='tail_'+Math.floor(t*5)%6;w=156;h=88;angle=Math.sin(t*2.1)*.15;}
 else if(role.startsWith('wing')){name='wing_'+role.slice(-1).toUpperCase()+Math.floor(t*4+p.i)%6;w=171;h=114;angle=(role.endsWith('L')?-1:1)*Math.sin(t*2.2+p.i)*.14;}
 else{name='claw_'+role.slice(-1).toUpperCase()+Math.floor(t*6+p.i)%6;w=168;h=116;angle=(role.endsWith('L')?-1:1)*(.09+Math.sin(t*3+p.i)*.19);}
 ctx.save();ctx.translate(x+pos.x,y+pos.y);ctx.rotate(angle);
 ctx.shadowColor=dam<.45?'#ff5485':'#45205e95';ctx.shadowBlur=dam<.45?19:7;
 if(p.flash>0)ctx.filter='brightness(2.2) saturate(1.3)';
 else if(dam<.32)ctx.filter='sepia(.65) saturate(2.2) hue-rotate(313deg)';
 else if(dam<.7)ctx.filter='sepia(.22) saturate(1.4)';
 zm6Sprite(name,-w/2,-h/2,w,h);
 ctx.filter='none';
 if(dam<.72){ctx.shadowBlur=0;ctx.strokeStyle=dam<.35?'#ff5b74':'#ffc77a';ctx.lineWidth=dam<.35?5:3;
 ctx.beginPath();ctx.moveTo(-16,-21);ctx.lineTo(4,-9);ctx.lineTo(-8,9);ctx.lineTo(11,28);ctx.stroke();}
 ctx.restore();
}
drawBoss=function(){
 if(!zm6Stage()||!boss?.alive||boss?.z?.n!==3)return zm6PrevBoss();
 const x=screenX(boss.x),y=boss.y,z=boss.z,t=z.elapsed||0;
 if(x<-420||x>W+420)return;
 ctx.save();const glow=ctx.createRadialGradient(x,y,10,x,y,235);
 glow.addColorStop(0,'#f06ccf31');glow.addColorStop(1,'#e06bc900');
 ctx.fillStyle=glow;ctx.beginPath();ctx.ellipse(x,y,226,175,0,0,Math.PI*2);ctx.fill();
 // The center torso deliberately does not contain pre-rendered wings, claws or tail.
 zm6Sprite('torso',x-91,y-124,182,242);
 // Move armor independently with a fixed sprite-to-hitbox pivot.
 for(const type of ['wing','tail','arm','core'])for(const p of z.parts)if(p.type===type)zm6DrawPart(p,t,x,y);
 if(z.parts.filter(p=>p.type!=='core').every(p=>p.dead)){
 ctx.save();ctx.strokeStyle='#ffef98';ctx.lineWidth=5;ctx.shadowBlur=30;ctx.shadowColor='#f758df';
 ctx.beginPath();ctx.ellipse(x,y-8,58+Math.sin(t*9)*7,52,0,0,Math.PI*2);ctx.stroke();ctx.restore();}
 ctx.restore();
};
applyRigShot=function(shot){
 if(!zm6Stage()||!boss?.alive||boss.z?.n!==3)return zm6PrevShot(shot);
 const sx=screenX(shot.x),sy=shot.y,z=boss.z;
 // A hit ALWAYS consumes the shot, even when the core is still armored.
 for(const p of z.parts){
 if(p.dead)continue;
 const pos=rigPartWorld(p),role=zm6Role(p),radius=zm6HitR[role];
 if(Math.hypot(sx-pos.x,sy-pos.y)>radius+(shot.radius||0))continue;
 if(shot.kind==='laser'){(shot.hitTargets??=new Set()).add(boss);}
 else{shot.life=0;shot.vx=0;}
 if(p.type==='core'&&z.parts.some(q=>q.type!=='core'&&!q.dead))return true;
 if(p.flash>0)return true;
 const damage=Math.max(1,shot.dmg||1);p.hp=Math.max(0,p.hp-damage);
 p.flash=.15;boss.hitFlash=.19;z.recoil=.24;
 pop(shot.x,shot.y,'#ffdea1',10,.66);sound(480,.06,'square',.032);
 if(p.hp===0){p.dead=true;shake=Math.max(shake,13);pop(shot.x,shot.y,'#ff61ab',44,1.55);sound(120,.26,'sawtooth',.09);
 if(z.parts.every(q=>q.dead)){boss.hp=0;defeatBoss();}}
 return true;
 }
 // Unbreakable chest plating also stops a shot; no projectile passes through the boss.
 if(Math.abs(sx-screenX(boss.x))<95&&Math.abs(sy-boss.y)<117){shot.life=0;shot.vx=0;return true;}
 return false;
};
applyRigBomb=function(b,rad){
 if(!zm6Stage()||boss?.z?.n!==3)return zm6PrevBomb(b,rad);
 const z=boss.z;let hit=false;
 for(const p of z.parts){
 if(p.dead||p.flash>0)continue;
 if(p.type==='core'&&z.parts.some(q=>q.type!=='core'&&!q.dead))continue;
 const q=rigPartWorld(p);if(Math.hypot(screenX(b.x)-q.x,b.y-q.y)>rad+20)continue;
 p.hp=Math.max(0,p.hp-(b.big?3:2));p.flash=.24;hit=true;
 if(p.hp===0){p.dead=true;shake=Math.max(shake,13);pop(b.x,b.y,'#ffe0a2',35,1.5);}
 }
 if(hit&&z.parts.every(p=>p.dead)){boss.hp=0;defeatBoss();}
 return hit;
};

// Signature visual language: claws use a luminous narrow laser, dunes rise as
// carved columns, the tail lobs heavy bombs, and shell wings telegraph a dash.
const zm6PriorAttackFx=drawBossAttackEffects;
drawBossAttackEffects=function(){
 if(!zm6Stage()||!boss?.alive||boss.z?.n!==3||!boss.z.attack)return zm6PriorAttackFx();
 const z=boss.z,a=z.attack[0],t=z.t||0;
 const warning=z.state==='TELEGRAPH',active=z.state==='ATTACK';
 if(!warning&&!active)return;
 const bx=screenX(boss.x),by=boss.y,px=screenX(player.x);
 ctx.save();
 if(a==='claw-laser'){
  const y=by+68+Math.sin(t*2)*12,left=66,right=bx-115;
  const glow=ctx.createLinearGradient(left,y,right,y);
  glow.addColorStop(0,'#f689e800');glow.addColorStop(.16,'#ef75dbaa');
  glow.addColorStop(.68,'#ff8ed2');glow.addColorStop(1,'#fff6b8');
  if(warning){
   ctx.strokeStyle='#ffeeb5';ctx.lineWidth=2.5+Math.sin(t*16)*.6;
   ctx.globalAlpha=.6+.22*Math.sin(t*10);
   ctx.setLineDash([18,11]);ctx.beginPath();ctx.moveTo(left,y);ctx.lineTo(right,y);ctx.stroke();ctx.setLineDash([]);
   for(let j=0;j<4;j++){const x=left+(right-left)*(j+.3)/4;
    ctx.strokeStyle='#ffe6c5';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,7+j%2*3,0,2*Math.PI);ctx.stroke();}
  }else{
   ctx.lineCap='round';ctx.shadowColor='#ff57e2';ctx.shadowBlur=27;
   ctx.strokeStyle='#d242d68a';ctx.lineWidth=35;ctx.beginPath();ctx.moveTo(left,y);ctx.lineTo(right,y);ctx.stroke();
   ctx.shadowBlur=14;ctx.strokeStyle=glow;ctx.lineWidth=17;ctx.stroke();
   ctx.shadowBlur=0;ctx.strokeStyle='#fff8e9';ctx.lineWidth=5;ctx.stroke();
   for(let j=0;j<9;j++){const x=left+(right-left)*((j*.137+t*.58)%1);
    ctx.fillStyle='#fff8e5';ctx.globalAlpha=.55+j%3*.15;
    ctx.beginPath();ctx.arc(x,y+(j%2?1:-1)*7,2+j%3*1.4,0,2*Math.PI);ctx.fill();}
  }
 }else if(a==='sand-columns'){
  for(let i=0;i<3;i++){
   const x=220+i*365,up=active?Math.min(1,Math.max(0,(t-i*.24)*6)):0;
   if(warning){
    ctx.globalAlpha=.55+.23*Math.sin(t*11+i);
    ctx.strokeStyle='#ffdfa3';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(x,ground-6,55,13,0,0,2*Math.PI);ctx.stroke();
    for(let j=0;j<5;j++){ctx.beginPath();ctx.moveTo(x-32+j*16,ground-17);ctx.lineTo(x-32+j*16,ground-38-Math.sin(t*6+j)*8);ctx.stroke();}
   }else if(up>0){
    const height=210*up,grad=ctx.createLinearGradient(x-48,0,x+48,0);
    grad.addColorStop(0,'#8e5770');grad.addColorStop(.2,'#e6b37e');grad.addColorStop(.55,'#f4cd95');grad.addColorStop(1,'#95617b');
    ctx.fillStyle=grad;ctx.strokeStyle='#6a4269';ctx.lineWidth=5;
    ctx.beginPath();ctx.moveTo(x-45,ground);ctx.lineTo(x-45,ground-height+14);
    ctx.lineTo(x-31,ground-height);ctx.lineTo(x+31,ground-height);
    ctx.lineTo(x+45,ground-height+14);ctx.lineTo(x+45,ground);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.strokeStyle='#9d6a69';ctx.lineWidth=2;
    for(let j=1;j<6;j++){const yy=ground-height+j*height/6;ctx.beginPath();ctx.moveTo(x-43,yy);ctx.lineTo(x+43,yy);ctx.stroke();}
    ctx.fillStyle='#f7e6bb77';for(let j=0;j<7;j++){
     const theta=j*2.4+t*3,dx=Math.sin(theta)*60,dy=Math.abs(Math.cos(theta))*30;
     ctx.beginPath();ctx.arc(x+dx,ground-height+dy,2+j%3*2,0,2*Math.PI);ctx.fill();}
   }
  }
 }else if(a==='tail-bombs'){
  if(warning){const p=getPartPos(z.parts.find(p=>p.type==='tail')||{type:'tail',i:4});
   ctx.strokeStyle='#ffdeac';ctx.lineWidth=3;ctx.setLineDash([8,10]);
   ctx.beginPath();ctx.arc(bx+p.x,by+p.y,59+Math.sin(t*9)*5,0,2*Math.PI);ctx.stroke();ctx.setLineDash([]);
  }else{
   for(let i=0;i<3;i++){const k=t-i*.29;if(k<=0||k>1.7)continue;
    const x=bx-100-i*140-k*110,y=by+114-300*k+310*k*k;
    const g=ctx.createRadialGradient(x-7,y-7,2,x,y,29);
    g.addColorStop(0,'#fff3c7');g.addColorStop(.25,'#f8abf7');g.addColorStop(.74,'#ae48b9');g.addColorStop(1,'#4b2c70');
    ctx.shadowColor='#ff78d1';ctx.shadowBlur=16;ctx.fillStyle=g;ctx.strokeStyle='#edbe8e';ctx.lineWidth=4;
    ctx.beginPath();ctx.arc(x,y,25,0,2*Math.PI);ctx.fill();ctx.stroke();
    ctx.shadowBlur=0;ctx.strokeStyle='#fff5bb';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x-6,y-8,9,Math.PI*1.2,Math.PI*1.8);ctx.stroke();
   }
  }
 }else if(a==='shell-dash'){
  ctx.lineCap='round';ctx.globalAlpha=warning?.45:.75;ctx.strokeStyle=warning?'#ffe6b0':'#e5bdff';ctx.lineWidth=warning?3:7;
  for(let i=0;i<9;i++){
   const y=by-105+i*25,off=(i%3)*33;
   const x=bx-180-off-(warning?0:t*65);
   ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-85-i%3*31,y);ctx.stroke();
  }
  if(warning){ctx.strokeStyle='#ffefbc';ctx.lineWidth=4;ctx.beginPath();ctx.ellipse(bx,by,200,140,0,0,2*Math.PI);ctx.stroke();}
 }
 ctx.restore();
};

window.ZAMAZONE_STAGE2_MASTER_QA=()=>({
 stage,mode,ready:zm6Names.filter(zm6Ready).length,total:zm6Names.length,
 artSource:'original concept sprite sheets, independent 84-WebP delivery',
 parts:boss?.z?.n===3?boss.z.parts.map(p=>({role:zm6Role(p),hp:p.hp,maxHp:p.maxHp,dead:p.dead,world:rigPartWorld(p)})):[],
 activeBases:bases?.filter(b=>b.alive).length,
 assets:{background:zm6Ready('bg_middle'),boss:zm6Ready('torso'),base:zm6Ready('base_ground_0'),enemy:zm6Ready('enemy_beetle_0')}
});


// Test-only hook is never exposed on ordinary game URLs.
if(new URLSearchParams(location.search).get('stage2_qa')==='1'){
 window.ZAMAZONE_STAGE2_QA_DESTROY_ALL=function(){
  if(!zm6Stage()||!boss?.alive||boss.z?.n!==3)return {error:'boss inactive'};
  const outcomes=[];
  for(const role of ['armL','armR','wingL','wingR','tail','core']){
   const part=boss.z.parts.find(p=>zm6Role(p)===role);
   let shots=0;
   while(part&&!part.dead&&shots<120&&boss.alive){
    for(const p of boss.z.parts)p.flash=0;
    const q=getPartPos(part);
    const s={x:wrapX(boss.x+q.x),y:boss.y+q.y,life:1,vx:700,dmg:1,radius:1};
    const hit=applyRigShot(s);
    if(!hit)return {error:'shot missed',role,shots,outcomes};
    if(s.life!==0)return {error:'shot pierced',role,shots,outcomes};
    shots++;
   }
   outcomes.push({role,shots,dead:!!part?.dead,hp:part?.hp});
  }
  return {outcomes,allDestroyed:boss.z.parts.every(p=>p.dead),bossAlive:boss.alive,mode};
 };
}

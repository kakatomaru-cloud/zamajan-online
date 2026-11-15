// STAGE2_REPAIR_VISUAL_AND_COLLISION_V4_20261115
// Replaces all legacy stage-2 backdrop compositing with one clean paint pass.
const stage2RepairPreviousScenery=drawScreenshotScenery;
const stage2RepairPreviousBase=drawBase;
const stage2RepairPreviousEnemy=drawEnemy;
const stage2RepairPreviousBoss=drawBoss;
const stage2RepairPreviousPos=getPartPos;
const stage2RepairPreviousShot=applyRigShot;
const stage2RepairPreviousSpawn=spawnBoss;
const stage2RepairBg=new Image();
stage2RepairBg.src='assets/area2_background.webp';
const stage2RepairParts={};
for(const type of ['core','wingL','wingR','armL','armR','tail']){
 const im=new Image();im.src='assets/boss_rig/mana3_'+type+'.png';stage2RepairParts[type]=im;
}
const stage2RepairIs=()=>stage===2&&!riichiMode;
const stage2RepairBases={core:[0,-18],wingL:[-112,-47],wingR:[112,-47],armL:[-67,49],armR:[67,49],tail:[0,74]};
function stage2RepairRole(p){
 if(p.type==='core')return 'core';
 if(p.type==='wing')return p.i===2?'wingL':'wingR';
 if(p.type==='tail')return 'tail';
 return p.i===0?'armL':'armR';
}
drawScreenshotScenery=function(){
 if(!stage2RepairIs())return stage2RepairPreviousScenery();
 const y=82,ht=ground-y;
 ctx.save();
 // No stacked background strips and no stretched asset compositing with gaps.
 const bg=stage2RepairBg;
 if(bg.complete&&bg.naturalWidth>0){
   const scale=Math.max(W/bg.naturalWidth,ht/bg.naturalHeight);
   const height=bg.naturalHeight*scale*1.04,width=bg.naturalWidth*scale*1.04;
   const shift=Math.sin(camera/1800)*Math.max(0,(width-W)*.39);
   ctx.drawImage(bg,(W-width)/2-shift,y+(ht-height)/2,width,height);
 }else{
   const grad=ctx.createLinearGradient(0,y,0,ground);
   grad.addColorStop(0,'#663d8a');grad.addColorStop(.55,'#ffb16c');grad.addColorStop(1,'#e7a16b');
   ctx.fillStyle=grad;ctx.fillRect(0,y,W,ht);
 }
 // Foreground sand glints: transparent graphics, never opaque horizontal bands.
 const move=camera*.37;
 for(let i=0;i<24;i++){
   const x=((i*123-move)%(W+180)+(W+180))%(W+180)-70;
   const sy=ground-28+Math.sin(i*1.21)*12;
   ctx.fillStyle=i%3===0?'#ffe9a967':'#75436538';
   ctx.fillRect(x,sy,13+i%4*4,2);
 }
 const sand=ctx.createLinearGradient(0,ground-34,0,H);
 sand.addColorStop(0,'#b66f5e00');sand.addColorStop(.33,'#dca474c9');sand.addColorStop(1,'#85536a');
 ctx.fillStyle=sand;ctx.fillRect(0,ground-34,W,H-ground+34);
 ctx.fillStyle='#ffe2a2';ctx.fillRect(0,ground-2,W,3);
 ctx.restore();
 return true;
};
// Preserve the carefully composed original game sprites rather than the simplified geometry override.
drawBase=function(base){if(!stage2RepairIs())return stage2RepairPreviousBase(base);
 if(!base.alive)return; const x=screenX(base.x),y=base.y,t=base.phase;
 if(x<-160||x>W+160)return;
 ctx.save();ctx.translate(x,y);
 const flying=!!base.flying;
 // Existing original art is independently animated for an anchored ground and hovering base.
 if(flying){
   ctx.translate(0,Math.sin(t*2.8)*7);
   ctx.fillStyle='#614ac555';ctx.beginPath();ctx.ellipse(0,77,65,12,0,0,Math.PI*2);ctx.fill();
   const im=pixelArt.zaz_airbase;
   if(im?.complete&&im.naturalWidth)ctx.drawImage(im,-82,-91,164,145);
   else{ctx.fillStyle='#b78b66';ctx.fillRect(-65,-50,130,85);}
   for(const x0 of [-43,0,43]){ctx.fillStyle='#80eaff99';ctx.beginPath();ctx.moveTo(x0-9,57);ctx.lineTo(x0+9,57);ctx.lineTo(x0,86+Math.sin(t*16+x0)*10);ctx.closePath();ctx.fill();}
 }else{
   // Ancient desert fortress: shaded stonework, decorated spires, gilded scarab gate.
   ctx.save();
   ctx.fillStyle='#442f4d55';ctx.beginPath();ctx.ellipse(0,50,94,14,0,0,Math.PI*2);ctx.fill();
   const block=ctx.createLinearGradient(-91,-135,92,49);
   block.addColorStop(0,'#fff1ad');block.addColorStop(.3,'#d8ab70');
   block.addColorStop(.65,'#9a6a61');block.addColorStop(1,'#573d5c');
   const gold=ctx.createLinearGradient(-80,-112,72,26);
   gold.addColorStop(0,'#fff6c5');gold.addColorStop(.5,'#e7bb6b');gold.addColorStop(1,'#8b4d52');
   function wall(x,y,w,h){ctx.fillStyle=block;ctx.fillRect(x,y,w,h);ctx.strokeStyle='#765064';ctx.lineWidth=3;ctx.strokeRect(x,y,w,h);
     ctx.strokeStyle='#ecc28a';ctx.lineWidth=1.7;
     for(let row=1;row<Math.floor(h/17);row++){const yy=y+row*17;ctx.beginPath();ctx.moveTo(x,yy);ctx.lineTo(x+w,yy);ctx.stroke();}
     for(let row=0;row<Math.floor(h/17);row++)for(let k=1;k<Math.floor(w/24);k++){const xx=x+k*24+(row%2)*12;if(xx<x+w){ctx.beginPath();ctx.moveTo(xx,y+row*17);ctx.lineTo(xx,y+(row+1)*17);ctx.stroke();}}}
   wall(-89,-65,178,112);
   // Side towers visibly anchored to foundation.
   for(const sx of [-68,68]){
     wall(sx-23,-117,46,158);
     ctx.fillStyle=gold;ctx.fillRect(sx-28,-119,56,12);
     ctx.fillStyle='#6c456b';ctx.fillRect(sx-13,-96,26,36);
     ctx.fillStyle='#f5d59b';ctx.fillRect(sx-8,-93,7,28);
     ctx.fillStyle='#6e4971';ctx.fillRect(sx-16,-137,32,21);
     ctx.fillStyle='#f5c576';ctx.fillRect(sx-20,-141,40,7);
     ctx.fillStyle='#2a214c';ctx.fillRect(sx-11,-136,22,4);
     ctx.fillStyle='#ffbcdc';ctx.fillRect(sx-3,-134,6,14);
   }
   // Stone upper battlements.
   wall(-56,-88,112,31);
   ctx.fillStyle=gold;ctx.fillRect(-59,-96,118,10);
   for(let i=0;i<5;i++){ctx.fillStyle=i%2?'#b98562':'#f1c98b';ctx.fillRect(-53+i*23,-111,19,16);}
   // Central arched mechanical gateway.
   ctx.fillStyle='#382449';ctx.beginPath();ctx.moveTo(-38,48);ctx.lineTo(-38,-16);ctx.arc(0,-16,38,Math.PI,0);ctx.lineTo(38,48);ctx.closePath();ctx.fill();
   ctx.strokeStyle='#e5bd7b';ctx.lineWidth=8;ctx.stroke();
   ctx.fillStyle='#9a4795';ctx.fillRect(-29,-14,58,62);
   for(let i=0;i<3;i++){ctx.strokeStyle='#fdc9ff';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-20+i*20,-8);ctx.lineTo(-20+i*20,40);ctx.stroke();}
   // Emblem contains the vulnerable eye; damage color feedback uses existing base.flash.
   ctx.save();ctx.translate(0,-60+Math.sin(t*3)*2);
   ctx.fillStyle='#3e2c61';ctx.beginPath();ctx.ellipse(0,0,42,25,0,0,Math.PI*2);ctx.fill();
   ctx.strokeStyle='#ffe39e';ctx.lineWidth=7;ctx.stroke();
   ctx.fillStyle='#f57dcf';ctx.beginPath();ctx.ellipse(0,0,25,18,0,0,Math.PI*2);ctx.fill();
   ctx.fillStyle='#462359';ctx.beginPath();ctx.ellipse(0,0,9,16,0,0,Math.PI*2);ctx.fill();
   ctx.fillStyle='#fff6c4';ctx.beginPath();ctx.arc(-9,-6,5,0,Math.PI*2);ctx.fill();
   ctx.restore();
   // Gilded scarab relief across the roof.
   for(const sign of [-1,1]){
     ctx.save();ctx.translate(sign*37,-106);ctx.rotate(sign*.28);
     ctx.fillStyle='#edba6e';ctx.beginPath();ctx.ellipse(0,0,28,11,sign*.35,0,Math.PI*2);ctx.fill();
     ctx.strokeStyle='#72455a';ctx.lineWidth=3;ctx.stroke();ctx.restore();
   }
   // Tethers and red temple banners.
   ctx.fillStyle='#7c2e65';ctx.fillRect(-95,-70,18,47);ctx.fillRect(77,-70,18,47);
   ctx.fillStyle='#ffd88c';ctx.fillRect(-91,-65,10,32);ctx.fillRect(81,-65,10,32);
   ctx.restore();

 }
 if(base.flash>0){ctx.globalAlpha=Math.min(.52,base.flash*3);ctx.fillStyle='#ffefc1';ctx.beginPath();ctx.ellipse(0,0,68,52,0,0,Math.PI*2);ctx.fill();}
 ctx.restore();
};
drawEnemy=function(e){if(!stage2RepairIs())return stage2RepairPreviousEnemy(e);
 // Reuse existing transparent character art; avoid enlarged clipping rectangles.
 const x=screenX(e.x),y=e.y;
 if(x<-105||x>W+105)return;
 ctx.save();ctx.translate(x,y+Math.sin(e.phase*6)*3);if(e.vx<0)ctx.scale(-1,1);
 const nm=e.type==='wasp'?'zaz_wasp':e.type==='laserjelly'?'zaz_jelly':null;
 if(nm&&pixelArt[nm]?.complete&&pixelArt[nm].naturalWidth){
   ctx.rotate(Math.sin(e.phase*6)*.055);ctx.drawImage(pixelArt[nm],-49,-42,98,84);
 }else{
   const kind=e.type==='bird'?'enemy_bird_anim_':e.type==='bouncer'?'enemy_propeller_anim_':'enemy_crawler_anim_';
   const frame=Math.floor(e.phase*8)%8,im=pixelArt[kind+frame];
   if(im?.complete&&im.naturalWidth)ctx.drawImage(im,-48,-40,96,80);
   else{ctx.fillStyle='#347ac3';ctx.beginPath();ctx.ellipse(0,0,28,18,0,0,Math.PI*2);ctx.fill();}
 }
 ctx.restore();
};
// All six damageable parts have real transparent artwork and matching collision pivots.
spawnBoss=function(){
 stage2RepairPreviousSpawn();
 if(!stage2RepairIs()||!boss?.z||boss.z.n!==3)return;
 const z=boss.z;
 z.parts=[
  {type:'arm',i:0,x:-67,y:49,hp:11,maxHp:11,dead:false,flash:0},
  {type:'arm',i:1,x:67,y:49,hp:11,maxHp:11,dead:false,flash:0},
  {type:'wing',i:2,x:-112,y:-47,hp:8,maxHp:8,dead:false,flash:0},
  {type:'wing',i:3,x:112,y:-47,hp:8,maxHp:8,dead:false,flash:0},
  {type:'tail',i:4,x:0,y:74,hp:10,maxHp:10,dead:false,flash:0},
  {type:'core',i:99,x:0,y:-18,hp:16,maxHp:16,dead:false,flash:0}
 ];
 boss.hp=boss.maxHp=9999;
};
getPartPos=function(p){
 if(!stage2RepairIs()||boss?.z?.n!==3)return stage2RepairPreviousPos(p);
 const t=boss.z.elapsed||0,role=stage2RepairRole(p),a=stage2RepairBases[role]||[0,0];
 if(role==='armL'||role==='armR')return{x:a[0]+Math.sin(t*2+p.i)*9,y:a[1]+Math.cos(t*2.4+p.i)*9};
 if(role==='wingL'||role==='wingR')return{x:a[0]+Math.sin(t*1.5+p.i)*5,y:a[1]+Math.cos(t*2+p.i)*11};
 if(role==='tail')return{x:a[0]+Math.sin(t*2.2)*13,y:a[1]+Math.cos(t*2.1)*9};
 return{x:a[0],y:a[1]+Math.sin(t*2)*3};
};
drawBoss=function(){
 if(!stage2RepairIs()||!boss?.alive||boss.z?.n!==3)return stage2RepairPreviousBoss();
 const bx=screenX(boss.x),by=boss.y,z=boss.z,t=z.elapsed||0;
 if(bx<-300||bx>W+300)return;
 ctx.save();ctx.translate(bx,by);
 ctx.fillStyle='#39204955';ctx.beginPath();ctx.ellipse(0,156,115,17,0,0,Math.PI*2);ctx.fill();
 for(const role of ['wingL','wingR','tail','armL','armR','core']){
   const p=z.parts.find(a=>stage2RepairRole(a)===role&&!a.dead);
   if(!p)continue;
   const im=stage2RepairParts[role],origin=stage2RepairBases[role],q=getPartPos(p);
   ctx.save();ctx.translate(q.x,q.y);
   let angle=role.startsWith('wing')?(role==='wingL'?-1:1)*Math.sin(t*1.75)*.075:role.startsWith('arm')?(role==='armL'?-1:1)*Math.sin(t*2.5)*.13:role==='tail'?Math.sin(t*2.1)*.12:0;
   if(z.state==='TELEGRAPH')angle*=1.8;
   ctx.rotate(angle);
   if(im.complete&&im.naturalWidth){
     const ratio=p.hp/p.maxHp;
     if(p.flash>0)ctx.filter='brightness(1.9) sepia(.45) saturate(2)';
     else if(ratio<.4)ctx.filter='sepia(.7) saturate(2.7) hue-rotate(295deg)';
     else if(ratio<.75)ctx.filter='sepia(.25) saturate(1.45)';
     ctx.drawImage(im,-172-origin[0],-172-origin[1],344,344);
     ctx.filter='none';
   }else{ctx.fillStyle='#b88a5a';ctx.beginPath();ctx.arc(0,0,25,0,2*Math.PI);ctx.fill();}
   if(p.hp<p.maxHp&&!p.dead){
      ctx.strokeStyle=p.hp/p.maxHp<.4?'#ff4973':'#fbc47d';
      ctx.lineWidth=3;ctx.shadowColor='#ff5fa3';ctx.shadowBlur=6;
      ctx.beginPath();ctx.moveTo(-8,-12);ctx.lineTo(3,-1);ctx.lineTo(-3,11);ctx.stroke();
   }
   ctx.restore();
 }
 ctx.restore();
};
applyRigShot=function(b){
 if(!stage2RepairIs()||!boss?.alive||boss.z?.n!==3)return stage2RepairPreviousShot(b);
 const z=boss.z,sx=screenX(b.x),sy=b.y,outer=z.parts.some(p=>p.type!=='core'&&!p.dead);
 for(const p of z.parts){
   if(p.dead)continue;
   const q=rigPartWorld(p);
   const radius=p.type==='core'?51:p.type==='wing'?45:p.type==='arm'?39:33;
   if(Math.hypot(sx-q.x,sy-q.y)>radius+(b.radius||0))continue;
   b.life=0;b.vx=0;
   if(p.type==='core'&&outer)return true;
   if(p.flash>0)return true;
   p.hp-=Math.max(1,b.dmg||1);p.flash=.16;z.recoil=.21;boss.hitFlash=.15;
   pop(b.x,b.y,'#ffe9bd',9,.52);sound(435,.045,'square',.025);
   if(p.hp<=0){p.hp=0;p.dead=true;shake=Math.max(shake,11);pop(b.x,b.y,'#ff78a9',27,1.2);sound(130,.18,'sawtooth',.06);}
   if(z.parts.every(part=>part.dead)){boss.hp=0;defeatBoss();}
   return true;
 }
 // Main armor blocks shots until every exposed module has been broken.
 if(Math.abs(sx-screenX(boss.x))<114&&Math.abs(sy-boss.y)<114){b.life=0;b.vx=0;return true;}
 return false;
};
window.ZAMAZONE_STAGE2_REPAIR_QA=()=>({
 stage,mode,backgroundLoaded:stage2RepairBg.complete&&stage2RepairBg.naturalWidth>0,
 sprites:Object.entries(stage2RepairParts).map(([name,img])=>({name,loaded:img.complete&&img.naturalWidth>0})),
 bossParts:boss?.z?.n===3?boss.z.parts.map(p=>({type:p.type,hp:p.hp,maxHp:p.maxHp,dead:p.dead})):[],
 version:'stage2-repair-v4'
});

window.ZAMAZONE_STAGE2_REPAIR_PREVIEW_AREA=function(){
  if(riichiMode)return false;
  stage=2;setupStage(false);mode='play';closePanel();
  camera=320;player.x=400;player.y=350;player.inv=8;
  return true;
};

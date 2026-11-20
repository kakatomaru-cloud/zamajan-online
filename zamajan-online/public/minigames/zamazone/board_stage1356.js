/* ZAMAZONE_BOARD_STAGE1356_V1_20261118
 * ZAMAZONE_BOARD_STAGE1356_V2_GRASSLAND_VISUAL_FIX_20261118
 * ZAMAZONE_STAGE1_VECTOR_REDRAW_V3_20261118
 * ZAMAZONE_STAGE1_SOURCE_ART_HQ_V4_20261118
 * ZAMAZONE_BOARD_REAL_RENDER_ENFORCEMENT_V5_20261120
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
const grassHQ=new Image();
grassHQ.decoding='async';
grassHQ.src='assets/board_stage1356/grass_hq.webp';
const grassReady=()=>grassHQ.complete&&grassHQ.naturalWidth===1120&&grassHQ.naturalHeight===160;
const loaded=id=>id===1?grassReady():!!(atlas[id]?.complete&&atlas[id].naturalWidth===336&&atlas[id].naturalHeight===48);
let forceStage=0,spawnCount=0,lastStage=0,drawCount=Array(7).fill(0);
const sceneRender={};let legacyArtFallbacks=0,assetFailures=0,lastArtError='';
const actualVariants={};
function markArt(kind,id,index,source){
 const row=sceneRender[id]??=( {enemy:0,air:0,ground:0,enemyVariants:[],frames:0,lastAsset:'',oldRenderer:0} );
 row[kind]++;row.frames++;
 if(kind==='enemy'&&!row.enemyVariants.includes(index))row.enemyVariants.push(index);
 row.lastAsset=source;
}
const artFail=(id,kind)=>{
 assetFailures++;
 if(assetFailures<6||assetFailures%300===0){
  lastArtError='Stage '+id+' '+kind+' failed to load '+(id===1?'grass_hq.webp':artStages[id]+'.png');
  console.error('ZAMAZONE_STAGE_ART_UNAVAILABLE',lastArtError);
 }
};
function pendingArt(x,y,kind,id){
 ctx.save();ctx.translate(x,y);
 ctx.strokeStyle=accents[id]||'#f9df83';ctx.lineWidth=4;
 ctx.setLineDash([9,5]);ctx.strokeRect(-47,-37,94,74);ctx.setLineDash([]);
 ctx.textAlign='center';ctx.font='bold 13px system-ui';
 ctx.fillStyle='#fff';ctx.fillText('ART '+id+' LOADING',0,5);
 ctx.restore();artFail(id,kind);
}
const deaths=[],counters={enemy:0,air:0,ground:0,enemyDefeats:0,baseDefeats:0,fragments:0,shots:0,grassSky:0,grassScenery:0};
const current=()=>forceStage||stage;
// The desert's own Stage-2 smoke harness can temporarily force its stage
// while the main level is grassland; respect that override without intercepting.
const enabled=()=>!riichiMode&&!!artStages[current()]&&
 !(window.ZAMAZONE_DESERT_REDESIGN_QA?.()?.active);
const src=i=>i*48;
const enemyScale={1:128,3:115,4:112,5:119,6:119};
const baseScale={1:206,3:226,4:228,5:234,6:230};
const redFilter='brightness(0) saturate(100%) invert(19%) sepia(99%) saturate(6470%) hue-rotate(345deg)';
const flashing=o=>(o?.zfxRedUntil&&performance.now()<o.zfxRedUntil&&Math.floor(performance.now()/70)%2===0)||
  (o?.flash>0&&Math.floor(performance.now()/70)%2===0);

// High-definition Stage 1 redraw, faithful to the seven named designs on the
// supplied concept board. Vector paths avoid enlarging 20px-wide thumbnails.
function grassVector(index,w,h,t){
 ctx.save();ctx.scale(w/120,h/120);
 const outline='#24204c',gold='#f9b728',shine='#fff9b1';
 function ellipse(x,y,rx,ry,c,stroke=outline,lw=3){
  ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);
  ctx.fillStyle=c;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=lw;ctx.stroke();}
 }
 function grad(c1,c2,y=-45){const g=ctx.createLinearGradient(0,y,0,55);g.addColorStop(0,c1);g.addColorStop(1,c2);return g;}
 function poly(points,color,stroke=outline,lw=3){
  ctx.beginPath();ctx.moveTo(...points[0]);
  for(const p of points.slice(1))ctx.lineTo(...p);
  ctx.closePath();ctx.fillStyle=color;ctx.fill();
  if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=lw;ctx.stroke();}
 }
 function eye(x,y,size=16){
  ellipse(x,y,size,size*.95,'#fffdfb',outline,3.3);
  ellipse(x+3,y,6.8*size/16,9*size/16,'#19132c',null);
  ellipse(x+1,y-5,3*size/16,3*size/16,'white',null);
 }
 function jewel(x,y,r=4){ellipse(x,y,r,r,'#75efff','#fff5d8',1.3);ellipse(x-1,y-1,r*.3,r*.3,'white',null);}
 function cannon(x,y,r=20){
  ellipse(x,y,r+6,r+6,grad('#fffba1','#ed8e1e'),outline,4);
  ellipse(x,y,r,r,'#f39e1d','#f9dd75',3);
  ellipse(x,y,r*.67,r*.67,'#3e1843','#b04c1b',3);
  ellipse(x-3,y-5,4.3,4.3,'#ffffbf',null);
 }
 const wave=Math.sin(t*7),wiggle=Math.sin(t*3.2);
 if(index===0){
  // HATCH: golden one-eyed bee, animated cyan glass wings.
  ellipse(18,6,31,24,grad('#fff365','#d47b13'),outline,3.3);
  for(const x of [14,27])poly([[x,-13],[x+9,-9],[x+11,20],[x+2,27]],'#4c2a2d',null);
  ellipse(-8,-26,20,28+wave*3,grad('#e9ffff','#37c7f8'),outline,3);
  ellipse(24,-30,20,27-wave*3,grad('#edffff','#6ddcff'),outline,3);
  ellipse(-11,-37,6,11,'#fff',null,0);
  ellipse(0,3,26,26,grad('#ffe954','#eeb019'),outline,4);
  eye(-9,2,19);
  ellipse(-2,35,5,5,gold);ellipse(20,34,5,5,gold);
  ctx.strokeStyle=outline;ctx.lineWidth=3;ctx.beginPath();
  ctx.moveTo(-7,-24);ctx.lineTo(-15,-38);ctx.moveTo(3,-22);ctx.lineTo(9,-37);ctx.stroke();
  ellipse(-15,-39,4,4,shine);ellipse(9,-38,4,4,shine);
 }else if(index===1){
  // LEAFUN: bright leaf creature and mobile seed eye.
  for(let i=0;i<5;i++){
   const a=-1.2+i*.55+wiggle*.05;
   ctx.save();ctx.rotate(a);
   ellipse(9,-30,18,32,grad('#c4ff6d','#2ead3c'),outline,3);
   ctx.strokeStyle='#e7ff9c';ctx.lineWidth=2;
   ctx.beginPath();ctx.moveTo(9,-48);ctx.lineTo(9,-14);ctx.stroke();
   ctx.restore();
  }
  ellipse(0,10,34,30,grad('#bfff46','#43b43c'),outline,4);
  eye(-10,8,19);
  ellipse(21,13,6,5,'#f4ffb4',null);
  ellipse(-8,40,7,4,'#f0c840',outline,2);ellipse(16,40,7,4,'#f0c840',outline,2);
 }else if(index===2){
  // KINOPI: red mushroom with cream spots and eye-like face.
  ellipse(0,16,25,30,grad('#fff6af','#dfa028'),outline,4);
  eye(0,14,19);
  ellipse(-15,45,8,5,'#ef9c30',outline,2);ellipse(15,45,8,5,'#ef9c30',outline,2);
  ctx.beginPath();ctx.moveTo(-46,-5);
  ctx.bezierCurveTo(-42,-60,40,-64,46,-5);
  ctx.quadraticCurveTo(0,16,-46,-5);ctx.closePath();
  ctx.fillStyle=grad('#ff7471','#d62340',-55);ctx.fill();
  ctx.strokeStyle=outline;ctx.lineWidth=4;ctx.stroke();
  ellipse(-20,-21,9,6,'#fff7d5',null);
  ellipse(5,-41,11,6,'#fff7d5',null);
  ellipse(28,-19,8,6,'#fff7d5',null);
 }else if(index===3){
  // FLOWAN: five glossy pink petals around one giant eye.
  for(let i=0;i<6;i++){
   const a=i*Math.PI/3+t*.12;
   ctx.save();ctx.rotate(a);
   ellipse(0,-27,20,26,grad('#fff5f8','#fb4fa4'),outline,3);
   ellipse(-6,-36,6,7,'#fff5fa',null);
   ctx.restore();
  }
  ellipse(0,0,27,27,grad('#fffda6','#f1ae31'),outline,4);
  eye(0,0,17);
  ctx.strokeStyle='#289b3b';ctx.lineWidth=10;ctx.beginPath();
  ctx.moveTo(0,35);ctx.lineTo(0,52);ctx.stroke();
  ellipse(11,43,14,6,'#50d84e',outline,2);
 }else if(index===4){
  // TOGEMARON: one-eyed orange spiked cog enemy.
  ctx.save();ctx.rotate(t*.18);
  for(let i=0;i<12;i++){
   const a=i*Math.PI/6;
   ctx.save();ctx.rotate(a);
   poly([[-10,-28],[0,-55],[11,-28]],grad('#ffd765','#ed611c'),outline,2.5);
   ctx.restore();
  }
  ellipse(0,0,36,36,grad('#ffc95a','#e96c13'),outline,4);
  for(let i=0;i<9;i++){const a=i*6.28/9;ellipse(Math.cos(a)*27,Math.sin(a)*27,3,3,'#fff3a0',null);}
  eye(0,0,19);
  ctx.restore();
 }else if(index===5){
  // FLOWER FLYER: pastel airborne flower/cannon fortress.
  for(let i=0;i<6;i++){
   const a=i*Math.PI/3+wiggle*.035;
   ctx.save();ctx.rotate(a);
   ellipse(0,-30,17,26,grad('#fff9bf','#ff70c2'),outline,3);
   ctx.restore();
  }
  ellipse(-41,7,18,12,grad('#ffea7b','#de7d32'),outline,3);
  ellipse(41,7,18,12,grad('#ffea7b','#de7d32'),outline,3);
  ellipse(0,-4,39,31,grad('#f9bbff','#ed55b7'),outline,4);
  poly([[-51,10],[-35,0],[35,0],[51,10],[39,21],[-39,21]],grad('#ffda67','#de7927'),outline,3);
  for(const i of [-30,-15,0,15,30])jewel(i,10,3.6);
  eye(0,-13,15);
  cannon(0,26,19);
  ctx.strokeStyle='#ad6826';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(0,-36);ctx.lineTo(0,-52);ctx.stroke();
  ctx.save();ctx.translate(0,-52);ctx.rotate(t*9);
  ellipse(0,0,30,5,'#ffe364',outline,2);ctx.restore();
 }else if(index===6){
  // GREEN TREE: planted leafy tower with single eye and golden cannon.
  poly([[-30,0],[-25,43],[27,43],[31,0]],grad('#e5a44d','#a06132'),outline,4);
  for(let i=0;i<9;i++){
   const a=i*2.399+wiggle*.015;
   const x=Math.sin(a)*35,y=-25+Math.cos(a)*27;
   ellipse(x,y,27,26,grad('#d9ff7f','#56b940'),outline,3);
  }
  ellipse(0,-31,40,35,grad('#b5fd65','#389e42'),outline,3.7);
  for(let i=0;i<12;i++){
   const a=i*2.399+wiggle*.06;
   const x=Math.sin(a)*42,y=-39+Math.cos(a)*31;
   ellipse(x,y,5,5,['#ff90ce','#fff7a8','#b9eaff'][i%3],outline,1.1);
  }
  ellipse(0,-9,32,23,grad('#fcce71','#d47c2d'),outline,4);
  eye(0,-15,18);
  for(const x of [-31,-16,0,16,31])jewel(x,11,4);
  cannon(0,32,17);
  ellipse(-35,40,10,5,'#58c756',outline,2);ellipse(35,40,10,5,'#58c756',outline,2);
 }
 ctx.restore();
}

function paint(index,x,y,w,h,opts={}){
 const id=current();if(!loaded(id))return false;
 const img=atlas[id],time=opts.time||performance.now()/1000;
 ctx.save();ctx.translate(x,y);
 if(opts.flip)ctx.scale(-1,1);
 if(opts.rotation)ctx.rotate(opts.rotation);
 if(opts.alpha!==undefined)ctx.globalAlpha=opts.alpha;
 if(opts.red)ctx.filter=redFilter;
 if(id===1){
  // Approved character board itself: full 160x160 alpha cut-outs, not vector substitutes.
  ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
  ctx.drawImage(grassHQ,index*160,0,160,160,-w/2,-h/2,w,h);
  markArt(opts.kind||'enemy',id,index,'grass_hq.webp#'+index);
  ctx.restore();return true;
 }
 ctx.imageSmoothingEnabled=true;
 ctx.imageSmoothingQuality='high';
 // Source art is pre-separated into an alpha-matted single sprite per cell.
 ctx.drawImage(img,src(index),0,48,48,-w/2,-h/2,w,h);
 markArt(opts.kind||'enemy',id,index,artStages[id]+'.png#'+index);
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

// Stage 1 art direction from the approved concept board: grassland, not a
// pink cosmic planet. Background follows the camera while character art
// remains sprite-based and belongs to its own draw wrappers below.
const boardOldScreenshotScenery=drawScreenshotScenery;
drawScreenshotScenery=function(){
 // Stage 1 used a pre-rendered planet backdrop, which bypassed both
 // drawSky and drawScenery and hid the approved meadow theme.
 if(stage===1&&!riichiMode)return false;
 return boardOldScreenshotScenery();
};
const boardOldSky=drawSky,boardOldScenery=drawScenery;
drawSky=function(){
 if(riichiMode||stage!==1)return boardOldSky();
 counters.grassSky++;
 // Saturated Sega-era meadow palette with sunlight, sky banding and cumulus.
 const g=ctx.createLinearGradient(0,80,0,ground);
 g.addColorStop(0,'#218cdb');g.addColorStop(.45,'#66c4f6');g.addColorStop(.82,'#b7f9ff');g.addColorStop(1,'#e4fff1');
 ctx.fillStyle=g;ctx.fillRect(0,80,W,ground-80);
 const sunX=1054-camera*.012,sunY=173;
 const glow=ctx.createRadialGradient(sunX,sunY,8,sunX,sunY,205);
 glow.addColorStop(0,'rgba(255,251,182,.62)');glow.addColorStop(.35,'rgba(255,245,174,.24)');glow.addColorStop(1,'rgba(255,250,210,0)');
 ctx.fillStyle=glow;ctx.fillRect(sunX-210,sunY-210,420,420);
 ctx.fillStyle='#fff9cb';ctx.beginPath();ctx.arc(sunX,sunY,43,0,Math.PI*2);ctx.fill();
 function cloud(cx,cy,scale,opacity){
  ctx.save();ctx.globalAlpha=opacity;ctx.translate(cx,cy);ctx.scale(scale,scale);
  ctx.shadowColor='#d7efff';ctx.shadowBlur=15;
  ctx.fillStyle='#f8ffff';ctx.beginPath();ctx.ellipse(0,11,81,20,0,0,Math.PI*2);ctx.fill();
  for(const [x,y,r] of [[-45,0,34],[-17,-15,39],[24,-21,35],[54,1,28]]){
   ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
  }
  ctx.fillStyle='rgba(101,192,229,.13)';ctx.beginPath();ctx.ellipse(0,15,71,10,0,0,Math.PI);ctx.fill();
  ctx.restore();
 }
 for(let j=-1;j<9;j++){
  const x=((j*253-camera*.056)%(W+410)+(W+410))%(W+410)-130;
  cloud(x,176+(j%3)*72,.55+(j%3)*.14,.74);
 }
};
drawScenery=function(){
 if(riichiMode||stage!==1)return boardOldScenery();
 counters.grassScenery++;
 const SW=W,GH=ground;
 // Crystal-clear mountain silhouette and pastel sandstone spires in the distance.
 const peaks=[
  [-80,GH-180],[25,GH-270],[107,GH-205],[217,GH-298],[325,GH-192],
  [426,GH-252],[540,GH-186],[669,GH-288],[772,GH-213],
  [891,GH-302],[995,GH-207],[1104,GH-276],[1230,GH-197],[1370,GH-252]
 ];
 ctx.save();ctx.translate(-(camera*.027)%240,0);
 for(let shift=-240;shift<400;shift+=1440){
  const gradient=ctx.createLinearGradient(0,GH-325,0,GH-65);
  gradient.addColorStop(0,'#8d92e8');gradient.addColorStop(.55,'#93c7e3');gradient.addColorStop(1,'#8ce1c5');
  ctx.fillStyle=gradient;ctx.beginPath();ctx.moveTo(-260+shift,GH);
  for(const [x,y] of peaks)ctx.lineTo(x+shift,y);
  ctx.lineTo(1550+shift,GH);ctx.closePath();ctx.fill();
  for(const [x,y] of peaks.filter((_,i)=>i%2===1)){
   ctx.fillStyle='#fff3e1';ctx.beginPath();
   ctx.moveTo(x+shift,y);ctx.lineTo(x-33+shift,y+44);ctx.lineTo(x-2+shift,y+30);
   ctx.lineTo(x+21+shift,y+51);ctx.closePath();ctx.fill();
  }
 }
 ctx.restore();
 // Mid-distance flower-covered cliffs and gently curved emerald terrain.
 for(let layer=0;layer<3;layer++){
  const drift=camera*(layer===0?.10:layer===1?.22:.35);
  const by=GH-(layer===0?138:layer===1?91:48);
  ctx.fillStyle=['#a4e3b6','#65ca96','#3dad77'][layer];
  ctx.beginPath();ctx.moveTo(0,GH);
  for(let x=0;x<=SW+40;x+=18){
   const y=by+Math.sin((x+drift)*.008+layer*1.2)*28+
       Math.sin((x+drift)*.023+layer)*9;
   ctx.lineTo(x,y);
  }
  ctx.lineTo(SW,GH);ctx.closePath();ctx.fill();
 }
 // Ruined pastel stone arches, flower patches and luminous foliage at midground.
 const scrolling=(n,step,speed)=>((n*step-camera*speed)%(SW+step*4)+(SW+step*4))%(SW+step*4)-step*2;
 for(let j=-1;j<12;j++){
  const x=scrolling(j,173,.54);
  if(x<-130||x>SW+130)continue;
  const y=GH-28+(j%3)*11;
  if(j%4===0){
   ctx.fillStyle='#b8a8d7';ctx.strokeStyle='#65539f';ctx.lineWidth=5;
   ctx.fillRect(x-23,y-106,19,100);ctx.strokeRect(x-23,y-106,19,100);
   ctx.fillRect(x+38,y-112,20,109);ctx.strokeRect(x+38,y-112,20,109);
   ctx.beginPath();ctx.arc(x+16,y-105,48,Math.PI,Math.PI*2);ctx.stroke();
   for(let p=0;p<4;p++){
    ctx.fillStyle='#fff7d9';ctx.fillRect(x-21+p%2*61,y-97+p*22,9,5);
   }
  }else{
   ctx.fillStyle='#885d4b';ctx.fillRect(x-6,y-87,13,82);
   const leafy=ctx.createRadialGradient(x-14,y-95,7,x,y-102,58);
   leafy.addColorStop(0,'#e3ff87');leafy.addColorStop(.5,'#69dc65');leafy.addColorStop(1,'#248e5f');
   ctx.fillStyle=leafy;
   for(const [ox,oy,r] of [[-29,-108,29],[25,-111,32],[0,-129,38]]){
    ctx.beginPath();ctx.arc(x+ox,y+oy,r,0,Math.PI*2);ctx.fill();
   }
   for(let k=0;k<8;k++){
    const ang=k*2.4+j;
    ctx.fillStyle=['#fff8b2','#ff84cb','#ffffff'][k%3];
    ctx.beginPath();ctx.arc(x+Math.sin(ang)*42,y-112+Math.cos(ang)*27,4,0,Math.PI*2);ctx.fill();
   }
  }
 }
 // Layered soil with patterned stones and colorful flower meadow foreground.
 const soil=ctx.createLinearGradient(0,GH,0,H);
 soil.addColorStop(0,'#9a6c51');soil.addColorStop(.36,'#704c66');soil.addColorStop(1,'#423e72');
 ctx.fillStyle=soil;ctx.fillRect(0,GH,SW,H-GH);
 ctx.fillStyle='#4abc63';ctx.fillRect(0,GH-17,SW,23);
 ctx.fillStyle='#c6f46c';ctx.fillRect(0,GH-18,SW,5);
 for(let j=0;j<140;j++){
  const x=scrolling(j,32,.82),yy=GH-15-(j%5)*4;
  const tall=8+(j%4)*4;
  ctx.strokeStyle=j%2?'#268c53':'#8ade69';ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(x,GH-15);ctx.lineTo(x+(j%3-1)*5,yy-tall);ctx.stroke();
  if(j%3===0){
   const fx=x+(j%3-1)*5,fy=yy-tall;
   ctx.strokeStyle='#fdf3b2';ctx.lineWidth=1.1;
   for(let k=0;k<5;k++){
    const a=k*Math.PI*2/5;
    ctx.fillStyle=['#ff70c5','#ffe58b','#fdfcff'][j%3];
    ctx.beginPath();ctx.arc(fx+Math.cos(a)*4.5,fy+Math.sin(a)*4.5,3.5,0,Math.PI*2);ctx.fill();
   }
   ctx.fillStyle='#ffae43';ctx.beginPath();ctx.arc(fx,fy,2.8,0,Math.PI*2);ctx.fill();
  }
 }
 // Small colorful stones in foreground earth, varied but deterministic.
 for(let j=0;j<75;j++){
  const x=scrolling(j,51,.84),y=GH+15+(j*47)%78;
  ctx.fillStyle=['#b98ca1','#645d8e','#c5a27c'][j%3];
  ctx.beginPath();ctx.ellipse(x,y,5+j%4,2+j%3,0,0,Math.PI*2);ctx.fill();
 }
}; 
const originalBase=drawBase;
drawBase=function(b){
 if(!enabled())return originalBase(b);
 if(!b?.alive)return;
 const x=screenX(b.x),isAir=!!(b.flying||b.air);
 if(x<-190||x>W+190)return;
 const size=Math.min(baseScale[current()],Math.max(115,(ground-95)*.52)),t=animate(current(),b);
 const y=isAir?Math.max(size*.53+12,Math.min(ground-size*.53-12,b.y+Math.sin(t*2.5)*7)):ground-size*.5-13;
 if(!loaded(current())){pendingArt(x,y,isAir?'air':'ground',current());return;}
 const index=isAir?5:6;
 // Idle animation: 4-phase bob, head tilt, rhythmic cannon/jewel gleam.
 const cyc=Math.floor((t%2.4)/.6);
 const ang=isAir?Math.sin(t*2.1)*.045:(cyc===2?.018:cyc===3?-.018:0);
 const pulse=(cyc===2?1.035:cyc===3?.985:1);
 if(!paint(index,x,y,size*pulse,size*pulse,{rotation:ang,red:flashing(b),kind:isAir?'air':'ground'})){
  pendingArt(x,y,isAir?'air':'ground',current());return;
 }
 if((cyc===2||cyc===3)&&!flashing(b)){
  ctx.save();ctx.globalAlpha=.15;ctx.fillStyle=accents[current()];
  ctx.beginPath();ctx.arc(x,y+size*.18,12+cyc*3,0,Math.PI*2);ctx.fill();ctx.restore();
 }
 counters[isAir?'air':'ground']++;
};
const originalEnemy=drawEnemy;
drawEnemy=function(e){
 if(!enabled())return originalEnemy(e);
 if(!e||e.hp<=0)return;
 const id=current();
 if(e.boardStage!==id){
  e.boardStage=id;
  // First encounters visibly introduce mushrooms and flowers, rather than
  // looking like the legacy first-stage bee while the player starts moving.
  const spawnOrder=id===1?[2,3,1,4,0]:[0,1,2,3,4];
  e.boardVariant=spawnOrder[spawnCount++%5];
  e.artKey='stage'+id+'_mob'+e.boardVariant;
  e.boardLastShot=e.shot;e.boardAttack=0;
 }
 const x=screenX(e.x);
 if(x<-160||x>W+160)return;
 if(!loaded(id)){pendingArt(x,e.y,'enemy',id);return;}
 const t=animate(id,e),index=e.boardVariant;
 const size=enemyScale[id]*(index===4?.93:1),phase=Math.floor(t*6)%4;
 const attack=e.boardAttack>0;
 const wobble=index%2?Math.sin(t*4.5)*.095:Math.sin(t*6.0)*.065;
 const bob=Math.sin(t*(index===1?7:4.4))*5;
 const stretch=phase===0?1:phase===2?.94:1.04;
 const red=flashing(e);
 if(!paint(index,x,e.y+bob,size*stretch,size/stretch,{rotation:wobble,flip:e.vx<0,red,kind:'enemy'})){
  pendingArt(x,e.y,'enemy',id);return;
 }
 // The muzzle lights up for an attack instead of drawing an unrelated stock projectile.
 if(attack){
  ctx.save();ctx.globalAlpha=Math.min(1,e.boardAttack/.12)*.86;
  ctx.fillStyle=accents[id];ctx.shadowColor=accents[id];ctx.shadowBlur=12;
  ctx.beginPath();ctx.arc(x+(e.vx<0?-27:27),e.y+bob+2,7,0,Math.PI*2);ctx.fill();ctx.restore();
  counters.shots++;
 }
 counters.enemy++;
};
// The game's base hitbox/damage code remains unchanged. The last-stage
// renderers above are authoritative for all approved non-desert levels.
const originalHitBase=hitBase;
hitBase=function(b,damageAmount){
 if(!enabled()||!b?.alive)return originalHitBase(b,damageAmount);
 const before=b.alive,idx=b.flying||b.air?5:6,origX=b.x,
 y=b.flying||b.air?b.y:ground-Math.min(baseScale[current()],Math.max(115,(ground-95)*.52))*.5-13,sz=Math.min(baseScale[current()],Math.max(115,(ground-95)*.52));
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
 for(let i=deaths.length-1;i>=0;i--)if(deaths[i].time>2.25)deaths.splice(i,1);
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
  const x=screenX(d.x),t=d.time,progress=Math.min(1,t/1.9);
  if(x<-200||x>W+200)continue;
  const alpha=Math.min(1,Math.max(0,(2.25-t)/.55));
  const sz=d.size/4;
  ctx.save();ctx.imageSmoothingEnabled=true;
  // Stage-2-quality staged dismantling: the original body shakes, splits and scatters.
  if(d.kind==='base'&&t<.48){
    const sh=Math.sin(t*92)*(2+t*19),collapse=1-Math.pow(t/.48,2)*.22;
    paint(d.index,x+sh,d.y+Math.min(14,t*24),d.size*collapse,d.size*collapse,
      {red:t>.14&&Math.sin(t*49)>0,alpha:Math.max(0,1-t/.48),kind:'death'});
  }
  for(const p of d.parts){
   const i=(p.sy/12)*4+(p.sx/12),explode=Math.max(0,t-(d.kind==='base'?.25:0)),
     tx=x+((p.sx-18)*d.size/48)+p.vx*explode*.9,
     ty=d.y+((p.sy-18)*d.size/48)+p.vy*explode*.9+175*explode*explode;
   ctx.save();ctx.globalAlpha=alpha;
   ctx.translate(tx,ty);ctx.rotate(t*p.rot);
   if(d.id===1 && grassReady())
     ctx.drawImage(grassHQ,d.index*160+p.sx/12*40,p.sy/12*40,40,40,-sz*.5,-sz*.5,sz,sz);
   else
     ctx.drawImage(atlas[d.id],src(d.index)+p.sx,p.sy,12,12,-sz*.5,-sz*.5,sz,sz);
   ctx.restore();counters.fragments++;
  }
  if(t<.48){
   ctx.save();ctx.globalAlpha=(.48-t)/.48*.8;
   ctx.strokeStyle=accents[d.id];ctx.shadowColor=accents[d.id];ctx.shadowBlur=20;
   ctx.lineWidth=5;ctx.beginPath();ctx.arc(x,d.y,(d.size*.2)+t*170,0,Math.PI*2);
   ctx.stroke();ctx.restore();
  }
  ctx.restore();
 }
};
function status(){
 return {active:enabled(),stage:current(),loaded:Object.fromEntries(Object.keys(artStages).map(x=>[x,loaded(+x)])),
  realDraws:JSON.parse(JSON.stringify(sceneRender)),legacyArtFallbacks,assetFailures,lastArtError,
  names:labels[current()]||[],...counters,activeDeaths:deaths.length,
  renderedVariants:drawCount.slice(0,5),grassHQ:grassReady(),grassArtVersion:'source-HQ-160px',size:Object.fromEntries(Object.keys(artStages).map(x=>[x,x==='1'?grassHQ.naturalWidth:atlas[x].naturalWidth]))};
}
window.ZAMAZONE_BOARD_STAGE1356_QA=status;
if(new URLSearchParams(location.search).get('stage2_qa')==='1'){
 window.ZAMAZONE_BOARD_STAGE1356_TEST={
  // Actual campaign update/draw loops, but choose the intended stage to
  // check its real renderer independently of multi-minute level progression.
  enterLiveStage(sid){
   if(riichiMode||!artStages[sid])return {error:'invalid stage'};
   start();
   stage=sid;forceStage=0;spawnCount=0;lastStage=sid;
   for(const e of enemies){delete e.boardStage;delete e.boardVariant;}
   mode='play';
   return status();
  },
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
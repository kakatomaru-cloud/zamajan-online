// STAGE2_DELIVERY_ART_DIRECTION_V5_20261115
// Sand temple art direction: composited parallax, genuine alpha-matted independent sprites.
// This override is deliberately the LAST stage-2 renderer, preserving all non-stage-2 logic.
const _v5OriginalBackdrop=drawScreenshotScenery;
const _v5OriginalBase=drawBase;
const _v5OriginalEnemy=drawEnemy;
const _v5OriginalBoss=drawBoss;
const _v5OriginalPosition=getPartPos;
const _v5Enabled=()=>stage===2&&!riichiMode;
const _v5AssetPrefix="assets/stage2_concept/";
const _v5Sprites={};
const _v5Names=['bg_sky','bg_far','bg_mid','bg_near','base_ground0','base_ground1','base_ground_hurt','base_air0','base_air1','base_air_hurt','boss_body','boss_eye0','boss_eye1','boss_eye2','boss_eye_hurt',...['wing_L','wing_R','claw_L','claw_R','tail'].flatMap(n=>[0,1,2].map(f=>'boss_'+n+f)),...['beetle','ray','balloon'].flatMap(n=>[0,1,2].map(f=>'enemy_'+n+f))];
for(const name of _v5Names){const im=new Image();im.src=_v5AssetPrefix+name+'.webp';_v5Sprites[name]=im;}
const _v5Loaded=(name)=>{const im=_v5Sprites[name];return !!(im?.complete&&im.naturalWidth>0);};
const _v5Masked={};
function _v5Layer(name,topFade=24,bottomFade=24){
 if(_v5Masked[name])return _v5Masked[name];if(!_v5Loaded(name))return null;
 const im=_v5Sprites[name],c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;
 const g=c.getContext('2d');g.drawImage(im,0,0);
 if(topFade||bottomFade){
  g.globalCompositeOperation='destination-in';
  const fade=g.createLinearGradient(0,0,0,c.height);
  fade.addColorStop(0,topFade?'rgba(255,255,255,0)':'rgba(255,255,255,1)');fade.addColorStop(Math.min(.35,topFade/c.height),'rgba(255,255,255,1)');
  fade.addColorStop(1-Math.min(.35,bottomFade/c.height),'rgba(255,255,255,1)');fade.addColorStop(1,bottomFade?'rgba(255,255,255,0)':'rgba(255,255,255,1)');
  g.fillStyle=fade;g.fillRect(0,0,c.width,c.height);g.globalCompositeOperation='source-over';
 }
 return _v5Masked[name]=c;
}
function _v5Tile(img,rate,y,h,alpha=1){
 if(!img)return;
 const tile=1280,dx=(((camera*rate)%tile)+tile)%tile;
 ctx.save();ctx.globalAlpha=alpha;ctx.imageSmoothingEnabled=true;
 for(let i=-1;i<3;i++)ctx.drawImage(img,i*tile-dx,y,tile,h);
 ctx.restore();
}
drawScreenshotScenery=function(){
 if(!_v5Enabled())return _v5OriginalBackdrop();
 ctx.save();const sky=ctx.createLinearGradient(0,82,0,ground);
 sky.addColorStop(0,'#4e438f');sky.addColorStop(.38,'#a57fc3');sky.addColorStop(.74,'#f5beaa');sky.addColorStop(1,'#db9d80');
 ctx.fillStyle=sky;ctx.fillRect(0,82,W,H-82);
 _v5Tile(_v5Layer('bg_sky',0,60),.014,82,300,.98);
 _v5Tile(_v5Layer('bg_far',57,57),.064,192,280,.98);
 _v5Tile(_v5Layer('bg_mid',63,60),.18,320,292,.99);
 _v5Tile(_v5Layer('bg_near',70,0),.37,426,ground-426,.98);
 // Thin heat haze, atmospheric dust, but no opaque horizontal bands.
 const haze=ctx.createLinearGradient(0,ground-58,0,ground+12);
 haze.addColorStop(0,'#ffcf8600');haze.addColorStop(.9,'#f8c18d8c');haze.addColorStop(1,'#e4aa76');
 ctx.fillStyle=haze;ctx.fillRect(0,ground-58,W,70);
 const sand=ctx.createLinearGradient(0,ground,0,H);sand.addColorStop(0,'#bd826a');sand.addColorStop(.25,'#d7a277');sand.addColorStop(1,'#8e5f77');
 ctx.fillStyle=sand;ctx.fillRect(0,ground,W,H-ground);
 ctx.fillStyle='#ffe3a3';ctx.fillRect(0,ground-3,W,4);
 for(let i=0;i<26;i++){const x=((i*113-camera*.63)%(W+200)+(W+200))%(W+200)-110;const y=ground+12+(i*17)%57;ctx.fillStyle=i%3===0?'#fbd49c':'#9b6e73';ctx.globalAlpha=i%3===0?.7:.42;ctx.fillRect(x,y,15+(i%4)*7,2);}
 ctx.globalAlpha=1;
 for(let i=0;i<27;i++){const x=((i*171+themeTick*(15+i%4*8)-camera*.2)%(W+80)+(W+80))%(W+80)-40,y=160+(i*59)%(ground-210);ctx.fillStyle='#fff4cd';ctx.globalAlpha=.11+(i%5)*.04;ctx.beginPath();ctx.arc(x,y,1+i%3*.45,0,Math.PI*2);ctx.fill();}
 ctx.restore();return true;
};
function _v5Draw(name,x,y,w,h,alpha=1){
 if(!_v5Loaded(name))return false;
 ctx.save();ctx.globalAlpha*=alpha;ctx.drawImage(_v5Sprites[name],x,y,w,h);ctx.restore();return true;
}
drawBase=function(b){
 if(!_v5Enabled()||!_v5Loaded('base_ground0'))return _v5OriginalBase(b);
 if(!b.alive)return;
 const x=screenX(b.x);if(x<-200||x>W+200)return;
 const t=b.phase||0,air=!!(b.flying||b.air),y=b.y+(air?Math.sin(t*2.9)*9:0);
 ctx.save();ctx.translate(x,y);
 const w=air?208:213,h=air?148:160,sy=air?-83:-100;
 // Shadow and light reflection track the same physical anchor as the sprite.
 if(air){ctx.fillStyle='#36234c48';ctx.beginPath();ctx.ellipse(0,ground-y+5,65,11,0,0,Math.PI*2);ctx.fill();
  const jet=ctx.createLinearGradient(0,40,0,95);jet.addColorStop(0,'#e3b4ff9f');jet.addColorStop(1,'#67f0ff00');for(const xx of [-53,0,53]){ctx.fillStyle=jet;ctx.beginPath();ctx.moveTo(xx-10,44);ctx.lineTo(xx+10,44);ctx.lineTo(xx,86+Math.sin(t*16+xx)*9);ctx.fill();}
 }else{
  // Image bottom stays planted on sand ground, never floats above it.
  const realBottom=sy+h;
  if(ground-y>realBottom){ctx.fillStyle='#805468';ctx.fillRect(-62,realBottom-5,16,ground-y-realBottom+5);ctx.fillRect(47,realBottom-5,16,ground-y-realBottom+5);}
  ctx.fillStyle='#4b2f4c50';ctx.beginPath();ctx.ellipse(0,ground-y,93,12,0,0,Math.PI*2);ctx.fill();
 }
 const type=air?'air':'ground',f=Math.floor(t*(air?2.6:1.5))%2;
 const key='base_'+type+f;
 _v5Draw(key,-w/2,sy,w,h);
 if(b.flash>0){ctx.save();ctx.globalAlpha=Math.min(.65,b.flash*3);_v5Draw('base_'+type+'_hurt',-w/2,sy,w,h);ctx.restore();}
 ctx.restore();
};
drawEnemy=function(e){
 if(!_v5Enabled()||!_v5Loaded('enemy_beetle0'))return _v5OriginalEnemy(e);
 const x=screenX(e.x);if(x<-130||x>W+130)return;const t=e.phase||0;
 const k=(e.type==='bird'||e.type==='wasp')?'ray':(e.type==='bouncer'||e.type==='laserjelly')?'balloon':'beetle';
 const f=Math.floor(t*(k==='ray'?9:k==='beetle'?11:6))%3;
 const w=k==='ray'?122:k==='balloon'?93:114,h=k==='ray'?95:k==='balloon'?112:91;
 ctx.save();ctx.translate(x,e.y+Math.sin(t*2.4)*5);if(e.vx<0)ctx.scale(-1,1);
 if(k==='ray')ctx.rotate(Math.sin(t*6)*.055);
 else if(k==='beetle')ctx.rotate(Math.sin(t*10)*.025);
 ctx.shadowColor='#241c56aa';ctx.shadowBlur=7;ctx.shadowOffsetY=5;
 _v5Draw('enemy_'+k+f,-w/2,-h/2,w,h);ctx.restore();
};
const _v5Pivot={armL:[-67,49],armR:[67,49],wingL:[-112,-47],wingR:[112,-47],tail:[0,74],core:[0,-18]};
const _v5PartName=p=>p.type==='core'?'core':p.type==='tail'?'tail':p.type==='wing'?(p.i===2?'wingL':'wingR'):(p.i===0?'armL':'armR');
function _v5BossPart(p,t,x,y){
 if(p.dead)return;
 const key=_v5PartName(p),a= getPartPos(p),r=p.hp/Math.max(p.maxHp,1);
 const frame=p.flash>0||r<.34?2:Math.floor(t*(p.type==='arm'?5:p.type==='wing'?3.3:2.8)+p.i)%2;
 const name=key==='core'?(p.flash>0?'boss_eye_hurt':'boss_eye'+Math.floor(t*2.3)%3):
   'boss_'+(key.startsWith('arm')?'claw_'+key.slice(-1).toUpperCase():key.startsWith('wing')?'wing_'+key.slice(-1).toUpperCase():'tail')+frame;
 const dims=p.type==='core'?[117,112]:p.type==='wing'?[168,124]:p.type==='arm'?[153,119]:[116,91];
 ctx.save();ctx.translate(x+a.x,y+a.y);
 let twist=key==='core'?0:key.startsWith('wing')?(key.endsWith('L')?-1:1)*Math.sin(t*2.3+p.i)*.15:key.startsWith('arm')?(key.endsWith('L')?-1:1)*(.08+Math.sin(t*3.4+p.i)*.20):Math.sin(t*2.5)*.17;
 if(boss.z.state==='TELEGRAPH')twist*=1.3;
 ctx.rotate(twist);
 ctx.shadowColor=r<.5?'#ff719f':'#512e81a9';ctx.shadowBlur=r<.5?24:8;
 if(p.flash>0)ctx.filter='brightness(2.3) saturate(1.2)';
 else if(r<.34)ctx.filter='sepia(.48) saturate(1.9) hue-rotate(314deg)';
 else if(r<.7)ctx.filter='sepia(.16) saturate(1.38)';
 if(!_v5Draw(name,-dims[0]/2,-dims[1]/2,...dims)){
  ctx.fillStyle='#e6b36d';ctx.beginPath();ctx.arc(0,0,29,0,Math.PI*2);ctx.fill();
 }
 ctx.filter='none';
 if(r<.8){ctx.shadowBlur=0;ctx.strokeStyle=r<.35?'#ff4366':'#ffdf9c';ctx.lineWidth=r<.35?5:3;ctx.beginPath();ctx.moveTo(-16,-25);ctx.lineTo(3,-11);ctx.lineTo(-7,7);ctx.lineTo(13,28);ctx.stroke();}
 ctx.restore();
}
drawBoss=function(){
 if(!_v5Enabled()||!boss?.alive||boss.z?.n!==3||!_v5Loaded('boss_body'))return _v5OriginalBoss();
 const x=screenX(boss.x),y=boss.y,z=boss.z,t=z.elapsed||0;
 if(x<-400||x>W+400)return;
 ctx.save();
 // Depth shadow visually anchors the creature above the desert.
 ctx.fillStyle='#331a4a3d';ctx.beginPath();ctx.ellipse(x,ground-9,141,17,0,0,Math.PI*2);ctx.fill();
 const glow=ctx.createRadialGradient(x,y-10,25,x,y,228);glow.addColorStop(0,'#ff74d02c');glow.addColorStop(1,'#ff74d000');
 ctx.fillStyle=glow;ctx.beginPath();ctx.ellipse(x,y,230,196,0,0,Math.PI*2);ctx.fill();
 const ex=z.parts.some(p=>p.type!=='core'&&!p.dead);
 // Torso is a single underlay. Every damageable shell is independently transformed.
 _v5Draw('boss_body',x-158,y-154,316,289);
 for(const part of ['wing','tail','arm','core'])for(const p of z.parts)if(p.type===part)_v5BossPart(p,t,x,y);
 if(!ex){ctx.strokeStyle='#ffed97';ctx.lineWidth=5;ctx.shadowColor='#ff7fdb';ctx.shadowBlur=26;ctx.beginPath();ctx.arc(x,y-18,58+Math.sin(t*8)*7,0,Math.PI*2);ctx.stroke();}
 ctx.restore();
};
window.ZAMAZONE_STAGE2_DELIVERY_QA=()=>({
 version:'stage2-art-direction-v5',
 stage,mode,loaded:_v5Names.filter(_v5Loaded).length,total:_v5Names.length,
 backgrounds:['bg_sky','bg_far','bg_mid','bg_near'].every(_v5Loaded),
 bosses:boss?.z?.n===3?boss.z.parts.map(p=>({type:p.type,hp:p.hp,dead:p.dead})):[],
 baseCount:bases?.filter(b=>b.alive).length,
 images:{base:_v5Loaded('base_ground0'),boss:_v5Loaded('boss_body'),enemy:_v5Loaded('enemy_beetle0')}
});

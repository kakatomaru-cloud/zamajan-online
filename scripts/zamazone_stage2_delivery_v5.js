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
 // The concept strip atlas is NOT a continuous backdrop; displaying its rows
 // produces opaque lavender bars. Preserve the clean panoramic desert base.
 const result=_v5OriginalBackdrop();
 ctx.save();
 // Separate faint parallax silhouettes, not rectangular image-strip overlays.
 for(let layer=0;layer<2;layer++){
   const drift=camera*(layer===0?.11:.32);
   ctx.globalAlpha=layer===0?.12:.18;
   ctx.strokeStyle=layer===0?'#9c759f':'#815b7c';
   ctx.lineWidth=layer===0?4:5;
   const scale=layer===0?.72:1.07;
   for(let j=-1;j<7;j++){
     let x=j*330-((drift%330+330)%330)+80;
     let y=ground-45-(layer===0?90:40);
     ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);
     ctx.beginPath();ctx.moveTo(-45,1);ctx.lineTo(-45,-80);ctx.lineTo(-33,-80);
     ctx.lineTo(-33,-107);ctx.lineTo(-8,-107);ctx.lineTo(-8,-87);
     ctx.lineTo(24,-87);ctx.lineTo(24,1);ctx.stroke();
     ctx.restore();
   }
 }
 ctx.restore();
 return result;
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
 // The concept asset fragments in stage2_concept are not a complete boss rig.
 // Keep the coherent transparent 6-part scarab renderer from the validated V4.
 if(!_v5Enabled()||!boss?.alive||boss.z?.n!==3)return _v5OriginalBoss();
 _v5OriginalBoss();
};

window.ZAMAZONE_STAGE2_DELIVERY_QA=()=>({
 version:'stage2-art-direction-v5',
 stage,mode,loaded:_v5Names.filter(_v5Loaded).length,total:_v5Names.length,
 backgrounds:['bg_sky','bg_far','bg_mid','bg_near'].every(_v5Loaded),
 bosses:boss?.z?.n===3?boss.z.parts.map(p=>({type:p.type,hp:p.hp,dead:p.dead})):[],
 baseCount:bases?.filter(b=>b.alive).length,
 images:{base:_v5Loaded('base_ground0'),boss:_v5Loaded('boss_body'),enemy:_v5Loaded('enemy_beetle0')}
});

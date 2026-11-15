// STAGE2_CONCEPT_SPRITE_INTEGRATION_20261115
// Render Stage2 with separate transparent art objects; retain the existing
// collision/attack controller and stage progression.
(()=>{
const root='assets/stage2_concept/';
const names=['bg_sky','bg_far','bg_mid','bg_near','boss_body',
 'boss_eye0','boss_eye1','boss_eye2','boss_eye_hurt',
 ...['wing_L','wing_R','claw_L','claw_R','tail'].flatMap(k=>[0,1,2].map(i=>'boss_'+k+i)),
 ...['beetle','ray','balloon'].flatMap(k=>[0,1,2].map(i=>'enemy_'+k+i)),
 ...['ground0','ground1','ground_hurt','air0','air1','air_hurt'].map(k=>'base_'+k)];
const sp={};for(const n of names){const i=new Image();i.src=root+n+'.webp';sp[n]=i;}
const ready=n=>sp[n]&&sp[n].complete&&sp[n].naturalWidth>0;
const draw=(n,x,y,w,h)=>{if(!ready(n))return false;ctx.drawImage(sp[n],x,y,w,h);return true};
const isStage2=()=>!riichiMode&&stage===2;
const oldBg=drawAreaBackground;
drawAreaBackground=function(){if(!isStage2()||!ready('bg_sky'))return oldBg();
 const layers=[['bg_sky',.018,85,340],['bg_far',.08,200,288],['bg_mid',.19,325,272],['bg_near',.42,454,220]];
 ctx.fillStyle='#6059a0';ctx.fillRect(0,0,W,H);
 for(const [key,rate,y,h] of layers){const tw=1280;const delta=((camera*rate)%tw+tw)%tw;for(let k=-1;k<3;k++)draw(key,k*tw-delta,y,tw,h);}
 const grad=ctx.createLinearGradient(0,ground,0,H);grad.addColorStop(0,'#c79772');grad.addColorStop(1,'#704d61');ctx.fillStyle=grad;ctx.fillRect(0,ground,W,H-ground);ctx.fillStyle='#ffd8a0';ctx.fillRect(0,ground-4,W,4);
};
const oldBase=drawBase;
drawBase=function(b){if(!isStage2()||!ready('base_ground0'))return oldBase(b);if(!b.alive)return;const x=screenX(b.x);if(x<-160||x>W+160)return;
 const flying=Boolean(b.flying||b.air);const f=Math.floor((b.phase||0)*4)%2;const kind=flying?'air':'ground';
 const y=b.y+(flying?Math.sin((b.phase||0)*3.2)*8:0);
 draw('base_'+kind+f,x-111,y-88,222,176);
 if(b.flash>0)draw('base_'+kind+'_hurt',x-111,y-88,222,176);
};
const oldEnemy=drawEnemy;
drawEnemy=function(e){if(!isStage2()||!ready('enemy_beetle0'))return oldEnemy(e);const x=screenX(e.x);if(x<-120||x>W+120)return;
 const kind=(e.type==='bird'||e.type==='wasp')?'ray':(e.type==='bouncer'||e.type==='laserjelly')?'balloon':'beetle';
 const frame=Math.floor((e.phase||0)*7)%3,w=kind==='ray'?116:105,h=kind==='balloon'?106:80;
 ctx.save();ctx.translate(x,e.y);if(e.vx<0)ctx.scale(-1,1);draw('enemy_'+kind+frame,-w/2,-h/2,w,h);ctx.restore();
};
const oldBoss=drawBoss;
drawBoss=function(){if(!isStage2()||!boss?.alive||boss.z?.n!==3||!ready('boss_body'))return oldBoss();
 const x=screenX(boss.x),y=boss.y,t=boss.z.elapsed||0;
 if(x<-400||x>W+400)return;
 ctx.save();ctx.shadowColor='#e8c1ff';ctx.shadowBlur=15;
 draw('boss_body',x-110,y-127,220,237);
 const groups=['wing','tail','arm','core'];
 for(const type of groups)for(const p of boss.z.parts){
  if(p.dead||p.type!==type)continue;
  const q=getPartPos(p),a=x+q.x,b=y+q.y;
  const damaged=p.hp<p.maxHp*.5;
  const frame=damaged?2:Math.floor(t*(type==='wing'?2:type==='arm'?4:3)+p.i)%2;
  const lr=type==='wing'?(p.i===2?'L':'R'):type==='arm'?(p.i===0?'L':'R'):'';
  const key=type==='core'?(damaged?'boss_eye_hurt':'boss_eye'+Math.floor(t*2.3)%3):'boss_'+(type==='arm'?'claw':type)+(lr?'_'+lr:'')+frame;
  const w=type==='core'?100:type==='wing'?146:type==='arm'?128:105;
  const h=type==='core'?94:type==='wing'?123:type==='arm'?120:111;
  ctx.save();ctx.translate(a,b);
  if(type==='wing'||type==='arm')ctx.rotate((lr==='L'?-1:1)*Math.sin(t*(type==='wing'?2.1:3.2))*.20);
  if(damaged){ctx.filter='saturate(1.9) hue-rotate(-18deg)';ctx.shadowColor='#ff6e89';ctx.shadowBlur=20;}
  draw(key,-w/2,-h/2,w,h);
  ctx.restore();
 }
 ctx.restore();
};
window.ZAMAZONE_STAGE2_SPRITES_QA=()=>({stage,loaded:Object.keys(sp).filter(ready).length,total:names.length,parts:boss?.z?.n===3?boss.z.parts.map(p=>({type:p.type,hp:p.hp,dead:p.dead})):[]});
})();

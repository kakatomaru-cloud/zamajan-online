/* ZAMAZONE articulated boss rigs — each limb is a separate transparent PNG.
   Frames are not one-image translations: independent pivoted wing, tentacle,
   halo, tail and core layers are drawn every frame. */
(function(global){'use strict';
const names=['halo','wingL','wingR','armL','armR','tail','core'];
const art={};for(let n=3;n<=8;n++){art[n]={};for(const p of names){const im=new Image();im.src=`assets/boss_rig/mana${n}_${p}.png`;art[n][p]=im;}}
const configs={
  3:{size:350,move:1.0,wings:.19,arms:.22,halo:.12,blink:'#ffd887',radius:137},
  4:{size:332,move:1.7,wings:.12,arms:.43,halo:.10,blink:'#83f9fa',radius:132},
  5:{size:388,move:.78,wings:.29,arms:.12,halo:.38,blink:'#b5f6ff',radius:145},
  6:{size:370,move:1.24,wings:.20,arms:.28,halo:.18,blink:'#ff5ee3',radius:137},
  7:{size:360,move:1.1,wings:.31,arms:.31,halo:.24,blink:'#5dffbb',radius:137},
  8:{size:445,move:1.37,wings:.35,arms:.51,halo:.37,blink:'#ff48cb',radius:155},
};
const pivots={halo:[0,-112],wingL:[-94,-29],wingR:[94,-29],armL:[-85,65],armR:[85,65],tail:[0,95],core:[0,0]};
const drawOrder=['halo','armL','armR','tail','wingL','wingR','core'];
function motion(n,part,t,action,attack,progress){
 const C=configs[n],speed=C.move,ang=t*speed,hit=action==='hit',dying=action==='death';
 const at=/claw|whip|arm|ram|rush|crush|magnetic|omni|train|smash|matrix/.test(attack);
 const beam=/beam|laser|lance|searchlight|pulse|annihilation/.test(attack);
 let a=0,s=1,dx=0,dy=0;
 if(part==='halo'){a=Math.sin(ang*.8)*C.halo+(n===5?t*.27:n===7?t*.2:0);dy=Math.sin(ang*1.2)*3;}
 if(part==='wingL'||part==='wingR'){const d=part==='wingL'?-1:1;a=d*(Math.sin(ang*2.3)*C.wings+(action==='attack'?.18:0));dy=3*Math.cos(ang*2.3+d);s=1+Math.sin(ang*2.5+d)*.035;}
 if(part==='armL'||part==='armR'){const d=part==='armL'?-1:1;a=d*(Math.sin(ang*2.7+d)*C.arms+(at?Math.sin(t*9)*.38:.0));dx=d*(Math.sin(ang*2.1)*6+(at?Math.sin(t*8)*14:0));dy=Math.cos(ang*2.8+d)*7+(beam?10:0);}
 if(part==='tail'){a=Math.sin(ang*2.7)*(.11+(n===4?.21:0));dy=Math.sin(ang*3.1)*9;}
 if(part==='core'){s=1+Math.sin(ang*2)*.02+(action==='attack'&&beam?.05:0);dy=Math.sin(ang*1.6)*3;}
 if(action==='intro'){const k=Math.min(1,progress);a*=k;s*=.75+.25*k;dy+=(1-k)*(n===4?75:-45);}
 if(hit){dx+=Math.sin(t*44)*9;dy+=Math.cos(t*38)*4;a+=Math.sin(t*30)*.13;}
 if(dying){const f=Math.min(1,progress);const i=names.indexOf(part);const step=(i*2.399963+ n*.4);dx+=Math.cos(step)*(28+f*190)*f;dy+=Math.sin(step)*(35+f*160)*f+f*f*95;a+=(i%2?-1:1)*f*4.7;s*=1-f*.22;}
 return {a,s,dx,dy};
}
function render(ctx,x,y,n,t,opts={}){
 if(!configs[n])return false;
 const C=configs[n],action=opts.action||'idle',attack=opts.attack||'',progress=opts.progress||0;
 const sz=opts.size||C.size,scale=sz/344,alpha=action==='death'?Math.max(0,1-Math.max(0,progress-.8)*4):1;
 let drawn=false;
 ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);ctx.globalAlpha*=alpha;
 for(const part of drawOrder){const im=art[n][part];if(!im||!im.complete||!im.naturalWidth)continue;
   drawn=true;const [px,py]=pivots[part],m=motion(n,part,t,action,attack,progress);
   ctx.save();ctx.translate(px+m.dx,py+m.dy);ctx.rotate(m.a);ctx.scale(m.s,m.s);
   if(action==='hit'&&Math.floor(t*19)%2){ctx.filter='sepia(1) saturate(9) hue-rotate(315deg) brightness(1.8)';}
   if(action==='death'&&progress>.25){ctx.filter=`brightness(${1+progress*1.2}) saturate(${1-progress*.6})`;}
   ctx.imageSmoothingEnabled=false;ctx.drawImage(im,-172-px,-172-py,344,344);ctx.restore();
 }
 // Animated iris glint and separate shield/charge mechanics are procedural parts.
 const a=Math.sin(t*2.9);if(action!=='death'){
  ctx.save();ctx.globalCompositeOperation='screen';ctx.globalAlpha=.45+.22*a;
  ctx.fillStyle=C.blink;ctx.beginPath();ctx.arc(4+Math.sin(t*1.5)*10,0+Math.cos(t*2)*6,4+(action==='attack'?3:0),0,Math.PI*2);ctx.fill();ctx.restore();
  if(action==='attack'&&/ring|prism|horizon|grid|shield|vortex|pulse/.test(attack)){
    ctx.save();ctx.strokeStyle=C.blink;ctx.globalAlpha=.35+.25*Math.abs(Math.sin(t*7));ctx.lineWidth=2;
    ctx.beginPath();ctx.ellipse(0,0,C.radius+Math.sin(t*8)*14,C.radius*.6+Math.cos(t*6)*9,t*.24,0,Math.PI*2);ctx.stroke();ctx.restore();
  }
 }
 ctx.restore();return drawn;
}
global.ZamaBossRig={render,motion,configs,ready:(n)=>names.every(p=>art[n]?.[p]?.complete&&art[n][p].naturalWidth>0)};
})(window);

// STAGE2_SCARAB_SILHOUETTE_V6_20261115
// Independent mechanical linkage under original transparent art.
// Exact pivots are taken from getPartPos, the same function the hit detector uses.
const v6OldDrawBoss=drawBoss;
const v6On=()=>!riichiMode&&stage===2&&boss?.alive&&boss.z?.n===3;
function v6Shell(p){
 const ratio=p.hp/Math.max(1,p.maxHp),broken=ratio<.4;
 const metal=ctx.createLinearGradient(-85,-90,85,90);
 metal.addColorStop(0,broken?'#ffb79b':'#fff3b3');
 metal.addColorStop(.24,broken?'#bf6675':'#deaa61');
 metal.addColorStop(.58,broken?'#713552':'#a16e6b');
 metal.addColorStop(1,broken?'#341e4c':'#3c2c61');
 return metal;
}
function v6Ellipse(x,y,rx,ry,fill,stroke='#51365e',width=5){
 ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fillStyle=fill;ctx.fill();
 if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke();}
}
function v6Path(pts,fill,stroke='#463055',width=6){
 ctx.beginPath();pts.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fillStyle=fill;ctx.fill();
 if(stroke){ctx.lineWidth=width;ctx.strokeStyle=stroke;ctx.stroke();}
}
function v6Glow(x,y,r,col='#ff7de8'){
 const g=ctx.createRadialGradient(x,y,3,x,y,r);g.addColorStop(0,'#fff8d5e8');g.addColorStop(.25,col);g.addColorStop(1,'#ff78ee00');
 ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
}
drawBoss=function(){
 if(!v6On())return v6OldDrawBoss();
 const z=boss.z,x=screenX(boss.x),y=boss.y,t=z.elapsed||0;
 if(x<-450||x>W+450)return;
 ctx.save();ctx.translate(x,y);ctx.globalAlpha=.98;
 // The chest and abdomen remain visually connected until every outer component falls.
 const chest=v6Shell({hp:1,maxHp:1});
 v6Ellipse(0,9,117,114,chest,'#51375b',12);
 v6Ellipse(0,1,94,86,'#49305b','#f2c987',7);
 for(let k=0;k<7;k++){
  const a=-Math.PI+.20+k*.44;
  const c=Math.cos(a),d=Math.sin(a);
  v6Path([[c*97,d*85+8],[c*109,d*98+8],[c*123,d*90+8],[c*108,d*71+8]],k%2?'#d3a76b':'#865c79','#413254',3);
 }
 // Segmented scorpion tail, articulated with actual tail root location.
 const tail=z.parts.find(p=>p.type==='tail');
 if(tail&&!tail.dead){
  const q=getPartPos(tail),move=Math.sin(t*2.2)*6;
  for(let i=0;i<4;i++){
   const yy=68+i*21,xx=Math.sin(t*2+i*.33)*5;
   v6Ellipse(xx,yy,39-i*6,17-i*.6,v6Shell(tail),'#493056',5);
   ctx.strokeStyle='#f6dc96';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(xx-16,yy-6);ctx.lineTo(xx+16,yy-6);ctx.stroke();
  }
  v6Path([[-23,147],[23,147],[13,178+move],[0,189+move],[-14,178+move]],v6Shell(tail),'#54315a',7);
  v6Glow(0,164+move,17,'#f46bda');
 }
 // Articulated arms. Each arm is independently damageable, visible and collidable.
 for(const p of z.parts.filter(p=>p.type==='arm'&&!p.dead)){
  const q=getPartPos(p),dir=p.i===0?-1:1;
  const a=[dir*48,34],b=[q.x,q.y];
  const joint=v6Shell(p);
  ctx.strokeStyle='#452d55';ctx.lineWidth=41;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.stroke();
  ctx.strokeStyle='#eac27d';ctx.lineWidth=28;ctx.stroke();
  ctx.strokeStyle='#805079';ctx.lineWidth=11;ctx.stroke();
  v6Ellipse(q.x,q.y,42,39,joint,'#f4d48c',7);
  // Hooked weapon tines are physically attached to the weapon joint.
  const rr=Math.sin(t*3.2+p.i)*9;
  v6Path([[q.x+dir*18,q.y-25],[q.x+dir*55,q.y-40-rr],[q.x+dir*79,q.y-12],[q.x+dir*55,q.y+6],[q.x+dir*29,q.y-4]],joint,'#67405e',5);
  v6Path([[q.x+dir*18,q.y+15],[q.x+dir*59,q.y+28+rr],[q.x+dir*74,q.y+63],[q.x+dir*38,q.y+48]],joint,'#67405e',5);
  if(p.hp<p.maxHp){ctx.strokeStyle=p.hp/p.maxHp<.4?'#ff527e':'#ffdc9f';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(q.x-22,q.y-20);ctx.lineTo(q.x+6,q.y+4);ctx.lineTo(q.x-8,q.y+25);ctx.stroke();}
  v6Glow(q.x,q.y,23,p.hp/p.maxHp<.4?'#ff536a':'#d25cfa');
 }
 // Wing plates open and close independently. Metallic folds add the huge beetle silhouette.
 for(const p of z.parts.filter(p=>p.type==='wing'&&!p.dead)){
  const q=getPartPos(p),dir=p.i===2?-1:1;
  const fold=(Math.sin(t*2+p.i)*.5+.5)*13;
  const metal=v6Shell(p);
  v6Path([[dir*39,-93],[dir*65,-141],[dir*151,-152-fold],[dir*180,-95-fold],[dir*143,-36],[dir*66,-39]],metal,'#f4cc82',9);
  v6Path([[dir*74,-105],[dir*113,-137-fold],[dir*157,-98-fold],[dir*128,-63]],'#734075','#ffd99b',4);
  for(let j=0;j<4;j++){
   const xx=dir*(89+j*20);
   ctx.strokeStyle=j%2?'#e8bc77':'#44295b';ctx.lineWidth=4;
   ctx.beginPath();ctx.moveTo(dir*69,-100);ctx.lineTo(xx,-52+fold*.23);ctx.stroke();
  }
  v6Glow(q.x,q.y,15,'#ffc47e');
 }
 if(z.parts.some(p=>p.flash>0))v6Glow(0,2,96,'#ff6e7f');
 ctx.restore();
 v6OldDrawBoss();
};
window.ZAMAZONE_STAGE2_V6_QA=()=>({
 stage,mode,parts:boss?.z?.n===3?boss.z.parts.map(p=>({id:p.i,type:p.type,hp:p.hp,dead:p.dead})):[],
 silhouette:true
});

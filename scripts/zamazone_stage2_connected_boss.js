// STAGE2_CONNECTED_BOSS_12POSE_TEST_20261115
// One complete-frame sprite per animation step: no disconnected tile-built body.
const _poseBossPrevious=drawBoss;
const _poseFrameImages=Array.from({length:12},(_,i)=>{
  const image=new Image();image.src='assets/mana3_frame'+String(i).padStart(2,'0')+'.png';return image;
});
const _poseLoaded=i=>_poseFrameImages[i]?.complete&&_poseFrameImages[i].naturalWidth>0;
const _poseTarget=()=>!riichiMode&&stage===2&&boss?.alive&&boss.z?.n===3;
function _poseModeFrame(){
 const z=boss.z,seq=z.attack?.[0]||'';
 const time=z.elapsed||0;
 const breaks=z.parts.filter(p=>p.dead).length;
 if(boss.dying||z.state==='DYING'||z.state==='DEFEATED')return 8+Math.floor(time*4)%4;
 if(z.recoil>.06||boss.hitFlash>.045)return 8+Math.floor(time*12)%3;
 if(z.state==='TELEGRAPH')return seq==='claw-laser'?4:seq==='sand-columns'?5:seq==='tail-bombs'?6:7;
 if(z.state==='ATTACK')return 4+Math.floor((z.t||0)*6)%4;
 if(z.state==='RECOVERY')return 2+Math.floor((z.t||0)*4)%2;
 return (Math.floor(time*3.8)+(breaks>3?1:0))%4;
}
drawBoss=function(){
 if(!_poseTarget())return _poseBossPrevious();
 const x=screenX(boss.x),y=boss.y;
 if(x<-300||x>W+300)return;
 const z=boss.z,t=z.elapsed||0,frame=_poseModeFrame(),image=_poseFrameImages[frame];
 const all=z.parts.length,broken=z.parts.filter(p=>p.dead).length,remaining=all-broken;
 ctx.save();
 const wobble=Math.sin(t*2.8)*5;
 const scale=z.state==='ATTACK'&&z.attack?.[0]==='shell-dash'?1.06:1;
 ctx.translate(x,y+wobble);ctx.scale(scale,scale);
 // A single coherent silhouette is maintained in every frame.
 ctx.shadowColor=broken>=3?'#ff66a7':'#7b59a9';ctx.shadowBlur=broken>=3?17:6;
 const width=342,height=342;
 if(_poseLoaded(frame))ctx.drawImage(image,-width/2,-height/2,width,height);
 else _poseBossPrevious();
 ctx.shadowBlur=0;
 // Damage stages are legible without an intrusive boss health bar.
 if(broken>0){
  ctx.globalCompositeOperation='source-atop';ctx.fillStyle='#c84d55';
  ctx.globalAlpha=Math.min(.34,broken*.055);ctx.fillRect(-width/2,-height/2,width,height);
  ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;
 }
 if(z.state==='TELEGRAPH'){
  ctx.strokeStyle='#ffe29c';ctx.lineWidth=5;ctx.globalAlpha=.5+.25*Math.sin(t*12);
  ctx.beginPath();ctx.arc(0,0,169,0,2*Math.PI);ctx.stroke();
 }
 ctx.restore();
};
window.ZAMAZONE_STAGE2_CONNECTED_BOSS_QA=()=>({
 version:'full-frame-12pose-preview',stage,mode,
 loadedFrames:_poseFrameImages.filter(x=>x.complete&&x.naturalWidth>0).length,
 displayedFrame:_poseTarget()?_poseModeFrame():null,
 parts:boss?.z?.n===3?boss.z.parts.map(p=>({type:p.type,hp:p.hp,dead:p.dead})):[],
 hasFullSilhouette:true
});

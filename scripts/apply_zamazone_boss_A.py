from pathlib import Path
import re, html, math
p=Path("zamajan-online/public/minigames/zamazone/index.html")
s=p.read_text(encoding="utf-8")
tag="ZAMA_BOSS_A_PARTS_V3_20261115"
if tag in s:
    print("A boss patch already applied")
    raise SystemExit(0)
# Remove the original, staging compact, and rig-layer boss HUDs. Never remove the player HP.
patterns=[
 r"if\(boss&&boss\.alive&&mode!=='bossIntro'\)\{ctx\.fillStyle='#190d44dd';ctx\.fillRect\(320,95,640,48\);.*?ctx\.fillRect\(370,121,540\*Math\.max\(0,boss\.hp\)/boss\.maxHp,11\)\}",
 r"if\(boss&&boss\.alive&&mode!=='bossIntro'\)\{ctx\.save\(\);ctx\.fillStyle='#110f35df';ctx\.fillRect\(911,88,352,26\);.*?ctx\.restore\(\);\}",
 r"if\(boss&&boss\.alive\)\{ctx\.fillStyle='#1a153b';ctx\.fillRect\(517,95,250,28\);.*?ctx\.fillText\(stage===6&&lastBossPhase\?'mana8':THEMES\[stage-1\]\.boss,642,116\);\}",
 r"ctx\.save\(\);ctx\.fillStyle='#111632e5';ctx\.fillRect\((?:340,144,600,38|912,117,352,39)\);.*?ctx\.restore\(\);"
]
for pat in patterns:
 s,c=re.subn(pat,"",s,flags=re.S)
 print("HUD removed",c)
# Make boss HP not the victory condition; body/core is a discrete part.
addon=r"""
// ZAMA_BOSS_A_PARTS_V3_20261115
const ZAMA_A_CORE_HP={3:5,4:5,5:5,6:6,7:6,8:8};
const zamaAOldSpawn=spawnBoss;
spawnBoss=function(){
 zamaAOldSpawn();
 if(!riichiMode&&boss&&boss.alive){
  boss.hp=9999;boss.maxHp=9999;
  if(boss.z){
   boss.z.parts.push({x:0,y:0,hp:ZAMA_A_CORE_HP[boss.z.n]||5,maxHp:ZAMA_A_CORE_HP[boss.z.n]||5,type:'core',i:99,flash:0,dead:false});
  }else if(stage===1&&boss.wings){
   boss.zamaCore={hp:6,maxHp:6,flash:0,dead:false};
  }
 }
};
function zamaABreak(p,x,y,color){
 p.dead=true;p.hp=0;shake=Math.max(shake,10);pop(wrapX(boss.x+(x-screenX(boss.x))),y,color,38,1.75);
 sound(105,.3,'sawtooth',.075);for(let i=0;i<10;i++)pop(wrapX(boss.x+(x-screenX(boss.x))),y,'#ffecc6',2,1);
}
function zamaAAllBroken(){
 if(!boss?.alive)return;
 if(boss.z&&boss.z.parts.every(q=>q.dead)){boss.hp=0;defeatBoss();}
 else if(stage===1&&boss.wings?.every(q=>q.broken)&&boss.zamaCore?.dead){boss.hp=0;defeatBoss();}
}
const zamaAOriginalShot=applyRigShot;
applyRigShot=function(b){
 if(!rigReady()||!boss.z?.parts?.some(p=>p.type==='core'))return zamaAOriginalShot(b);
 const z=boss.z, sx=screenX(b.x), sy=b.y;
 if(b.kind==='laser'&&b.hitTargets?.has(boss))return false;
 for(const p of z.parts){
  if(p.dead)continue;
  if(p.type==='core'&&z.parts.some(q=>q.type!=='core'&&!q.dead))continue;
  const q=rigPartWorld(p),r=p.type==='core'?65:(z.n===7?43:z.n===8?52:49);
  if(Math.hypot(q.x-sx,q.y-sy)>r+(b.radius||0))continue;
  if(p.flash>0){if(b.kind!=='laser')b.life=0;return true;}
  p.hp-=Math.max(1,b.dmg||1);p.flash=.13;z.recoil=.24;boss.hitFlash=.19;
  if(b.kind==='laser')(b.hitTargets??=new Set()).add(boss);else b.life=0;
  pop(b.x,b.y,'#fff2a5',10,.65);sound(490,.06,'square',.035);
  if(p.hp<=0){zamaABreak(p,q.x,q.y,REBOSS[z.n].color);z.expose=1.25;zamaAAllBroken();}
  return true;
 }
 return false;
};
const zamaAOriginalBomb=applyRigBomb;
applyRigBomb=function(b,rad){
 if(!rigReady()||!boss.z?.parts?.some(p=>p.type==='core'))return zamaAOriginalBomb(b,rad);
 const z=boss.z;let hit=false;
 for(const p of z.parts){
  if(p.dead)continue;
  if(p.type==='core'&&z.parts.some(q=>q.type!=='core'&&!q.dead))continue;
  const q=rigPartWorld(p);
  if(Math.hypot(screenX(b.x)-q.x,b.y-q.y)>rad+(p.type==='core'?50:25))continue;
  if(p.flash>0)continue;
  p.hp-=b.big?2:1;p.flash=.19;z.recoil=.31;hit=true;
  if(p.hp<=0)zamaABreak(p,q.x,q.y,REBOSS[z.n].color);
 }
 if(hit)zamaAAllBroken();return hit;
};
const zamaAOriginalMana2Shot=v2Mana2Shot;
v2Mana2Shot=function(s){
 if(!boss?.wings||riichiMode)return zamaAOriginalMana2Shot(s);
 const dx=nearDelta(s.x,boss.x),dy=s.y-boss.y;
 const idx=dx<0?0:1,w=boss.wings[idx];
 if(!w.broken&&Math.abs(dx)>40&&Math.abs(dx)<164&&Math.abs(dy)<93){
  w.hp-=s.dmg||1;w.flash=.16;s.life=0;boss.hitFlash=.10;
  pop(s.x,s.y,'#fff6b6',8,.6);
  if(w.hp<=0){w.broken=true;zamaABreak(w,screenX(boss.x)+dx,s.y,'#ff75c7');}return;
 }
 const core=boss.zamaCore;
 if(core&&boss.wings.every(q=>q.broken)&&!core.dead&&Math.abs(dx)<76&&Math.abs(dy)<75){
  if(core.flash>0){s.life=0;return;}
  core.hp-=s.dmg||1;core.flash=.13;s.life=0;boss.hitFlash=.17;pop(s.x,s.y,'#ffecc9',12,.8);
  if(core.hp<=0){zamaABreak(core,screenX(boss.x),boss.y,'#fff8a6');zamaAAllBroken();}
 }else if(Math.abs(dx)<100&&Math.abs(dy)<87&&s.kind!=='laser')s.life=0;
};
const zamaAOriginalExplode=explode;
explode=function(b){
 const preBoss=boss;
 zamaAOriginalExplode(b);
 if(!riichiMode&&stage===1&&preBoss&&boss===preBoss&&boss.alive&&boss.wings?.every(w=>w.broken)&&boss.zamaCore&&!boss.zamaCore.dead){
  if(Math.hypot(nearDelta(b.x,boss.x),b.y-boss.y)<(b.big?195:150)){
   const c=boss.zamaCore;if(c.flash<=0){c.hp-=b.big?2:1;c.flash=.19;boss.hitFlash=.2;
    if(c.hp<=0){zamaABreak(c,screenX(boss.x),boss.y,'#fff1a7');zamaAAllBroken();}}
  }
 }
};
for(const n of [3,4,5,6,7,8]){for(const a of REBOSS[n].tech){
 a[2]=Math.max(1.15,a[2]); // clearly visible anticipation
 a[3]=Math.min(2.0,a[3]); // shorten lengthy repeated attacks
 a[4]=Math.max(1.15,a[4]); // attack windows for safely destroying parts
}}
const zamaAOriginalUpdate=update;
update=function(dt){
 zamaAOriginalUpdate(dt);
 if(!boss||!boss.alive||riichiMode)return;
 if(boss.zamaCore)boss.zamaCore.flash=Math.max(0,boss.zamaCore.flash-dt);
 if(boss.z?.parts?.some(p=>p.type==='core'))zamaAAllBroken();
};
const zamaAOriginalDrawBoss=drawBoss;
drawBoss=function(){
 zamaAOriginalDrawBoss();
 if(!boss?.alive||riichiMode)return;
 const n=boss.z?.n||2,x=screenX(boss.x),y=boss.y,now=performance.now()/1000;
 // No boss name or HP label. Pulsating visible damage replaces HUD.
 ctx.save();
 if(boss.z){
  const z=boss.z,core=z.parts.find(p=>p.type==='core');
  for(const p of z.parts){
   if(p.type==='core'||p.dead)continue;
   const q=rigPartWorld(p);
   const r=(p.maxHp>0?p.hp/p.maxHp:0);
   ctx.strokeStyle=r<.5?'#f8a4ff':'#fdf0bd';ctx.lineWidth=r<.5?5:2;
   ctx.shadowColor='#ffce68';ctx.shadowBlur=r<.5?17:5;
   ctx.beginPath();ctx.arc(q.x,q.y,15+Math.sin(now*4+p.i)*3,0,Math.PI*2);ctx.stroke();
   if(r<1){ctx.strokeStyle='#ff7257';ctx.beginPath();ctx.moveTo(q.x-14,q.y-17);ctx.lineTo(q.x+6,q.y+7);ctx.lineTo(q.x-5,q.y+17);ctx.stroke();}
  }
  if(core&&!core.dead&&z.parts.every(p=>p.type==='core'||p.dead)){
   ctx.strokeStyle='#fff7b0';ctx.lineWidth=5;ctx.shadowColor='#ffe89c';ctx.shadowBlur=23;
   ctx.beginPath();ctx.ellipse(x,y,48+Math.sin(now*9)*7,43+Math.cos(now*9)*6,0,0,Math.PI*2);ctx.stroke();
   if(core.hp<core.maxHp){ctx.strokeStyle='#ff6e81';ctx.beginPath();ctx.moveTo(x-18,y-25);ctx.lineTo(x+8,y+12);ctx.lineTo(x-6,y+27);ctx.stroke();}
  }
 }else if(boss.wings){
  const c=boss.zamaCore;
  if(boss.wings.every(w=>w.broken)&&c&&!c.dead){
   ctx.strokeStyle='#fff2ad';ctx.lineWidth=5;ctx.shadowColor='#ffda86';ctx.shadowBlur=24;
   ctx.beginPath();ctx.ellipse(x,y,52+Math.sin(now*8)*6,46,0,0,Math.PI*2);ctx.stroke();
  }
 }
 ctx.restore();
};
window.ZAMAZONE_A_QA={
 get(){return {stage,mode,boss:boss?.alive||false,parts:boss?.z?.parts.map(p=>({type:p.type,hp:p.hp,dead:p.dead}))||boss?.wings?.map(p=>({hp:p.hp,dead:p.broken})),core:boss?.zamaCore?.hp};},
 destroyParts(){if(!boss?.alive)return false;
  if(boss.z){boss.z.parts.forEach(p=>{p.dead=true;p.hp=0;});}
  else if(boss.wings){boss.wings.forEach(p=>{p.broken=true;p.hp=0;});if(boss.zamaCore){boss.zamaCore.dead=true;boss.zamaCore.hp=0;}}
  zamaAAllBroken();return true;}
};
"""
needle='if(!riichiMode)showDebugTitle();\n})();</script><script id="zj-minigame-ready-v2">'
assert needle in s, "main game end not found"
s=s.replace(needle,addon+"\n"+needle,1)
# Shop v2 uses item images. Upgrade to richer SVG artwork.
s=s.replace("pic.src='assets/v2_shop_'+String(i).padStart(2,'0')+'.png'","pic.src='assets/v2_shop_'+String(i).padStart(2,'0')+'.svg'")
if ".svg'" not in s: raise RuntimeError("shop icon replacement missing")
p.write_text(s,encoding="utf-8")
# Create detailed original SVG illustrations. Each is a 3D styled mechanical product render.
asset=p.parent/"assets"
asset.mkdir(parents=True,exist_ok=True)
icons=[
 ('マルチショット', '<g transform="translate(0 -4)"><path d="M90 144L144 71L198 144L179 172H109Z" fill="url(#metal)" stroke="#26384c" stroke-width="9"/><path d="M133 152V58h23v94" fill="url(#cyan)" stroke="#17334c" stroke-width="5"/><path d="M103 122L83 86L107 77L132 121M181 121L208 75L232 91L194 137" fill="url(#gold)" stroke="#49331d" stroke-width="6"/></g>'),
 ('高速エンジン', '<path d="M66 112L108 61H201L231 109L196 175H108Z" fill="url(#metal)" stroke="#1c3141" stroke-width="9"/><circle cx="153" cy="114" r="49" fill="url(#cyan)" stroke="#233e54" stroke-width="10"/><circle cx="153" cy="114" r="23" fill="url(#gold)"/><path d="M61 97L24 115L58 139" fill="#ff9960"/><path d="M63 106L18 116L60 127" fill="#fff2a3"/>'),
 ('シールド', '<path d="M144 37L238 76L222 153Q193 197 144 222Q95 197 66 153L50 76Z" fill="url(#cyan)" stroke="#e4ebfc" stroke-width="10"/><path d="M144 61L208 88L193 147Q170 180 144 194Q117 179 95 147L80 88Z" fill="url(#metal)" opacity=".8"/><path d="M144 85V169M106 128H182" stroke="#fff5bd" stroke-width="13" stroke-linecap="round"/>'),
 ('3WAY', '<path d="M145 176V72M131 168L74 108M159 168L216 108" stroke="url(#cyan)" stroke-width="20" stroke-linecap="round"/><path d="M145 35L163 76H127Z M49 92L87 99L75 123Z M239 92L213 123L201 99Z" fill="url(#gold)" stroke="#553321" stroke-width="4"/><circle cx="145" cy="178" r="25" fill="url(#metal)"/>'),
 ('8WAY', ''.join('<path d="M145 134L145 53" stroke="url(#cyan)" stroke-width="13" transform="rotate(%d 145 134)"/>'%(i*45) for i in range(8))+'<circle cx="145" cy="134" r="36" fill="url(#gold)" stroke="#5b3831" stroke-width="7"/><circle cx="145" cy="134" r="13" fill="#fff9d6"/>'),
 ('レーザー', '<path d="M60 95L114 68H195L235 100L205 156H111L60 123Z" fill="url(#metal)" stroke="#273a50" stroke-width="8"/><rect x="123" y="98" width="101" height="28" rx="11" fill="url(#cyan)"/><path d="M222 112H276" stroke="#c4ffff" stroke-width="15" stroke-linecap="round"/><circle cx="108" cy="111" r="27" fill="url(#gold)"/>'),
 ('ワイド', '<path d="M34 150Q144 10 255 150" fill="none" stroke="#f2e0ff" stroke-width="24"/><path d="M45 153Q144 44 246 153" fill="none" stroke="#fa79b5" stroke-width="17"/><path d="M73 153Q144 73 215 153" fill="none" stroke="#fff2ad" stroke-width="9"/><circle cx="145" cy="164" r="30" fill="url(#metal)" stroke="#f5bde7" stroke-width="7"/>'),
 ('装甲', '<path d="M145 36L221 78L231 162L145 211L57 162L67 78Z" fill="url(#metal)" stroke="#dce4ff" stroke-width="10"/><path d="M145 60L193 91L198 145L145 178L92 145L97 91Z" fill="url(#gold)" opacity=".82"/><path d="M145 65V175M90 119H200" stroke="#334a56" stroke-width="10"/>'),
 ('ハート', '<path d="M145 206C91 168 38 139 38 95C38 36 109 27 145 76C181 27 252 36 252 95C252 139 199 168 145 206Z" fill="url(#heart)" stroke="#7c2342" stroke-width="12"/><path d="M77 90Q99 53 129 82" fill="none" stroke="#ffd0de" stroke-width="14" stroke-linecap="round"/><circle cx="201" cy="91" r="12" fill="#ffaed2"/>'),
 ('最大HP', '<path d="M145 206C91 168 38 139 38 95C38 36 109 27 145 76C181 27 252 36 252 95C252 139 199 168 145 206Z" fill="url(#heart)" stroke="#7c2342" stroke-width="12"/><path d="M145 85V163M106 124H184" stroke="#fff4d4" stroke-width="22" stroke-linecap="round"/>'),
 ('ボム', '<circle cx="145" cy="136" r="80" fill="url(#metal)" stroke="#afbaca" stroke-width="10"/><circle cx="114" cy="107" r="19" fill="#edf9ff" opacity=".65"/><path d="M144 55V27L178 22" stroke="#d6e1e5" stroke-width="15" stroke-linecap="round"/><path d="M184 23L200 15M184 23L205 34" stroke="#ffbb58" stroke-width="10"/><path d="M121 143H170M145 118V168" stroke="#ff6e63" stroke-width="14"/>'),
 ('ブースター', '<path d="M91 49H201L216 110L191 178H100L76 112Z" fill="url(#metal)" stroke="#25394b" stroke-width="9"/><path d="M111 81H182L194 124H100Z" fill="url(#cyan)"/><path d="M118 173L107 227L146 196L189 227L173 173" fill="url(#gold)" stroke="#bd6b22" stroke-width="5"/>')
]
for i,(label,object_svg) in enumerate(icons):
 defs="""<defs><radialGradient id="bg"><stop stop-color="#466aa3"/><stop offset="1" stop-color="#0c1232"/></radialGradient><linearGradient id="metal" x1="0" y1="0" x2=".95" y2="1"><stop stop-color="#f6fbff"/><stop offset=".22" stop-color="#9db8ce"/><stop offset=".5" stop-color="#415a73"/><stop offset=".78" stop-color="#283d5e"/><stop offset="1" stop-color="#acb6cd"/></linearGradient><linearGradient id="gold" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fff9c7"/><stop offset=".4" stop-color="#ffcf55"/><stop offset="1" stop-color="#a85d27"/></linearGradient><linearGradient id="cyan" x1="0" y1="0" x2=".9" y2="1"><stop stop-color="#fff"/><stop offset=".27" stop-color="#93f2fa"/><stop offset=".65" stop-color="#1aaeca"/><stop offset="1" stop-color="#165388"/></linearGradient><radialGradient id="heart" cx=".34" cy=".2"><stop stop-color="#ffcfdd"/><stop offset=".38" stop-color="#ff6a89"/><stop offset=".85" stop-color="#ca294d"/><stop offset="1" stop-color="#73132e"/></radialGradient></defs>"""
 svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 290 250">'+defs+'<rect width="290" height="250" rx="21" fill="url(#bg)"/><path d="M14 220H276" stroke="#7898b9" stroke-width="3" opacity=".7"/><ellipse cx="145" cy="217" rx="94" ry="19" fill="#02081a" opacity=".58"/>'+object_svg+'<rect x="4" y="4" width="282" height="242" rx="19" fill="none" stroke="#bed6f1" stroke-opacity=".45" stroke-width="6"/></svg>'
 (asset/("v2_shop_%02d.svg"%i)).write_text(svg,encoding="utf-8")
print("patched A-style boss parts + 12 original vector item icons",p.stat().st_size)

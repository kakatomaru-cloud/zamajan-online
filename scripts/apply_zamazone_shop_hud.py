from pathlib import Path
import re
p=Path("zamajan-online/public/minigames/zamazone/index.html")
s=p.read_text(encoding="utf-8")
if "SHOP12FIX-20261115" in s:
 print("already installed")
 raise SystemExit(0)
pattern=r"if\(boss&&boss\.alive&&mode!=='bossIntro'\)\{ctx\.fillStyle='#190d44dd';ctx\.fillRect\(320,95,640,48\);.*?ctx\.fillRect\(370,121,540\*Math\.max\(0,boss\.hp\)/boss\.maxHp,11\)\}"
replacement="""if(boss&&boss.alive&&mode!=='bossIntro'){ctx.save();ctx.fillStyle='#110f35df';ctx.fillRect(911,88,352,26);ctx.fillStyle='#fff0ba';ctx.font='bold 12px system-ui';ctx.textAlign='left';ctx.fillText('BOSS HP',920,105);ctx.fillStyle='#573153';ctx.fillRect(996,96,250,10);ctx.fillStyle='#ff5692';ctx.fillRect(996,96,250*Math.max(0,boss.hp)/Math.max(1,boss.maxHp),10);ctx.restore();}"""
s,n=re.subn(pattern,replacement,s,flags=re.S)
assert n==1,"Boss HP target not found"
start=s.index("ctx.save();ctx.fillStyle='#111632e5';ctx.fillRect(340,144,600,38);")
end=s.index("ctx.restore();};",start)+len("ctx.restore();")
replacement="""ctx.save();ctx.fillStyle='#111632e5';ctx.fillRect(912,117,352,39);ctx.textAlign='left';ctx.font='bold 12px system-ui';ctx.fillStyle=col;ctx.fillText(REBOSS[z.n].name+' / '+(exposed(z)?'WEAK POINT OPEN':'ARMOR LOCK'),921,132);if(z.attack&&z.state!=='IDLE'){ctx.fillStyle=z.state==='TELEGRAPH'?'#fff1a0':col;ctx.fillText((z.state==='TELEGRAPH'?'予兆：':'攻撃：')+z.attack[1],921,148);}ctx.restore();"""
s=s[:start]+replacement+s[end:]
addon="""
// SHOP12FIX-20261115
const allShopStyle=document.createElement('style');
allShopStyle.textContent='#panel.shop.v2-shop{width:min(96vw,1140px)!important;max-height:94vh!important;overflow:hidden!important}#panel.shop.v2-shop .shop12{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px;max-height:61vh;overflow:auto;padding:8px}#panel.shop.v2-shop .shop12 article{background:#fff9e7;color:#214732;border:4px solid #cdaa61;border-radius:10px;padding:6px;min-width:0;text-align:center;display:flex;flex-direction:column;gap:4px}#panel.shop.v2-shop .shop12 img{width:100%;height:92px;object-fit:contain;background:#15214c;border-radius:5px}#panel.shop.v2-shop .shop12 strong{font-size:15px}#panel.shop.v2-shop .shop12 button{color:#285333;background:#ffefab;border:2px solid #9d7f45;border-radius:7px;font-weight:900;padding:5px}#panel.shop.v2-shop .shop12 button:disabled{opacity:.5}#panel.shop.v2-shop .shop12 .shop-selected{outline:4px solid #f535a4!important}#panel.shop.v2-shop .shop12-head{background:#fff1ab;color:#275038;display:flex;justify-content:space-between;padding:10px;border-radius:8px;font-weight:900}#panel.shop.v2-shop .shop12-foot{background:#27673e;color:#fff4be;padding:8px;font-size:13px;text-align:center;border-radius:7px}@media(max-width:750px){#panel.shop.v2-shop .shop12{grid-template-columns:repeat(3,minmax(0,1fr))}}@media(max-width:520px){#panel.shop.v2-shop .shop12{grid-template-columns:repeat(2,minmax(0,1fr));max-height:46vh}#panel.shop.v2-shop .shop12 img{height:65px}}';
document.head.appendChild(allShopStyle);
v2ShopRender=function(){
 titleEl.textContent='ZAMAZONE / ALL 12 ITEMS';
 const panel=document.getElementById('panel');panel.classList.add('shop','v2-shop');
 contentEl.replaceChildren();
 const head=document.createElement('div');head.className='shop12-head';head.textContent='ALL 12 ITEMS　　所持金 '+player.money+' G';contentEl.appendChild(head);
 const grid=document.createElement('div');grid.className='shop12';
 V2_ITEMS.forEach((it,i)=>{
  const a=document.createElement('article'),pic=document.createElement('img');pic.src='assets/v2_shop_'+String(i).padStart(2,'0')+'.png';pic.alt=it[0];a.appendChild(pic);
  const name=document.createElement('strong');name.textContent=it[0];a.appendChild(name);
  const desc=document.createElement('small');desc.textContent=it[2];a.appendChild(desc);
  const price=document.createElement('strong');price.textContent=v2Cost(i)+' G';a.appendChild(price);
  const btn=document.createElement('button');btn.type='button';btn.dataset.buy=String(i);btn.disabled=!v2Allowed(i);btn.textContent=v2Purchased[i]>=it[5]?'MAX':(i===8&&player.hp>=player.maxHp?'HP満タン':btn.disabled?'購入不可':'BUY');btn.onclick=()=>v2Buy(i);a.appendChild(btn);grid.appendChild(a);
 });
 contentEl.appendChild(grid);
 const footer=document.createElement('div');footer.className='shop12-foot';footer.textContent='上下左右：商品選択 / Enter・A：購入 / Esc・B：退店　ハートとボムは何度でも購入可能';contentEl.appendChild(footer);
 mainAction.textContent='EXIT / お店を出る';mainAction.onclick=curtainExit;panelWrap.classList.remove('hidden');
 shopSelection=Math.min(12,Math.max(0,shopSelection));v2ShopHighlight();
};refreshShop=v2ShopRender;
shopNav=function(step,axis){if(mode!=='shop')return;shopSelection=(shopSelection+step+13)%13;v2ShopHighlight();sound(560,.028,'square',.014);};
"""
needle='if(!riichiMode)showDebugTitle();\n})();</script><script id="zj-minigame-ready-v2">'
assert needle in s
s=s.replace(needle,addon+'\n'+needle,1)
p.write_text(s,encoding="utf-8")
print("success")

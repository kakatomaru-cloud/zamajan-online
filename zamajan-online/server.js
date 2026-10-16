'use strict';
const express=require('express'),http=require('http'),{Server}=require('socket.io'),crypto=require('crypto');
const app=express(),server=http.createServer(app),io=new Server(server,{maxHttpBufferSize:24e6});
app.use('/assets/tables',express.static('public/assets/tables',{maxAge:'30d',immutable:true}));app.use(express.static('public'));app.get('/',(req,res)=>res.redirect('/online.html'));
// GitHub 共通設定。トークンと管理者パスワードはサーバー環境変数のみで管理。
const GH_OWNER=process.env.GITHUB_OWNER||'kakatomaru-cloud';
const GH_REPO=process.env.GITHUB_REPO||'zamajan-online';
const GH_BRANCH=process.env.GITHUB_BRANCH||'main';
const GH_PATH=process.env.GITHUB_CONFIG_PATH||'zamajan-online/game-config.json';
const GH_TOKEN=process.env.GITHUB_TOKEN||'';
const ADMIN_PASSWORD=process.env.ZAMAJAN_ADMIN_PASSWORD||'';
let sharedConfig=null, sharedUpdatedAt=null;
const failures=new Map();
function secureEqual(a,b){const x=crypto.createHash('sha256').update(String(a)).digest();const y=crypto.createHash('sha256').update(String(b)).digest();return crypto.timingSafeEqual(x,y)}
function ghEndpoint(){return 'https://api.github.com/repos/'+encodeURIComponent(GH_OWNER)+'/'+encodeURIComponent(GH_REPO)+'/contents/'+GH_PATH.split('/').map(encodeURIComponent).join('/')}
async function ghRequest(method,payload){
 const response=await fetch(ghEndpoint()+'?ref='+encodeURIComponent(GH_BRANCH),{method,headers:{'Accept':'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28',...(GH_TOKEN?{'Authorization':'Bearer '+GH_TOKEN}:{}),...(payload?{'Content-Type':'application/json'}:{})},...(payload?{body:JSON.stringify(payload)}:{})});
 const raw=await response.text();let data;try{data=JSON.parse(raw)}catch{data={message:raw.slice(0,150)}};
 if(!response.ok){const err=new Error('GitHub API '+response.status+': '+(data.message||'通信エラー'));err.status=response.status;throw err}
 return data;
}
async function fetchGitHubConfig(){
 try{let result=await ghRequest('GET');
  // GitHub Contents API omits content for files over 1MB; fetch the blob by SHA.
  if(!result.content&&result.sha){
   const blobUrl='https://api.github.com/repos/'+encodeURIComponent(GH_OWNER)+'/'+encodeURIComponent(GH_REPO)+'/git/blobs/'+encodeURIComponent(result.sha);
   const response=await fetch(blobUrl,{headers:{'Accept':'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28',...(GH_TOKEN?{'Authorization':'Bearer '+GH_TOKEN}:{})}});
   if(!response.ok)throw Error('GitHub blob取得エラー '+response.status);result=await response.json();
  }
  if(!result.content)throw Error('JSON内容がありません');
  const raw=JSON.parse(Buffer.from(result.content.replace(/\s/g,''),'base64').toString('utf8'));
  const cfg=validateSharedConfig(raw);sharedConfig=cfg;sharedUpdatedAt=new Date().toISOString();
  console.log('GitHub共通設定読み込み成功',cfg.tiles.length,'牌',cfg.yaku.length,'役');return cfg;
 }catch(err){if(err.status!==404)console.error('GitHub共通設定の読み込み失敗:',err.message);return null}
}
function validateSharedConfig(raw){
 if(!raw||typeof raw!=='object'||!Array.isArray(raw.tiles)||!Array.isArray(raw.yaku))throw Error('牌・役を含むJSONが必要です');
 if(raw.tiles.length<1||raw.tiles.length>100||raw.yaku.length>100)throw Error('牌・役の件数が範囲外です');
 if(raw.tiles.some((t,i)=>!t||t.id!==i+1||typeof t.name!=='string'||t.name.length>80||!Number.isInteger(+t.count)||+t.count<0||+t.count>40||
   (t.image!=null&&(typeof t.image!=='string'||t.image.length>15000000||!/^data:image\/(png|jpeg|webp);base64,/.test(t.image)))))throw Error('牌設定が不正です');
 if(raw.tiles.filter(t=>t.wild).length>1)throw Error('特別牌が複数あります');
 if(raw.yaku.some(y=>!y||typeof y.name!=='string'||y.name.length>80||!Number.isInteger(y.points)||y.points<1||y.points>100000||!Array.isArray(y.pattern)||y.pattern.length<1||y.pattern.length>99||y.pattern.some(id=>!Number.isInteger(id)||id<1||id>raw.tiles.length)))throw Error('役設定が不正です');
 return configFrom(raw);
}
app.get('/api/shared-config',(req,res)=>{res.set('Cache-Control','no-store');res.json({available:!!sharedConfig,config:sharedConfig,updatedAt:sharedUpdatedAt})});

// GitHubに保存済みのJSONをそのまま配布する。ブラウザーのローカル設定は混ぜない。
// GitHub Contents APIは1MBを超えるファイルでcontentを省略するためBlob APIも扱う。
app.get('/api/shared-config/download',async(req,res)=>{
 res.set('Cache-Control','no-store, no-cache, must-revalidate');
 try{
  let file=await ghRequest('GET');
  if(!file.content&&file.sha){
   const url='https://api.github.com/repos/'+encodeURIComponent(GH_OWNER)+'/'+encodeURIComponent(GH_REPO)+'/git/blobs/'+encodeURIComponent(file.sha);
   const response=await fetch(url,{headers:{'Accept':'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28',...(GH_TOKEN?{'Authorization':'Bearer '+GH_TOKEN}:{})}});
   if(!response.ok)throw Error('GitHub Blob API '+response.status);
   file=await response.json();
  }
  if(file.encoding&&file.encoding!=='base64')throw Error('未対応のGitHubファイル形式です');
  if(!file.content)throw Error('GitHubに設定JSONがありません');
  const content=Buffer.from(file.content.replace(/\s/g,''),'base64');
  if(!content.length||content.length>20*1024*1024)throw Error('設定JSONの容量が対応範囲外です');
  // オフライン版と互換のある牌・役設定かチェックする（保存内容は書き換えない）。
  validateSharedConfig(JSON.parse(content.toString('utf8')));
  res.type('application/json; charset=utf-8');
  res.attachment('zamajan-github-settings.json');
  res.send(content);
 }catch(err){
  console.error('GitHub設定JSONのダウンロード失敗:',err.message);
  const code=err.status===404?404:502;
  res.status(code).json({error:err.status===404?'GitHubに共通設定JSONがありません':'GitHubから設定JSONを取得できませんでした: '+err.message});
 }
});

app.post('/api/admin/save-config',express.json({limit:'14mb'}),async(req,res)=>{
 res.set('Cache-Control','no-store');
 if(!ADMIN_PASSWORD||!GH_TOKEN)return res.status(503).json({error:'Render環境変数 GITHUB_TOKEN と ZAMAJAN_ADMIN_PASSWORD を設定してください'});
 const ip=req.ip||'unknown',record=failures.get(ip)||{count:0,until:0};
 if(record.until>Date.now())return res.status(429).json({error:'認証失敗が続いたため、15分後に再試行してください'});
 if(typeof req.body?.password!=='string'||!secureEqual(req.body.password,ADMIN_PASSWORD)){
  record.count++;if(record.count>=5){record.until=Date.now()+15*60*1000;record.count=0}failures.set(ip,record);
  return res.status(401).json({error:'管理者パスワードが違います'});
 }
 failures.delete(ip);
 try{
  const cfg=validateSharedConfig(req.body.config);
  const json=JSON.stringify({format:'zamajan-config',schemaVersion:1,app:'zamajan',updatedAt:new Date().toISOString(),...cfg},null,2);
  if(Buffer.byteLength(json)>9*1024*1024)return res.status(413).json({error:'画像を含む設定が9MBを超えています。画像を縮小してから保存してください'});
  let sha;try{sha=(await ghRequest('GET')).sha}catch(e){if(e.status!==404)throw e}
  const result=await ghRequest('PUT',{message:'Update Zamajan shared game settings from admin panel',content:Buffer.from(json).toString('base64'),branch:GH_BRANCH,...(sha?{sha}:{})});
  sharedConfig=cfg;sharedUpdatedAt=new Date().toISOString();
  res.json({ok:true,commit:result.commit?.sha,tiles:cfg.tiles.length,yaku:cfg.yaku.length,warning:'GitHubへのコミットでRenderが自動デプロイされる場合、対戦中の部屋が切断される可能性があります'});
 }catch(err){console.error('GitHub保存エラー:',err.message);res.status(err.status===409?409:400).json({error:err.message})}
});
const rooms=new Map(), names=['ねこ','いぬ','うさぎ','くま','きつね','パンダ','さる','とり','かえる','ライオン','ぞう','ぶた','うし','ねずみ','コアラ','とら','ひつじ','うま','たぬき','りす','特別牌'];
const emojis=['🐱','🐶','🐰','🐻','🦊','🐼','🐵','🐦','🐸','🦁','🐘','🐷','🐮','🐭','🐨','🐯','🐑','🐴','🦝','🐿️','⭐'];
const safe=(x,n=20)=>String(x||'').slice(0,n).replace(/[<>]/g,'');
const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=crypto.randomInt(i+1);[a[i],a[j]]=[a[j],a[i]]}return a};
function configFrom(x){
 const input=Array.isArray(x?.tiles)&&x.tiles.length>=1&&x.tiles.length<=100?x.tiles:null;
 const tiles=(input||names.map((name,i)=>({name,emoji:emojis[i],count:i===20?1:9,wild:i===20}))).map((t,i)=>({
  id:i+1,name:safe(t?.name||names[i]||`牌${i+1}`),emoji:safe(t?.emoji||emojis[i]||'🀄',6),
  image:typeof t?.image==='string'&&t.image.length<=15000000&&/^data:image\/(png|jpeg|webp);base64,/.test(t.image)?t.image:null,
  count:Math.max(0,Math.min(40,Number.isFinite(+t?.count)?Math.floor(+t.count):9)),
  imageOnly:!!t?.imageOnly,wild:!!t?.wild
 }));
 // Older saved settings identified tile 21 as the special tile.
 if(!tiles.some(t=>t.wild)&&!x?.wildDeleted&&tiles.length>=21&&tiles[20].name==='特別牌')tiles[20].wild=true;
 const wild=tiles.find(t=>t.wild);if(wild)tiles.forEach(t=>{t.wild=t.id===wild.id});
 const yaku=(Array.isArray(x?.yaku)?x.yaku:[]).slice(0,100).filter(y=>Array.isArray(y.pattern)&&y.pattern.length>=1&&y.pattern.length<=99&&y.pattern.every(n=>Number.isInteger(n)&&n>=1&&n<=tiles.length)).map(y=>({name:safe(y.name),points:Math.max(1,Math.min(100000,Math.floor(+y.points||1000))),pattern:y.pattern}));
 return {tiles,yaku,wildDeleted:!!x?.wildDeleted};
}
function wildId(r){return r.config.tiles.find(t=>t.wild)?.id||0}
function patternWin(r,hand,pattern){
 if(hand.length!==9||!Array.isArray(pattern)||pattern.length<1||pattern.length>99)return false;
 const wild=wildId(r),have=new Map(),need=new Map();
 for(const id of hand)if(id!==wild)have.set(id,(have.get(id)||0)+1);
 for(const id of pattern)if(id!==wild)need.set(id,(need.get(id)||0)+1);
 const wildInHand=wild?hand.filter(id=>id===wild).length:0;
 if(pattern.length<=9){
  // 1〜9枚指定：登録した牌の枚数は「最低枚数」ではなく「ちょうどその枚数」。
  // 例：ねこ×1 を指定した役は、ねこ×2 の手牌では成立しない。
  // 特別牌は足りない枚数の代わりになるが、実際の牌が余分にある場合は補えない。
  for(const [id,n] of need)if((have.get(id)||0)>n)return false;
  let missing=0;for(const [id,n] of need)missing+=n-(have.get(id)||0);
  const explicit=wild?pattern.filter(id=>id===wild).length:0;
  // 特別牌自身を登録した場合も、登録数を超えていれば不一致。
  if(explicit>0&&wildInHand>explicit+missing)return false;
  return explicit<=wildInHand&&missing<=wildInHand-explicit;
 }
 // 10枚以上の役：異なる牌を各3枚ずつ登録した「三枚組候補」。
 // 4種類×3枚=12枠、10種類×3枚=30枠でも登録できる。
 // あがりは候補から異なる3組をそろえた9枚。特別牌は不足枚数を代用。
 if(pattern.length>9&&need.size>=3&&[...need.values()].every(n=>n===3)){
  if(!tripleWin(r,hand))return false;
  if([...have].some(([id,n])=>!need.has(id)||n>3))return false;
  return have.size+(wildInHand>=3?1:0)>=3 || wildInHand>0;
 }
 // 10〜99枚登録：候補の中から9種類を各1枚ずつ集める「バラ牌9種類」の役。
 // 例えば21種類登録なら、候補の異なる8種類でテンパイ、異なる9種類であがり。
 // 同じ牌2枚を異なる2種類として数えてはいけない。
 const allowed=new Set(pattern);
 if(allowed.size<9)return false;
 if([...have].some(([id,count])=>count!==1||!allowed.has(id)))return false;
 // 特別牌は、まだ手元にない登録牌の1種類として使える。
 return allowed.size>=have.size+wildInHand;
}
function tripleWin(r,hand){
 const wild=wildId(r),counts=Array(r.config.tiles.length+1).fill(0);hand.forEach(n=>counts[n]++);
 let missing=0;for(let i=1;i<counts.length;i++){if(i===wild)continue;missing+=(3-counts[i]%3)%3}
 const available=wild?counts[wild]:0;return missing<=available&&(available-missing)%3===0;
}
function win(room,hand){
 if(!Array.isArray(hand)||hand.length!==9)return null;
 const threeGroups=tripleWin(room,hand);
 const matches=[];
 if(threeGroups)matches.push({name:'三組そろえ',points:1000});
 for(const y of room.config.yaku){
  if(!Array.isArray(y.pattern)||y.pattern.length<1||y.pattern.length>99)continue;
  // 1-8 tiles specify an additional role condition; do not let partial hands win.
  if(y.pattern.length<9&&!threeGroups)continue;
  if(patternWin(room,hand,y.pattern))matches.push(y);
 }
 return matches.sort((a,b)=>b.points-a.points)[0]||null;
}
// Result layout: form three actual groups of three, preserving the wildcard tile.
function resultGroups(r,hand,yaku){
 const wild=wildId(r), counts=new Map();for(const id of hand)if(id!==wild)counts.set(id,(counts.get(id)||0)+1);
 let remaining=wild?hand.filter(id=>id===wild).length:0;
 let targets=[];
 if(yaku&&Array.isArray(yaku.pattern)){
  if(yaku.pattern.length>9){
   const result=hand.slice().sort((a,b)=>a-b).map(id=>({id,as:id}));
   return [result.slice(0,3),result.slice(3,6),result.slice(6,9)];
  }
  targets=yaku.pattern.slice();
  const leftover=new Map(counts),wildRequested=wild?targets.filter(n=>n===wild).length:0;
  let spareWild=remaining-wildRequested;
  for(const id of targets){
   if(id===wild)continue;
   if((leftover.get(id)||0)>0)leftover.set(id,leftover.get(id)-1);
   else if(spareWild>0)spareWild--;
  }
  for(const [id,n] of [...leftover].sort((a,b)=>a[0]-b[0]))for(let k=0;k<n;k++)targets.push(id);
  while(targets.length<9)targets.push(wild);
 }
 else if(yaku?.name==='三組そろえ'){
  for(const [id,n] of [...counts].sort((a,b)=>a[0]-b[0]))for(let k=0;k<Math.ceil(n/3)*3;k++)targets.push(id);
  if(targets.length>9)return null;
  while(targets.length<9)targets.push([...counts.keys()].sort((a,b)=>a-b)[0]||r.config.tiles.find(t=>!t.wild)?.id||wild);
 }else return null;
 if(targets.length!==9)return null;
 // A registered yaku can specify its own ordered pattern; display three consecutive triplets.
 const result=[];for(const target of targets){const n=counts.get(target)||0;if(n){counts.set(target,n-1);result.push({id:target,as:target})}else if(remaining>0){remaining--;result.push({id:wild,as:target})}else return null}
 if(remaining||[...counts.values()].some(n=>n))return null;
 return [result.slice(0,3),result.slice(3,6),result.slice(6,9)];
}
function ownBonus(r,p,hand){
 const name=String(r.players[p]?.name||'').trim().toLocaleLowerCase();
 if(!name||name.length<2)return false;
 return hand.some(id=>String(r.config.tiles[id-1]?.name||'').toLocaleLowerCase().includes(name));
}
function tenpai(r,hand){
 if(!Array.isArray(hand)||hand.length!==8)return false;
 return r.config.tiles.some(t=>t.count>hand.filter(id=>id===t.id).length&&win(r,[...hand,t.id]));
}

const ZJ_ITEMS=[
 ['smoke','🌫️ 煙幕',3000,'対象の手牌を次の1ターンだけ伏せて表示'],
 ['breaker','💥 暗刻クラッシャー',10000,'相手の同じ牌3枚のうち1枚を山と交換'],
 ['shock','⚡ しびれ攻撃',5000,'対象は次のツモ牌を強制的に捨てる'],
 ['lock','🔒 牌ロック',3000,'対象の手牌1枚を次の捨て牌までロック'],
 ['shuffle','🌪️ シャッフル地獄',8000,'対象の手牌2枚を山と交換'],
 ['glasses','👓 透視メガネ',5000,'相手1人の手牌を3秒間表示'],
 ['exchange','🔄 運命の交換',5000,'自分の牌1枚を山と交換'],
 ['double','🎲 ダブルツモ',8000,'次のツモで山の2枚から1枚を選ぶ'],
 ['wild','⭐ ワイルドチャンス',10000,'山の特別牌と自分の牌1枚を交換'],
 ['search','🔍 リーチサーチ',3000,'今の手牌の待ち牌・役を表示'],
 ['reset','♻️ 強制リセット',5000,'自分の牌を最大3枚山と交換'],
 ['boost','🔥 得点ブースト',10000,'この局の自分のあがり得点1.5倍'],
 ['revenge','🏆 リベンジボーナス',0,'4位専用。次のあがりで5,000点加算'],
 ['steal','💰 スコアスティール',3000,'相手から3,000点を獲得'],
 ['seal','🚫 リーチ封印',5000,'対象の次の手番でリーチ不可'],
 ['counter','🛡️ カウンター',3000,'次の妨害を1回防ぐ'],
 ['roulette','🎰 逆転ルーレット',0,'4位専用。0〜10,000点を獲得'],
 ['allshuffle','🔀 全員シャッフル',8000,'全員から牌1枚を集めて再配布'],
 ['timer','⏱️ タイムアタック',3000,'対象の次の捨て牌制限を5秒に'],
 ['last','🃏 最後の切り札',0,'最終局4位専用。山3枚から1枚を選んで交換']
];
const ZJ_TARGETED=new Set(['smoke','breaker','shock','lock','shuffle','glasses','steal','seal','timer']);
const ZJ_FREE=new Set(['revenge','roulette','last']);
const ZJ_SWAP=new Set(['breaker','shuffle','exchange','reset','wild','last','allshuffle']);
function zjInitItems(r){r.items={mode:r.itemMode||'both',limit:r.itemLimit||1,used:[0,0,0,0],bags:[[],[],[],[]],effects:[{},{},{},{}]}}
function zjLast(r){return r.scores.indexOf(Math.min(...r.scores))}
function zjRoundItems(r){const a=r.items;if(!a)return;a.used=[0,0,0,0];a.bags=[[],[],[],[]];a.effects=[{},{},{},{}];if(r.round>=2&&['both','last'].includes(a.mode)){const pool=ZJ_ITEMS.filter(x=>x[0]!=='last'||r.round===r.maxRounds);const x=pool[crypto.randomInt(pool.length)];a.bags[zjLast(r)].push(x[0]);log(r,'🎁 '+r.players[zjLast(r)].name+'に「'+x[1]+'」を無料配布')}}
function zjPublicItems(r,seat){const a=r.items;return a?{mode:a.mode,limit:a.limit,used:a.used,bags:a.bags[seat]||[],effects:a.effects[seat]||{},lastSeat:zjLast(r),catalog:ZJ_ITEMS}:null}
function zjEffect(r,who,id,target,description){const x=ZJ_ITEMS.find(z=>z[0]===id);const payload={id,name:x?.[1]||id,actor:who,actorName:r.players[who].name,target,targetName:target==null?null:r.players[target].name,description,at:Date.now()};log(r,'🎁 '+payload.actorName+'：'+payload.name+(target==null?'':' → '+payload.targetName)+' / '+description);io.to(r.code).emit('itemEffect',payload)}
function zjSwap(r,p,n){if(r.riichi[p]||r.wall.length<n||r.hands[p].length<n)return false;for(let k=0;k<n;k++){const i=crypto.randomInt(r.hands[p].length),old=r.hands[p][i];r.hands[p][i]=r.wall.pop();r.wall.push(old);shuffle(r.wall)}r.hands[p].sort((a,b)=>a-b);return true}
function zjAllowed(r,p,id){const a=r.items,x=ZJ_ITEMS.find(z=>z[0]===id);if(!a||!x||a.mode==='off'||r.phase!=='playing'||r.turn!==p||r.pendingDouble||a.used[p]>=a.limit)return false;if(ZJ_FREE.has(id)&&p!==zjLast(r))return false;if(id==='last'&&r.round!==r.maxRounds)return false;if(r.riichi[p]&&ZJ_SWAP.has(id))return false;return a.bags[p].includes(id)||(!ZJ_FREE.has(id)&&['both','paid'].includes(a.mode)&&r.scores[p]>=x[2])}
function zjUse(r,p,data,s){
 const id=String(data?.id||''),x=ZJ_ITEMS.find(z=>z[0]===id),target=data?.target;
 if(!zjAllowed(r,p,id))return s.emit('errorMessage','アイテムの使用条件を満たしていません');
 if(ZJ_TARGETED.has(id)&&(!Number.isInteger(target)||target===p||target<0||target>3))return s.emit('errorMessage','対象を選んでください');
 const a=r.items,e=a.effects;let detail=x[3];
 if(ZJ_TARGETED.has(id)&&['smoke','breaker','shock','lock','shuffle','seal','timer'].includes(id)&&e[target].counter){e[target].counter=false;zjEffect(r,p,'counter',target,'カウンターで攻撃を防いだ！');broadcast(r);return}
 if(['breaker','shuffle'].includes(id)&&r.riichi[target])return s.emit('errorMessage','リーチ中の相手には交換系を使えません');
 if(id==='smoke')e[target].smoke=true;
 if(id==='breaker'){const h=r.hands[target],trip=[...new Set(h)].filter(v=>h.filter(t=>t===v).length>=3);if(!trip.length||!r.wall.length)return s.emit('errorMessage','相手に暗刻がないか山がありません');const v=trip[crypto.randomInt(trip.length)];h[h.indexOf(v)]=r.wall.pop();r.wall.push(v);shuffle(r.wall);h.sort((a,b)=>a-b)}
 if(id==='shock')e[target].shock=true;
 if(id==='lock')e[target].lock=r.hands[target][crypto.randomInt(r.hands[target].length)];
 if(id==='shuffle'&&!zjSwap(r,target,2))return s.emit('errorMessage','交換できません');
 if(id==='glasses')s.emit('itemPrivate',{title:r.players[target].name+'の手牌',message:r.hands[target].map(v=>r.config.tiles[v-1]?.name||v).join(' / ')});
 if(id==='exchange'&&!zjSwap(r,p,1))return s.emit('errorMessage','山がありません');
 if(id==='double')e[p].double=true;
 if(id==='wild'){const wild=r.config.tiles.find(t=>t.wild)?.id;const idx=r.wall.indexOf(wild);if(idx<0)return s.emit('errorMessage','山に特別牌がありません');const j=crypto.randomInt(r.hands[p].length),old=r.hands[p][j];r.hands[p][j]=r.wall.splice(idx,1)[0];r.wall.push(old);shuffle(r.wall);r.hands[p].sort((a,b)=>a-b)}
 if(id==='search'){const h=r.hands[p],options=r.config.tiles.filter(t=>t.count>0&&win(r,[...h.slice(0,8),t.id])).slice(0,20);s.emit('itemPrivate',{title:'リーチサーチ',message:options.length?options.map(t=>t.name).join(' / '):'現在は待ち牌の候補がありません'})}
 if(id==='reset'&&!zjSwap(r,p,Math.min(3,r.wall.length,r.hands[p].length)))return s.emit('errorMessage','交換できません');
 if(id==='boost')e[p].boost=true;
 if(id==='revenge')e[p].revenge=true;
 if(id==='steal'){const v=Math.min(3000,Math.max(0,r.scores[target]));r.scores[target]-=v;r.scores[p]+=v}
 if(id==='seal')e[target].seal=true;
 if(id==='counter')e[p].counter=true;
 if(id==='roulette'){const v=crypto.randomInt(11)*1000;r.scores[p]+=v;detail=v.toLocaleString()+'点を獲得！'}
 if(id==='allshuffle'){if(r.riichi.some(Boolean))return s.emit('errorMessage','リーチ中のプレイヤーがいるため使えません');const picks=r.hands.map(h=>h.splice(crypto.randomInt(h.length),1)[0]);shuffle(picks);r.hands.forEach((h,i)=>{h.push(picks[i]);h.sort((a,b)=>a-b)})}
 if(id==='timer')e[target].timer=true;
 if(id==='last'){if(r.wall.length<1)return s.emit('errorMessage','山がありません');const chosen=Number(data?.choice),discard=Number(data?.discard);if(!Number.isInteger(chosen)||chosen<0||chosen>=Math.min(3,r.wall.length)||!Number.isInteger(discard)||discard<0||discard>=r.hands[p].length)return s.emit('errorMessage','牌をプルダウンで選んでください');const wi=r.wall.length-Math.min(3,r.wall.length)+chosen,old=r.hands[p][discard];r.hands[p][discard]=r.wall.splice(wi,1)[0];r.wall.push(old);shuffle(r.wall);r.hands[p].sort((a,b)=>a-b)}
 const i=a.bags[p].indexOf(id);if(i>=0)a.bags[p].splice(i,1);else r.scores[p]-=x[2];a.used[p]++;zjEffect(r,p,id,ZJ_TARGETED.has(id)?target:null,detail);broadcast(r);
}

function broadcast(r){for(let i=0;i<4;i++){const p=r.players[i];if(p?.socket){const s=io.sockets.sockets.get(p.socket);if(s)s.emit('state',state(r,i))}}}
function state(r,seat){
 const h=r.hands?.[seat]||[];
 const readyDiscards=r.phase==='playing'&&r.turn===seat&&r.drawn&&!r.riichi[seat]&&h.length===9
  ?h.flatMap((_,i)=>tenpai(r,h.filter((__,j)=>i!==j))?[i]:[]):[];
 return {readyDiscards,code:r.code,seat,host:r.host===r.players[seat]?.token,phase:r.phase,round:r.round,maxRounds:r.maxRounds,turn:r.turn,firstDice:r.firstDice||null,startSeat:r.startSeat??0,drawn:r.drawn,wallCount:r.wall?.length||0,scores:r.scores,riichi:r.riichi,discards:r.discards,discardHistory:r.discardHistory||[],hand:r.hands?.[seat]||[],handCounts:r.hands?.map(h=>h.length)||[0,0,0,0],players:r.players.map(p=>p?{name:p.name,cpu:!!p.cpu,connected:!!p.socket}:null),result:r.result,config:r.config,tableTheme:r.tableTheme||1,logs:r.logs.slice(-12),items:zjPublicItems(r,seat),deadline:r.deadline||0}}
function log(r,s){r.logs.push(s);if(r.logs.length>100)r.logs.shift()}
function schedule(r){
 clearTimeout(r.timer);
 if(r.phase!=='playing')return;
 const isCpu=!!r.players[r.turn]?.cpu;
 const isRiichi=!!r.riichi?.[r.turn];
 const delay=isCpu?(r.drawn?400:200):isRiichi?(r.drawn?450:200):(r.drawn?(r.items?.effects[r.turn]?.timer?5000:15000):200);
 r.deadline=Date.now()+delay;
 const round=r.round,turn=r.turn,drawn=r.drawn;
 r.timer=setTimeout(()=>{
  if(r.phase!=='playing'||r.round!==round||r.turn!==turn||r.drawn!==drawn||r.pendingDouble)return;
  if(r.players[turn]?.cpu){cpuAct(r);return}
  if(r.drawn)discard(r,turn,r.hands[turn].length-1);
  else draw(r,turn);
 },delay);
}
const STREET_FIGHTER_CPU_NAMES=["リュウ", "ケン", "春麗", "ガイル", "ブランカ", "ザンギエフ", "ダルシム", "エドモンド本田", "キャミィ", "ディージェイ", "ジュリ", "ルーク", "ジェイミー", "キンバリー", "マノン", "マリーザ", "リリー", "JP", "ラシード", "A.K.I.", "エド", "豪鬼", "ベガ", "テリー", "舞", "エレナ", "サガット", "C.ヴァイパー"];
function randomCpuName(taken=[] ){const choices=STREET_FIGHTER_CPU_NAMES.filter(n=>!taken.includes(n));return (choices.length?choices:STREET_FIGHTER_CPU_NAMES)[Math.floor(Math.random()*(choices.length||STREET_FIGHTER_CPU_NAMES.length))]}
function roundStart(r){clearTimeout(r.timer);const deck=[];for(const t of r.config.tiles)for(let j=0;j<t.count;j++)deck.push(t.id);if(deck.length<33){r.phase='lobby';return '牌が33枚未満です'}shuffle(deck);r.hands=[[],[],[],[]];r.discards=[[],[],[],[]];r.discardHistory=[];r.riichi=[false,false,false,false];r.pendingDouble=null;r.wall=deck;zjRoundItems(r);
if(r.round===1&&!r.firstDice){
 r.firstDice=crypto.randomInt(1,7);
 r.startSeat=(r.firstDice-1)%4;
}
if(r.round>1)r.startSeat=((r.startSeat??0)+1)%4;
r.turn=r.startSeat??0;r.drawn=false;r.result=null;r.phase='playing';for(let k=0;k<8;k++)for(let i=0;i<4;i++)r.hands[i].push(r.wall.pop());r.hands.forEach(h=>h.sort((a,b)=>a-b));log(r,r.round===1?`🎲 サイコロ ${r.firstDice}！部屋主から右回りで${r.firstDice}人目：${r.players[r.startSeat].name}がスタート！`:`第${r.round}局 はじめ！`);schedule(r);broadcast(r);return null}
function finish(r,result){clearTimeout(r.timer);r.deadline=0;r.phase='result';r.result=result;log(r,result.method==='流局'?'流局':result.method==='ロン'?`${result.winnerName}が${result.loserName||r.players[result.loser]?.name||'相手'}からロン！`:`${result.winnerName}が${result.method}！`);broadcast(r)}
function zjFinishDraw(r,p,t){r.hands[p].push(t);r.drawn=true;const y=win(r,r.hands[p]);if(y){const e=r.items?.effects[p]||{},base=Math.round(y.points*(e.boost?1.5:1)),extra=e.revenge?5000:0,bonus=ownBonus(r,p,r.hands[p])?1000:0,gain=base*3+extra+bonus;r.scores[p]+=gain;for(let i=0;i<4;i++)if(i!==p)r.scores[i]-=base;finish(r,{method:'ツモ',winner:p,winnerName:r.players[p].name,yaku:y.name,points:gain,basePoints:base*3,ownBonus:bonus,hand:r.hands[p].slice(),groups:resultGroups(r,r.hands[p],y)});return}schedule(r);broadcast(r)}
function draw(r,p){if(r.phase!=='playing'||r.turn!==p||r.drawn||r.pendingDouble)return;if(!r.wall.length){finish(r,{method:'流局'});return}const e=r.items?.effects[p];if(e?.double&&r.wall.length>=2&&!r.players[p].cpu){const tiles=[r.wall.pop(),r.wall.pop()];e.double=false;clearTimeout(r.timer);r.pendingDouble={seat:p,tiles};const s=io.sockets.sockets.get(r.players[p].socket);if(s)s.emit('itemDrawOptions',tiles.map((v,i)=>({index:i,name:r.config.tiles[v-1]?.name||String(v)})));r.pendingDouble.timer=setTimeout(()=>{if(r.pendingDouble?.seat===p){r.pendingDouble=null;r.wall.push(tiles[1]);shuffle(r.wall);zjFinishDraw(r,p,tiles[0])}},15000);broadcast(r);return}if(e)e.double=false;zjFinishDraw(r,p,r.wall.pop())}
function discard(r,p,index){if(r.phase!=='playing'||r.turn!==p||!r.drawn||!Number.isInteger(index)||index<0||index>=r.hands[p].length)return;const e=r.items?.effects[p];if(e?.lock&&r.hands[p][index]===e.lock&&!r.players[p].cpu)return;if(e?.shock&&index!==r.hands[p].length-1&&!r.players[p].cpu)return;const t=r.hands[p].splice(index,1)[0];const sealed=!!e?.seal;if(e){e.lock=null;e.shock=false;e.smoke=false;e.seal=false;e.timer=false}r.discards[p].push(t);r.discardHistory.push({seat:p,id:t});r.hands[p].sort((a,b)=>a-b);r.drawn=false;log(r,`${r.players[p].name}が${r.config.tiles[t-1].name}を捨てた`);if(!r.riichi[p]&&!sealed&&tenpai(r,r.hands[p])){r.riichi[p]=true;r.discardHistory[r.discardHistory.length-1].riichi=true;log(r,`${r.players[p].name} リーチ！（供託なし・宣言牌：${r.config.tiles[t-1].name}）`)}for(let k=1;k<4;k++){const q=(p+k)%4;if(!r.riichi[q])continue;const hand=[...r.hands[q],t],y=win(r,hand);if(y){const bonus=ownBonus(r,q,hand)?1000:0;const ef=r.items?.effects[q]||{},base=Math.round(y.points*(ef.boost?1.5:1)),extra=ef.revenge?5000:0;r.scores[q]+=base+bonus+extra;r.scores[p]-=base;finish(r,{method:'ロン',winner:q,winnerName:r.players[q].name,loser:p,loserName:r.players[p].name,yaku:y.name,points:base+bonus+extra,basePoints:base,ownBonus:bonus,hand,groups:resultGroups(r,hand,y)});return}}if(!r.wall.length){finish(r,{method:'流局'});return}r.turn=(p+1)%4;schedule(r);broadcast(r)}
function cpuAct(r){if(r.phase!=='playing')return;const p=r.players[r.turn];if(!p||!p.cpu)return;if(r.drawn){const h=r.hands[r.turn];const counts={};h.forEach(x=>counts[x]=(counts[x]||0)+1);const idx=r.items?.effects[r.turn]?.shock?h.length-1:r.riichi[r.turn]?h.length-1:h.map((x,i)=>({x,i,c:counts[x]})).sort((a,b)=>a.c-b.c)[0].i;discard(r,r.turn,idx)}else draw(r,r.turn)}

function makeCode(){let c;do{c=String(crypto.randomInt(100000,1000000))}while(rooms.has(c));return c}
function join(s,r,name,token){let seat=r.players.findIndex(p=>p&&p.token===token);if(seat<0){if(r.phase!=='lobby')return s.emit('errorMessage','対戦開始後は新規参加できません');seat=r.players.findIndex(p=>!p);if(seat<0)return s.emit('errorMessage','満員です');token=crypto.randomUUID();r.players[seat]={name:safe(name)||`プレイヤー${seat+1}`,token,socket:s.id,cpu:false}}else{r.players[seat].socket=s.id;r.players[seat].cpu=false} s.join(r.code);s.data.room=r.code;s.data.seat=seat;s.data.token=token;s.emit('joined',{code:r.code,seat,token});broadcast(r)}
io.on('connection',s=>{
 s.on('create',({name,config,maxRounds,itemMode,itemLimit}={})=>{const code=makeCode(),token=crypto.randomUUID();const r={code,host:token,players:[{name:safe(name)||'あなた',token,socket:s.id,cpu:false},null,null,null],config:configFrom(sharedConfig||config),maxRounds:[1,2,4,8,12,16,20].includes(+maxRounds)?+maxRounds:4,phase:'lobby',itemMode:['both','last','paid','off'].includes(itemMode)?itemMode:'both',itemLimit:[1,2,3].includes(+itemLimit)?+itemLimit:1,round:1,tableTheme:crypto.randomInt(1,6),scores:[10000,10000,10000,10000],hands:null,discards:[[],[],[],[]],discardHistory:[],riichi:[false,false,false,false],logs:[],deadline:0};zjInitItems(r);rooms.set(code,r);s.join(code);s.data={room:code,seat:0,token};s.emit('joined',{code,seat:0,token});broadcast(r)});
 s.on('join',({code,name,token}={})=>{const r=rooms.get(String(code));if(!r)return s.emit('errorMessage','ルームが見つかりません');join(s,r,name,token)});
 s.on('start',()=>{const r=rooms.get(s.data.room);if(!r||r.host!==s.data.token||r.phase!=='lobby')return;for(let i=0;i<4;i++)if(!r.players[i])r.players[i]={name:randomCpuName(r.players.filter(Boolean).map(p=>p.name)),cpu:true,socket:null,token:null};const err=roundStart(r);if(err)s.emit('errorMessage',err)});
 s.on('itemUse',data=>{const r=rooms.get(s.data.room);const p=s.data.seat;if(!r||!Number.isInteger(p)||r.players[p]?.token!==s.data.token||r.players[p]?.cpu)return;zjUse(r,p,data,s)});
 s.on('itemOptions',({id}={})=>{const r=rooms.get(s.data.room),p=s.data.seat;if(!r||!zjAllowed(r,p,id))return; if(id==='last')s.emit('itemOptions',{id,wall:r.wall.slice(-3).map((v,i)=>({index:i,name:r.config.tiles[v-1]?.name||String(v)})),hand:r.hands[p].map((v,i)=>({index:i,name:r.config.tiles[v-1]?.name||String(v)}))})});
 s.on('itemDrawChoice',choice=>{const r=rooms.get(s.data.room),p=s.data.seat;if(!r||r.turn!==p||!r.pendingDouble||r.pendingDouble.seat!==p)return;const d=r.pendingDouble;r.pendingDouble=null;clearTimeout(d.timer);const c=choice===1?1:0;r.wall.push(d.tiles[1-c]);shuffle(r.wall);zjFinishDraw(r,p,d.tiles[c])});
 s.on('draw',()=>{const r=rooms.get(s.data.room);if(r&&r.players[r.turn]?.token===s.data.token&&!r.riichi[r.turn])draw(r,r.turn)});
 s.on('discard',i=>{const r=rooms.get(s.data.room);if(r&&r.players[r.turn]?.token===s.data.token&&!r.riichi[r.turn])discard(r,r.turn,i)});
 // One-click tile action: if the 0.2-second automatic draw is still pending,
 // draw first and then discard this selected tile. Server remains authoritative.
 s.on('playTile',i=>{
  const r=rooms.get(s.data.room);
  if(!r||r.phase!=='playing'||r.pendingDouble||r.players[r.turn]?.token!==s.data.token||r.riichi[r.turn])return;
  if(!Number.isInteger(i)||i<0||i>=r.hands[r.turn].length+(r.drawn?0:1))return;
  const p=r.turn;
  if(!r.drawn)draw(r,p);
  if(r.phase==='playing'&&r.turn===p&&r.drawn&&i<r.hands[p].length)discard(r,p,i);
 });
 s.on('next',()=>{const r=rooms.get(s.data.room);if(!r||r.phase!=='result'||r.host!==s.data.token)return;if(r.round>=r.maxRounds){r.phase='final';r.result={method:'最終結果'};broadcast(r)}else{r.round++;roundStart(r)}});
 function handoff(r,seat,reason){const p=r.players[seat];if(!p)return;if(r.phase==='lobby'){if(r.host===p.token){clearTimeout(r.timer);rooms.delete(r.code);for(const client of io.sockets.sockets.values())if(client.data.room===r.code){client.data={};client.emit('roomClosed','部屋主が退出したため、部屋を終了しました')}}else{r.players[seat]=null;broadcast(r)}return}
  const wasHost=r.host===p.token;
  p.socket=null;p.cpu=true;p.token=null;p.name=randomCpuName(r.players.filter((x,i)=>i!==seat&&x).map(x=>x.name));
  log(r,`${seat+1}番が${reason}したため、手牌と点数をそのままCPUが引き継ぎました`);
  if(wasHost){const successor=r.players.find(x=>x&&!x.cpu&&x.token&&x.socket);r.host=successor?.token||null}
  if(r.phase==='playing'&&r.turn===seat)schedule(r);
  broadcast(r);
 }
 s.on('leave',()=>{const r=rooms.get(s.data.room),seat=s.data.seat,p=r?.players[seat];if(!r||!p||p.socket!==s.id||p.token!==s.data.token){s.data={};return}s.data={};handoff(r,seat,'退出')});
 s.on('disconnect',()=>{const r=rooms.get(s.data.room),seat=s.data.seat,p=r?.players[seat];if(p&&p.socket===s.id){p.socket=null;broadcast(r);const token=p.token;setTimeout(()=>{const q=r.players[seat];if(q&&q.token===token&&!q.socket&&rooms.has(r.code))handoff(r,seat,'切断')},20000)}});

});
setInterval(()=>{for(const [c,r] of rooms){if(!r.players.some(p=>p?.socket)&&r.phase!=='playing'){clearTimeout(r.timer);rooms.delete(c)}else if(r.phase==='result'&&!r.host){if(r.round>=r.maxRounds){r.phase='final';r.result={method:'最終結果'};broadcast(r)}else{r.round++;roundStart(r)}}}},60000);
fetchGitHubConfig().finally(()=>server.listen(process.env.PORT||3000,()=>console.log('Zamajan online listening')));

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
// Persist configuration outside the Git checkout, so auto-deploy never overwrites it.
const path=require('path');
const SERVER_CONFIG_FILE=process.env.ZAMAJAN_DATA_FILE||'/home/zamajan/zamajan-data/game-config.json';
function saveServerConfig(cfg){
 const dir=path.dirname(SERVER_CONFIG_FILE);fs.mkdirSync(dir,{recursive:true,mode:0o700});
 const bytes=JSON.stringify({format:'zamajan-config',schemaVersion:1,app:'zamajan',updatedAt:new Date().toISOString(),...cfg},null,2);
 // Snapshot the existing configuration before overwriting it.
 if(fs.existsSync(SERVER_CONFIG_FILE)){
  const backupDir=path.join(dir,'backups');fs.mkdirSync(backupDir,{recursive:true,mode:0o700});
  const stamp=new Date().toISOString().replace(/[:.]/g,'-');
  fs.copyFileSync(SERVER_CONFIG_FILE,path.join(backupDir,'game-config-'+stamp+'.json'));
  const old=fs.readdirSync(backupDir).filter(x=>/^game-config-.*\.json$/.test(x)).sort();
  old.slice(0,-20).forEach(x=>fs.unlinkSync(path.join(backupDir,x)));
 }
 const tmp=SERVER_CONFIG_FILE+'.tmp-'+process.pid+'-'+crypto.randomBytes(4).toString('hex');
 try{fs.writeFileSync(tmp,bytes,{mode:0o600,flag:'wx'});fs.renameSync(tmp,SERVER_CONFIG_FILE)}
 finally{try{fs.unlinkSync(tmp)}catch{}}
}
function loadServerConfig(){
 try{const raw=JSON.parse(fs.readFileSync(SERVER_CONFIG_FILE,'utf8'));sharedConfig=validateSharedConfig(raw);sharedUpdatedAt=raw.updatedAt||new Date().toISOString();console.log('KAGOYA保存設定読み込み',sharedConfig.tiles.length,'牌',sharedConfig.yaku.length,'役');return true}
 catch(e){if(e.code!=='ENOENT')console.error('サーバー設定読み込み失敗:',e.message);return false}
}
function adminAuth(req,res){
 if(!ADMIN_PASSWORD){res.status(503).json({error:'管理者パスワードがサーバーに設定されていません'});return false}
 const ip=req.ip||'unknown',r=failures.get(ip)||{count:0,until:0};
 if(r.until>Date.now()){res.status(429).json({error:'認証失敗が続いたため15分後に再試行してください'});return false}
 if(typeof req.body?.password!=='string'||!secureEqual(req.body.password,ADMIN_PASSWORD)){
  r.count++;if(r.count>=5){r.until=Date.now()+15*60*1000;r.count=0}failures.set(ip,r);
  res.status(401).json({error:'管理者パスワードが違います'});return false
 }
 failures.delete(ip);return true
}

function secureEqual(a,b){const x=crypto.createHash('sha256').update(String(a)).digest();const y=crypto.createHash('sha256').update(String(b)).digest();return crypto.timingSafeEqual(x,y)}
function ghEndpoint(){return 'https://api.github.com/repos/'+encodeURIComponent(GH_OWNER)+'/'+encodeURIComponent(GH_REPO)+'/contents/'+GH_PATH.split('/').map(encodeURIComponent).join('/')}
async function ghRequest(method,payload){
 const response=await fetch(ghEndpoint()+'?ref='+encodeURIComponent(GH_BRANCH),{method,headers:{'Accept':'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28',...(GH_TOKEN?{'Authorization':'Bearer '+GH_TOKEN}:{}),...(payload?{'Content-Type':'application/json'}:{})},...(payload?{body:JSON.stringify(payload)}:{})});
 const raw=await response.text();let data;try{data=JSON.parse(raw)}catch{data={message:raw.slice(0,150)}};
 if(!response.ok){const err=new Error('GitHub API '+response.status+': '+(data.message||'通信エラー'));err.status=response.status;throw err}
 return data;
}
async function fetchGitHubConfig(){
 if(loadServerConfig())return sharedConfig;
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
  // One-time migration: seed local KAGOYA file only if no local file exists.
  if(!fs.existsSync(SERVER_CONFIG_FILE)){try{saveServerConfig(cfg);console.log('KAGOYA共通設定へ初期移行完了')}catch(e){console.error('初期移行の保存に失敗:',e.message)}}
  console.log('GitHub共通設定読み込み成功',cfg.tiles.length,'牌',cfg.yaku.length,'役');return cfg;
 }catch(err){
  if(err.status!==404)console.error('GitHub共通設定の読み込み失敗:',err.message);
  // A fresh deployment without access to GitHub can still use the bundled baseline.
  try{const base=JSON.parse(fs.readFileSync(path.join(__dirname,'game-config.json'),'utf8'));const cfg=validateSharedConfig(base);saveServerConfig(cfg);sharedConfig=cfg;sharedUpdatedAt=new Date().toISOString();console.log('バンドル設定をKAGOYAに初期登録');return cfg}
  catch(e){console.error('初期設定が読み込めません:',e.message);return null}
 }
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
// GitHubのコミットとKAGOYAへの正常デプロイ履歴を比較する。秘密情報は返さない。
const fs=require('fs');
let zjDeployStatusCache=null,zjDeployStatusUntil=0;
app.get('/api/deploy-status',async(req,res)=>{
 res.set('Cache-Control','no-store');
 if(zjDeployStatusCache&&Date.now()<zjDeployStatusUntil)return res.json(zjDeployStatusCache);
 let deployedSha=null,deployedAt=null,githubSha=null,githubCommitAt=null,deployedAtKind="deployment";
 try{
  const file='/var/lib/zj-github-sync/deployed.sha';
  deployedSha=fs.readFileSync(file,'utf8').trim()||null;
  if(deployedSha)deployedAt=fs.statSync(file).mtime.toISOString();
 }catch{};
 // The deployment marker is root-owned (0600) on KAGOYA. Read the currently checked-out
 // Git commit instead, which is accessible to the unprivileged Node application.
 // This also works when the sync utility's state directory is inaccessible.
 if(!deployedSha){
  try{
   const {execFileSync}=require('child_process');
   const repositoryDir='/home/zamajan/zamajan-online';
   const sha=execFileSync('git',['-C',repositoryDir,'rev-parse','HEAD'],{encoding:'utf8',timeout:2000}).trim();
   if(/^[0-9a-f]{40}$/i.test(sha)){
    deployedSha=sha;
    // This is the server-process start time, not GitHub push or the git commit time.
    deployedAt=new Date(Date.now()-process.uptime()*1000).toISOString();
    deployedAtKind="server-start";
   }
  }catch(error){console.warn('Git revision status unavailable:',error.message)}
 }
 try{
  const endpoint='https://api.github.com/repos/'+encodeURIComponent(GH_OWNER)+'/'+encodeURIComponent(GH_REPO)+'/commits/'+encodeURIComponent(GH_BRANCH);
  const response=await fetch(endpoint,{headers:{'Accept':'application/vnd.github+json','User-Agent':'zamajan-sync-status',...(GH_TOKEN?{'Authorization':'Bearer '+GH_TOKEN}:{})},signal:AbortSignal.timeout(5000)});
  if(response.ok){const data=await response.json();githubSha=data.sha||null;githubCommitAt=data.commit?.committer?.date||null;}
 }catch{};
 const result={githubSha,githubCommitAt,deployedSha,deployedAt,deployedAtKind,synced:githubSha&&deployedSha?githubSha===deployedSha:null};
 zjDeployStatusCache=result;zjDeployStatusUntil=Date.now()+60000;
 res.json(result);
});
app.get('/api/shared-config',(req,res)=>{res.set('Cache-Control','no-store');res.json({available:!!sharedConfig,config:sharedConfig,updatedAt:sharedUpdatedAt,source:'KAGOYA'} )});
app.post('/api/admin/save-server-config',express.json({limit:'14mb'}),(req,res)=>{
 res.set('Cache-Control','no-store');if(!adminAuth(req,res))return;
 try{const cfg=validateSharedConfig(req.body.config);saveServerConfig(cfg);sharedConfig=cfg;sharedUpdatedAt=new Date().toISOString();res.json({ok:true,tiles:cfg.tiles.length,yaku:cfg.yaku.length,updatedAt:sharedUpdatedAt})}
 catch(e){console.error('KAGOYA設定保存エラー:',e.message);res.status(400).json({error:'保存できませんでした: '+e.message})}
});


// GitHubに保存済みのJSONをそのまま配布する。ブラウザーのローカル設定は混ぜない。
// GitHub Contents APIは1MBを超えるファイルでcontentを省略するためBlob APIも扱う。
app.get('/api/shared-config/download',(req,res)=>{
 res.set('Cache-Control','no-store');
 try{
  if(!sharedConfig)throw Error('共通設定がありません');
  res.type('application/json; charset=utf-8');res.attachment('zamajan-kagoya-settings.json');
  res.send(JSON.stringify({format:'zamajan-config',schemaVersion:1,app:'zamajan',...sharedConfig},null,2));
 }catch(e){res.status(404).json({error:'KAGOYA共通設定を取得できません: '+e.message})}
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

// ZAMA-JAN CHAOS ITEMS v2 — online, authoritative server implementation.
const ZJ_ITEMS=[
 ['dogtakeover','🐕 わんこ画面ジャック',7000,'使用者以外の3人の画面を実写犬が45秒間占領する。'],
 ['steal','💰 スコアスティール',6000,'相手から3,000点を自分へ移動する。'],
 ['openall','👁️ 全面透視',7000,'この局の終了まで他の3人の手牌を公開する。'],
 ['riichiswap','🔴 リーチ強奪',5000,'リーチ中の相手と8枚の手牌を交換し、自分がリーチになる。'],
 ['hightriple','🌟 伝説の三牌',6000,'最大3枚を高得点役につながる山の牌と交換する。'],
 ['revolution','🌋 大革命',7000,'全員の手牌を配り直し、全員のリーチを解除する。'],
 ['freeze','🧊 金縛り',5000,'ランダムな相手1人の手番を5回スキップさせる。'],
 ['oj','🎉 OJ万歳',6000,'秘密装備：自分のあがり時にOJ1枚につき5,000点加算。'],
 ['mana2','😈 mana2 だよ',7000,'秘密装備：他人のあがり時にmana2 1枚につき3,000点減点。'],
 ['festival','🎊 ザマン祭',5000,'全員の手牌のmana2とOJがザマンに変わる。'],
 ['mirror','🌀 手牌大移動',7000,'全員の手牌8枚を右隣へ回しリーチを解除する。'],
 ['jackpot','🎰 山の秘宝',5000,'山の上5枚から欲しい牌と、自分が返す牌を選択して交換。'],
 ['triplefactory','🏭 暗刻製造機',6000,'山に3枚ある同一牌で自分の手牌3枚を交換し暗刻を作る。'],
 ['leaderfall','👑 王者転落',7000,'1位が6,000点失い、他の3人が各2,000点獲得する。'],
 ['riichicancel','🚫 リーチ脱却',5000,'全員のリーチを解除する（1局全体で2回まで）。'],
 ['palpunte','🌈 パルプ○テ',3000,'34種類の不思議な現象から何が起こるかわからない。マイナス点でも使用可能。'],
 ['doublepoints','🔥 得点倍増',6000,'この局で自分があがった際、役の基本点が2倍になる。'],
 ['handraid','🧤 手牌略奪',7000,'相手と手牌3枚ずつをランダム交換する。'],
 ['selfreset','♻️ 生まれ変わり',5000,'自分の手牌を最大5枚交換しリーチを解除する。'],
 ['timefreeze','⏳ 時間停止',6000,'他の3人の次の手番を1回ずつスキップ。'],
 ['wildhunt','🃏 万能牌強奪',7000,'山に残る特別牌と自分の牌1枚を交換する。']
];
app.get('/api/item-catalog',(req,res)=>{res.set('Cache-Control','no-store');res.json(ZJ_ITEMS)});
const ZJ_TARGETED=new Set(['steal','riichiswap','handraid']);
const ZJ_PASSIVE=new Set(['oj','mana2']);
const zjName=s=>String(s||'').normalize('NFKC').replace(/[\s　_・-]/g,'').toLowerCase();
const zjTileId=(r,s)=>r.config.tiles.find(t=>zjName(t.name)===zjName(s))?.id||0;
const zjItemById=id=>ZJ_ITEMS.find(x=>x[0]===id);
function zjInitItems(r){r.items={version:2,mode:r.itemMode||'both',limit:r.itemLimit||1,used:[0,0,0,0],tickets:[0,0,0,0],bags:[[],[],[],[]],effects:[{},{},{},{}],riichiCancelCount:0}}
function zjBottomSeats(r){const min=Math.min(...r.scores),seats=r.scores.flatMap((v,i)=>v===min?[i]:[]);return seats.length<=2?seats:[]}
function zjRoundItems(r){const a=r.items;if(!a)return;a.used=[0,0,0,0];a.tickets=[0,0,0,0];a.bags=[[],[],[],[]];a.effects=[{},{},{},{}];a.riichiCancelCount=0;if(r.round<2||!['both','last'].includes(a.mode))return;const seats=zjBottomSeats(r);if(!seats.length){log(r,'🎟️ 同率最下位が3人以上のため無料使用権はありません');return}for(const p of seats){a.tickets[p]=1;log(r,'🎟️ '+r.players[p].name+'に好きなアイテムの無料使用権を1回付与！')}}
function zjPublicEffects(r){return r.items?.effects.map(e=>({openall:!!e.openall,oj:!!e.oj,mana2:!!e.mana2,doublepoints:!!e.doublepoints,frozen:e.frozen||0,freezeQueue:Array.isArray(e.freezeQueue)?e.freezeQueue.filter(v=>v.remaining>0).map(v=>({by:v.by,id:v.id,remaining:v.remaining})):[]}))||[{},{},{},{}]}
function zjPublicItems(r,seat){const a=r.items;return a?{mode:a.mode,limit:a.limit,used:a.used,tickets:a.tickets,bags:a.bags[seat]||[],effects:a.effects[seat]||{},allEffects:zjPublicEffects(r),catalog:ZJ_ITEMS,riichiCancelCount:a.riichiCancelCount||0,version:2}:null}
function zjEffect(r,who,id,target,description){if(ZJ_PASSIVE.has(id))return;const x=zjItemById(id);const payload={id,name:x?.[1]||id,actor:who,actorName:r.players[who].name,target,targetName:target==null?null:r.players[target].name,description,at:Date.now()};log(r,'🎁 '+payload.actorName+'：'+payload.name+(target==null?'':' → '+payload.targetName)+' / '+description);io.to(r.code).emit('itemEffect',payload)}
function zjRandomIndices(n,len){return shuffle(Array.from({length:len},(_,i)=>i)).slice(0,n)}
function zjSwapWall(r,p,n){const h=r.hands[p],w=r.wall;const count=Math.min(n,h.length,w.length);if(count<=0)return 0;for(const i of zjRandomIndices(count,h.length)){const old=h[i];h[i]=w.pop();w.push(old);shuffle(w)}h.sort((a,b)=>a-b);return count}
function zjAvailable(r,p,id){const h=r.hands?.[p]||[],w=r.wall||[],a=r.items,e=a?.effects[p]||{};
 if(!h.length)return false;
 if(id==='riichiswap')return !r.riichi[p]&&r.riichi.some((v,i)=>i!==p&&v);
 if(id==='oj')return !!zjTileId(r,'OJ')&&!e.oj;
 if(id==='mana2')return !!zjTileId(r,'mana2')&&!e.mana2;
 if(id==='festival'){const oj=zjTileId(r,'OJ'),m=zjTileId(r,'mana2'),z=zjTileId(r,'ザマン');return !!(oj&&m&&z&&r.hands.some(hand=>hand.some(t=>t===oj||t===m)))}
 if(id==='openall')return !e.openall;
 if(id==='doublepoints')return !e.doublepoints;
 if(id==='leaderfall')return new Set(r.scores).size>1;
 if(id==='riichicancel')return r.riichi.some(Boolean)&&(a.riichiCancelCount||0)<2;
 if(id==='jackpot'||id==='selfreset')return w.length>0;
 if(id==='hightriple')return w.length>0&&r.config.yaku.some(y=>y.points>0&&Array.isArray(y.pattern));
 if(id==='triplefactory')return w.some(v=>w.filter(t=>t===v).length>=3);
 if(id==='wildhunt')return !!wildId(r)&&w.includes(wildId(r));
 return true;
}
function zjAllowed(r,p,id){if(id==='scoreflip')return false;const a=r.items,x=zjItemById(id);if(!a||!x||a.mode==='off'||r.phase!=='playing'||r.turn!==p||a.used[p]>=a.limit||!zjAvailable(r,p,id))return false;return a.tickets[p]>0||a.bags[p].includes(id)||(['both','paid'].includes(a.mode)&&(id==='palpunte'||r.scores[p]>=x[2]))}
function zjAddFreeze(r,target,by,id,turns){const e=r.items.effects[target];e.frozen=(e.frozen||0)+turns;(e.freezeQueue||(e.freezeQueue=[])).push({by,id,remaining:turns})}
function zjConsumeFreeze(r,p){const e=r.items.effects[p];if(!e?.frozen)return;e.frozen--;const q=e.freezeQueue||[];const head=q.find(v=>v.remaining>0);if(head)head.remaining--;e.freezeQueue=q.filter(v=>v.remaining>0)}
function zjWinBonuses(r,p,hand){const effects=r.items?.effects||[];const oj=zjTileId(r,'OJ'),mana=zjTileId(r,'mana2');const ojBonus=effects[p]?.oj&&oj?hand.filter(v=>v===oj).length*5000:0;const manaCount=mana?hand.filter(v=>v===mana).length:0;const otherHolders=effects.reduce((n,x,i)=>n+(i!==p&&x?.mana2?1:0),0);return {ojBonus,manaPenalty:otherHolders*manaCount*3000,multiplier:effects[p]?.doublepoints?2:1}}
function zjReplaceHighThree(r,p){
 const h=r.hands[p],w=r.wall,roles=[...r.config.yaku].filter(y=>y.points>0&&Array.isArray(y.pattern)).sort((a,b)=>b.points-a.points);if(!w.length||!roles.length)return 0;
 const count=arr=>{const m=new Map();for(const id of arr)m.set(id,(m.get(id)||0)+1);return m};const owned=count(h),onWall=count(w);let best=null;
 for(const y of roles){const pattern=y.pattern;let desired=[];
  if(pattern.length===9)desired=pattern.slice();
  else if(pattern.length>9){const need=count(pattern),triples=need.size>=3&&[...need.values()].every(v=>v===3);
   if(triples){const choices=[...need.keys()].sort((a,b)=>(Math.min(owned.get(b)||0,3)+Math.min(onWall.get(b)||0,Math.max(0,3-(owned.get(b)||0))))-(Math.min(owned.get(a)||0,3)+Math.min(onWall.get(a)||0,Math.max(0,3-(owned.get(a)||0)))));if(choices.length<3)continue;desired=choices.slice(0,3).flatMap(id=>[id,id,id])}
   else{const choices=[...new Set(pattern)].sort((a,b)=>(Number(owned.has(b))*3+Number(onWall.has(b)))-(Number(owned.has(a))*3+Number(onWall.has(a))));if(choices.length<9)continue;desired=choices.slice(0,9)}}
  else{const req=count(pattern);if([...req.values()].some(v=>v!==3)||req.size>3)continue;const candidates=[...new Set([...h,...w])].filter(id=>id!==wildId(r)&&!req.has(id)).sort((a,b)=>Math.min(owned.get(b)||0,3)+Math.min(onWall.get(b)||0,3)-Math.min(owned.get(a)||0,3)-Math.min(onWall.get(a)||0,3));const ids=[...req.keys(),...candidates].slice(0,3);if(ids.length<3)continue;desired=ids.flatMap(id=>[id,id,id])}
  const needed=count(desired),missing=[];for(const [id,n] of needed)for(let j=0;j<Math.max(0,n-(owned.get(id)||0));j++)missing.push(id);
  const available=new Map(onWall),obtainable=[];for(const id of missing)if((available.get(id)||0)>0){available.set(id,available.get(id)-1);obtainable.push(id)}
  if(!obtainable.length)continue;const hits=Math.min(3,obtainable.length),gap=Math.max(0,missing.length-hits),value=y.points/(1+gap*2)+hits*3500;if(!best||value>best.value)best={needed,obtainable,value};
 }
 if(!best)return 0;const replacement=best.obtainable.slice(0,3),remain=new Map(best.needed),keep=[],remove=[];
 h.forEach((id,i)=>{const n=remain.get(id)||0;if(n>0){remain.set(id,n-1);keep.push(i)}else remove.push(i)});
 for(const i of keep.slice().reverse()){if(remove.length>=replacement.length)break;remove.push(i)}
 let changed=0;for(let k=0;k<Math.min(replacement.length,remove.length);k++){const wi=w.indexOf(replacement[k]);if(wi<0)continue;const i=remove[k],old=h[i];h[i]=w.splice(wi,1)[0];w.push(old);changed++}
 shuffle(w);h.sort((a,b)=>a-b);return changed;
}
// リーチ強奪：KAGOYAサーバーが開始時刻、連打数、勝敗を管理する。
const ZJ_FIGHT_COUNTDOWN_MS=3000,ZJ_FIGHT_DURATION_MS=10000;
function zjStartRiichiFight(r,p,target){
 if(r.boxing)return false;
 clearTimeout(r.timer);r.deadline=0;
 const now=Date.now();
 const fight={id:crypto.randomUUID(),actor:p,target,startsAt:now+ZJ_FIGHT_COUNTDOWN_MS,endsAt:now+ZJ_FIGHT_COUNTDOWN_MS+ZJ_FIGHT_DURATION_MS,counts:[0,0],lastTap:[0,0]};
 r.boxing=fight;
 io.to(r.code).emit('riichiFightStart',{id:fight.id,actor:p,target,startsAt:fight.startsAt,endsAt:fight.endsAt,actorName:r.players[p].name,targetName:r.players[target].name});
 if(r.players[target].cpu){
  // CPU対戦：毎秒10～14打程度の疑似連打。通信イベントには依存しない。
  fight.botTimer=setInterval(()=>{if(r.boxing!==fight)return;const t=Date.now();if(t>=fight.startsAt&&t<fight.endsAt)fight.counts[1]+=crypto.randomInt(1,3)},130);
 }
 fight.timer=setTimeout(()=>zjFinishRiichiFight(r,fight),ZJ_FIGHT_COUNTDOWN_MS+ZJ_FIGHT_DURATION_MS+120);
 broadcast(r);return true;
}
function zjFinishRiichiFight(r,fight){
 if(r.boxing!==fight)return;
 clearTimeout(fight.timer);clearInterval(fight.botTimer);r.boxing=null;
 const success=fight.counts[0]>fight.counts[1];
 if(success&&r.phase==='playing'&&r.hands?.[fight.actor]&&r.hands?.[fight.target]&&r.riichi[fight.target]){
  const a=fight.actor,b=fight.target,h=r.hands;
  const mine=h[a].slice(0,8),theirs=h[b].slice(0,8),extra=h[a].slice(8);
  h[a]=theirs.concat(extra);h[b]=mine;r.riichi[b]=false;r.riichi[a]=true;
 }
 const description=success?'リーチ強奪成功！':'リーチ強奪失敗（防衛または引き分け）';
 log(r,'🥊 '+r.players[fight.actor].name+' vs '+r.players[fight.target].name+' '+fight.counts.join(' - ')+' '+description);
 io.to(r.code).emit('riichiFightResult',{id:fight.id,actor:fight.actor,target:fight.target,counts:fight.counts,success});
 // 結果画像の表示中は手番を進めない。別のアイテム演出も重ねない。
 if(r.phase==='playing'){r.boxing={ending:true};setTimeout(()=>{if(r.boxing?.ending){r.boxing=null;schedule(r);broadcast(r)}},3000)}
 broadcast(r);
}
function zjRiichiFightPunch(r,p,id){
 const f=r.boxing,now=Date.now();
 if(!f||f.id!==id||now<f.startsAt||now>=f.endsAt||![f.actor,f.target].includes(p))return;
 const index=p===f.actor?0:1;
 // 同時に到着した異常な大量イベントを制限（通常の連打は通過）。
 if(now-f.lastTap[index]<30)return;
 f.lastTap[index]=now;f.counts[index]++;
 io.to(r.code).emit('riichiFightCount',{id:f.id,counts:f.counts});
}
// パルプ○テの30種類のイベント。得点移動は原則合計点を保存。
const ZJ_PALPUNTE=[
 ['topQuarter','まばゆい光が4人を照らす！ 首位の持ち点が4つに分かれて降り注いだ！'],
 ['allEqual','黄金の秤が揺れる！ 全員の持ち点が均等になった！'],
 ['reverse','運命の砂時計が逆さになる！ 1位と4位の得点が入れ替わった！'],
 ['clockwise','点数の渦が回り始めた！ 持ち点が右隣へ移動した！'],
 ['counterclock','点数の渦が逆回転！ 持ち点が左隣へ移動した！'],
 ['giftLeft','天空から贈り物！ 左隣から1,000点が届けられた！'],
 ['giftRight','天空から贈り物！ 右隣から1,000点が届けられた！'],
 ['taxTop','王冠がひび割れる！ 首位から他の3人へ各1,000点が流れた！'],
 ['bonusLast','最後尾に希望の光！ 最下位へ各プレイヤーから500点が集まった！'],
 ['actorGift','金色の雨が降る！ 他の3人から使用者へ500点ずつ集まった！'],
 ['actorDonate','虹の架け橋が開いた！ 使用者の得点を他の3人に500点ずつ分け与えた！'],
 ['randomGift','流れ星がひとつ！ ランダムな相手から1,500点が飛んできた！'],
 ['randomDonate','流れ星が跳ね返った！ ランダムな相手へ1,500点を贈った！'],
 ['pairSwap','運命の糸が絡まる！ ランダムな2人の得点が入れ替わった！'],
 ['mirror','鏡の世界が現れた！ 全員の手牌が右隣へ渡された！'],
 ['mirrorBack','鏡が逆さに映った！ 全員の手牌が左隣へ渡された！'],
 ['reshuffle','大地が震える！ 手牌がすべて混ざり再配布された！'],
 ['swapOne','小さな妖精が飛び回る！ 全員の手牌1枚が右隣へ！'],
 ['swapTwo','風のいたずら！ 全員の手牌2枚が右隣へ！'],
 ['swapThree','嵐の通り道！ 全員の手牌3枚が右隣へ！'],
 ['refreshActor','光の羽根が舞う！ 使用者の手牌3枚が山と入れ替わった！'],
 ['refreshAll','新しい風が吹く！ 全員の手牌1枚が山と入れ替わった！'],
 ['riichiOff','静寂が訪れた！ リーチ中の者の3枚組が崩れ、リーチが解除された！'],
 ['riichiOnly','赤い月が昇る！ 使用者だけがリーチ状態になった！'],
 ['riichiAll','赤い稲妻が走る！ 全員の手牌が自動的に組み替わり、あがりを待つ！'],
 ['freezeOne','時が一瞬止まった！ ランダムな相手の次の手番が飛ばされる！'],
 ['freezeAll','氷の輪が広がる！ 使用者以外の次の手番が飛ばされる！'],
 ['revealAll','霧が晴れる！ 全員の手牌がこの局だけ見えるようになった！'],
 ['doubleActor','赤い彗星が使用者を包む！ あがった時の基本点が2倍に！'],
 ['rewind','時の歯車が逆回転した！ この局が始まりの瞬間へ巻き戻った！'],
 ['manaSeven','七つの紫の光がひとりを包む！ その手牌の7枚がmana2に変わった！'],
 ['ojSeven','七つの金の光がひとりを包む！ その手牌の7枚がOJに変わった！'],
 ['musicShift','空から不思議な旋律が響く！ この部屋のBGMが別の曲に変わった！'],
 ['themeShift','世界が色を変える！ 対戦卓の壁紙が一瞬で変わった！'],
 ['nothing','まばゆい閃光！ ……しかし何も起こらなかった！']
];
// リーチ系の呪文は旗だけを変えず、実牌を山札と交換して成立を検証する。
// 牌の枚数の保存を優先し、実現不能な場合は「不発」としてリーチにしない。
function zjMakeRealRiichi(r, seat){
 const hand=r.hands?.[seat],wall=r.wall;
 if(!Array.isArray(hand)||hand.length<8||!Array.isArray(wall))return false;
 const bonus=hand.length-8, pool=hand.slice(0,8).concat(wall);
 // 任意の3種類を3枚・3枚・2枚で揃え、残りの同種牌で9枚目を待つ。
 // 対象が実際に九枚であがれるかも既存のwin()で確認する。
 const counts=new Map();pool.forEach(v=>counts.set(v,(counts.get(v)||0)+1));
 const ids=[...counts].filter(([id,c])=>c>=3 && id!==wildId(r)).map(([id])=>id);
 shuffle(ids);
 let picked=null;
 for(const pair of ids){
  for(const first of ids){if(first===pair)continue;
   for(const second of ids){if(second===pair||second===first)continue;
    const wanted=[first,first,first,second,second,second,pair,pair];
    if(win(r,wanted.concat(pair))&&tenpai(r,wanted)){picked={wanted,pair};break}
   }
   if(picked)break;
  }
  if(picked)break;
 }
 if(!picked)return false;
 // 既存の8枚と山札だけで交換（特殊に生成した牌は含めない）。
 const remain=pool.slice();
 for(const tile of picked.wanted){const i=remain.indexOf(tile);if(i<0)return false;remain.splice(i,1)}
 // 待ち牌が山札に少なくとも1枚あることを保証する。
 if(!remain.includes(picked.pair))return false;
 hand.splice(0,8,...picked.wanted.sort((a,b)=>a-b));
 wall.splice(0,wall.length,...remain);shuffle(wall);
 r.riichi[seat]=true;
 return true;
}
function zjBreakRealRiichi(r,seat){
 const hand=r.hands?.[seat],wall=r.wall;
 if(!Array.isArray(hand)||hand.length<8)return false;
 const counts=new Map();hand.slice(0,8).forEach(x=>counts.set(x,(counts.get(x)||0)+1));
 const triples=[...counts].filter(([id,n])=>n>=3).map(([id])=>id);
 shuffle(triples);
 // 完成した3枚組のうち1枚を、別種類の山札と交換。
 for(const trip of triples){
  const hi=hand.slice(0,8).indexOf(trip);
  const choices=shuffle(wall.map((v,i)=>({v,i})).filter(o=>o.v!==trip));
  // できる限りテンパイも崩して、ただのフラグ解除にならないようにする。
  const selected=choices.find(({v})=>{const test=hand.slice(0,8);test[hi]=v;return !tenpai(r,test)})||choices[0];
  if(!selected)continue;
  const old=hand[hi];hand[hi]=wall[selected.i];wall[selected.i]=old;
  hand.sort((a,b)=>a-b);shuffle(wall);r.riichi[seat]=false;
  return true;
 }
 // 三枚組がない特殊役テンパイでも、手牌を山札と交換して実際に崩す。
 for(let hi=0;hi<Math.min(8,hand.length);hi++){
  for(const {v,i} of shuffle(wall.map((v,i)=>({v,i})))){
   if(v===hand[hi])continue;
   const trial=hand.slice(0,8);trial[hi]=v;
   if(tenpai(r,trial))continue;
   const old=hand[hi];hand[hi]=wall[i];wall[i]=old;
   hand.sort((a,b)=>a-b);shuffle(wall);r.riichi[seat]=false;return true;
  }
 }
 return false;
}
function zjDoPalpunte(r,p){
 const h=r.hands,w=r.wall,n=4,idx=crypto.randomInt(ZJ_PALPUNTE.length),[kind,baseMessage]=ZJ_PALPUNTE[idx];let message=baseMessage;
 const transfer=(from,to,amount)=>{const value=Math.min(Math.max(0,r.scores[from]),amount);r.scores[from]-=value;r.scores[to]+=value};
 const randOther=()=>[0,1,2,3].filter(i=>i!==p)[crypto.randomInt(3)];
 const mixHands=(steps,count)=>{const copies=h.map(hand=>hand.slice(0,count));for(let i=0;i<4;i++)h[(i+steps)%4]=copies[i].concat(h[(i+steps)%4].slice(count)).sort((a,b)=>a-b);r.riichi=[false,false,false,false]};
 const top=r.scores.indexOf(Math.max(...r.scores)),last=r.scores.indexOf(Math.min(...r.scores));
 switch(kind){
 case 'topQuarter':{const amount=Math.max(0,r.scores[top]),each=Math.floor(amount/4),extra=amount%4;r.scores[top]=0;for(let i=0;i<4;i++)r.scores[i]+=each+(i===top?extra:0);break}
 case 'allEqual':{const total=r.scores.reduce((a,b)=>a+b,0),each=Math.floor(total/4);r.scores=[each,each,each,total-each*3];break}
 case 'reverse':[r.scores[top],r.scores[last]]=[r.scores[last],r.scores[top]];break;
 case 'clockwise':r.scores=r.scores.map((_,i)=>r.scores[(i+3)%4]);break;
 case 'counterclock':r.scores=r.scores.map((_,i)=>r.scores[(i+1)%4]);break;
 case 'giftLeft':transfer((p+3)%4,p,1000);break;
 case 'giftRight':transfer((p+1)%4,p,1000);break;
 case 'taxTop':for(let i=0;i<4;i++)if(i!==top)transfer(top,i,1000);break;
 case 'bonusLast':for(let i=0;i<4;i++)if(i!==last)transfer(i,last,500);break;
 case 'actorGift':for(let i=0;i<4;i++)if(i!==p)transfer(i,p,500);break;
 case 'actorDonate':for(let i=0;i<4;i++)if(i!==p)transfer(p,i,500);break;
 case 'randomGift':transfer(randOther(),p,1500);break;
 case 'randomDonate':transfer(p,randOther(),1500);break;
 case 'pairSwap':{const a=crypto.randomInt(4),b=(a+1+crypto.randomInt(3))%4;[r.scores[a],r.scores[b]]=[r.scores[b],r.scores[a]];break}
 case 'mirror':mixHands(1,8);break;
 case 'mirrorBack':mixHands(3,8);break;
 case 'reshuffle':{const sizes=h.map(x=>x.length),all=w.splice(0);for(const hand of h)all.push(...hand.splice(0));shuffle(all);for(let i=0;i<4;i++)for(let j=0;j<sizes[i];j++)h[i].push(all.pop());w.push(...all);h.forEach(v=>v.sort((a,b)=>a-b));r.riichi=[false,false,false,false];break}
 case 'swapOne':mixHands(1,1);break;
 case 'swapTwo':mixHands(1,2);break;
 case 'swapThree':mixHands(1,3);break;
 case 'refreshActor':zjSwapWall(r,p,3);r.riichi[p]=false;break;
 case 'refreshAll':for(let i=0;i<4;i++)zjSwapWall(r,i,1);r.riichi=[false,false,false,false];break;
 case 'riichiOff':{let changed=0;for(let i=0;i<4;i++)if(r.riichi[i]){if(zjBreakRealRiichi(r,i))changed++;else r.riichi[i]=false}message+=' （'+changed+'人の手牌を交換）';break}
 case 'riichiOnly':{for(let i=0;i<4;i++)if(i!==p&&r.riichi[i]){if(!zjBreakRealRiichi(r,i))r.riichi[i]=false}const ok=zjMakeRealRiichi(r,p);message+=ok?' 実際にあがれる待ち牌ができた！':' しかし山に必要な牌がなく不発！';break}
 case 'riichiAll':{let changed=0;for(let i=0;i<4;i++)if(zjMakeRealRiichi(r,i))changed++;message+=' （'+changed+'人が実際にテンパイ）';break}
 case 'freezeOne':zjAddFreeze(r,randOther(),p,'palpunte',1);break;
 case 'freezeAll':for(let i=0;i<4;i++)if(i!==p)zjAddFreeze(r,i,p,'palpunte',1);break;
 case 'revealAll':for(let i=0;i<4;i++)r.items.effects[i].openall=true;break;
 case 'doubleActor':r.items.effects[p].doublepoints=true;break;
 case 'rewind':{const snap=r.roundOpening;if(!snap){message='時の歯車が震えた……しかし戻るべき時間がない！';break;}clearTimeout(r.timer);r.hands=snap.hands.map(v=>v.slice());r.wall=snap.wall.slice();r.discards=snap.discards.map(v=>v.slice());r.discardHistory=[];r.riichi=[false,false,false,false];r.turn=snap.turn;r.drawn=false;r.pendingDouble=null;r.items.effects=[{},{},{},{}];r.scores=snap.scores.slice();r.bgmTrack=snap.bgmTrack;r.tableTheme=snap.tableTheme;break}
 case 'manaSeven':case 'ojSeven':{const tile=zjTileId(r,kind==='manaSeven'?'mana2':'OJ');const candidates=[0,1,2,3].filter(i=>h[i].length>=7);if(!tile||!candidates.length){message='七つの光が現れた……しかし対応する牌がなく、光は消えた！';break}const target=candidates[crypto.randomInt(candidates.length)];const indices=zjRandomIndices(7,h[target].length);for(const ix of indices)h[target][ix]=tile;h[target].sort((a,b)=>a-b);r.riichi[target]=false;message=r.players[target].name+'に七つの光が降り注いだ！ 手牌7枚が'+(kind==='manaSeven'?'mana2':'OJ')+'に変化した！';break}
 case 'musicShift':{r.bgmTrack=(r.bgmTrack+1+crypto.randomInt(4))%5;break}
 case 'themeShift':{r.tableTheme=(r.tableTheme-1+1+crypto.randomInt(7))%8+1;break}
 }
 return {kind,message};
}
function zjUse(r,p,data,s){
 const id=String(data?.id||''),x=zjItemById(id),target=data?.target,a=r.items;
 if(r.boxing)return s?.emit('errorMessage','ストリートファイトの対戦中です');
 if(!zjAllowed(r,p,id))return s?.emit('errorMessage','アイテムの使用条件を満たしていません');
 if(ZJ_TARGETED.has(id)&&(!Number.isInteger(target)||target===p||target<0||target>3||id==='riichiswap'&&!r.riichi[target]))return s?.emit('errorMessage','有効な対象を選んでください');
 const h=r.hands,w=r.wall,e=a.effects;let detail=x[3],victim=ZJ_TARGETED.has(id)?target:null;
 if(id==='dogtakeover'){detail='使用者以外の3人の画面を実写犬が45秒間占領！'}
 else if(id==='steal'){r.scores[target]-=3000;r.scores[p]+=3000;detail='3,000点を移動'}
 else if(id==='openall')e[p].openall=true;
 else if(id==='riichiswap'){
  if(a.tickets[p]>0)a.tickets[p]--;else if(a.bags[p].includes(id))a.bags[p].splice(a.bags[p].indexOf(id),1);else r.scores[p]-=x[2];
  a.used[p]++;zjStartRiichiFight(r,p,target);return;
 }
 else if(id==='hightriple'){const changed=zjReplaceHighThree(r,p);if(!changed)return s?.emit('errorMessage','交換できる高得点役の牌が山にありません');detail=changed+'枚を高得点役向けに交換'}
 else if(id==='revolution'){const sizes=h.map(v=>v.length),all=w.splice(0);for(const hand of h)all.push(...hand.splice(0));shuffle(all);for(let i=0;i<4;i++)for(let j=0;j<sizes[i];j++)h[i].push(all.pop());w.push(...all);h.forEach(v=>v.sort((a,b)=>a-b));r.riichi=[false,false,false,false];detail='全員の手牌とリーチをリセット'}
 else if(id==='freeze'){const targets=[0,1,2,3].filter(i=>i!==p);victim=targets[crypto.randomInt(targets.length)];zjAddFreeze(r,victim,p,'freeze',5);detail=r.players[victim].name+'が5回の手番をスキップ'}
 else if(id==='oj')e[p].oj=true;
 else if(id==='mana2')e[p].mana2=true;
 else if(id==='festival'){const oj=zjTileId(r,'OJ'),mana=zjTileId(r,'mana2'),zaman=zjTileId(r,'ザマン');let changed=0;for(let q=0;q<4;q++){h[q]=h[q].map(v=>{if(v===oj||v===mana){changed++;return zaman}return v}).sort((x,y)=>x-y)}detail=changed+'枚がザマンへ変化'}
 else if(id==='mirror'){const bases=h.map(v=>v.slice(0,8));for(let i=0;i<4;i++)h[(i+1)%4]=bases[i].concat(h[(i+1)%4].slice(8));r.riichi=[false,false,false,false];detail='全員の8枚を右隣へ大移動'}
 else if(id==='jackpot'){const n=Math.min(5,w.length),choice=Number(data?.choice),discardIndex=Number(data?.discard);if(!Number.isInteger(choice)||choice<0||choice>=n||!Number.isInteger(discardIndex)||discardIndex<0||discardIndex>=h[p].length)return s?.emit('errorMessage','山と自分の牌をプルダウンで選択してください');const wi=w.length-n+choice,old=h[p][discardIndex];h[p][discardIndex]=w.splice(wi,1)[0];w.push(old);shuffle(w);h[p].sort((a,b)=>a-b);detail='山の上5枚から好きな1枚を交換'}
 else if(id==='triplefactory'){const counts=new Map();for(const t of w)counts.set(t,(counts.get(t)||0)+1);const candidates=[...counts].filter(([id,n])=>n>=3).map(([id])=>id);if(!candidates.length)return s?.emit('errorMessage','山に3枚ある牌がありません');const v=candidates[crypto.randomInt(candidates.length)],ids=zjRandomIndices(3,h[p].length);for(const i of ids){const wi=w.indexOf(v),old=h[p][i];h[p][i]=w.splice(wi,1)[0];w.push(old)}shuffle(w);h[p].sort((a,b)=>a-b);detail=(r.config.tiles[v-1]?.name||v)+'の暗刻を作成'}
 else if(id==='leaderfall'){const top=r.scores.indexOf(Math.max(...r.scores));r.scores[top]-=6000;for(let i=0;i<4;i++)if(i!==top)r.scores[i]+=2000;detail=r.players[top].name+'が6,000点失い他3人が2,000点獲得'}
 else if(id==='riichicancel'){a.riichiCancelCount=(a.riichiCancelCount||0)+1;let changed=0;for(let i=0;i<4;i++)if(r.riichi[i]){if(zjBreakRealRiichi(r,i))changed++;else r.riichi[i]=false}detail='完成した3枚組を崩してリーチ解除（交換'+changed+'人／この局 '+a.riichiCancelCount+'/2回）'}
 else if(id==='palpunte'){const outcome=zjDoPalpunte(r,p);detail=outcome.message}
 else if(id==='doublepoints')e[p].doublepoints=true;
 else if(id==='handraid'){const n=Math.min(3,h[p].length,h[target].length),left=zjRandomIndices(n,h[p].length),right=zjRandomIndices(n,h[target].length);for(let k=0;k<n;k++)[h[p][left[k]],h[target][right[k]]]=[h[target][right[k]],h[p][left[k]]];h[p].sort((a,b)=>a-b);h[target].sort((a,b)=>a-b);detail='3枚ずつ強制交換'}
 else if(id==='selfreset'){r.riichi[p]=false;const count=zjSwapWall(r,p,5);detail=count+'枚を引き直し'}
 else if(id==='timefreeze'){for(let i=0;i<4;i++)if(i!==p)zjAddFreeze(r,i,p,'timefreeze',1);detail='他の3人の次の手番をスキップ'}
 else if(id==='wildhunt'){const wi=w.indexOf(wildId(r));if(wi<0)return s?.emit('errorMessage','山に特別牌がありません');const i=crypto.randomInt(h[p].length),old=h[p][i];h[p][i]=w.splice(wi,1)[0];w.push(old);shuffle(w);h[p].sort((a,b)=>a-b);detail='特別牌を獲得'}
 else return s?.emit('errorMessage','未対応のアイテムです');
 if(a.tickets[p]>0)a.tickets[p]--;else if(a.bags[p].includes(id))a.bags[p].splice(a.bags[p].indexOf(id),1);else r.scores[p]-=x[2];a.used[p]++;
 if(!ZJ_PASSIVE.has(id))zjEffect(r,p,id,victim,detail);
 if(id==='palpunte'){clearTimeout(r.timer);schedule(r)}
 else if(r.turn===p&&r.phase==='playing'&&r.riichi[p])schedule(r);
 broadcast(r);
}

function broadcast(r){for(let i=0;i<4;i++){const p=r.players[i];if(p?.socket){const s=io.sockets.sockets.get(p.socket);if(s)s.emit('state',state(r,i))}}}
function state(r,seat){
 const h=r.hands?.[seat]||[];
 const readyDiscards=r.phase==='playing'&&r.turn===seat&&r.drawn&&!r.riichi[seat]&&h.length===9
  ?h.flatMap((_,i)=>tenpai(r,h.filter((__,j)=>i!==j))?[i]:[]):[];
 return {readyDiscards,bgmTrack:r.bgmTrack??0,code:r.code,seat,host:r.host===r.players[seat]?.token,phase:r.phase,round:r.round,maxRounds:r.maxRounds,turn:r.turn,firstDice:r.firstDice||null,startSeat:r.startSeat??0,drawn:r.drawn,wallCount:r.wall?.length||0,scores:r.scores,riichi:r.riichi,discards:r.discards,discardHistory:r.discardHistory||[],hand:r.hands?.[seat]||[],handCounts:r.hands?.map(h=>h.length)||[0,0,0,0],players:r.players.map(p=>p?{name:p.name,cpu:!!p.cpu,connected:!!p.socket}:null),result:r.result,config:r.config,tableTheme:r.tableTheme||1,logs:r.logs.slice(-12),items:zjPublicItems(r,seat),visibleHands:r.items?.effects[seat]?.openall?r.hands.map(h=>h.slice()):null,deadline:r.deadline||0}}
function log(r,s){r.logs.push(s);if(r.logs.length>100)r.logs.shift()}
function schedule(r){
 clearTimeout(r.timer);
 if(r.boxing)return;
 if(r.phase!=='playing')return;
 let count=0;
 while(!r.drawn&&r.items?.effects[r.turn]?.frozen>0&&count<20){
  const blocked=r.turn;zjConsumeFreeze(r,blocked);count++;
  log(r,'🧊 '+r.players[blocked].name+'は金縛りで手番をスキップ！ 残り'+r.items.effects[blocked].frozen+'回');
  r.turn=(blocked+1)%4;
 }
 if(count)broadcast(r);
 const isCpu=!!r.players[r.turn]?.cpu;
 const isRiichi=!!r.riichi?.[r.turn];
 const delay=isCpu?(r.drawn?400:200):isRiichi?(r.drawn?450:200):(r.drawn?15000:200);
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
r.turn=r.startSeat??0;r.drawn=false;r.result=null;r.phase='playing';
// Keep one room-wide soundtrack for the entire game, including subsequent rounds.
if(!Number.isInteger(r.bgmTrack))r.bgmTrack=crypto.randomInt(5);
for(let k=0;k<8;k++)for(let i=0;i<4;i++)r.hands[i].push(r.wall.pop());r.hands.forEach(h=>h.sort((a,b)=>a-b));r.roundOpening={hands:r.hands.map(v=>v.slice()),wall:r.wall.slice(),discards:r.discards.map(v=>v.slice()),scores:r.scores.slice(),turn:r.turn,bgmTrack:r.bgmTrack,tableTheme:r.tableTheme};log(r,r.round===1?`🎲 サイコロ ${r.firstDice}！部屋主から右回りで${r.firstDice}人目：${r.players[r.startSeat].name}がスタート！`:`第${r.round}局 はじめ！`);schedule(r);broadcast(r);return null}
// Persistent player ranking (independent from git checkout and game-config).
const ZJ_RANK_LEVELS=[['BRONZE',0],['SILVER',500],['GOLD',1000],['PLATINUM',2000],['DIAMOND',3500],['MASTER',5500],['HIGH MASTER',8000],['GRAND MASTER',11000],['ULTIMATE GRAND MASTER',15000],['LEGEND',50000]];
const ZJ_LP_FILE=process.env.ZAMAJAN_LP_FILE||path.join(path.dirname(SERVER_CONFIG_FILE),'player-lp.json');
let zjLpStore={schemaVersion:1,players:{}};
try{const data=JSON.parse(fs.readFileSync(ZJ_LP_FILE,'utf8'));if(data&&data.schemaVersion===1&&data.players&&typeof data.players==='object'){zjLpStore=data;for(const rec of Object.values(zjLpStore.players)){if(rec&&typeof rec==='object')rec.lp=Math.max(0,Number(rec.lp)||0)}}}catch(e){if(e.code!=='ENOENT')console.warn('LP saved data could not be loaded:',e.message)}
function zjRank(lp){let rank=ZJ_RANK_LEVELS[0][0];for(const [name,min] of ZJ_RANK_LEVELS)if(lp>=min)rank=name;return rank}
function zjSaveLp(){const dir=path.dirname(ZJ_LP_FILE);fs.mkdirSync(dir,{recursive:true,mode:0o700});const tmp=ZJ_LP_FILE+'.tmp-'+process.pid;try{fs.writeFileSync(tmp,JSON.stringify(zjLpStore,null,2),{mode:0o600});fs.renameSync(tmp,ZJ_LP_FILE)}finally{try{fs.unlinkSync(tmp)}catch{}}}
// Names are temporary ranking IDs until account-based player authentication is introduced.
function zjLpName(player){return safe(player?.name||'').trim().slice(0,20)}
function zjAwardLp(r,result){
 if(result.method!=='ツモ'&&result.method!=='ロン')return;
 const winner=result.winner;if(!Number.isInteger(winner)||winner<0||winner>=4)return;
 const updates=new Map();
 for(let i=0;i<4;i++){
  const player=r.players[i];if(!player||player.cpu)continue;
  const key=zjLpName(player);if(!key)continue;
  const prev=updates.get(key)||zjLpStore.players[key]||{lp:0,streak:0,wins:0,losses:0};
  // The loser is every other human participant (not only the ron discarder).
  if(i===winner){
   const streak=Math.min(40,Math.max(0,prev.streak||0)+1);
   const base=(result.method==='ツモ'?50:30)+Math.floor(Math.max(0,Number(result.points)||0)/5000)*10;
   const multiplier=streak>=3?2**Math.min(10,streak-2):1;
   updates.set(key,{...prev,lp:Math.min(Number.MAX_SAFE_INTEGER,Math.max(0,(prev.lp||0)+base*multiplier)),streak,wins:(prev.wins||0)+1,lastGain:base*multiplier,updatedAt:new Date().toISOString()});
  }else updates.set(key,{...prev,lp:Math.max(0,(prev.lp||0)-10),streak:0,losses:(prev.losses||0)+1,lastGain:-10,updatedAt:new Date().toISOString()});
 }
 for(const [key,value] of updates)zjLpStore.players[key]=value;
 try{zjSaveLp()}catch(e){console.error('LP persistence failed:',e.message)}
}
app.get('/api/ranks',(req,res)=>{res.set('Cache-Control','no-store');const players=Object.entries(zjLpStore.players).map(([name,p])=>({name,lp:Math.max(0,Number(p.lp)||0),rank:zjRank(Math.max(0,Number(p.lp)||0)),streak:p.streak||0,wins:p.wins||0,losses:p.losses||0})).sort((a,b)=>b.lp-a.lp||a.name.localeCompare(b.name,'ja')).slice(0,200);res.json({levels:ZJ_RANK_LEVELS.map(([name,lp])=>({name,minLp:lp})),players})});
function finish(r,result){if(r.phase==='result')return;zjAwardLp(r,result);clearTimeout(r.timer);r.deadline=0;r.phase='result';r.result=result;log(r,result.method==='流局'?'流局':result.method==='ロン'?`${result.winnerName}が${result.loserName||r.players[result.loser]?.name||'相手'}からロン！`:`${result.winnerName}が${result.method}！`);broadcast(r)}
function zjScoreWin(r,p,hand,y,method,loser=null,winningTile=null){
 const b=zjWinBonuses(r,p,hand),rolePoints=Math.round(y.points*b.multiplier),bonus=ownBonus(r,p,hand)?1000:0;
 for(let i=0;i<4;i++)if(i!==p){if(method==='ロン'&&loser!==i)continue;const payment=rolePoints;r.scores[i]-=payment;r.scores[p]+=payment}
 r.scores[p]+=b.ojBonus-b.manaPenalty+bonus;
 const actual=method==='ロン'?rolePoints:rolePoints*3;
 finish(r,{method,winner:p,winnerName:r.players[p].name,...(loser!==null?{loser,loserName:r.players[loser].name}:{}),yaku:y.name,points:actual+b.ojBonus-b.manaPenalty+bonus,rolePoints,basePoints:actual,ojBonus:b.ojBonus,manaPenalty:b.manaPenalty,ownBonus:bonus,hand:hand.slice(),winningTile:winningTile??hand.at(-1),groups:resultGroups(r,hand,y)});
}
function zjFinishDraw(r,p,t){r.hands[p].push(t);r.drawn=true;const y=win(r,r.hands[p]);if(y){zjScoreWin(r,p,r.hands[p],y,'ツモ',null,t);return}schedule(r);broadcast(r)}
function draw(r,p){if(r.boxing)return;if(r.phase!=='playing'||r.turn!==p||r.drawn)return;if(!r.wall.length){finish(r,{method:'流局'});return}zjFinishDraw(r,p,r.wall.pop())}
function discard(r,p,index){if(r.boxing)return;if(r.phase!=='playing'||r.turn!==p||!r.drawn||!Number.isInteger(index)||index<0||index>=r.hands[p].length)return;const t=r.hands[p].splice(index,1)[0];r.discards[p].push(t);r.discardHistory.push({seat:p,id:t});r.hands[p].sort((a,b)=>a-b);r.drawn=false;log(r,`${r.players[p].name}が${r.config.tiles[t-1].name}を捨てた`);if(!r.riichi[p]&&tenpai(r,r.hands[p])){r.riichi[p]=true;r.discardHistory[r.discardHistory.length-1].riichi=true;log(r,`${r.players[p].name} リーチ！（供託なし・宣言牌：${r.config.tiles[t-1].name}）`)}for(let k=1;k<4;k++){const q=(p+k)%4;if(!r.riichi[q])continue;const hand=[...r.hands[q],t],y=win(r,hand);if(y){zjScoreWin(r,q,hand,y,'ロン',p,t);return}}if(!r.wall.length){finish(r,{method:'流局'});return}r.turn=(p+1)%4;schedule(r);broadcast(r)}
function cpuAct(r){if(r.boxing)return;if(r.phase!=='playing')return;const p=r.players[r.turn];if(!p||!p.cpu)return;
 const seat=r.turn;
 if(!r.drawn&&r.items?.tickets[seat]>0&&r.items.used[seat]<r.items.limit){
  const candidates=['openall','hightriple','festival','revolution','freeze','leaderfall','riichiswap','mirror','timefreeze','steal','triplefactory','selfreset','wildhunt','doublepoints','oj','mana2','handraid','riichicancel'].filter(id=>zjAllowed(r,seat,id));
  if(candidates.length){const id=candidates[crypto.randomInt(candidates.length)],targets=[0,1,2,3].filter(i=>i!==seat&&(id!=='riichiswap'||r.riichi[i]));if(!ZJ_TARGETED.has(id)||targets.length){const target=ZJ_TARGETED.has(id)?targets[crypto.randomInt(targets.length)]:null;zjUse(r,seat,{id,target},null);if(r.turn!==seat||r.phase!=='playing')return}}
 }
 if(r.drawn){const h=r.hands[r.turn];const counts={};h.forEach(x=>counts[x]=(counts[x]||0)+1);const idx=r.riichi[r.turn]?h.length-1:h.map((x,i)=>({x,i,c:counts[x]})).sort((a,b)=>a.c-b.c)[0].i;discard(r,r.turn,idx)}else draw(r,r.turn)}

function makeCode(){let c;do{c=String(crypto.randomInt(100000,1000000))}while(rooms.has(c));return c}
function join(s,r,name,token){let seat=r.players.findIndex(p=>p&&p.token===token);if(seat<0){if(r.phase!=='lobby')return s.emit('errorMessage','対戦開始後は新規参加できません');seat=r.players.findIndex(p=>!p);if(seat<0)return s.emit('errorMessage','満員です');token=crypto.randomUUID();r.players[seat]={name:safe(name)||`プレイヤー${seat+1}`,token,socket:s.id,cpu:false}}else{r.players[seat].socket=s.id;r.players[seat].cpu=false} s.join(r.code);s.data.room=r.code;s.data.seat=seat;s.data.token=token;s.emit('joined',{code:r.code,seat,token});broadcast(r);if(r.boxing)s.emit('riichiFightStart',{id:r.boxing.id,actor:r.boxing.actor,target:r.boxing.target,startsAt:r.boxing.startsAt,endsAt:r.boxing.endsAt,actorName:r.players[r.boxing.actor].name,targetName:r.players[r.boxing.target].name})}
io.on('connection',s=>{
 s.on('create',({name,config,maxRounds,itemMode,itemLimit,tableThemeChoice,bgmChoice}={})=>{const code=makeCode(),token=crypto.randomUUID();const r={code,host:token,players:[{name:safe(name)||'あなた',token,socket:s.id,cpu:false},null,null,null],config:configFrom(sharedConfig||config),maxRounds:[1,2,4,8,12,16,20].includes(+maxRounds)?+maxRounds:4,phase:'lobby',itemMode:['both','last','paid','off'].includes(itemMode)?itemMode:'both',itemLimit:[1,2,3].includes(+itemLimit)?+itemLimit:1,round:1,bgmTrack:/^[0-4]$/.test(String(bgmChoice??''))?Number(bgmChoice):crypto.randomInt(5),tableTheme:/^[1-8]$/.test(String(tableThemeChoice||''))?Number(tableThemeChoice):crypto.randomInt(1,9),scores:[30000,30000,30000,30000],hands:null,discards:[[],[],[],[]],discardHistory:[],riichi:[false,false,false,false],logs:[],deadline:0};zjInitItems(r);rooms.set(code,r);s.join(code);s.data={room:code,seat:0,token};s.emit('joined',{code,seat:0,token});broadcast(r)});
 s.on('join',({code,name,token}={})=>{const r=rooms.get(String(code));if(!r)return s.emit('errorMessage','ルームが見つかりません');join(s,r,name,token)});
 s.on('start',()=>{const r=rooms.get(s.data.room);if(!r||r.host!==s.data.token||r.phase!=='lobby')return;for(let i=0;i<4;i++)if(!r.players[i])r.players[i]={name:randomCpuName(r.players.filter(Boolean).map(p=>p.name)),cpu:true,socket:null,token:null};const err=roundStart(r);if(err)s.emit('errorMessage',err)});
 s.on('itemUse',data=>{const r=rooms.get(s.data.room);const p=s.data.seat;if(!r||!Number.isInteger(p)||r.players[p]?.token!==s.data.token||r.players[p]?.cpu)return;zjUse(r,p,data,s)});
 s.on('riichiFightPunch',({id}={})=>{const r=rooms.get(s.data.room),p=s.data.seat;if(r&&Number.isInteger(p)&&r.players[p]?.token===s.data.token&&!r.players[p]?.cpu)zjRiichiFightPunch(r,p,id)});
 s.on('itemOptions',({id}={})=>{const r=rooms.get(s.data.room),p=s.data.seat;if(!r||r.players[p]?.token!==s.data.token||!zjAllowed(r,p,id))return;
  if(id==='jackpot'){const n=Math.min(5,r.wall.length);s.emit('itemOptions',{id,wall:r.wall.slice(-n).map((v,i)=>({index:i,name:r.config.tiles[v-1]?.name||String(v)})),hand:r.hands[p].map((v,i)=>({index:i,name:r.config.tiles[v-1]?.name||String(v)}))})}
 });
 s.on('draw',()=>{const r=rooms.get(s.data.room);if(r&&r.players[r.turn]?.token===s.data.token&&!r.riichi[r.turn])draw(r,r.turn)});
 s.on('discard',i=>{const r=rooms.get(s.data.room);if(r&&r.players[r.turn]?.token===s.data.token&&!r.riichi[r.turn])discard(r,r.turn,i)});
 // One-click tile action: if the 0.2-second automatic draw is still pending,
 // draw first and then discard this selected tile. Server remains authoritative.
 s.on('playTile',i=>{
  const r=rooms.get(s.data.room);
  if(!r||r.boxing||r.phase!=='playing'||r.pendingDouble||r.players[r.turn]?.token!==s.data.token||r.riichi[r.turn])return;
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
 s.on('leave',()=>{const r=rooms.get(s.data.room),seat=s.data.seat,p=r?.players[seat];if(!r||!p||p.socket!==s.id||p.token!==s.data.token){if(s.data.room)s.leave(s.data.room);s.data={};return}s.leave(r.code);s.data={};handoff(r,seat,'退出')});
 s.on('disconnect',()=>{const r=rooms.get(s.data.room),seat=s.data.seat,p=r?.players[seat];if(p&&p.socket===s.id){p.socket=null;broadcast(r);const token=p.token;setTimeout(()=>{const q=r.players[seat];if(q&&q.token===token&&!q.socket&&rooms.has(r.code))handoff(r,seat,'切断')},20000)}});

});
setInterval(()=>{for(const [c,r] of rooms){if(!r.players.some(p=>p?.socket)&&r.phase!=='playing'){clearTimeout(r.timer);rooms.delete(c)}else if(r.phase==='result'&&!r.host){if(r.round>=r.maxRounds){r.phase='final';r.result={method:'最終結果'};broadcast(r)}else{r.round++;roundStart(r)}}}},60000);
fetchGitHubConfig().finally(()=>server.listen(process.env.PORT||3000,()=>console.log('Zamajan online listening')));

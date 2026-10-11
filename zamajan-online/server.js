'use strict';
const express=require('express'),http=require('http'),{Server}=require('socket.io'),crypto=require('crypto');
const app=express(),server=http.createServer(app),io=new Server(server,{maxHttpBufferSize:24e6});
app.use(express.static('public'));app.get('/',(req,res)=>res.redirect('/online.html'));
const rooms=new Map(), names=['ねこ','いぬ','うさぎ','くま','きつね','パンダ','さる','とり','かえる','ライオン','ぞう','ぶた','うし','ねずみ','コアラ','とら','ひつじ','うま','たぬき','りす','特別牌'];
const emojis=['🐱','🐶','🐰','🐻','🦊','🐼','🐵','🐦','🐸','🦁','🐘','🐷','🐮','🐭','🐨','🐯','🐑','🐴','🦝','🐿️','⭐'];
const safe=(x,n=20)=>String(x||'').slice(0,n).replace(/[<>]/g,'');
const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=crypto.randomInt(i+1);[a[i],a[j]]=[a[j],a[i]]}return a};
function configFrom(x){
 const input=Array.isArray(x?.tiles)&&x.tiles.length>=1&&x.tiles.length<=100?x.tiles:null;
 const tiles=(input||names.map((name,i)=>({name,emoji:emojis[i],count:i===20?1:9,wild:i===20}))).map((t,i)=>({
  id:i+1,name:safe(t?.name||names[i]||`牌${i+1}`),emoji:safe(t?.emoji||emojis[i]||'🀄',6),
  image:typeof t?.image==='string'&&t.image.length<=600000&&/^data:image\/(png|jpeg|webp);base64,/.test(t.image)?t.image:null,
  count:Math.max(0,Math.min(40,Number.isFinite(+t?.count)?Math.floor(+t.count):9)),
  imageOnly:!!t?.imageOnly,wild:!!t?.wild
 }));
 // Older saved settings identified tile 21 as the special tile.
 if(!tiles.some(t=>t.wild)&&!x?.wildDeleted&&tiles.length>=21&&tiles[20].name==='特別牌')tiles[20].wild=true;
 const wild=tiles.find(t=>t.wild);if(wild)tiles.forEach(t=>{t.wild=t.id===wild.id});
 const yaku=(Array.isArray(x?.yaku)?x.yaku:[]).slice(0,100).filter(y=>Array.isArray(y.pattern)&&y.pattern.length>=1&&y.pattern.length<=9&&y.pattern.every(n=>Number.isInteger(n)&&n>=1&&n<=tiles.length)).map(y=>({name:safe(y.name),points:Math.max(1,Math.min(100000,Math.floor(+y.points||1000))),pattern:y.pattern}));
 return {tiles,yaku,wildDeleted:!!x?.wildDeleted};
}
function wildId(r){return r.config.tiles.find(t=>t.wild)?.id||0}
function patternWin(r,hand,pattern){
 if(hand.length!==9||!Array.isArray(pattern)||pattern.length<1||pattern.length>9)return false;
 const wild=wildId(r),have=new Map(),need=new Map();
 for(const id of hand)if(id!==wild)have.set(id,(have.get(id)||0)+1);
 for(const id of pattern)if(id!==wild)need.set(id,(need.get(id)||0)+1);
 let missing=0;for(const [id,n] of need)missing+=Math.max(0,n-(have.get(id)||0));
 const available=wild?hand.filter(id=>id===wild).length:0;
 const requestedWild=pattern.filter(id=>id===wild).length;
 return requestedWild<=available&&missing<=available-requestedWild;
}
function tripleWin(r,hand){
 const wild=wildId(r),counts=Array(r.config.tiles.length+1).fill(0);hand.forEach(n=>counts[n]++);
 let missing=0;for(let i=1;i<counts.length;i++){if(i===wild)continue;missing+=(3-counts[i]%3)%3}
 const available=wild?counts[wild]:0;return missing<=available&&(available-missing)%3===0;
}
function win(room,hand){if(hand.length!==9)return null;const matches=[];if(tripleWin(room,hand))matches.push({name:'三組そろえ',points:1000});for(const y of room.config.yaku)if(patternWin(room,hand,y.pattern))matches.push(y);return matches.sort((a,b)=>b.points-a.points)[0]||null}
// Result layout: form three actual groups of three, preserving the wildcard tile.
function resultGroups(r,hand,yaku){
 const wild=wildId(r), counts=new Map();for(const id of hand)if(id!==wild)counts.set(id,(counts.get(id)||0)+1);
 let remaining=wild?hand.filter(id=>id===wild).length:0;
 let targets=[];
 if(yaku&&Array.isArray(yaku.pattern)){
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
function tenpai(r,hand){return r.config.tiles.some(t=>t.count>0&&win(r,[...hand,t.id]))}
function broadcast(r){for(let i=0;i<4;i++){const p=r.players[i];if(p?.socket){const s=io.sockets.sockets.get(p.socket);if(s)s.emit('state',state(r,i))}}}
function state(r,seat){return {code:r.code,seat,host:r.host===r.players[seat]?.token,phase:r.phase,round:r.round,maxRounds:r.maxRounds,turn:r.turn,drawn:r.drawn,wallCount:r.wall?.length||0,scores:r.scores,riichi:r.riichi,discards:r.discards,hand:r.hands?.[seat]||[],handCounts:r.hands?.map(h=>h.length)||[0,0,0,0],players:r.players.map(p=>p?{name:p.name,cpu:!!p.cpu,connected:!!p.socket}:null),result:r.result,config:r.config,logs:r.logs.slice(-12),deadline:r.deadline||0}}
function log(r,s){r.logs.push(s);if(r.logs.length>100)r.logs.shift()}
function schedule(r){
 clearTimeout(r.timer);
 if(r.phase!=='playing')return;
 const isCpu=!!r.players[r.turn]?.cpu;
 const delay=isCpu?(r.drawn?400:200):(r.drawn?15000:200);
 r.deadline=Date.now()+delay;
 const round=r.round,turn=r.turn,drawn=r.drawn;
 r.timer=setTimeout(()=>{
  if(r.phase!=='playing'||r.round!==round||r.turn!==turn||r.drawn!==drawn)return;
  if(r.players[turn]?.cpu){cpuAct(r);return}
  if(r.drawn)discard(r,turn,r.hands[turn].length-1);
  else draw(r,turn);
 },delay);
}
function roundStart(r){clearTimeout(r.timer);const deck=[];for(const t of r.config.tiles)for(let j=0;j<t.count;j++)deck.push(t.id);if(deck.length<33){r.phase='lobby';return '牌が33枚未満です'}shuffle(deck);r.hands=[[],[],[],[]];r.discards=[[],[],[],[]];r.riichi=[false,false,false,false];r.wall=deck;r.turn=0;r.drawn=false;r.result=null;r.phase='playing';for(let k=0;k<8;k++)for(let i=0;i<4;i++)r.hands[i].push(r.wall.pop());r.hands.forEach(h=>h.sort((a,b)=>a-b));log(r,`第${r.round}局 はじめ！`);schedule(r);broadcast(r);return null}
function finish(r,result){clearTimeout(r.timer);r.deadline=0;r.phase='result';r.result=result;log(r,result.method==='流局'?'流局':`${result.winnerName}が${result.method}！`);broadcast(r)}
function draw(r,p){if(r.phase!=='playing'||r.turn!==p||r.drawn)return;if(!r.wall.length){finish(r,{method:'流局'});return}const t=r.wall.pop();r.hands[p].push(t);r.drawn=true;const y=win(r,r.hands[p]);if(y){const gain=y.points*3;r.scores[p]+=gain;for(let i=0;i<4;i++)if(i!==p)r.scores[i]-=y.points;finish(r,{method:'ツモ',winner:p,winnerName:r.players[p].name,yaku:y.name,points:gain,hand:r.hands[p].slice(),groups:resultGroups(r,r.hands[p],y)});return}schedule(r);broadcast(r)}
function discard(r,p,index){if(r.phase!=='playing'||r.turn!==p||!r.drawn||!Number.isInteger(index)||index<0||index>=r.hands[p].length)return;const t=r.hands[p].splice(index,1)[0];r.discards[p].push(t);r.hands[p].sort((a,b)=>a-b);r.drawn=false;log(r,`${r.players[p].name}が${r.config.tiles[t-1].name}を捨てた`);if(!r.riichi[p]&&r.scores[p]>=1000&&tenpai(r,r.hands[p])){r.riichi[p]=true;r.scores[p]-=1000;log(r,`${r.players[p].name} リーチ！`)}for(let k=1;k<4;k++){const q=(p+k)%4;if(!r.riichi[q])continue;const hand=[...r.hands[q],t],y=win(r,hand);if(y){r.scores[q]+=y.points;r.scores[p]-=y.points;finish(r,{method:'ロン',winner:q,winnerName:r.players[q].name,loser:p,yaku:y.name,points:y.points,hand,groups:resultGroups(r,hand,y)});return}}if(!r.wall.length){finish(r,{method:'流局'});return}r.turn=(p+1)%4;schedule(r);broadcast(r)}
function cpuAct(r){if(r.phase!=='playing')return;const p=r.players[r.turn];if(!p||!p.cpu)return;if(r.drawn){const h=r.hands[r.turn];const counts={};h.forEach(x=>counts[x]=(counts[x]||0)+1);const idx=r.riichi[r.turn]?h.length-1:h.map((x,i)=>({x,i,c:counts[x]})).sort((a,b)=>a.c-b.c)[0].i;discard(r,r.turn,idx)}else draw(r,r.turn)}

function makeCode(){let c;do{c=String(crypto.randomInt(100000,1000000))}while(rooms.has(c));return c}
function join(s,r,name,token){let seat=r.players.findIndex(p=>p&&p.token===token);if(seat<0){if(r.phase!=='lobby')return s.emit('errorMessage','対戦開始後は新規参加できません');seat=r.players.findIndex(p=>!p);if(seat<0)return s.emit('errorMessage','満員です');token=crypto.randomUUID();r.players[seat]={name:safe(name)||`プレイヤー${seat+1}`,token,socket:s.id,cpu:false}}else{r.players[seat].socket=s.id;r.players[seat].cpu=false} s.data.room=r.code;s.data.seat=seat;s.data.token=token;s.emit('joined',{code:r.code,seat,token});broadcast(r)}
io.on('connection',s=>{
 s.on('create',({name,config,maxRounds}={})=>{const code=makeCode(),token=crypto.randomUUID();const r={code,host:token,players:[{name:safe(name)||'あなた',token,socket:s.id,cpu:false},null,null,null],config:configFrom(config),maxRounds:[1,2,4,8,12,16,20].includes(+maxRounds)?+maxRounds:4,phase:'lobby',round:1,scores:[10000,10000,10000,10000],hands:null,discards:[[],[],[],[]],riichi:[false,false,false,false],logs:[],deadline:0};rooms.set(code,r);s.data={room:code,seat:0,token};s.emit('joined',{code,seat:0,token});broadcast(r)});
 s.on('join',({code,name,token}={})=>{const r=rooms.get(String(code));if(!r)return s.emit('errorMessage','ルームが見つかりません');join(s,r,name,token)});
 s.on('start',()=>{const r=rooms.get(s.data.room);if(!r||r.host!==s.data.token||r.phase!=='lobby')return;for(let i=0;i<4;i++)if(!r.players[i])r.players[i]={name:`CPU${i+1}`,cpu:true,socket:null,token:null};const err=roundStart(r);if(err)s.emit('errorMessage',err)});
 s.on('draw',()=>{const r=rooms.get(s.data.room);if(r&&r.players[r.turn]?.token===s.data.token)draw(r,r.turn)});
 s.on('discard',i=>{const r=rooms.get(s.data.room);if(r&&r.players[r.turn]?.token===s.data.token)discard(r,r.turn,i)});
 s.on('next',()=>{const r=rooms.get(s.data.room);if(!r||r.phase!=='result'||r.host!==s.data.token)return;if(r.round>=r.maxRounds){r.phase='final';r.result={method:'最終結果'};broadcast(r)}else{r.round++;roundStart(r)}});
 function handoff(r,seat,reason){const p=r.players[seat];if(!p)return;if(r.phase==='lobby'){if(r.host===p.token){clearTimeout(r.timer);rooms.delete(r.code);for(const client of io.sockets.sockets.values())if(client.data.room===r.code){client.data={};client.emit('roomClosed','部屋主が退出したため、部屋を終了しました')}}else{r.players[seat]=null;broadcast(r)}return}
  const wasHost=r.host===p.token;
  p.socket=null;p.cpu=true;p.token=null;p.name=`CPU${seat+1}`;
  log(r,`${seat+1}番が${reason}したため、手牌と点数をそのままCPUが引き継ぎました`);
  if(wasHost){const successor=r.players.find(x=>x&&!x.cpu&&x.token&&x.socket);r.host=successor?.token||null}
  if(r.phase==='playing'&&r.turn===seat)schedule(r);
  broadcast(r);
 }
 s.on('leave',()=>{const r=rooms.get(s.data.room),seat=s.data.seat,p=r?.players[seat];if(!r||!p||p.socket!==s.id||p.token!==s.data.token){s.data={};return}s.data={};handoff(r,seat,'退出')});
 s.on('disconnect',()=>{const r=rooms.get(s.data.room),seat=s.data.seat,p=r?.players[seat];if(p&&p.socket===s.id){p.socket=null;broadcast(r);const token=p.token;setTimeout(()=>{const q=r.players[seat];if(q&&q.token===token&&!q.socket&&rooms.has(r.code))handoff(r,seat,'切断')},20000)}});

});
setInterval(()=>{for(const [c,r] of rooms){if(!r.players.some(p=>p?.socket)&&r.phase!=='playing'){clearTimeout(r.timer);rooms.delete(c)}else if(r.phase==='result'&&!r.host){if(r.round>=r.maxRounds){r.phase='final';r.result={method:'最終結果'};broadcast(r)}else{r.round++;roundStart(r)}}}},60000);
server.listen(process.env.PORT||3000,()=>console.log('Zamajan online listening'));

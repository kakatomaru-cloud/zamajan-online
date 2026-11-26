'use strict';
const ZamaPractice=(()=>{
 const kinds=['英字・大文字','数字','記号と数字','ローマ字','日本語IME'];
 const source=[
  ['The quick brown fox jumps over the lazy dog.','PACK MY BOX WITH FIVE DOZEN LIQUOR JUGS','Tokyo to Kyoto','Check the next train','ZAMA TYPE Master','Keep your hands relaxed','New Project Draft','Update the ZIP file'],
  ['0123456789','9071 4268 35','2026 11 26','470 218 965','13579 24680','1200 4050 8700','003 408 759 261'],
  ['09:30 - 18:00','10% + 25% = 35%','ID: A7_B2','[draft] v2.1','{x: 12, y: 8}','user@example.com','C:\\Temp\\log.txt','A/B & C/D','3 * (4 + 5) = 27','https://example.com/#top','"Hello!"','don\'t stop','Use <tag> and </tag>','~ ^ | ? $','¥1,200','`+String.fromCharCode(96)+`code`+String.fromCharCode(96)+` ; _ @ #'],
  ['あさのよていをかくにんする','いきさきのちずをひらく','おつかれさまでした','よろしくおねがいします','しゅっせきのへんじをおくる','ひつようなものをとりにいく','おいそがしいところすみません','ごかくにんをおねがいします','きをつけておかえりください','じかんがきまったらおしえてください'],
  ['よろしくお願いします。','ご確認をお願いします。','添付資料をご覧ください。','会議は14時30分からです。','来週の予定を共有します。','新しいファイルを保存します。','お名前と連絡先を入力してください。','第2会議室でお待ちしています。','質問があれば、お知らせください。','次の駅で乗り換えます。','明日は10時に出発します。']
 ];
 const pools=source.map((items,kind)=>items.map(text=>({kind,text:kind===3?globalThis.ZamaEngine.display(text).toLowerCase():text,reading:kind===3?text:''})));
 const normalize=value=>value.normalize('NFKC');
 const bosses=[
  ['黒炎竜 イグニス','midboss-dragon.webp','🐉',2],
  ['魔獣 ベヒーモス','midboss-behemoth.webp','🐗',2],
  ['魔眼 アーリマン','midboss-ahriman.webp','👁️',2],
  ['深淵の神官 アビス','abyss-priest.webp','🔮',3],
  ['終焉の魔王 アビスロード','abyss-lord.webp','💀',4]
 ];
 const glyphs=['💧','🦇','🐺','👻','👺','💀','🦎','🕷️','🐉'];
 function enemy(stage,loop){
  if(stage>=30)return bosses[stage-30];
  const roster=globalThis.ZamaEngine.ENEMIES;
  const index=(stage+(loop-1)*7)%roster.length;
  return [roster[index].name,'',glyphs[index%glyphs.length],1];
 }
 function weakest(stats){
  return Object.entries(stats).filter(([,v])=>v.need>0).sort((a,b)=>b[1].need-a[1].need||b[1].miss-a[1].miss);
 }
 function create(stats=Object.create(null),random=Math.random){
  return {stats,random,stage:0,loop:1,cleared:0,questions:0,attempts:0,mistakes:0,recent:[],rotation:0,hp:1};
 }
 function question(state){
  const weak=weakest(state.stats).slice(0,3);
  const step=state.questions++;
  const kind=state.rotation%pools.length;
  const focused=weak.length&&(step%4===1||step%4===3);
  const key=focused?weak[Math.floor(step/2)%weak.length][0]:'';
  const full=pools.flat();
  let eligible;
  if(key){
   eligible=full.filter(item=>normalize(item.text).includes(key)&&!state.recent.includes(item.text));
   if(!eligible.length){
    const token=key===' '?'A B C':key+' '+key+' '+key;
    return {kind:4,text:token,reading:'',key,drill:true};
   }
  }else{
   state.rotation++;
   eligible=pools[kind].filter(item=>!state.recent.includes(item.text));
   if(!eligible.length)eligible=pools[kind];
  }
  const item=eligible[Math.floor(state.random()*eligible.length)];
  state.recent.push(item.text);
  if(state.recent.length>12)state.recent.shift();
  return {...item,key};
 }
 function record(state,key,correct){
  state.attempts++;
  if(!correct)state.mistakes++;
  if(!key||(key!==' '&&key.trim()===''))return;
  const entry=state.stats[key]??={miss:0,need:0};
  if(correct)entry.need=Math.max(0,entry.need-1);
  else{
   entry.miss++;
   entry.need=Math.min(24,entry.need+4);
  }
  if(!entry.miss&&!entry.need)delete state.stats[key];
 }
 function hit(state){
  if(--state.hp>0)return false;
  state.cleared++;
  state.stage++;
  if(state.stage===35){state.stage=0;state.loop++;}
  state.hp=enemy(state.stage,state.loop)[3];
  return true;
 }
 return {create,enemy,kinds,question,record,hit,weakest,normalize};
})();
if(typeof module==='object')module.exports=ZamaPractice;

if(typeof document!=='undefined'){
 const E=ZamaPractice;
 const byId=id=>document.getElementById(id);
 const profilePrefix='zamatype:practice-profile:v1:';
 const lastProfileKey='zamatype:practice-last-profile:v1';
 const answer=byId('answer'),nameField=byId('playerName');
 const format=new Intl.NumberFormat('ja-JP');
 let profileName='',profile,session;
 let current,goal,credited=0,previous='',composing=false;
 function readProfile(name,fallback){
  try{
   const saved=JSON.parse(localStorage.getItem(profilePrefix+name));
   if(saved)return {attempts:saved.attempts,misses:saved.misses,keys:Object.assign(Object.create(null),saved.keys)};
  }catch{}
  return fallback??{attempts:0,misses:0,keys:Object.create(null)};
 }
 function openProfile(name){
  if(name===profileName){
   profile=readProfile(name,profile);
   session.stats=profile.keys;
   updateStats();
   answer.focus();
   return;
  }
  profileName=name;
  profile=readProfile(name);
  session=E.create(profile.keys);
  composing=false;
  try{localStorage.setItem(lastProfileKey,name);}catch{}
  byId('profileLabel').textContent=name+' の記録';
  byId('feedback').textContent='';
  byId('practiceLayout').hidden=false;
  renderEnemy();
  updateStats();
  nextQuestion();
  answer.focus();
 }
 const describe=key=>key===' '?'スペース':key;
 function updateStats(){
  byId('clears').textContent='撃破数 '+session.cleared;
  byId('accuracy').textContent=session.attempts
   ?'正確率 '+Math.round(100*(session.attempts-session.mistakes)/session.attempts)+'%'
   :'正確率 —';
  byId('totalAttempts').textContent=format.format(profile.attempts);
  byId('totalMisses').textContent=format.format(profile.misses);
  const weak=E.weakest(profile.keys).slice(0,5);
  byId('weakKeys').replaceChildren(...(weak.length?weak:[['記録なし']]).map(([key])=>{
   const li=document.createElement('li');
   li.textContent=describe(key);
   return li;
  }));
 }
 function save(attempts,misses){
  profile.attempts+=session.attempts-attempts;
  profile.misses+=session.mistakes-misses;
  try{
   localStorage.setItem(profilePrefix+profileName,JSON.stringify(profile));
   byId('storageStatus').textContent='';
  }catch{
   byId('storageStatus').textContent='このブラウザに記録を保存できません。この画面を開いている間は確認できます。';
  }
 }
 function renderEnemy(){
  const [name,image,glyph,max]=E.enemy(session.stage,session.loop);
  const art=byId('enemyArt'),symbol=byId('enemyGlyph');
  if(image&&art.getAttribute('src')!==image){art.src=image;art.hidden=false;symbol.hidden=true;}
  if(!image){art.removeAttribute('src');art.hidden=true;symbol.hidden=false;}
  symbol.textContent=glyph;
  byId('enemyName').textContent=name;
  const phase=session.stage<30?'ザコ '+(session.stage+1)+' / 30':session.stage<33?'中ボス '+(session.stage-29)+' / 3':session.stage===33?'神官':'ラスボス';
  byId('stage').textContent=session.loop+'周目 ／ '+phase;
  byId('enemyHp').max=max;
  byId('enemyHp').value=session.hp;
  byId('enemyHits').textContent='残り '+session.hp+' 問';
 }
 byId('enemyArt').addEventListener('error',()=>{
  byId('enemyArt').hidden=true;
  byId('enemyGlyph').hidden=false;
 });
 function highlight(count){
  byId('done').textContent=current.text.slice(0,count);
  byId('next').textContent=current.text[count]??'';
  byId('remaining').textContent=current.text.slice(count+1);
 }
 function nextQuestion(){
  current=E.question(session);
  goal=E.normalize(current.text);
  credited=0;
  previous='';
  answer.value='';
  const type=current.drill?'キー反復':E.kinds[current.kind];
  byId('kind').textContent=type+(current.key?' ／ 苦手なキー「'+describe(current.key)+'」':'')+(current.kind===4&&!current.drill?' ／ 日本語入力で変換して確定':' ／ 半角入力');
  byId('reading').textContent=current.reading;
  byId('reading').hidden=!current.reading;
  highlight(0);
 }
 function checkInput(){
  const entered=E.normalize(answer.value);
  if(!session||entered===previous)return;
  profile=readProfile(profileName,profile);
  session.stats=profile.keys;
  const {attempts,mistakes}=session;
  let prefix=0;
  while(prefix<entered.length&&entered[prefix]===goal[prefix])prefix++;
  for(let position=credited;position<prefix;position++)E.record(session,goal[position],true);
  credited=Math.max(credited,prefix);
  previous=entered;
  highlight(prefix);
  if(prefix===goal.length&&prefix===entered.length){
   const previousLoop=session.loop;
   const defeated=E.hit(session);
   byId('feedback').textContent=session.loop!==previousLoop?'ラスボス撃破！ 次の周回へ。':defeated?'撃破！':'命中！';
   const arena=byId('arena');
   arena.classList.remove('hit');
   void arena.offsetWidth;
   arena.classList.add('hit');
   renderEnemy();
   nextQuestion();
  }else if(prefix<entered.length){
   E.record(session,goal[prefix],false);
   byId('feedback').textContent=goal[prefix]?'次は「'+describe(goal[prefix])+'」です。':'余分な文字を削除してください。';
   if(current.kind!==4||current.drill){
    answer.value=entered.slice(0,prefix);
    previous=answer.value;
   }
  }else byId('feedback').textContent='';
  if(session.attempts!==attempts)save(attempts,mistakes);
  updateStats();
 }
 answer.addEventListener('compositionstart',()=>{composing=true;});
 answer.addEventListener('compositionend',()=>{composing=false;checkInput();});
 answer.addEventListener('input',event=>{if(!composing&&!event.isComposing)checkInput();});
 byId('profileForm').addEventListener('submit',event=>{
  event.preventDefault();
  const name=nameField.value.normalize('NFC').trim();
  if(!name){nameField.focus();return;}
  nameField.value=name;
  openProfile(name);
 });
 let savedName;
 try{savedName=localStorage.getItem(lastProfileKey);}catch{}
 if(!savedName){
  try{nameField.value=sessionStorage.getItem('zamatype.playerName')??'';}catch{}
 }
 if(savedName){
  nameField.value=savedName;
  openProfile(savedName);
 }
}

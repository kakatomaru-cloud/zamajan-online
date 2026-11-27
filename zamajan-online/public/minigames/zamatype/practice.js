'use strict';
const ZamaPractice=(()=>{
 const kinds=['英字','数字','記号と数字','ローマ字','日本語IME'];
 const source=[
  ['The quick brown fox jumps over the lazy dog.','PACK MY BOX WITH FIVE DOZEN LIQUOR JUGS','Tokyo to Kyoto','Check the next train','ZAMA TYPE Master','Keep your hands relaxed','New Project Draft','Update the ZIP file'],
  ['0123456789','9071 4268 35','2026 11 26','470 218 965','13579 24680','1200 4050 8700','003 408 759 261'],
  ['09:30 - 18:00','10% + 25% = 35%','ID: A7_B2','[draft] v2.1','{x: 12, y: 8}','user@example.com','C:\\Temp\\log.txt','A/B & C/D','3 * (4 + 5) = 27','https://example.com/#top','"Hello!"','don\'t stop','Use <tag> and </tag>','~ ^ | ? $','¥1,200','`+String.fromCharCode(96)+`code`+String.fromCharCode(96)+` ; _ @ #'],
  ['あさのよていをかくにんする','いきさきのちずをひらく','おつかれさまでした','よろしくおねがいします','しゅっせきのへんじをおくる','ひつようなものをとりにいく','おいそがしいところすみません','ごかくにんをおねがいします','きをつけておかえりください','じかんがきまったらおしえてください'],
  ['よろしくお願いします。','ご確認をお願いします。','添付資料をご覧ください。','会議は14時30分からです。','来週の予定を共有します。','新しいファイルを保存します。','お名前と連絡先を入力してください。','第2会議室でお待ちしています。','質問があれば、お知らせください。','次の駅で乗り換えます。','明日は10時に出発します。']
 ];
 const pick=(items,random)=>items[Math.floor(random()*items.length)];
 const digits=(count,random)=>Array.from({length:count},()=>Math.floor(random()*10)).join('');
 function generate(kind,random){
  const choose=items=>pick(items,random);
  const number=count=>digits(count,random);
  const label=choose(['draft','report','memo','review','plan','log','check','backup','notes','invoice']);
  const document=choose(['議事録','報告書','見積書','提案書','資料','請求書','作業手順書','スケジュール']);
  const day=choose(['今日の午後','明日の朝','金曜日の夕方','来週の月曜日','今月末']);
  switch(kind){
   case 0:{
    const subject=choose(['the project plan','the meeting notes','the budget','the test results','the new layout','the invoice','the delivery date','the final draft','the backup files']);
    const action=choose(['Review','Check','Update','Double-check','Please review','Remember to check']);
    const ending=choose(['',' before lunch',' by Friday',' after the meeting',' before you leave',' this afternoon',' one more time']);
    return choose([label,subject,action+' '+subject+ending+'.']);
   }
   case 1:
    return Array.from({length:choose([1,2,3,4])},()=>number(choose([2,3,4,5]))).join(' ');
   case 2:{
    const price=Number(number(5)).toLocaleString('en-US');
    return choose([
     label+'_'+number(4)+'.txt', '['+label+'] v'+number(1)+'.'+number(2),
     label+'+'+number(3)+'@example.com', '{x: '+number(3)+', y: '+number(3)+'}',
     label+'/'+number(2)+'?id='+number(4)+'#top', '$'+price+' / '+number(2)+'%',
     '('+number(3)+' + '+number(2)+') * '+number(1), '"'+label+'" & '+number(3)+'!',
     '<'+label+'> '+number(4)+' </'+label+'>', label+'-'+number(3)+' = '+number(4),
     'C:\\'+label+'\\'+number(4)+'.txt'
    ]);
   }
   case 3:{
    const item=choose(['しりょう','けいかく','みつもり','れんらくさき','えきまでのみち','つぎのでんしゃ','うけとりじかん','とどけさき','りょこうのよてい','かいぎのじかん']);
    const when=choose(['あさのうちに','かいぎのまえに','あしたまでに','きんようびまでに','ひるやすみに','かえるまえに']);
    return choose([item,when+item+'をかくにんする',item+'のかくにんをおねがいします']);
   }
   case 4:
    return choose([
     day+'までに'+document+'を確認してください。',
     day+'までに'+document+'の共有をお願いします。',
     document+'を'+choose(['担当者','営業チーム','総務部','製作チーム','受付窓口','新しい担当者'])+'に送ってください。',
     document+'の'+(Number(number(2))+1)+'ページ目を確認してください。',
     choose(['新しい','修正済みの','昨日受け取った','先週作成した'])+document+'をご覧ください。'
    ]);
  }
 }
 function makeQuestion(kind,reading){
  return kind===3?{kind,text:globalThis.ZamaEngine.display(reading).toLowerCase(),reading}:{kind,text:reading,reading:''};
 }
 const normalize=value=>value.normalize('NFKC');
 // Japanese keyboards may enter a yen sign for the backslash key.
 const matchText=(text,question)=>question.kind===4&&!question.drill
  ?text
  :text.toLowerCase().replace(/¥/g,'\\');
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
  return {stats,random,stage:0,loop:1,cleared:0,questions:0,attempts:0,mistakes:0,recent:[],categories:[],hp:1};
 }
 function question(state){
  const {random,recent}=state;
  const weak=weakest(state.stats).slice(0,3);
  const step=state.questions++;
  const key=weak.length&&step%2?weak[Math.floor(step/2)%weak.length][0]:'';
  if(!state.categories.length)state.categories=kinds.map((_,index)=>index);
  const normalKind=pick(state.categories,random);
  const fingerprint=item=>matchText(normalize(item.text),item);
  const fresh=item=>!recent.includes(fingerprint(item));
  const eligible=item=>normalize(item.text).includes(key)&&fresh(item);
  let item;
  for(let attempt=0;attempt<60;attempt++){
   const kind=key?Math.floor(random()*kinds.length):normalKind;
   const candidate=makeQuestion(kind,generate(kind,random));
   if(eligible(candidate)){
    item=candidate;
    break;
   }
  }
  if(!item){
   const relevant=(key?source.map((_,kind)=>kind):[normalKind])
    .flatMap(kind=>source[kind].map(value=>makeQuestion(kind,value))).filter(eligible);
   if(relevant.length)item=pick(relevant,random);
  }
  if(!item){
   const isJapanese=/[^\x00-\x7f¥]/.test(key);
   let suffix=Number(digits(5,random));
   do{
    const code=String(suffix++).padStart(5,'0');
    const text=key===' '?'A '+code+' B':key?key+' '+code+' '+key:'ID '+code;
    item={kind:isJapanese?4:2,text,reading:'',drill:!isJapanese};
   }while(!fresh(item));
  }
  if(!key)state.categories.splice(state.categories.indexOf(normalKind),1);
  recent.push(fingerprint(item));
  if(recent.length>60)recent.shift();
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
 return {create,enemy,kinds,question,record,hit,weakest,normalize,matchText};
})();
if(typeof module==='object')module.exports=ZamaPractice;

if(typeof document!=='undefined'){
 const E=ZamaPractice;
 const byId=id=>document.getElementById(id);
 const profilePrefix='zamatype:practice-profile:v1:';
 const recentKey='zamatype:practice-recent:v1';
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
  try{
   const recent=JSON.parse(localStorage.getItem(recentKey));
   if(Array.isArray(recent))session.recent=recent.filter(item=>typeof item==='string').slice(-60);
  }catch{}
  current=E.question(session);
  try{localStorage.setItem(recentKey,JSON.stringify(session.recent));}catch{}
  goal=E.normalize(current.text);
  credited=0;
  previous='';
  answer.value='';
  const type=current.drill?'キー反復':E.kinds[current.kind];
  byId('kind').textContent=type+(current.key?' ／ 苦手なキー「'+describe(current.key)+'」':'')+(current.kind===4&&!current.drill?' ／ 日本語入力で変換して確定':' ／ 半角入力（英字の大文字・小文字はどちらでも可）');
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
  const matchedInput=E.matchText(entered,current);
  const matchedGoal=E.matchText(goal,current);
  let prefix=0;
  while(prefix<matchedInput.length&&matchedInput[prefix]===matchedGoal[prefix])prefix++;
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

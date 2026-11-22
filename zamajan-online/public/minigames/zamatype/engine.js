/* ZAMA TYPE shared deterministic rules — original non-commercial prototype */
(function(root,factory){const x=factory();if(typeof module==='object'&&module.exports)module.exports=x;root.ZamaEngine=x;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const ENEMIES=[
 {id:'slime',name:'翠晶スライム',word:'すらいむ',tier:1,score:100,damage:10,life:19,spell:null},
 {id:'bat',name:'夜翼の蝙蝠',word:'こうもり',tier:1,score:100,damage:10,life:17,spell:null},
 {id:'wolf',name:'灰牙ウルフ',word:'おおかみ',tier:1,score:100,damage:10,life:16,spell:null},
 {id:'ghost',name:'蒼霊ウィスプ',word:'ゆうれい',tier:1,score:100,damage:10,life:18,spell:'cure'},
 {id:'goblin',name:'棘槍ゴブリン',word:'ごぶりん',tier:2,score:200,damage:15,life:20,spell:null},
 {id:'skeleton',name:'白骨の守衛',word:'がいこつ',tier:2,score:200,damage:15,life:19,spell:'fire'},
 {id:'lizard',name:'深紅の蜥蜴',word:'とかげ',tier:2,score:200,damage:15,life:19,spell:null},
 {id:'golem',name:'岩殻ゴーレム',word:'ごーれむ',tier:2,score:200,damage:15,life:23,spell:'protect'},
 {id:'witch',name:'深森の魔女',word:'まじょ',tier:2,score:200,damage:15,life:21,spell:'blizzard'},
 {id:'knight',name:'黒曜の騎士',word:'あんこくきし',tier:3,score:400,damage:20,life:26,spell:null},
 {id:'dragon',name:'雷鱗ドラゴン',word:'どらごん',tier:3,score:400,damage:20,life:25,spell:'thunder'},
 {id:'reaper',name:'時縛りの死神',word:'しにがみ',tier:3,score:400,damage:20,life:24,spell:'slow'},
 {id:'harpy',name:'風鳴りハーピー',word:'はーぴー',tier:2,score:200,damage:15,life:18,spell:null},
 {id:'mimic',name:'宝喰らいミミック',word:'たからばこ',tier:2,score:200,damage:15,life:20,spell:'cure'},
 {id:'ogre',name:'紅鉄オーガ',word:'おーが',tier:3,score:400,damage:20,life:24,spell:null}
];
// Every enemy presents independent changing questions, never its monster name.
const QUESTIONS={
 slime:[['あおいひかり','BLUE LIGHT'],['きらめくいずみ','SPARKLING SPRING'],['ふしぎなみず','MAGIC WATER']],
 bat:[['くらやみのなか','IN THE DARK'],['よるのとばり','NIGHT FALLS'],['ほしがひかる','SHINING STARS']],
 wolf:[['はやくにげろ','RUN AWAY'],['つきよのみち','MOONLIT ROAD'],['もりのおくへ','DEEP FOREST']],
 ghost:[['きえないおもい','LASTING MEMORY'],['ひかりのたま','BALL OF LIGHT'],['みえないてき','INVISIBLE FOE']],
 goblin:[['たからをまもれ','GUARD THE GOLD'],['まけるもんか','NEVER GIVE UP'],['けんをかまえろ','RAISE YOUR SWORD']],
 skeleton:[['かたいよろい','IRON ARMOR'],['こだいのひみつ','ANCIENT SECRET'],['ふるいおしろ','OLD CASTLE']],
 lizard:[['ほのおのいぶき','FIERY BREATH'],['あついさばく','HOT DESERT'],['いしのかいだん','STONE STAIRS']],
 golem:[['だいちのちから','EARTH POWER'],['いわをくだけ','BREAK THE ROCK'],['はがねのこころ','STEEL HEART']],
 witch:[['まほうのじゅもん','MAGIC SPELL'],['しんぴのちから','MYSTIC POWER'],['あおいほうせき','BLUE GEMSTONE']],
 knight:[['やみをきりさけ','CUT THE DARK'],['まもりぬくんだ','STAND YOUR GROUND'],['ゆうきのしるし','MARK OF COURAGE']],
 dragon:[['でんせつのつるぎ','LEGENDARY SWORD'],['そらをこえて','BEYOND THE SKY'],['あらしをよべ','CALL THE STORM']],
 reaper:[['ときはもどらない','TIME NEVER STOPS'],['いのちをまもれ','PROTECT LIFE'],['うんめいのとびら','DOOR OF FATE']],
 harpy:[['かぜにのって','RIDE THE WIND'],['つばさをひろげ','SPREAD WINGS'],['はるかなそら','DISTANT SKY']],
 mimic:[['たからばこのなぞ','TREASURE SECRET'],['あけてはいけない','DO NOT OPEN'],['きんいろのかぎ','GOLDEN KEY']],
 ogre:[['ちからをあわせろ','JOIN FORCES'],['たちあがれ','RISE AGAIN'],['ぜったいにかつ','WE WILL WIN']]
};
const ENGLISH=Object.fromEntries(ENEMIES.map(e=>[e.id,QUESTIONS[e.id][0][1]]));
const SPELLS={
 cure:{name:'ケアル',word:'けある',type:'heal',value:20,color:'#65d7ac'},
 cura:{name:'ケアルラ',word:'けあるら',type:'heal',value:35,color:'#65d7ac'},
 curaga:{name:'ケアルガ',word:'けあるが',type:'heal',value:50,color:'#65d7ac'},
 fire:{name:'ファイア',word:'ふぁいあ',type:'damage',value:1,color:'#ff9c61'},
 fira:{name:'ファイラ',word:'ふぁいら',type:'damage',value:2,color:'#ff9c61'},
 firaga:{name:'ファイガ',word:'ふぁいが',type:'damage',value:3,color:'#ff9c61'},
 thunder:{name:'サンダー',word:'さんだー',type:'damage',value:1,color:'#ffe28a'},
 thundara:{name:'サンダラ',word:'さんだら',type:'damage',value:2,color:'#ffe28a'},
 thundaga:{name:'サンダガ',word:'さんだが',type:'damage',value:3,color:'#ffe28a'},
 blizzard:{name:'ブリザド',word:'ぶりざど',type:'damage',value:1,freeze:5,color:'#95dafe'},
 blizzara:{name:'ブリザラ',word:'ぶりざら',type:'damage',value:2,freeze:8,color:'#95dafe'},
 blizzaga:{name:'ブリザガ',word:'ぶりざが',type:'damage',value:3,freeze:11,color:'#95dafe'},
 slow:{name:'スロウ',word:'すろう',type:'slow',value:12,color:'#c2a8ff'},
 protect:{name:'プロテス',word:'ぷろてす',type:'shield',value:1,color:'#9bdcbf'}
};
const BOSS_WORDS=['まおうのかんむりをねらう','あんこくのかめんをわる','おおきなつのにひびをいれる','ひたいのほうせきをくだく'];
const ROM={
 'あ':['A'],'い':['I'],'う':['U'],'え':['E'],'お':['O'],
 'か':['KA'],'き':['KI'],'く':['KU'],'け':['KE'],'こ':['KO'],
 'さ':['SA'],'し':['SI','SHI'],'す':['SU'],'せ':['SE'],'そ':['SO'],
 'た':['TA'],'ち':['TI','CHI'],'つ':['TU','TSU'],'て':['TE'],'と':['TO'],
 'な':['NA'],'に':['NI'],'ぬ':['NU'],'ね':['NE'],'の':['NO'],
 'は':['HA'],'ひ':['HI'],'ふ':['HU','FU'],'へ':['HE'],'ほ':['HO'],
 'ま':['MA'],'み':['MI'],'む':['MU'],'め':['ME'],'も':['MO'],
 'や':['YA'],'ゆ':['YU'],'よ':['YO'],
 'ら':['RA'],'り':['RI'],'る':['RU'],'れ':['RE'],'ろ':['RO'],
 'わ':['WA'],'を':['WO'],'ん':['NN','N'],
 'が':['GA'],'ぎ':['GI'],'ぐ':['GU'],'げ':['GE'],'ご':['GO'],
 'ざ':['ZA'],'じ':['ZI','JI'],'ず':['ZU'],'ぜ':['ZE'],'ぞ':['ZO'],
 'だ':['DA'],'ぢ':['DI'],'づ':['DU'],'で':['DE'],'ど':['DO'],
 'ば':['BA'],'び':['BI'],'ぶ':['BU'],'べ':['BE'],'ぼ':['BO'],
 'ぱ':['PA'],'ぴ':['PI'],'ぷ':['PU'],'ぺ':['PE'],'ぽ':['PO'],
 'きゃ':['KYA'],'きゅ':['KYU'],'きょ':['KYO'],
 'しゃ':['SYA','SHA'],'しゅ':['SYU','SHU'],'しょ':['SYO','SHO'],
 'ちゃ':['TYA','CHA','CYA'],'ちゅ':['TYU','CHU','CYU'],'ちょ':['TYO','CHO','CYO'],
 'にゃ':['NYA'],'にゅ':['NYU'],'にょ':['NYO'],
 'ひゃ':['HYA'],'ひゅ':['HYU'],'ひょ':['HYO'],
 'みゃ':['MYA'],'みゅ':['MYU'],'みょ':['MYO'],
 'りゃ':['RYA'],'りゅ':['RYU'],'りょ':['RYO'],
 'ぎゃ':['GYA'],'ぎゅ':['GYU'],'ぎょ':['GYO'],
 'じゃ':['JA','JYA','ZYA'],'じゅ':['JU','JYU','ZYU'],'じょ':['JO','JYO','ZYO'],
 'びゃ':['BYA'],'びゅ':['BYU'],'びょ':['BYO'],
 'ぴゃ':['PYA'],'ぴゅ':['PYU'],'ぴょ':['PYO'],
 'ふぁ':['FA','FWA'],'ふぃ':['FI'],'ふぇ':['FE'],'ふぉ':['FO'],
 'てぃ':['THI','TI'],'でぃ':['DHI'],'うぃ':['WI'],'うぇ':['WE'],
 'ぁ':['LA','XA'],'ぃ':['LI','XI'],'ぅ':['LU','XU'],'ぇ':['LE','XE'],'ぉ':['LO','XO'],
 'ゃ':['LYA','XYA'],'ゅ':['LYU','XYU'],'ょ':['LYO','XYO'],'ー':['-']
};
function toHira(s){return [...s].map(c=>{let n=c.charCodeAt(0);return n>=0x30a1&&n<=0x30f6?String.fromCharCode(n-96):c;}).join('');}
function variants(raw){const s=toHira(raw),out=[];function gen(i,str){if(out.length>384)return;if(i>=s.length){out.push(str);return;}if(s[i]==='っ'){const tail=[];for(const l of [2,1]){const k=s.slice(i+1,i+1+l);if(ROM[k])tail.push(...ROM[k]);}const heads=[...new Set(tail.map(t=>t[0]).filter(t=>/[BCDFGHJKLMNPQRSTVWXYZ]/.test(t)))];for(const c of heads)gen(i+1,str+c);gen(i+1,str+'XTU');gen(i+1,str+'LTU');return;}
if(s[i]==='ん'){const next=s[i+1];const options=next&&/[あいうえおやゆよなにぬねの]/.test(next)?['NN']:['N','NN'];for(const a of options)gen(i+1,str+a);return;}
for(let l=2;l>=1;l--){const part=s.slice(i,i+l);if(ROM[part])for(const r of ROM[part])gen(i+l,str+r);}}
gen(0,'');return [...new Set(out)].filter(Boolean);}
const cached=new Map();function accepts(word){if(!cached.has(word))cached.set(word,variants(word));return cached.get(word);}
function isPrefix(word,str){return (/^[A-Z -]+$/.test(word)?word.replace(/\s/g,'').startsWith(str):accepts(word).some(v=>v.startsWith(str)));}
function complete(word,str){return (/^[A-Z -]+$/.test(word)?word.replace(/\s/g,'')===str:accepts(word).includes(str));}
function display(word){return /^[A-Z -]+$/.test(word)?word:(accepts(word)[0]||word);}
function make(seedPlayers,opts={}){const p=seedPlayers.map((x,i)=>({id:x.id,name:String(x.name||`P${i+1}`).slice(0,20),score:0,combo:0,kills:0,miss:0,typed:'',charges:[],weapon:null,magicMeter:0,lastInput:0}));return {status:'playing',duration:180,remaining:180,hp:100,maxHp:100,players:p,foes:[],midboss:null,midbossCleared:false,boss:null,bossIndex:0,kills:0,nextEnemy:1,magicSeq:0,shield:0,freezeUntil:0,slowUntil:0,elapsed:0,events:[],eventSeq:0,result:null,randomSeed:opts.seed||Math.floor(Math.random()*100000000),lastTick:null,questionSeq:0};}
function rand(s){s.randomSeed=(s.randomSeed*1664525+1013904223)>>>0;return s.randomSeed/4294967296;}
function pickEnemy(s){const idx=Math.floor(rand(s)*ENEMIES.length);return ENEMIES[idx];}

// Japanese typing prompts are original phrases, with an English alternative.
const TOPICS=[
 ['ファイナルファンタジー',[
  ['ちょこぼ','CHOCOBO'],['くぽ','KUPO'],['しょうかん','SUMMON'],['ひくうてい','AIRSHIP'],
  ['くりすたるをまもる','GUARD THE CRYSTAL'],['まどうしがたびにでる','MAGE SETS OUT'],
  ['ちょこぼでそうげんをかける','CHOCOBO CROSSES THE PLAINS']]],
 ['ドラゴンクエスト',[
  ['ゆうしゃ','HERO'],['すらいむ','SLIME'],['やくそう','MEDICINAL HERB'],['きめらのつばさ','CHIMERA WING'],
  ['さかばでなかまをさがす','FIND ALLIES AT THE TAVERN'],['ごーるどでたてをかう','BUY A SHIELD WITH GOLD'],
  ['どらきーがどうくつからとびだす','A DRACKY FLIES OUT OF THE CAVE']]],
 ['ガンダム',[
  ['ざく','ZAKU'],['じむ','GM FRAME'],['はろ','HARO'],['びーむさーべる','BEAM SABER'],
  ['こっくぴっとをてんけん','CHECK THE COCKPIT'],['ほわいとべーすがりりくする','WHITE BASE LIFTS OFF'],
  ['こくぴっとにけいほうがなる','THE COCKPIT ALARM SOUNDS']]],
 ['マクロス',[
  ['みんめい','MINMAY'],['ばるきりー','VALKYRIE'],['でるた','DELTA FLIGHT'],['がうぉーく','GERWALK'],
  ['へんけいしてきゅうせんかい','TRANSFORM AND BANK HARD'],['ほしのあいだにうたがひびく','A SONG RINGS BETWEEN STARS'],
  ['らいぶのうしろでふねがとぶ','SHIP FLIES PAST THE CONCERT']]],
 ['ストリートファイター',[
  ['ぶらんか','BLANKA'],['りゅう','RYU'],['けん','KEN'],['はどうけん','HADOKEN'],
  ['しょーりゅーけん','SHORYUKEN'],['どらいぶらっしゅをとめる','STOP THE DRIVE RUSH'],
  ['さしあいからさしがえす','PUNISH THE WHIFF']]],
 ['パソコン関連',[
  ['まうす','MOUSE'],['めもり','MEMORY'],['ぱす','FILE PATH'],['だぶるくりっく','DOUBLE CLICK'],
  ['きーぼーどをつなぐ','CONNECT THE KEYBOARD'],['ばっくあっぷをとる','MAKE A BACKUP'],
  ['もにたーのあかるさをさげる','DIM THE MONITOR']]],
 ['今日のニュース（11/22）',[
  ['ふじ','FUJI APPLE'],['かき','PERSIMMON'],['あんぽがき','ANPO PERSIMMON'],
  ['じゃがいものしんひんしゅ','NEW POTATO VARIETY'],['あんぽがきづくりがさかん','ANPO PERSIMMON SEASON'],
  ['りんごのふじがしゅうかくき','FUJI APPLE HARVEST']]],
 ['話題になったネタ',[
  ['ねこみーむ','CAT MEME'],['おしかつ','FANDOM LIFE'],['がちゃ','CAPSULE TOY'],['れとろぶーむ','RETRO BOOM'],
  ['けんだまでれんぞくちゃれんじ','KENDAMA STREAK CHALLENGE'],['れとろげーむであそぶ','PLAY A RETRO GAME'],
  ['ねこのどうががわだいになる','CAT VIDEO GOES VIRAL']]]
];
const TOPIC_QUESTIONS=TOPICS.flatMap(([genre,entries])=>entries.map(([word,english])=>[word,english.toUpperCase(),genre]));
const OTHER_QUESTIONS=Object.values(QUESTIONS).flat();
function forms(q){return [...accepts(q[0]),q[1].replace(/\s/g,'').toUpperCase()];}
const MAGIC_FORMS=Object.entries(SPELLS).flatMap(([key,spell])=>[key.toUpperCase(),...accepts(spell.word)]);
const PROMPT_FORMS=new Map([...TOPIC_QUESTIONS,...OTHER_QUESTIONS].map(q=>[q,forms(q)]));
function chooseQuestion(s,f){
 const blocked=[...MAGIC_FORMS,...s.foes.filter(enemy=>enemy.uid!==f.uid).flatMap(enemy=>forms([enemy.word,enemy.english]))];
 const valid=q=>q[0]!==f.word&&q[1]!==f.english&&accepts(q[0]).length>0&&PROMPT_FORMS.get(q).every(x=>blocked.every(y=>!x.startsWith(y)&&!y.startsWith(x)));
 const pool=TOPIC_QUESTIONS.filter(valid);
 const recent=s.recentQuestions??=[];
 const fresh=pool.filter(q=>!recent.includes(q[0]));
 const candidates=fresh.length?fresh:pool.length?pool:OTHER_QUESTIONS.filter(valid);
 const bands=[0,1,0,2,1,2];
 const band=word=>word.length<=4?0:word.length<=8?1:2;
 const desired=bands[s.questionSeq++%bands.length];
 const sameLength=candidates.filter(q=>band(q[0])===desired);
 const available=sameLength.length?sameLength:candidates;
 const different=available.filter(q=>q[2]!==s.lastQuestionGenre);
 const choices=different.length?different:available;
 const question=choices[Math.floor(rand(s)*choices.length)];
 recent.push(question[0]);
 if(recent.length>12)recent.shift();
 s.lastQuestionGenre=question[2];
 return question;
}

function spawn(s){if(s.status!=='playing'||s.boss||s.midboss||s.kills>=20||s.foes.length>=5)return;let tries=0,base;do{base=pickEnemy(s);tries++}while(tries<8&&s.foes.some(e=>e.word===base.word));let factor=s.players.length===1?1.3:s.players.length===2?1.15:1;const idx=0;
 const question=chooseQuestion(s,{uid:-1});
 const maxHp=Math.round((base.tier===1?9:base.tier===2?14:20)*(0.78+0.22*s.players.length));
 const f={...base,uid:s.nextEnemy++,remaining:base.life*factor,maxLife:base.life*factor,hp:maxHp,maxHp,questionIndex:idx,word:question[0],english:question[1],genre:question[2]??null};s.foes.push(f);}
function emit(s,text,kind='info',player=null,targetUid=null,spell=null){s.events.push({id:++s.eventSeq,text,kind,player,targetUid,spell});if(s.events.length>12)s.events.shift();}
function init(s){for(let i=0;i<5;i++)spawn(s);emit(s,'冒険が始まった！','start');return s;}
const BOSS_PARTS=[
 {id:'head',name:'頭',hp:9,words:BOSS_WORDS},
 {id:'torso',name:'胴体',hp:6,words:['よろいをわる','むねをうつ','かくをねらう']},
 {id:'left-arm',name:'右腕',hp:3,words:['みぎてをうつ','つめをおる','こぶしをとめる']},
 {id:'right-arm',name:'左腕',hp:3,words:['ひだりてをうつ','たてをはじく','てくびをねらう']},
 {id:'left-leg',name:'右脚',hp:3,words:['みぎひざをうつ','あしくびをうつ','みぎかかとをうつ']},
 {id:'right-leg',name:'左脚',hp:3,words:['ひだりひざをうつ','つまさきをうつ','ひだりかかとをうつ']}
];
const MIDBOSSES=[
 {id:'dragon',name:'黒炎竜 イグニス',damage:12},
 {id:'behemoth',name:'魔獣 ベヒーモス',damage:14},
 {id:'ahriman',name:'魔眼 アーリマン',damage:11}
];
const MIDBOSS_WORDS=[
 'もえさかるつばさをきりさく',
 'ふるえるだいちをかけぬける',
 'まがまがしいまがんをとじる',
 'とどろくほうこうをうけながす',
 'かたいてつのうろこをくだく',
 'くらやみのたににひかりをともす',
 'あらしをよぶいちげきをかわす',
 'たちのぼるけむりをつきぬける',
 'うなるかぎづめをかわしてきる',
 'ひびわれたせきぞうをたてにする',
 'おもいよろいのすきまをつく',
 'あおいつきがてらすみちをいく'
];
const WEAPONS={
 ragnarok:{name:'ラグナロク',word:'らぐなろく',damage:34,color:'#a8beff'},
 excalibur:{name:'エクスカリバー',word:'えくすかりばー',damage:34,color:'#ffda90'},
 masamune:{name:'政宗',word:'まさむね',damage:34,color:'#dfadc9'},
 yoichi:{name:'与一の弓',word:'よいちのゆみ',damage:34,color:'#a0ffe7'}
};

function midbossWords(s,previous=[]){
 const pool=MIDBOSS_WORDS.filter(word=>!previous.includes(word));
 return Array.from({length:3},()=>pool.splice(Math.floor(rand(s)*pool.length),1)[0]);
}
function beginMidboss(s){
 const spec=MIDBOSSES[Math.floor(rand(s)*MIDBOSSES.length)];
 const maxHp=48+12*(s.players.length-1);
 s.foes=[];
 s.players.forEach(p=>p.typed='');
 s.midboss={...spec,maxHp,hp:maxHp,words:midbossWords(s),introRemaining:3,remaining:9,exitRemaining:0};
 emit(s,`中ボス ${spec.name} が現れた！`,'midboss');
}
function hitMidboss(s,p,amount,typed=false){
 const boss=s.midboss;
 if(!boss?.hp)return;
 const lost=Math.min(amount,boss.hp);
 boss.hp-=lost;
 if(typed)emit(s,`${p.name}が ${boss.name} に ${lost} ダメージ！`,'hit',p.id,'midboss');
 if(boss.hp>0){
  if(typed){
   const previous=boss.words;
   boss.words=midbossWords(s,previous);
   for(const player of s.players){
    if(player.typed&&previous.some(word=>isPrefix(word,player.typed)))player.typed='';
   }
  }
  return;
 }
 boss.exitRemaining=1.6;
 boss.words=[];
 p.score+=800;
 emit(s,`${boss.name} を撃破！`,'midbossDown',p.id,'midboss');
 const weapons=Object.keys(WEAPONS);
 for(const player of s.players){
  player.typed='';
  player.weapon=weapons[Math.floor(rand(s)*weapons.length)];
  emit(s,`${player.name}が ${WEAPONS[player.weapon].name} を獲得！`,'loot',player.id);
 }
}
function typeMidboss(s,p,word){
 earnMagic(s,p,[...word].length);
 reward(s,p,220);
 hitMidboss(s,p,12,true);
}
function startEncounter(s){
 if(s.kills>=20){beginBoss(s);return;}
 if(s.kills>=10&&!s.midbossCleared)beginMidboss(s);
}
function beginBoss(s){
 s.foes=[];
 s.players.forEach(p=>p.typed='');
 const parts=BOSS_PARTS.map(spec=>{
  const maxHp=spec.hp+2*(s.players.length-1);
  return {id:spec.id,name:spec.name,maxHp,hp:maxHp,word:spec.words[Math.floor(rand(s)*spec.words.length)]};
 });
 const maxHp=parts.reduce((sum,part)=>sum+part.hp,0);
 s.boss={name:'終焉の魔王 アビスロード',maxHp,hp:maxHp,parts,introRemaining:4,remaining:11,attackCycle:11,phase:1};
 emit(s,'WARNING！ 魔王アビスロード降臨！','boss');
}
function end(s,why){s.status='ended';s.result=why;emit(s,why==='victory'?'魔王を撃破！ 冒険成功！':why==='hp'?'全滅…… GAME OVER':'時間切れ…… 冒険失敗',why==='victory'?'win':'lose');}
function damage(s,n){if(s.shield>0){s.shield--;emit(s,'プロテスが攻撃を防いだ！','shield');return;}s.hp=Math.max(0,s.hp-n);emit(s,`敵の攻撃！ 共通HP -${n}`,'hurt');if(s.hp===0)end(s,'hp');}
function tick(s,dt){
 if(s.status!=='playing')return;
 const boss=s.boss||s.midboss;
 if(boss?.introRemaining>0){
  boss.introRemaining=Math.max(0,boss.introRemaining-dt);
  return;
 }
 if(s.midboss?.hp===0){
  s.midboss.exitRemaining-=dt;
  if(s.midboss.exitRemaining<=0){
   s.midboss=null;
   s.midbossCleared=true;
   while(s.foes.length<5)spawn(s);
  }
  return;
 }
 s.elapsed+=dt;
 s.remaining=Math.max(0,s.duration-s.elapsed);
 if(s.remaining<=0){end(s,'time');return;}
 const freeze=s.elapsed<s.freezeUntil,slow=s.elapsed<s.slowUntil?0.5:1;
 if(!freeze){
  for(const foe of s.foes){
   foe.remaining-=dt*slow;
   if(foe.remaining>0)continue;
   foe.remaining+=foe.maxLife;
   emit(s,`${foe.name} の攻撃！`,'enemyAttack',null,foe.uid);
   damage(s,foe.damage);
   if(s.status!=='playing')return;
  }
  if(boss){
   boss.remaining-=dt*slow;
   if(boss.remaining<=0){
    emit(s,`${boss.name} の攻撃！`,'bossAttack');
    damage(s,s.midboss?boss.damage:Math.min(20,10+boss.phase*4));
    boss.remaining=s.midboss?9:boss.attackCycle;
   }
  }
 }
 if(boss||s.status!=='playing')return;
 startEncounter(s);
 if(!s.midboss&&!s.boss)while(s.foes.length<5)spawn(s);
}
function reward(s,p,base){p.combo++;let mult=1+Math.min(2,Math.floor((p.combo-1)/5)*0.25);p.score+=Math.round(base*mult);}
function updateBossPhase(boss){
 boss.phase=boss.hp<=boss.maxHp/3?3:boss.hp<=boss.maxHp*.7?2:1;
 boss.attackCycle=11-(boss.phase-1)*2;
 boss.remaining=Math.min(boss.remaining,boss.attackCycle);
}
function hitBossPart(s,p,part,amount,typed=false){
 const boss=s.boss;
 if(!part||!part.hp)return;
 const previous=part.hp;
 part.hp=Math.max(0,part.hp-amount);
 boss.hp-=previous-part.hp;
 if(typed)emit(s,`${p.name}が ${part.name} に一撃！`,'hit',p.id,part.id);
 if(!part.hp)emit(s,`${part.name}を破壊！`,'partBreak',p.id,part.id);
 else if(typed){
  const words=BOSS_PARTS.find(spec=>spec.id===part.id).words.filter(word=>word!==part.word);
  part.word=words[Math.floor(rand(s)*words.length)];
 }
 updateBossPhase(boss);
 if(boss.parts.every(target=>target.hp===0)){p.score+=1500;end(s,'victory');}
}
function typeBossPart(s,p,part){
 earnMagic(s,p,[...part.word].length);
 reward(s,p,300);
 hitBossPart(s,p,part,3,true);
}
function changeQuestion(s,f){
 const q=chooseQuestion(s,f);f.questionIndex++;f.word=q[0];f.english=q[1];f.genre=q[2]??null;
}
function defeatEnemy(s,p,foe,magic=false){
 s.foes=s.foes.filter(f=>f.uid!==foe.uid);s.kills++;if(!magic){p.kills++;reward(s,p,foe.score);}
 if(foe.spell&&!magic){let acquired=foe.spell;const pairs={cure:['cure','cura','curaga'],fire:['fire','fira','firaga'],thunder:['thunder','thundara','thundaga'],blizzard:['blizzard','blizzara','blizzaga']};if(pairs[foe.spell]){const list=pairs[foe.spell];acquired=list[Math.min(2,Math.floor(s.kills/8))];}if(p.charges.length<4){p.charges.push(acquired);emit(s,`${p.name}が ${SPELLS[acquired].name} を獲得！`,'loot',p.id);}}
 emit(s,`${p.name} が ${foe.name} を撃破！`,'kill',p.id,foe.uid);
 startEncounter(s);
 if(!s.boss&&!s.midboss)spawn(s);
}
function earnMagic(s,p,len){p.magicMeter=Math.min(4,(p.magicMeter||0)+(len>=12?4:len>=8?2:len>=5?1:.35));if(p.charges.length>=4||p.magicMeter<4)return;p.magicMeter-=4;const groups=[['fire','fira','firaga'],['thunder','thundara','thundaga'],['blizzard','blizzara','blizzaga']];const stage=len>=12?2:len>=8?1:0;const key=groups[Math.floor(rand(s)*groups.length)][stage];p.charges.push(key);emit(s,`${p.name}が長文ボーナスで ${SPELLS[key].name} を獲得！`,'loot',p.id);}
function cast(s,p,key){const spec=SPELLS[key];const idx=p.charges.indexOf(key);if(idx<0)return false;p.charges.splice(idx,1);const targets=[];
 if(spec.type==='heal'){targets.push('party');s.hp=Math.min(100,s.hp+spec.value);}
 if(spec.type==='shield')s.shield=Math.min(3,s.shield+spec.value);
 if(spec.type==='freeze')s.freezeUntil=Math.max(s.freezeUntil,s.elapsed+spec.value);
 if(spec.type==='slow')s.slowUntil=Math.max(s.slowUntil,s.elapsed+spec.value);
 if(spec.type==='damage'){
  if(spec.freeze)s.freezeUntil=Math.max(s.freezeUntil,s.elapsed+spec.freeze);
  if(s.boss){
   const active=s.boss.parts.filter(part=>part.hp>0);
   const selected=spec.value===1?active.slice(0,1):active;
   for(const part of selected){
    targets.push(part.id);
    const damage=Math.min(spec.value===3?2:1,part.hp-1);
    if(damage>0){
     part.hp-=damage;
     s.boss.hp-=damage;
    }
   }
   updateBossPhase(s.boss);
  }
  else if(s.midboss){
   targets.push('midboss');
   hitMidboss(s,p,[0,9,13,18][spec.value]);
  }
  else {for(const foe of [...s.foes].sort((a,b)=>a.remaining-b.remaining).slice(0,spec.value===1?1:s.foes.length)){
   targets.push(foe.uid);const amount=[0,9,13,18][spec.value];foe.hp=Math.max(0,foe.hp-amount);emit(s,`${spec.name}！ ${foe.name} HP -${amount}`,'magicHit',p.id,foe.uid);if(foe.hp<=0)defeatEnemy(s,p,foe,true);
   if(s.boss||s.midboss)break;
  }}
 }
 p.score+=150;emit(s,`${p.name}が ${spec.name} を唱えた！`,'spell',p.id,null,{key,targets:targets.length?targets:['party']});return true;
}
function useWeapon(s,p){
 const key=p.weapon;
 const weapon=WEAPONS[key];
 if(!weapon)return false;
 let target;
 if(s.midboss){
  target='midboss';
  hitMidboss(s,p,weapon.damage);
 }else if(s.boss){
  const part=s.boss.parts.find(part=>part.hp>1);
  if(!part)return false;
  target=part.id;
  hitBossPart(s,p,part,Math.min(7,part.hp-1));
 }else{
  const foe=s.foes.reduce((soonest,foe)=>!soonest||foe.remaining<soonest.remaining?foe:soonest,null);
  if(!foe)return false;
  target=foe.uid;
  foe.hp=Math.max(0,foe.hp-weapon.damage);
  if(!foe.hp)defeatEnemy(s,p,foe);
 }
 p.weapon=null;
 p.score+=180;
 emit(s,`${p.name}が ${weapon.name} を放った！`,'weapon',p.id,target,{key,targets:[target]});
 return true;
}
function inputLocked(s){return s.status!=='playing'||s.boss?.introRemaining>0||s.midboss?.introRemaining>0||s.midboss?.hp===0;}
function handle(s,playerId,key){if(inputLocked(s))return;const p=s.players.find(x=>x.id===playerId);if(!p)return;const k=String(key).toUpperCase();
 if(k==='BACKSPACE'){p.typed=p.typed.slice(0,-1);return;}if(k==='ESCAPE'){p.typed='';return;}if(!/^[A-Z-]$/.test(k))return;
 let candidate=p.typed+k;
 const targets=[...s.foes.flatMap(f=>[{kind:'enemy',word:f.word,id:f.uid},{kind:'enemy',word:f.english,id:f.uid}]),...(s.boss?s.boss.parts.filter(part=>part.hp>0).map(part=>({kind:'boss',word:part.word,id:part.id})):[]),...(s.midboss?.words??[]).map(word=>({kind:'midboss',word})),...(p.weapon?[{kind:'weapon',word:WEAPONS[p.weapon].word,key:p.weapon},{kind:'weapon',word:p.weapon.toUpperCase(),key:p.weapon}]:[]),...p.charges.flatMap(key=>[{kind:'spell',word:SPELLS[key].word,key},{kind:'spell',word:key.toUpperCase(),key}])];
 let choices=targets.filter(t=>isPrefix(t.word,candidate));if(!choices.length){p.miss++;p.combo=0;emit(s,`${p.name} ミスタイプ`,'miss',p.id);p.typed='';candidate=k;choices=targets.filter(t=>isPrefix(t.word,candidate));if(!choices.length)return;}
 p.typed=candidate;const matches=choices.filter(t=>complete(t.word,candidate));const ambiguous=choices.some(t=>!complete(t.word,candidate));if(!matches.length||(ambiguous&&!matches.some(t=>(t.kind==='spell'||t.kind==='weapon')&&t.key.toUpperCase()===candidate)))return;
 const chosen=matches.sort((a,b)=>({enemy:0,boss:1,midboss:1,spell:2,weapon:2}[a.kind]-{enemy:0,boss:1,midboss:1,spell:2,weapon:2}[b.kind]))[0];p.typed='';
 if(chosen.kind==='weapon'){useWeapon(s,p);return;}
 if(chosen.kind==='midboss'){typeMidboss(s,p,chosen.word);return;}
 if(chosen.kind==='spell'){cast(s,p,chosen.key);return;}
 if(chosen.kind==='boss'){typeBossPart(s,p,s.boss.parts.find(part=>part.id===chosen.id));return;}
 const foe=s.foes.find(f=>f.uid===chosen.id);if(!foe)return;
 const promptLength=[...foe.word.replace(/[\s、。！？]/g,'')].length;earnMagic(s,p,promptLength);
 const blow=Math.min(35,Math.max(5,3+promptLength*2));
 foe.hp=Math.max(0,foe.hp-blow);reward(s,p,Math.round(foe.score*.32));
 if(foe.hp===0){emit(s,`${p.name}が ${foe.name} に ${blow} ダメージ！`,'hit',p.id,foe.uid);defeatEnemy(s,p,foe);}
 else {emit(s,`${p.name}が ${foe.name} に ${blow} ダメージ！`,'hit',p.id,foe.uid);changeQuestion(s,foe);}
}
function handleText(s,playerId,text){const t=toHira(String(text).trim()).toLowerCase().replace(/\s+/g,'');if(!t||inputLocked(s))return false;const p=s.players.find(x=>x.id===playerId);if(!p)return false;
 const matches=word=>word===t||accepts(word).some(roman=>roman.toLowerCase()===t);
 if(p.weapon&&(p.weapon===t||matches(WEAPONS[p.weapon].word))){
  p.typed='';
  return useWeapon(s,p);
 }
 const midWord=s.midboss?.words.find(matches);
 if(midWord){p.typed='';typeMidboss(s,p,midWord);return true;}
 const spell=p.charges.find(k=>SPELLS[k].word===t||k===t);if(spell){p.typed='';return cast(s,p,spell);}const part=s.boss?.parts.find(part=>part.hp>0&&(part.word===t||accepts(part.word).some(word=>word.toLowerCase()===t)));if(part){p.typed='';typeBossPart(s,p,part);return true;}const targets=[...s.foes.flatMap(f=>[f.word,f.english]),...p.charges.flatMap(k=>[SPELLS[k].word,k.toUpperCase()])];const match=targets.find(w=>w.toLowerCase().replace(/\s+/g,'')===t);if(!match)return false;p.typed='';const sequence=display(match).replace(/\s+/g,'');for(const ch of sequence){if(s.status!=='playing')break;handle(s,playerId,ch);}return true;}
function snapshot(s){return JSON.parse(JSON.stringify(s));}
return {ENEMIES,QUESTIONS,SPELLS,WEAPONS,ENGLISH,BOSS_WORDS,handleText,variants,accepts,isPrefix,complete,display,make,init,tick,handle,snapshot,emit};
});

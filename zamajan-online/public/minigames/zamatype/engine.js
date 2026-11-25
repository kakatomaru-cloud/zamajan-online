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
const BOSS_WORDS=[
 'おせわになっております',
 'ごかくにんをおねがいします',
 'ごへんしんをおまちしております',
 'おいそがしいところおそれいります'
];
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
const cached=new Map();function accepts(word){if(!cached.has(word)){if(cached.size>=2048)cached.delete(cached.keys().next().value);cached.set(word,variants(word));}return cached.get(word);}
function isPrefix(word,str){return (/^[A-Z -]+$/.test(word)?word.replace(/\s/g,'').startsWith(str):accepts(word).some(v=>v.startsWith(str)));}
function complete(word,str){return (/^[A-Z -]+$/.test(word)?word.replace(/\s/g,'')===str:accepts(word).includes(str));}
function display(word){return /^[A-Z -]+$/.test(word)?word:(accepts(word)[0]||word);}
const BATTLE_DURATION=300;
const YAKU_READINGS={
 '大阪万博':'おおさかばんぱく','悲しみの名古屋':'かなしみのなごや','悪魔のコンビ':'あくまのこんび','光の戦士':'ひかりのせんし',
 'モダン(笑)':'もだん','日大一中一高':'にちだいいっちゅういちこう','東京ゲームデザイナー学院':'とうきょうげーむでざいなーがくいん',
 'ゴンタ杯':'ごんたはい','キン肉マン':'きんにくまん','お父さん':'おとうさん','幼女':'ようじょ','ザマ一色':'ざまいっしょく',
 '航空ショー':'こうくうしょー','踵丸ひきとめ':'かかとまるひきとめ','長老':'ちょうろう','梨狩り':'なしがり','眼鏡':'めがね',
 '実家暮らし':'じっかぐらし','アル中':'あるちゅう','VT好き':'ぶいてぃーずき','固定資産税':'こていしさんぜい','錦糸中':'きんしちゅう',
 '部屋つくりしもの':'へやつくりしもの','ザマンとその友達':'ざまんとそのともだち','豪鬼':'ごうき','北陸':'ほくりく','女キャラ好き':'おんなきゃらずき',
 '九州男児':'きゅうしゅうだんじ','FF14':'えふえふじゅうよん','溝ノ口':'みぞのくち','ランク廃人':'らんくはいじん',
 'カプセルサウナ310組':'かぷせるさうなさんいちぜろぐみ','マダムmana2':'まだむまなつー','納豆食えない':'なっとうくえない'
};
const DEFAULT_YAKU=[...Object.keys(YAKU_READINGS),'LOL','ちいかわ','レバーレス','バーチャロン','キッズ','アルマス','ロックマン','AI','ツインタニア','ペット','マッシブ','パワーウオッシュ','ブレイカーズリベンジ'];
function normalizeRegisteredWords(entries){
 if(!Array.isArray(entries))return [];
 const words=new Map();
 for(const entry of entries.slice(0,100)){
  if(typeof entry?.label!=='string'||typeof entry?.reading!=='string')continue;
  const label=entry.label.trim().slice(0,48);
  const reading=toHira(entry.reading.trim().normalize('NFKC')).replace(/\s/g,'');
  if(!label||!(/^[ぁ-ゖー]{1,40}$/.test(reading)||/^[a-z-]{1,40}$/i.test(reading)))continue;
  const word=/^[a-z-]+$/i.test(reading)?reading.toUpperCase():reading;
  if(!/^[A-Z-]+$/.test(display(word)))continue;
  if(!words.has(word))words.set(word,{label,reading:word});
 }
 return [...words.values()];
}
function yakuWords(names=DEFAULT_YAKU){
 if(!Array.isArray(names))return [];
 return normalizeRegisteredWords(names.filter(name=>typeof name==='string').map(label=>({label,reading:Object.hasOwn(YAKU_READINGS,label)?YAKU_READINGS[label]:label})));
}
const extraQuestions=new WeakMap();
function make(seedPlayers,opts={}){const p=seedPlayers.map((x,i)=>({id:x.id,job:Number.isInteger(x.job)?x.job:i%4,name:String(x.name||`P${i+1}`).slice(0,20),score:0,combo:0,kills:0,miss:0,typed:'',missWords:Object.create(null),charges:[],weapon:null,magicMeter:0,lastInput:0}));const game={status:'playing',duration:BATTLE_DURATION,remaining:BATTLE_DURATION,hp:100,maxHp:100,players:p,foes:[],midboss:null,midbossCleared:false,boss:null,bossIndex:0,kills:0,nextEnemy:1,magicSeq:0,shield:0,freezeUntil:0,slowUntil:0,elapsed:0,events:[],eventSeq:0,result:null,randomSeed:opts.seed||Math.floor(Math.random()*100000000),lastTick:null,questionSeq:0,reviewWords:[...new Set((opts.reviewWords??[]).flatMap(normalizeReviewWords))].slice(0,20),reviewDraw:0};
 const registered=normalizeRegisteredWords(opts.words);
 const rows=[...registered,...yakuWords(opts.yaku)];
 const unique=new Map();
 for(const row of rows)if(!unique.has(row.reading))unique.set(row.reading,[row.reading,display(row.reading), 'ザマじゃんの役・登録ワード',row.label,registered.includes(row)]);
 extraQuestions.set(game,[...unique.values()]);
 return game;
}
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
const EVERYDAY_TOPICS=[
 ['身近なもの', [['やかん','KETTLE'],['ひきだし','DRAWER'],['てぶくろ','GLOVES'],['つめきり','NAIL CLIPPERS'],['めざましどけい','ALARM CLOCK'],['かばんのなかをたしかめる','CHECK INSIDE THE BAG']]],
 ['散歩と旅', [['ろじ','ALLEY'],['みさき','CAPE'],['ふみきり','CROSSING'],['ゆうほどう','PROMENADE'],['とおくのとうだいをさがす','LOOK FOR THE LIGHTHOUSE'],['かわぞいのこみちをあるく','WALK ALONG THE RIVER']]],
 ['食卓', [['すもも','PLUM'],['つくだに','PRESERVED SEAWEED'],['むぎちゃ','BARLEY TEA'],['しおむすび','SALTED RICE BALL'],['やさいをうすくきりわける','SLICE THE VEGETABLES THINLY'],['こおりをいれておちゃをそそぐ','POUR TEA OVER ICE']]],
 ['仕事と暮らし', [['はんこ','STAMP'],['しおり','BOOKMARK'],['みつもり','ESTIMATE'],['てじゅんしょ','PROCEDURE GUIDE'],['しめきりをよていひょうにかく','MARK THE DEADLINE ON THE CALENDAR'],['らいしゅうのかいぎしつをとる','BOOK THE MEETING ROOM']]]
];
const ROTATING_TOPICS=[
 ['仕事の連絡', [['かいぎのしりょう','the meeting materials'],['こうしんしたてじゅんしょ','the updated instructions'],['あたらしいみつもりしょ','the new estimate'],['こんしゅうのぎじろく','the weekly minutes'],['よやくのないよう','the booking details'],['しはらいのめいさい','the payment details'],['きのうのれぽーと','the previous report'],['らいげつのにってい','the schedule for next month']],
  [['をかくにんする','check'],['をちーむにおくる','share {item} with the team'],['をいんさつする','print'],['をもういちどよむ','reread']]],
 ['買い物と食事', [['りんご','apples'],['とまと','tomatoes'],['たまご','eggs'],['しょくぱん','bread'],['よーぐると','yogurt'],['にんじん','carrots'],['みかん','mandarins'],['おれんじじゅーす','orange juice']],
  [['をまとめてかう','stock up on'],['をかいものかごにいれる','put {item} in the basket'],['をれいぞうこにしまう','refrigerate'],['をわすれずにかう','remember to buy']]],
 ['外出', [['びじゅつかん','the art museum'],['としょかん','the library'],['おんせん','the hot springs'],['すいぞくかん','the aquarium'],['びょういん','the hospital'],['しやくしょ','city hall'],['ゆうびんきょく','the post office'],['たいいくかん','the gym']],
  [['までのちずをひらく','open the map to'],['のえいぎょうじかんをしらべる','look up the opening hours of'],['のちかくでまちあわせる','meet near'],['までばすでいく','take the bus to']]]
].map(([genre,objects,actions])=>[genre,objects.flatMap(([noun,translation])=>actions.map(([ending,verb])=>[noun+ending,verb.includes('{item}') ? verb.replace('{item}',translation) : verb+' '+translation]))]);
const RUN_TOPICS=[
 ['旅と交通',[
  ['けんさつ','TICKET INSPECTION'],['しゃそう','TRAIN WINDOW'],['えきべん','RAILWAY LUNCH BOX'],['のりば','BOARDING POINT'],
  ['かいさつをぬける','PASS THE TICKET GATE'],['まどがわにすわる','TAKE THE WINDOW SEAT'],['きっぷうりばをさがす','FIND THE TICKET OFFICE'],
  ['しゅうでんのじかんをしらべる','CHECK THE LAST TRAIN TIME'],['おりるえきでにもつをまとめる','PACK YOUR BAG BEFORE GETTING OFF']
 ]],
 ['料理と食卓',[
  ['おたま','LADLE'],['ふきん','DISHCLOTH'],['ざる','COLANDER'],['かたくりこ','POTATO STARCH'],
  ['ねぎをこまかくきる','FINELY CHOP THE GREEN ONIONS'],['なべをよわびにする','TURN THE HEAT DOWN'],['おちゃをいれなおす','BREW A FRESH POT OF TEA'],
  ['やきあがったぱんをあみにのせる','COOL THE BREAD ON A RACK'],['やさいのすいぶんをふきとる','PAT THE VEGETABLES DRY']
 ]],
 ['仕事と連絡',[
  ['ぎだい','AGENDA'],['なふだ','NAME BADGE'],['かいとう','RESPONSE'],['ふせん','STICKY NOTE'],
  ['ないせんでれんらくする','CALL THE EXTENSION'],['きげんをみなおす','REVIEW THE DEADLINE'],['あいてのいけんをきく','ASK FOR THEIR OPINION'],
  ['はっぴょうのじゅんばんをきめる','SET THE PRESENTATION ORDER'],['ていしゅつしたふぁいるをひらく','OPEN THE SUBMITTED FILE']
 ]],
 ['自然と季節',[
  ['こかげ','TREE SHADE'],['あさつゆ','MORNING DEW'],['こもれび','DAPPLED SUNLIGHT'],['わかば','YOUNG LEAVES'],
  ['なみのおとをきく','LISTEN TO THE WAVES'],['かわべをさんぽする','WALK ALONG THE RIVERBANK'],['いけにうつるそらをみる','WATCH THE SKY IN THE POND'],
  ['ひぐれまえにおかをくだる','WALK DOWN THE HILL BEFORE DUSK'],['やまのむこうにくもがひろがる','CLOUDS SPREAD BEYOND THE MOUNTAINS']
 ]],
 ['家の片づけ',[
  ['たな','SHELF'],['ほうき','BROOM'],['まくら','PILLOW'],['せんたくばさみ','CLOTHESPIN'],
  ['たおるをたたむ','FOLD THE TOWELS'],['はこになまえをかく','LABEL THE BOX'],['つかいおわったほんをもどす','PUT THE BOOK BACK'],
  ['ひきだしのおくからかぎをだす','RETRIEVE THE KEY FROM THE DRAWER'],['よごれたまどをぬのでふく','WIPE THE WINDOW WITH A CLOTH']
 ]],
 ['音楽と舞台',[
  ['がくふ','SHEET MUSIC'],['ふえ','FLUTE'],['まく','CURTAIN'],['きゃくせき','AUDIENCE SEATS'],
  ['りずむにあわせててをたたく','CLAP TO THE BEAT'],['みじかいきょくをれんしゅうする','PRACTICE A SHORT PIECE'],['ぶたいのしょうめいをおとす','DIM THE STAGE LIGHTS'],
  ['えんそうがおわってからはくしゅする','APPLAUD AFTER THE PERFORMANCE'],['まくがあがるまえにせきにつく','TAKE YOUR SEAT BEFORE THE CURTAIN RISES']
 ]]
];
const TOPIC_QUESTIONS=[...TOPICS,...EVERYDAY_TOPICS,...ROTATING_TOPICS,...RUN_TOPICS].flatMap(([genre,entries])=>entries.map(([word,english])=>[word,english.toUpperCase(),genre]));
const OTHER_QUESTIONS=Object.values(QUESTIONS).flat();
function forms(q){return [...accepts(q[0]),q[1].replace(/\s/g,'').toUpperCase()];}
const MAGIC_FORMS=Object.entries(SPELLS).flatMap(([key,spell])=>[key.toUpperCase(),...accepts(spell.word)]);
const PROMPT_FORMS=new Map([...TOPIC_QUESTIONS,...OTHER_QUESTIONS].map(q=>[q,forms(q)]));
function normalizeReviewWords(words){
 return Array.isArray(words) ? words.slice(0,5).filter(word=>typeof word==='string'&&/^[ぁ-ゖー]{1,64}$/.test(word)) : [];
}
function chooseWord(s,items,wordOf=item=>item){
 const review=++s.reviewDraw%3===0 ? items.filter(item=>s.reviewWords.includes(wordOf(item))) : [];
 const pool=review.length?review:items;
 return pool[Math.floor(rand(s)*pool.length)];
}
function missRanking(game,playerId){
 const totals=new Map();
 for(const player of game.players){
  if(playerId!==undefined&&player.id!==playerId)continue;
  for(const [word,count] of Object.entries(player.missWords??{}))totals.set(word,(totals.get(word)??0)+count);
 }
 return [...totals].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0],'ja')).slice(0,5);
}
const matchQuestions=new WeakMap();
function chooseQuestion(s,f){
 const blocked=[...MAGIC_FORMS,...s.foes.filter(enemy=>enemy.uid!==f.uid).flatMap(enemy=>forms([enemy.word,enemy.english]))];
 const valid=q=>q[0]!==f.word&&q[1]!==f.english&&(PROMPT_FORMS.get(q)??forms(q)).every(x=>blocked.every(y=>!x.startsWith(y)&&!y.startsWith(x)));
 if(!matchQuestions.has(s))matchQuestions.set(s,new Set());
 const used=matchQuestions.get(s);
 const extras=extraQuestions.get(s)??[];
 const pool=[...extras,...TOPIC_QUESTIONS,...OTHER_QUESTIONS].filter(valid);
 let candidates=pool.filter(q=>!used.has(q[0]));
 if(!candidates.length){
  used.clear();
  candidates=pool;
 }
 const bands=[0,1,0,2,1,2];
 const band=word=>word.length<=4?0:word.length<=8?1:2;
 const desired=bands[(s.questionSeq+++(s.questionBandOffset??0))%bands.length];
 const sameLength=candidates.filter(q=>band(q[0])===desired);
 const themed=candidates.filter(q=>q[2]===s.runTheme);
 const themedLength=themed.filter(q=>band(q[0])===desired);
 const available=themedLength.length?themedLength:themed.length?themed:sameLength.length?sameLength:candidates;
 const different=available.filter(q=>q[2]!==s.lastQuestionGenre);
 const extraLength=sameLength.filter(q=>q[3]);
 const ownLength=extraLength.filter(q=>q[4]);
 const choices=s.questionSeq%3===1&&ownLength.length?ownLength:s.questionSeq%2===1&&extraLength.length?extraLength:different.length?different:available;
 const review=candidates.filter(q=>s.reviewWords.includes(q[0]));
 const question=++s.reviewDraw%3===0&&s.questionSeq>5&&review.length?review[Math.floor(rand(s)*review.length)]:choices[Math.floor(rand(s)*choices.length)];
 used.add(question[0]);
 s.lastQuestionGenre=question[2];
 return question;
}

function spawn(s){if(s.status!=='playing'||s.boss||s.midboss||s.kills>=20||s.foes.length>=5)return;let tries=0,base;do{base=pickEnemy(s);tries++}while(tries<8&&s.foes.some(e=>e.word===base.word));let factor=s.players.length===1?1.3:s.players.length===2?1.15:1;const idx=0;
 const question=chooseQuestion(s,{uid:-1});
 const maxHp=Math.round((base.tier===1?9:base.tier===2?14:20)*(0.78+0.22*s.players.length));
 const f={...base,uid:s.nextEnemy++,remaining:base.life*factor,maxLife:base.life*factor,hp:maxHp,maxHp,questionIndex:idx,word:question[0],english:question[1],genre:question[2]??null,label:question[3]??null};s.foes.push(f);}
function emit(s,text,kind='info',player=null,targetUid=null,spell=null){s.events.push({id:++s.eventSeq,text,kind,player,targetUid,spell});if(s.events.length>12)s.events.shift();}
function init(s){matchQuestions.set(s,new Set());s.runTheme=RUN_TOPICS[Math.floor(rand(s)*RUN_TOPICS.length)][0];s.questionBandOffset=Math.floor(rand(s)*6);for(let i=0;i<5;i++)spawn(s);emit(s,'冒険が始まった！','start');return s;}
const BOSS_PARTS=[
 {id:'head',name:'頭',hp:9,words:BOSS_WORDS},
 {id:'torso',name:'胴体',hp:6,words:[
 'しりょうをてんぷいたします',
 'かいぎのじかんをおしえてください',
 'しめきりをらいしゅうにへんこうします',
 'おてすきのさいにごかくにんください'
]},
 {id:'left-arm',name:'右腕',hp:3,words:[
 'あしたのよていをかくにんする',
 'えきまえでまちあわせをする',
 'かえりにのみものをかってかえる',
 'よやくのじかんをへんこうしたいです'
]},
 {id:'right-arm',name:'左腕',hp:3,words:[
 'おにもつのはいそうじょうきょうをかくにんする',
 'れしーとをおねがいします',
 'ちゅうもんしたしょうひんがとどきました',
 'りょうしゅうしょをはっこうしてください'
]},
 {id:'left-leg',name:'右脚',hp:3,words:[
 'つぎのえきででんしゃをのりかえる',
 'ちずでちかくのちゅうしゃじょうをさがす',
 'あめがふりそうなのでかさをもっていく',
 'とうちゃくしたられんらくしてください'
]},
 {id:'right-leg',name:'左脚',hp:3,words:[
 'へんこうしたぶぶんをまとめてください',
 'たいせつなところだけをみじかくしてください',
 'このぶんしょうをていねいにかきなおしてください',
 'ごふめいなてんがあればおしえてください'
]}
];
const MIDBOSSES=[
 {id:'dragon',name:'黒炎竜 イグニス',damage:12},
 {id:'behemoth',name:'魔獣 ベヒーモス',damage:14},
 {id:'ahriman',name:'魔眼 アーリマン',damage:11}
];
// Public-domain lyrics by Tatsuyuki Takano, transcribed in modern kana.
// Lyrics from the original public-domain editions (modern kana).
// Original retellings of traditional tales, written in kana for typing.
const MIDBOSS_WORDS=[
 // 桃太郎
 ['おおきなももがかわをながれてきました','おばあさんはももをひろっていえにかえりました','ももたろうはきびだんごをわけました','いぬとさるときじがなかまになりました'],
 // 浦島太郎
 ['うらしまたろうはかめをたすけました','かめのせなかにのってうみへでました','おとひめがりゅうぐうじょうでむかえました','たまてばこからしろいけむりがでました'],
 // かぐや姫
 ['たけとりのおきなはひかるたけをみつけました','たけのなかにちいさなおんなのこがいました','まんげつのよるにむかえがきました','かぐやひめはそらへとのぼっていきました'],
 // 赤ずきん
 ['あかずきんはおばあさんのいえへむかいました','もりのみちでおおかみにであいました','おおかみはさきにいえへたどりつきました','べっどのなかからおおきなみみがみえました'],
 // 三びきのこぶた
 ['はじめのこぶたはわらでいえをたてました','ふたりめのこぶたはきのいえをたてました','さいごのこぶたはれんがをつみました','おおかみがふいてもれんがのいえはたおれません'],
 // うさぎとかめ
 ['うさぎとかめがかけっこをしました','うさぎはきのしたでひるねをしました','かめはやすまずにあるきつづけました','うさぎがめをさますとかめはもうごーるにいました']
];
const usedMidbossWords=new WeakMap();
const WEAPONS={
 ragnarok:{name:'ラグナロク',word:'らぐなろく',damage:34,color:'#a8beff'},
 excalibur:{name:'エクスカリバー',word:'えくすかりばー',damage:34,color:'#ffda90'},
 masamune:{name:'政宗',word:'まさむね',damage:34,color:'#dfadc9'},
 yoichi:{name:'与一の弓',word:'よいちのゆみ',damage:34,color:'#a0ffe7'}
};

function distinctMidbossWords(words,active){
 const blocked=active.flatMap(word=>/^[A-Z-]+$/.test(word)?[word]:accepts(word));
 return words.filter(word=>(/^[A-Z-]+$/.test(word)?[word]:accepts(word)).every(form=>blocked.every(other=>!form.startsWith(other)&&!other.startsWith(form))));
}
function midbossWords(s){
 const tales=[...MIDBOSS_WORDS];
 const extras=(extraQuestions.get(s)??[]).map(q=>q[0]).filter(word=>!MIDBOSS_WORDS.some(tale=>tale.includes(word)));
 const words=[];
 for(let index=0;index<4;index++){
  const eligible=index<2?distinctMidbossWords(extras,words):[];
  const matching=eligible.filter(word=>index===0?word.length<=8:word.length>8);
  if(eligible.length){
   words.push(chooseWord(s,matching.length?matching:eligible));
   continue;
  }
  const [tale]=tales.splice(Math.floor(rand(s)*tales.length),1);
  const options=distinctMidbossWords(tale,words);
  words.push(chooseWord(s,options.length?options:distinctMidbossWords(MIDBOSS_WORDS.flat(),words)));
 }
 return words;
}
function beginMidboss(s){
 resetBossRewards(s);
 const spec=MIDBOSSES[Math.floor(rand(s)*MIDBOSSES.length)];
 const maxHp=48+12*(s.players.length-1);
 s.foes=[];
 s.players.forEach(p=>p.typed='');
 s.midboss={...spec,maxHp,hp:maxHp,words:midbossWords(s),labels:Object.fromEntries((extraQuestions.get(s)??[]).map(q=>[q[0],q[3]])),introRemaining:3,remaining:9,exitRemaining:0};
 usedMidbossWords.set(s.midboss,new Set(s.midboss.words));
 emit(s,`中ボス ${spec.name} が現れた！`,'midboss');
}
function hitMidboss(s,p,amount,answeredWord){
 const boss=s.midboss;
 if(!boss?.hp)return;
 const lost=Math.min(amount,boss.hp);
 boss.hp-=lost;
 if(answeredWord)emit(s,`${p.name}が ${boss.name} に ${lost} ダメージ！`,'hit',p.id,'midboss');
 if(boss.hp>0){
  if(answeredWord){
   const choices=boss.words.slice();
   const pool=distinctMidbossWords([...new Set([...MIDBOSS_WORDS.flat(),...(extraQuestions.get(s)??[]).map(q=>q[0])])],choices);
   const used=usedMidbossWords.get(boss)??new Set(choices);
   const fresh=pool.filter(word=>!used.has(word));
   if(!fresh.length)used.clear();
   const next=chooseWord(s,fresh.length?fresh:pool);
   choices[choices.indexOf(answeredWord)]=next;
   for(const word of choices)used.add(word);
   usedMidbossWords.set(boss,used);
   boss.words=choices;
   for(const player of s.players){
    if(player.typed&&isPrefix(answeredWord,player.typed)&&!choices.some(word=>isPrefix(word,player.typed)))player.typed='';
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
 countBossSuccess(s,p);
 earnMagic(s,p,[...word].length);
 reward(s,p,220);
 hitMidboss(s,p,12,word);
}
function startEncounter(s){
 if(s.kills>=20){beginPriest(s);return;}
 if(s.kills>=10&&!s.midbossCleared)beginMidboss(s);
}
const PRIEST_STRIKES=['さきほどのけんについてごれんらくします','おみせのえいぎょうじかんをおしえてください','よやくしているなまえをおつたえします','おねがいしたないようをもういちどかくにんします','かいぎのしりょうをじぜんにきょうゆうします','つぎのおやすみにともだちとでかけます','このけんはあらためてごそうだんします'];
const rotatingBossWords=[
 'しゅっせきするひとにれんらくする','ていしゅつまえにごじをさがす','つぎのかいぎをよやくする',
 'のうひんのひづけをきめる','かいじょうへのいきかたをしらべる','しりょうをいちまいずつくばる',
 'つくえにおいたでんわをとる','ひつようなしょるいをそろえる','へんしんがくるまでべつのさぎょうをする',
 'きろくしたじかんをみなおす','あしたのもくひょうをきめる','よやくのじかんにあわせてでかける',
 'くるまをちゅうしゃじょうにとめる','よるのうちにおかずをつくる','てんきをみてふくをきめる',
 'いそがしいときはさきにれんらくする','まちがえたところにしるしをつける','でかけるまえにかばんをたしかめる',
 'きゅうけいのあとでさぎょうにもどる','あたらしいぺーじをひらく','えきでかいすうけんをかう',
 'こしょうしたでんきゅうをとりかえる','のこったおかずをつめる','ともだちにたんじょうびのれんらくをする'
];
const priestAttackWords=[...new Set([...PRIEST_STRIKES,...rotatingBossWords.filter((_,i)=>i%2===0)])];
const finalAttackWords=[...new Set([...BOSS_PARTS.flatMap(part=>part.words),...rotatingBossWords.filter((_,i)=>i%2===1)])];
const bossWordDecks=new WeakMap();
function drawBossWord(s,pool,blocked=[]){
 if(!bossWordDecks.has(s))bossWordDecks.set(s,new Map());
 const decks=bossWordDecks.get(s);
 const used=decks.get(pool)??new Set();
 const eligible=pool.filter(word=>!blocked.includes(word));
 let fresh=eligible.filter(word=>!used.has(word));
 if(!fresh.length){
  used.clear();
  fresh=eligible;
 }
 const word=chooseWord(s,fresh);
 used.add(word);
 decks.set(pool,used);
 return word;
}
const PRIEST_TRAPS=[
 {word:'こくえんのせんこく',kind:'harm',spell:'firaga',value:12},
 {word:'らいていのさばき',kind:'harm',spell:'thundaga',value:15},
 {word:'ひょうけつのらくいん',kind:'harm',spell:'blizzara',value:12},
 {word:'せいれいのいぶき',kind:'heal',spell:'curaga',value:14},
 {word:'しんえんのいやし',kind:'heal',spell:'cura',value:14}
];
function priestChoices(s){
 const strikes=[];
 for(let i=0;i<5;i++)strikes.push(drawBossWord(s,priestAttackWords,[...strikes,...(s.boss?.choices??[]).map(choice=>choice.word)]));
 const harmful=PRIEST_TRAPS.filter(item=>item.kind==='harm');
 const healing=PRIEST_TRAPS.filter(item=>item.kind==='heal');
 const pool=[
  ...strikes.map(word=>({word,kind:'strike'})),
  ...Array.from({length:2},()=>harmful.splice(Math.floor(rand(s)*harmful.length),1)[0]),
  healing[Math.floor(rand(s)*healing.length)]
 ];
 return Array.from({length:pool.length},()=>pool.splice(Math.floor(rand(s)*pool.length),1)[0]);
}
function beginPriest(s){
 resetBossRewards(s);
 s.foes=[];
 s.players.forEach(player=>player.typed='');
 const maxHp=56+14*(s.players.length-1);
 s.boss={form:'priest',name:'深淵の神官 アビス',hp:maxHp,maxHp,choices:priestChoices(s),introRemaining:2.6,remaining:12,transformRemaining:0};
 emit(s,'深淵の神官 アビスが現れた！','priest');
}
function hitPriest(s,p,amount,typed=false){
 const priest=s.boss;
 if(!priest.hp)return;
 const lost=Math.min(amount,priest.hp);
 priest.hp-=lost;
 if(typed)emit(s,`${p.name}が ${priest.name} に ${lost} ダメージ！`,'hit',p.id,'priest');
 if(!priest.hp){
  priest.transformRemaining=2.3;
  s.players.forEach(player=>player.typed='');
  emit(s,'神官が崩れ、奥から魔王が現れる！','priestDown');
 }
}
function typePriest(s,p,choice){
 if(choice.kind==='strike'){
  countBossSuccess(s,p);
  earnMagic(s,p,[...choice.word].length);
  reward(s,p,260);
  hitPriest(s,p,14,true);
 }else{
  const heal=choice.kind==='heal';
  emit(s,`神官の ${choice.word}！`,'enemySpell',p.id,null,{key:choice.spell,targets:[heal?'priest':'party']});
  if(heal){
   const healed=Math.min(choice.value,s.boss.maxHp-s.boss.hp);
   s.boss.hp+=healed;
   emit(s,`神官のHPが ${healed} 回復した！`,'priestHeal');
  }else damage(s,choice.value);
 }
 if(s.boss.hp&&s.status==='playing'){
  const old=s.boss.choices;
  s.boss.choices=priestChoices(s);
  clearQuestionInput(s,old.map(choice=>choice.word));
 }
}
function clearQuestionInput(s,words){
 for(const player of s.players){
  if(player.typed&&words.some(word=>isPrefix(word,player.typed)))player.typed='';
 }
}
const DEFEND_WORD='ぼうぎょ';
const FINAL_SPELLS=[
 {key:'ultima',name:'アルテマ',words:['きっぷをなくさずにしまう','まどぎわのせきをえらぶ','あさのいちばをのぞく','かいだんをゆっくりおりる','よるのえきでひとをまつ','ちずをひろげてみちをさがす','はしをわたってみなとへいく','えきまえでじてんしゃをかりる','ふるいしゃしんをみなおす'],damage:3},
 {key:'holy',name:'ホーリー',words:['あたたかいおちゃをいれる','しおをすこしだけふる','ひるのべんとうをつつむ','きゅうりをうすくきる','みかんのかわをむく','こめをといでみずをかえる','よるのうちにぱんをやく','あさごはんのさらをならべる','ふたをあけてゆげをにがす'],damage:1},
 {key:'meteor',name:'メテオ',words:['しめきりをてちょうにかく','かいぎのじかんをずらす','ふるいめもをよみなおす','しりょうにふせんをはる','あしたのよていをまとめる','とけいをみていえをでる','まどをあけてくうきをかえる','つくえのうえをかたづける','たのまれたほんをさがす'],damage:2}
];
const finalSpellWords=[...new Set([
 ...FINAL_SPELLS.flatMap(spell=>spell.words),
 'くつひもをむすびなおす','まちあわせにすこしおくれる','かりたほんをとしょかんにかえす',
 'ちずでちかみちをみつける','あめがやむまでみせにいる','かさをげんかんにおく',
 'のみものをれいぞうこでひやす','やかんでおゆをわかす','なくしたかぎをさがす',
 'じてんしゃのくうきをいれる','ふるいはこをしょぶんする','きょうのぶんのこめをたく',
 'まえのぺーじにもどる','つかれたのでいすにすわる','あすのてんきをみておく',
 'につめたじゃむをびんにつめる','えきのかいさつであう','すずしいへやでひとやすみする',
 'てがみをぽすとにいれる','にもつのあてさきをたしかめる','かめらのじゅうでんをする',
 'しんごうがあおになってからわたる','でんきをけしてからねる','あついなべにふたをする',
 'こうえんのべんちでほんをよむ','こうさてんをひだりにまがる','でかけるまえにとじまりをする',
 'いらないめーるをけす','のりかえのじかんをしらべる','せんたくものをほす',
 'きったくだものをさらにならべる','ぬれたくつをかわかす','ゆうびんきょくでこづつみをおくる',
 'しおをいれずにすーぷをつくる','みせをでるまえにかさをとる','うけつけでなまえをつたえる',
 'まどをしめてからでかける','かえりみちでぱんをかう','こーひーをこぼしたのでふく',
 'ふうとうにきってをはる','べんとうのふたをしめる','ゆうがたのばすをまつ'
])];
function rollFinalSpell(s,spell){
 const active=availableFinalSpells(s.boss).map(option=>option.word);
 return {...spell,word:drawBossWord(s,finalSpellWords,active)};
}
function availableFinalSpells(boss){
 return boss?.hp>0 ? boss.finalSpells??[] : [];
}
const BOSS_HEALS=[
 {name:'ヒール',word:'てじゅんをかくにんする',value:15},
 {name:'ラヒール',word:'あしたのよていをきょうゆうする',value:30},
 {name:'ラヒーラ',word:'ごつごうのよいにちじをおしえてください',value:45}
];
const BOSS_SUMMONS=[
 {name:'紅翼鳥アグニル',word:'にもつをうけとりました',art:'fire',value:3},
 {name:'氷角獣ネヴァル',word:'こんしゅうのよていをおくります',art:'ice',value:3,freeze:3},
 {name:'雷雲竜ヴォルティス',word:'みつもりしょをてんぷいたします',art:'thunder',value:3,slow:5},
 {name:'獄炎鬼グラザン',move:'煉獄の噴火',art:'fire',value:4},
 {name:'氷晶后イゼリア',move:'白銀の吹雪',art:'ice',value:1,freeze:5},
 {name:'雷杖翁ラザール',move:'天轟の落雷',art:'thunder',value:2,slow:8},
 {name:'地殻巨人ドルガム',move:'地脈崩し',art:'fire',value:3,shield:1},
 {name:'深海蛇ネリオン',move:'深潮の大渦',art:'ice',value:3,slow:3},
 {name:'黒騎将ヴァルグ',move:'黒鋼の一閃',art:'thunder',value:1,focusedDamage:7},
 {name:'星竜アストレイン',move:'星核の閃光',art:'thunder',value:5},
 {name:'暁焔鳥ソレリア',move:'再生の暁火',art:'fire',value:1,heal:30},
 {name:'風爪鳥ヴェルカ',move:'裂空の大旋風',art:'thunder',value:2,freeze:2},
 {name:'聖塞機ルクシオン',move:'天蓋の光壁',art:'ice',value:2,shield:2}
];
const bossRewardWords=[
 ...BOSS_HEALS.map(heal=>heal.word),...BOSS_SUMMONS.flatMap(summon=>summon.word?[summon.word]:[]),
 'このないようでてつづきをすすめます','かくにんできしだいおへんじします',
 'おまたせしてもうしわけありません','おわすれものがないかごかくにんください',
 'おあいできるのをたのしみにしています','またのごりようをおまちしております',
 'かいぎにさんかできるじかんをつたえる','じゅんびができたらこえをかけてください',
 'こんかいはさんかをみおくります','おたがいのよていをすりあわせる',
 'ちゅういじこうをさいごまでよむ','こわれたものをしゅうりにだす',
 'こんどいっしょにしょくじにいきましょう','あめのばあいはにっていをかえます'
];
function rollBossReward(s,p,reward){
 const blocked=availableBossRewards(p).map(option=>option.word);
 return {...reward,word:drawBossWord(s,bossRewardWords,blocked)};
}
function resetBossRewards(s){
 for(const p of s.players){p.bossClean=0;p.bossHeal=null;p.bossSummons=[];}
}
const MAX_BOSS_REWARDS=3;
function availableBossRewards(p){return [p.bossHeal,...(p.bossSummons??[])].filter(Boolean).slice(0,MAX_BOSS_REWARDS);}
const summonDraws=new WeakMap();
function drawSummon(s,p){
 let draw=summonDraws.get(p);
 if(!draw?.remaining.length){
  draw={last:draw?.last,remaining:[...BOSS_SUMMONS]};
 }
 const choices=draw.remaining.filter(summon=>summon!==draw.last&&!p.bossSummons?.some(option=>option.name===summon.name));
 const pool=choices.length?choices:draw.remaining;
 const summon=pool[Math.floor(rand(s)*pool.length)];
 draw.remaining.splice(draw.remaining.indexOf(summon),1);
 draw.last=summon;
 summonDraws.set(p,draw);
 return rollBossReward(s,p,summon);
}
function countBossSuccess(s,p){
 if(!s.boss?.hp&&!s.midboss?.hp)return;
 const count=p.bossClean=(p.bossClean??0)+1;
 const tier=count%9;
 if(tier%3===0){
  const heal=BOSS_HEALS[tier===0?2:tier/3-1];
  if(!p.bossHeal||heal.value>=p.bossHeal.value){
   p.bossHeal=rollBossReward(s,p,heal);
   if(p.bossSummons.length>=MAX_BOSS_REWARDS)p.bossSummons.pop();
  }
 }
 if(tier%3===0||count%5===0){
  const options=p.bossSummons??=[];
  const limit=Math.min(count%5===0?3:2,MAX_BOSS_REWARDS-(p.bossHeal?1:0));
  while(options.length<limit)options.push(drawSummon(s,p));
 }
}
function castBossReward(s,p,reward){
 if(reward===p.bossHeal){
  p.bossHeal=null;
  const amount=Math.min(100-s.hp,reward.value);
  s.hp+=amount;
  emit(s,`${reward.name}！ 共通HP +${amount}`,'spell',p.id,null,{key:'curaga',targets:['party']});
  return;
 }
 p.bossSummons=p.bossSummons.filter(option=>option!==reward);
 const before=(s.boss??s.midboss)?.hp;
 if(s.boss?.parts){
  const part=exposedPart(s.boss);
  if(reward.focusedDamage&&part)hitBossPart(s,p,part,reward.focusedDamage);
  else damageFinalParts(s.boss,reward.focusedDamage?3:reward.value);
 }else if(s.boss?.form==='priest')hitPriest(s,p,10+2*reward.value+(reward.focusedDamage??0));
 else if(s.midboss)hitMidboss(s,p,10+2*reward.value+(reward.focusedDamage??0));
 if(reward.freeze)s.freezeUntil=Math.max(s.freezeUntil,s.elapsed+reward.freeze);
 if(reward.slow)s.slowUntil=Math.max(s.slowUntil,s.elapsed+reward.slow);
 if(reward.shield)s.shield=Math.min(3,s.shield+reward.shield);
 const healed=Math.min(s.maxHp-s.hp,reward.heal??0);
 s.hp+=healed;
 const move=reward.move?` ${reward.move}！`:'';
 const recovery=healed?` 共通HP +${healed}`:'';
 emit(s,`${reward.name} 召喚！${move}${recovery}`,'summon',p.id,null,{art:reward.art,landed:(s.boss??s.midboss)?.hp<before});
}
function castFinalSpell(s,p,spell){
 const boss=s.boss;
 const index=boss.finalSpells.indexOf(spell);
 boss.finalSpells[index]=rollFinalSpell(s,spell);
 const damage=damageFinalParts(boss,spell.damage,s,p);
 clearQuestionInput(s,[spell.word]);
 if(damage>0)p.score+=150;
 countBossSuccess(s,p);
 emit(s,`${p.name}が ${spell.name} を発動！ 魔王に ${damage} ダメージ！`,'finalSpell',p.id,'abyss',{key:spell.key,damage});
}
function damageFinalParts(boss,value,s,p){
 let damage=0;
 for(const part of boss.parts){
  const amount=Math.min(Math.max(0,part.hp-(s?0:1)),value);
  if(!amount)continue;
  if(s)hitBossPart(s,p,part,amount);
  else {part.hp-=amount;boss.hp-=amount;}
  damage+=amount;
 }
 updateBossPhase(boss);
 return damage;
}
function beginBoss(s){
 resetBossRewards(s);
 s.foes=[];
 s.players.forEach(p=>p.typed='');
 const parts=BOSS_PARTS.map(spec=>{
  const maxHp=spec.hp+2*(s.players.length-1);
  return {id:spec.id,name:spec.name,maxHp,hp:maxHp,word:''};
 });
 const maxHp=parts.reduce((sum,part)=>sum+part.hp,0);
 s.boss={name:'終焉の魔王 アビスロード',maxHp,hp:maxHp,parts,introRemaining:3.5,remaining:.15,attackCycle:9,phase:1,weakPart:null,pendingPart:null,lastPart:null,windup:0,guarded:false,finalSpells:FINAL_SPELLS.map(spell=>rollFinalSpell(s,spell))};
 emit(s,'WARNING！ 魔王アビスロード降臨！','boss');
}
function rotateBossWord(s,part){
 part.word=drawBossWord(s,finalAttackWords,[part.word]);
}
function exposedPart(boss){
 return boss?.parts?.find(part=>part.id===boss.weakPart&&part.hp>0);
}
function defend(s,p){
 s.boss.guarded=true;
 emit(s,`${p.name}が防御を構えた！`,'guardReady',p.id);
}
function tickAbyssLord(s,dt){
 const boss=s.boss;
 if(boss.pendingPart){
  boss.windup-=dt;
  if(boss.windup>0)return;
  const part=boss.parts.find(part=>part.id===boss.pendingPart&&part.hp>0);
  const previous=exposedPart(boss);
  const previousWord=previous?.word;
  const typingWeakness=previousWord&&s.players.some(player=>player.typed&&isPrefix(previousWord,player.typed));
  if(part&&part!==previous&&!typingWeakness){
   rotateBossWord(s,part);
   boss.weakPart=part.id;
  }
  boss.pendingPart=null;
  boss.remaining=boss.attackCycle;
  const target=exposedPart(boss);
  for(const player of s.players){
   if(player.typed&&!inputTargets(s,player).some(option=>isPrefix(option.word,player.typed)))player.typed='';
  }
  emit(s,target?`魔王の攻撃！ ${target.name}に隙ができた！`:'魔王の攻撃！','bossAttack',null,part?.id);
  if(boss.guarded)emit(s,'防御成功！ 共通HPを守った！','guardSuccess');
  else damage(s,7+boss.phase);
  boss.guarded=false;
  return;
 }
 boss.remaining-=dt;
 if(boss.remaining>0)return;
 const order=['left-arm','right-arm','left-leg','right-leg','torso','head'];
 const start=order.indexOf(boss.lastPart)+1;
 const next=order.slice(start).concat(order.slice(0,start)).find(id=>boss.parts.some(part=>part.id===id&&part.hp>0));
 boss.pendingPart=next;
 if(!exposedPart(boss)){
  const part=boss.parts.find(part=>part.id===next);
  if(part){
   rotateBossWord(s,part);
   boss.weakPart=part.id;
  }
 }
 boss.lastPart=next;
 boss.guarded=false;
 boss.windup=5;
 emit(s,'魔王が攻撃を構えた！ ぼうぎょと入力！','bossWindup',null,next);
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
 if(s.boss?.form==='priest'&&s.boss.hp===0){
  s.boss.transformRemaining-=dt;
  if(s.boss.transformRemaining<=0)beginBoss(s);
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
  if(s.boss?.parts)tickAbyssLord(s,dt*slow);
  else if(boss){
   boss.remaining-=dt*slow;
   if(boss.remaining<=0){
    emit(s,`${boss.name} の攻撃！`,'bossAttack');
    damage(s,s.midboss?boss.damage:8);
    boss.remaining=s.midboss?9:12;
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
 boss.attackCycle=9-(boss.phase-1);
 boss.remaining=Math.min(boss.remaining,boss.attackCycle);
}
function hitBossPart(s,p,part,amount,typed=false){
 const boss=s.boss;
 if(!part||!part.hp)return;
 const previous=part.hp;
 part.hp=Math.max(0,part.hp-amount);
 boss.hp-=previous-part.hp;
 if(typed)emit(s,`${p.name}が ${part.name} に一撃！`,'hit',p.id,part.id);
 if(!part.hp){
  clearQuestionInput(s,[part.word]);
  if(boss.weakPart===part.id)boss.weakPart=null;
  boss.remaining=Math.min(boss.remaining,1.4);
  emit(s,`${part.name}が骨に変わった！`,'partBreak',p.id,part.id);
 }
 else if(typed){
  clearQuestionInput(s,[part.word]);
  rotateBossWord(s,part);
 }
 updateBossPhase(boss);
 if(boss.parts.every(target=>target.hp===0)){p.score+=1500;end(s,'victory');}
}
function typeBossPart(s,p,part){
 countBossSuccess(s,p);
 earnMagic(s,p,[...part.word].length);
 reward(s,p,300);
 hitBossPart(s,p,part,3,true);
}
function changeQuestion(s,f){
 const q=chooseQuestion(s,f);f.questionIndex++;f.word=q[0];f.english=q[1];f.genre=q[2]??null;f.label=q[3]??null;
}
function defeatEnemy(s,p,foe,magic=false){
 s.foes=s.foes.filter(f=>f.uid!==foe.uid);s.kills++;if(!magic){p.kills++;reward(s,p,foe.score);}
 if(foe.spell&&!magic){let acquired=foe.spell;const pairs={cure:['cure','cura','curaga'],fire:['fire','fira','firaga'],thunder:['thunder','thundara','thundaga'],blizzard:['blizzard','blizzara','blizzaga']};if(pairs[foe.spell]){const list=pairs[foe.spell];acquired=list[Math.min(2,Math.floor(s.kills/8))];}if(p.charges.length<4){p.charges.push(acquired);emit(s,`${p.name}が ${SPELLS[acquired].name} を獲得！`,'loot',p.id);}}
 emit(s,`${p.name} が ${foe.name} を撃破！`,'kill',p.id,foe.uid);
 startEncounter(s);
 if(!s.boss&&!s.midboss)spawn(s);
}
function earnMagic(s,p,len){p.magicMeter=Math.min(4,(p.magicMeter||0)+(len>=12?4:len>=8?2:len>=5?1:.35));if(p.charges.length>=4||p.magicMeter<4)return;p.magicMeter-=4;const groups=[['fire','fira','firaga'],['thunder','thundara','thundaga'],['blizzard','blizzara','blizzaga']];const stage=len>=12?2:len>=8?1:0;const key=groups[Math.floor(rand(s)*groups.length)][stage];p.charges.push(key);emit(s,`${p.name}が長文ボーナスで ${SPELLS[key].name} を獲得！`,'loot',p.id);}
function cast(s,p,key){const spec=SPELLS[key];const idx=p.charges.indexOf(key);if(idx<0||(spec.type==='damage'&&s.boss?.parts&&!exposedPart(s.boss)))return false;p.charges.splice(idx,1);const targets=[];
 if(spec.type==='heal'){targets.push('party');s.hp=Math.min(100,s.hp+spec.value);}
 if(spec.type==='shield')s.shield=Math.min(3,s.shield+spec.value);
 if(spec.type==='freeze')s.freezeUntil=Math.max(s.freezeUntil,s.elapsed+spec.value);
 if(spec.type==='slow')s.slowUntil=Math.max(s.slowUntil,s.elapsed+spec.value);
 if(spec.type==='damage'){
  if(spec.freeze)s.freezeUntil=Math.max(s.freezeUntil,s.elapsed+spec.freeze);
  if(s.boss?.form==='priest'){
   targets.push('priest');
   hitPriest(s,p,[0,9,13,18][spec.value]);
  }else if(s.boss){
   const part=exposedPart(s.boss);
   if(!part)return false;
   const amount=Math.max(0,Math.min(spec.value===3?2:1,part.hp));
   if(amount>0)targets.push(part.id);
   hitBossPart(s,p,part,amount);
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
 countBossSuccess(s,p);
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
 }else if(s.boss?.form==='priest'){
  target='priest';
  hitPriest(s,p,weapon.damage);
 }else if(s.boss){
  const part=exposedPart(s.boss);
  if(!part||part.hp<=1)return false;
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
function inputLocked(s){return s.status!=='playing'||s.boss?.introRemaining>0||s.midboss?.introRemaining>0||s.midboss?.hp===0||s.boss?.transformRemaining>0;}
function inputTargets(s,p){
 const exposed=exposedPart(s.boss);
 return [...s.foes.flatMap(f=>[{kind:'enemy',word:f.word,id:f.uid},{kind:'enemy',word:f.english,reviewWord:f.word,id:f.uid}]),...(exposed?[{kind:'boss',word:exposed.word,id:exposed.id}]:[]),...((s.boss?.hp||s.midboss?.hp)?availableBossRewards(p):[]).map(reward=>({kind:'bossReward',word:reward.word,reward})),...availableFinalSpells(s.boss).map(spell=>({kind:'finalSpell',word:spell.word,spell})),...(s.boss?.pendingPart&&!s.boss.guarded?[{kind:'defend',word:DEFEND_WORD}]:[]),...(s.boss?.choices??[]).map(choice=>({kind:'priest',word:choice.word,choice})),...(s.midboss?.words??[]).map(word=>({kind:'midboss',word})),...(p.weapon?[{kind:'weapon',word:WEAPONS[p.weapon].word,key:p.weapon},{kind:'weapon',word:p.weapon.toUpperCase(),reviewWord:WEAPONS[p.weapon].word,key:p.weapon}]:[]),...p.charges.flatMap(key=>[{kind:'spell',word:SPELLS[key].word,key},{kind:'spell',word:key.toUpperCase(),reviewWord:SPELLS[key].word,key}])];
}
function recordMiss(s,p,targets,prefix,japanese=false){
 p.miss++;
 p.combo=0;
 p.bossClean=0;
 const remaining=new Set(targets.filter(t=>!prefix||(japanese?t.word.startsWith(prefix):isPrefix(t.word,prefix))).map(t=>t.reviewWord??t.word));
 if(remaining.size===1){
  const [word]=remaining;
  p.missWords[word]=(p.missWords[word]??0)+1;
 }
 emit(s,`${p.name} ミスタイプ`,'miss',p.id);
}
function handle(s,playerId,key){if(inputLocked(s))return;const p=s.players.find(x=>x.id===playerId);if(!p)return;const k=String(key).toUpperCase();
 if(k==='BACKSPACE'){p.typed=p.typed.slice(0,-1);return;}if(k==='ESCAPE'){p.typed='';return;}if(!/^[A-Z-]$/.test(k))return;
 let candidate=p.typed+k;
 const targets=inputTargets(s,p);
 let choices=targets.filter(t=>isPrefix(t.word,candidate));if(!choices.length){recordMiss(s,p,targets,p.typed);p.typed='';candidate=k;choices=targets.filter(t=>isPrefix(t.word,candidate));if(!choices.length)return;}
 p.typed=candidate;const matches=choices.filter(t=>complete(t.word,candidate));const ambiguous=choices.some(t=>!complete(t.word,candidate));if(!matches.length||(ambiguous&&!matches.some(t=>t.kind==='boss'||t.kind==='defend'||t.kind==='finalSpell'||t.kind==='bossReward'||((t.kind==='spell'||t.kind==='weapon')&&t.key.toUpperCase()===candidate))))return;
 const chosen=matches.sort((a,b)=>({defend:0,enemy:0,boss:1,priest:1,midboss:1,finalSpell:1,bossReward:1,spell:2,weapon:2}[a.kind]-{defend:0,enemy:0,boss:1,priest:1,midboss:1,finalSpell:1,bossReward:1,spell:2,weapon:2}[b.kind]))[0];p.typed='';
 if(chosen.kind==='bossReward'){castBossReward(s,p,chosen.reward);return;}
 if(chosen.kind==='finalSpell'){castFinalSpell(s,p,chosen.spell);return;}
 if(chosen.kind==='defend'){defend(s,p);return;}
 if(chosen.kind==='weapon'){useWeapon(s,p);return;}
 if(chosen.kind==='priest'){typePriest(s,p,chosen.choice);return;}
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
 const matches=word=>word.toLowerCase()===t||accepts(word).some(roman=>roman.toLowerCase()===t);
 if(s.boss?.pendingPart&&!s.boss.guarded&&matches(DEFEND_WORD)){p.typed='';defend(s,p);return true;}
 const bossReward=(s.boss?.hp||s.midboss?.hp)&&availableBossRewards(p).find(reward=>matches(reward.word));
 if(bossReward){p.typed='';castBossReward(s,p,bossReward);return true;}
 const finalSpell=availableFinalSpells(s.boss).find(spell=>matches(spell.word));
 if(finalSpell){p.typed='';castFinalSpell(s,p,finalSpell);return true;}
 if(p.weapon&&(p.weapon===t||matches(WEAPONS[p.weapon].word))){
  p.typed='';
  return useWeapon(s,p);
 }
 const midWord=s.midboss?.words.find(matches);
 if(midWord){p.typed='';typeMidboss(s,p,midWord);return true;}
 const priestChoice=s.boss?.choices?.find(choice=>matches(choice.word));
 if(priestChoice){p.typed='';typePriest(s,p,priestChoice);return true;}
 const spell=p.charges.find(k=>SPELLS[k].word===t||k===t);if(spell){p.typed='';return cast(s,p,spell);}const part=exposedPart(s.boss);if(part&&matches(part.word)){p.typed='';typeBossPart(s,p,part);return true;}const targets=[...s.foes.flatMap(f=>[f.word,f.english]),...p.charges.flatMap(k=>[SPELLS[k].word,k.toUpperCase()])];const match=targets.find(w=>w.toLowerCase().replace(/\s+/g,'')===t);if(!match){
 if(/[ぁ-ゖー一-龯]/.test(t)){
  const visible=inputTargets(s,p);
  let length=t.length;
  while(length>0&&!visible.some(target=>target.word.startsWith(t.slice(0,length))))length--;
  recordMiss(s,p,visible,t.slice(0,length),true);
  p.typed='';
  return true;
 }
 return false;
}p.typed='';const sequence=display(match).replace(/\s+/g,'');for(const ch of sequence){if(s.status!=='playing')break;handle(s,playerId,ch);}return true;}
function previewFinal(s,form){
 s.kills=20;
 s.midbossCleared=true;
 if(form==='priest')beginPriest(s);
 else beginBoss(s);
 return s;
}
function snapshot(s){return JSON.parse(JSON.stringify(s));}
return {normalizeRegisteredWords,yakuWords,ENEMIES,QUESTIONS,SPELLS,WEAPONS,ENGLISH,BOSS_WORDS,normalizeReviewWords,missRanking,availableBossRewards,availableFinalSpells,handleText,variants,accepts,isPrefix,complete,display,make,init,tick,handle,snapshot,emit,previewFinal};
});

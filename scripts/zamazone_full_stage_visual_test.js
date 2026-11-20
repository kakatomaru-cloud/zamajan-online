/* Full-stage asset and destruction visual smoke test.
 * Run with: node scripts/zamazone_full_stage_visual_test.js
 * Fail closed when any sprite, 2nd-stage death frame, or base renderer is unavailable.
 */
const {chromium}=require('playwright');
const fs=require('fs');
const path=require('path');
const out=path.join(process.cwd(),'zamazone-visual-evidence');
fs.mkdirSync(out,{recursive:true});
const url='http://127.0.0.1:8765/minigames/zamazone/index.html?stage2_qa=1';
const errors=[];
const expected={1:'grass_hq.webp',3:'ocean.png',4:'snow.png',5:'neon.png',6:'digital.png'};
function saveData(name,data){
 if(typeof data!=='string'||!data.startsWith('data:image/png;base64,'))throw Error(name+' empty PNG');
 fs.writeFileSync(path.join(out,name),Buffer.from(data.split(',')[1],'base64'));
}
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 const context=await browser.newContext({viewport:{width:1366,height:850},hasTouch:false});
 const page=await context.newPage();
 page.on('pageerror',e=>errors.push(String(e)));
 page.on('response',r=>{if(r.status()>=400&&/\/assets\//.test(r.url()))errors.push('HTTP '+r.status()+' '+r.url())});
 await page.goto(url,{waitUntil:'domcontentloaded',timeout:120000});
 await page.waitForFunction(()=>window.ZAMAZONE_BOARD_STAGE1356_TEST&&window.ZAMAZONE_DESERT_REDESIGN_TEST,{timeout:30000});
 await page.waitForFunction(()=>{
  const q=window.ZAMAZONE_BOARD_STAGE1356_QA?.();
  const d=window.ZAMAZONE_DESERT_REDESIGN_QA?.();
  return q&&Object.values(q.loaded).every(Boolean)&&d&&Object.values(d.assets).every(x=>{const [n,m]=x.split('/').map(Number);return n===m;});
 },{timeout:60000});
 const assetAudit=await page.evaluate(()=>{
  const cvs=document.createElement('canvas'),ctx2=cvs.getContext('2d',{willReadFrequently:true});
  function spriteAudit(file,parts,sw,sh){
   const img=new Image();img.src=file;
   if(!img.complete||!img.naturalWidth)return {file,error:'image unavailable'};
   if(img.naturalWidth!==sw*parts||img.naturalHeight!==sh)return {file,error:'atlas dimensions mismatch',width:img.naturalWidth,height:img.naturalHeight};
   cvs.width=img.naturalWidth;cvs.height=img.naturalHeight;ctx2.clearRect(0,0,cvs.width,cvs.height);ctx2.drawImage(img,0,0);
   const px=ctx2.getImageData(0,0,cvs.width,cvs.height).data;
   const cells=[];
   for(let i=0;i<parts;i++){
    let used=0,edge=0,minX=sw,minY=sh,maxX=-1,maxY=-1;
    for(let y=0;y<sh;y++)for(let x=0;x<sw;x++){
     const a=px[((y*cvs.width)+(i*sw+x))*4+3];
     if(a<=20)continue;
     used++;minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);
     if(x<=1||y<=1||x>=sw-2||y>=sh-2)edge++;
    }
    cells.push({i,used,edge,edgeRatio:used?Number((edge/used).toFixed(4)):0,bbox:[minX,minY,maxX,maxY]});
   }
   return {file,width:cvs.width,height:cvs.height,cells};
  }
  const arr=[spriteAudit('assets/board_stage1356/grass_hq.webp',7,160,160)];
  for(const name of ['ocean','snow','neon','digital'])arr.push(spriteAudit('assets/board_stage1356/'+name+'.png',7,48,48));
  return arr;
 });
 fs.writeFileSync(path.join(out,'asset-audit.json'),JSON.stringify(assetAudit,null,2));
 for(const asset of assetAudit){
  if(asset.error)errors.push(asset.file+': '+asset.error);
  for(const cell of asset.cells||[]){
   if(cell.used<40)errors.push(asset.file+' cell '+cell.i+': blank sprite');
   // A fully opaque border indicates a truncated sprite or missing transparency.
   if(cell.edgeRatio>.18)errors.push(asset.file+' cell '+cell.i+': excessive cropped edges '+cell.edgeRatio);
  }
 }
 const desert=await page.evaluate(()=>{
  const smoke=window.ZAMAZONE_DESERT_REDESIGN_TEST.smoke();
  return {smoke,png:document.querySelector('#game').toDataURL('image/png')};
 });
 saveData('stage-2.png',desert.png);
 if(!desert.smoke.allLoaded||!desert.smoke.groundDead||!desert.smoke.airDead||desert.smoke.after.deathDraw<=desert.smoke.before.deathDraw)
  errors.push('Stage 2 base destruction invalid: '+JSON.stringify(desert.smoke));
 for(const stage of [1,3,4,5,6]){
  const result=await page.evaluate(n=>{
   window.ZAMAZONE_BOARD_STAGE1356_TEST.enterLiveStage(n);
   const sample=window.ZAMAZONE_BOARD_STAGE1356_TEST.smoke(n);
   const quality=window.ZAMAZONE_BOARD_STAGE1356_QA();
   return {sample,quality,png:document.querySelector('#game').toDataURL('image/png')};
  },stage);
  saveData('stage-'+stage+'.png',result.png);
  const x=result.sample;
  if(!x.loaded||x.variants.length!==5||x.delta.enemy<5||x.delta.air<1||x.delta.ground<1||x.delta.fragments<1||x.activeDeaths<2)
   errors.push('Stage '+stage+' missing sprites or animated fragmentation: '+JSON.stringify(x));
  if(result.quality.assetFailures>0)errors.push('Stage '+stage+' art load errors '+result.quality.lastArtError);
 }
 const desktop=await page.evaluate(()=>({
   legacy:[...document.querySelectorAll('[data-key]')].filter(el=>getComputedStyle(el).display!=='none').length,
   dock:document.querySelector('#zama-mobile-controller')?getComputedStyle(document.querySelector('#zama-mobile-controller')).display:null
 }));
 if(desktop.legacy||desktop.dock!=='none')errors.push('Desktop controller visible '+JSON.stringify(desktop));
 fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({desert:desert.smoke,assetAudit,desktop,errors},null,2));
 await browser.close();
 if(errors.length)throw Error(errors.join('\n'));
 console.log('ZAMAZONE: ALL SIX STAGES, BASE DEATH ANIMATION, DESKTOP UI VERIFIED');
})().catch(e=>{console.error(e);process.exitCode=1});

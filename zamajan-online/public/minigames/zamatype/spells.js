(() => {
  const families = [
    { name:'火', art:'fire', color:'#ff9a53', pitch:145, spells:[['fire','ファイア'],['fira','ファイラ'],['firaga','ファイガ']] },
    { name:'雷', art:'thunder', color:'#b5a8ff', pitch:420, spells:[['thunder','サンダー'],['thundara','サンダラ'],['thundaga','サンダガ']] },
    { name:'氷', art:'ice', color:'#8be7ff', pitch:740, spells:[['blizzard','ブリザド'],['blizzara','ブリザラ'],['blizzaga','ブリザガ']] },
    { name:'回復', art:'heal', color:'#a0f9bd', pitch:570, spells:[['cure','ケアル'],['cura','ケアルラ'],['curaga','ケアルガ']] }
  ];
  const ward = {art:'ward',color:'#b4deff',pitch:520};
  const textures=new Map(families.map(({art})=>{
    const texture=new Image();
    texture.src=`vfx-${art}.webp`;
    texture.decode?.().catch(()=>{});
    return [art,texture];
  }));

  function createScene(x,y,width,height,family,rank,wide=false,delay=0) {
    const scene=document.createElement('div');
    scene.className=`spellScene spellScene--${family.art}${wide?' spellScene--wide':''}`;
    scene.style.cssText=`left:${x}px;top:${y}px;width:${width}px;height:${height}px;--spell-color:${family.color};--spell-time:${770+rank*105}ms;--impact-delay:${delay}ms`;
    scene.setAttribute('aria-hidden','true');
    scene.innerHTML='<div class="spellCue"></div><div class="spellWake"></div>';
    const texture=textures.get(family.art);
    if(!wide && texture){
      const image=texture.cloneNode();
      image.className='spellTexture';
      image.style.scale=delay%2 ? '-.93 .94' : '1';
      image.alt='';
      scene.append(image);
    }
    for(let i=0;i<3+rank;i++){
      const fleck=document.createElement('i');
      const turn=i*2.39996;
      fleck.className='spellFleck';
      fleck.style.cssText=`--x:${Math.cos(turn)*width*(.23+(i%4)*.08)}px;--y:${Math.sin(turn)*height*.28-height*.28}px;--angle:${i*37}deg;--fleck-delay:${i*7}ms`;
      scene.append(fleck);
    }
    scene.addEventListener('animationend',event=>{if(event.target===scene)scene.remove();});
    return scene;
  }
  function chainLightning(bounds, areas) {
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('viewBox',`0 0 ${bounds.width} ${bounds.height}`);
    svg.setAttribute('class','spellChain');
    svg.setAttribute('aria-hidden','true');
    for(let i=1;i<areas.length;i++){
      const previous=areas[i-1], next=areas[i];
      const x=previous.left+previous.width*.5-bounds.left;
      const y=previous.top+previous.height*.49-bounds.top;
      const dx=next.left+next.width*.5-bounds.left-x;
      const dy=next.top+next.height*.49-bounds.top-y;
      const steps=Array.from({length:7},(_,step)=>{
        const t=(step+1)/7;
        const jitter=step===6?0:((step%2)*2-1)*(5+(step*3)%9);
        return `L${(x+dx*t).toFixed(1)} ${(y+dy*t+jitter).toFixed(1)}`;
      }).join(' ');
      const path=`M${x} ${y} ${steps}`;
      const segment=document.createElementNS(svg.namespaceURI,'g');
      segment.style.setProperty('--chain-delay',`${i*14}ms`);
      segment.innerHTML=`<path class="chainGlow" d="${path}"/><path class="chainCore" d="${path}"/>`;
      svg.append(segment);
    }
    svg.addEventListener('animationend',event=>{if(event.target===svg)svg.remove();});
    return svg;
  }
  function render(layer,key,targets,audio,{wide}={}) {
    const family = families.find(f=>f.spells.some(([spell])=>spell===key)) || ward;
    const rank=(family.spells?.findIndex(([spell])=>spell===key) ?? 0)+1;
    const bounds=layer.getBoundingClientRect();
    const areas=targets.filter(Boolean).map(target=>target.getBoundingClientRect()).filter(rect=>rect.width>0).sort((a,b)=>a.left-b.left);
    const batch=document.createDocumentFragment();
    const showField=wide ?? (areas.length>1);
    if(showField&&areas.length>1&&family.art==='thunder'){
      batch.append(chainLightning(bounds,areas));
    } else if(showField&&areas.length>1&&['fire','ice'].includes(family.art)){
      const left=Math.min(...areas.map(r=>r.left));
      const right=Math.max(...areas.map(r=>r.right));
      const floor=Math.max(...areas.map(r=>r.bottom));
      const width=Math.min(bounds.width*.97,(right-left)*1.33);
      const height=Math.min(bounds.height*.9,Math.max(...areas.map(r=>r.height))*1.3);
      batch.append(createScene((left+right)*.5-bounds.left,floor-bounds.top,width,height,family,rank,true));
    }
    for(const [index,rect] of areas.entries()){
      const width=Math.min(bounds.width*.48,Math.max(84,rect.width)*(1.22+rank*.24));
      const height=Math.min(bounds.height*.82,Math.max(120,rect.height*(1.35+rank*.12)));
      batch.append(createScene(rect.left-bounds.left+rect.width*.5,rect.bottom-bounds.top,width,height,family,rank,false,index*12));
    }
    layer.append(batch);
    if(audio?.state!=='running') return;
    const time=audio.currentTime;
    const tone=audio.createOscillator(), gain=audio.createGain();
    tone.type=family.art==='fire'?'triangle':'sine';
    tone.frequency.setValueAtTime(family.pitch,time);
    tone.frequency.exponentialRampToValueAtTime(family.pitch*(family.art==='heal'?1.45:.55),time+.28);
    gain.gain.setValueAtTime(.002,time);
    gain.gain.linearRampToValueAtTime(.07+rank*.012,time+.015);
    gain.gain.exponentialRampToValueAtTime(.001,time+.33);
    tone.connect(gain).connect(audio.destination);
    tone.start(time);
    tone.stop(time+.34);
  }
  window.ZamaSpellFX={families,render};
})();

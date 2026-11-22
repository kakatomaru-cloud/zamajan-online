(() => {
  const control=document.getElementById('bgmVolume');
  const output=document.getElementById('bgmPercent');
  if(!control||!output)return;
  const key='zamatype.bgmVolume';
  const callbacks=new Set();
  let percent=15;
  try {
    const saved=localStorage.getItem(key);
    if(saved!==null&&/^(?:[0-9]{1,2}|100)$/.test(saved)) percent=Number(saved);
  } catch {}
  function render(){
    control.value=String(percent);
    output.value=percent+'%';
    callbacks.forEach(callback=>callback(percent/100));
  }
  control.addEventListener('input',()=>{
    percent=Number(control.value);
    try{localStorage.setItem(key,String(percent));}catch{}
    render();
  });
  window.ZamaBgm={subscribe(callback){callbacks.add(callback);callback(percent/100);}};
  render();
})();

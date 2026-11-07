/* ザマゾーン add-on menu: does not overwrite or alter Zamajan game rules. */
(() => {
  'use strict';
  const GAME_URL = '/minigames/zamazone/';
  const TITLE = 'ザマゾーン～ザマザマの大冒険～';
  const STORAGE = 'zamajan:minigames:zamazone:enabled';
  if (document.getElementById('zaz-addon-root')) return;
  const style = document.createElement('style');
  style.textContent = `
  #zaz-addon-root{position:fixed;right:12px;bottom:14px;z-index:2147482000;font-family:system-ui,-apple-system,'Yu Gothic',sans-serif;color:#fff}
  #zaz-open-menu{border:2px solid #ffe39c;border-radius:14px;background:linear-gradient(135deg,#462472,#a33478);color:#fff7d8;font-weight:900;padding:12px 16px;box-shadow:0 6px 18px #0008;font-size:14px;cursor:pointer}
  #zaz-panel{display:none;position:absolute;bottom:60px;right:0;background:linear-gradient(155deg,#29214e,#101c38);border:2px solid #f1c56d;border-radius:14px;box-shadow:0 8px 28px #000b;width:min(92vw,340px);padding:15px;max-height:75vh;overflow-y:auto}
  #zaz-panel[data-open="true"]{display:block}
  #zaz-panel h3{font-size:17px;margin:0 0 9px;color:#ffe39c}
  #zaz-panel label{display:flex;align-items:start;gap:9px;line-height:1.5;font-size:14px;cursor:pointer}
  #zaz-enabled{width:20px;height:20px;accent-color:#f5a7d4;flex-shrink:0}
  #zaz-launch{display:block;width:100%;padding:12px 8px;border:2px solid #ffe39c;border-radius:10px;background:linear-gradient(135deg,#ed72b6,#8157e6);color:#fff;font-weight:900;cursor:pointer;text-align:center;text-decoration:none;margin-top:12px}
  #zaz-panel p{font-size:12px;line-height:1.5;color:#cbd7f8;margin:8px 0 0}
  #zaz-launch[hidden],#zaz-open-menu[hidden]{display:none!important}
  `;
  const root = document.createElement('div');root.id = 'zaz-addon-root';
  const opener = document.createElement('button');opener.id='zaz-open-menu';opener.type='button';opener.textContent='🎮 ミニゲーム';
  opener.setAttribute('aria-expanded','false');
  const panel = document.createElement('section');panel.id='zaz-panel';panel.setAttribute('aria-label','ミニゲーム選択');
  const head = document.createElement('h3');head.textContent='ミニゲームを選択';
  const label = document.createElement('label');
  const check = document.createElement('input');check.type='checkbox';check.id='zaz-enabled';
  const desc = document.createElement('span');desc.textContent='ザマゾーンをザマじゃんのミニゲーム一覧に追加する';
  label.append(check,desc);
  const launch = document.createElement('a');launch.id='zaz-launch';launch.href=GAME_URL;launch.target='_blank';launch.rel='noopener noreferrer';launch.textContent=TITLE;
  const note=document.createElement('p');note.textContent='チェックを外すと追加ボタンが非表示になります。設定はこのブラウザに保存されます。';
  panel.append(head,label,launch,note);root.append(opener,panel);document.head.append(style);document.body.append(root);
  const enabled = () => localStorage.getItem(STORAGE)==='true';
  function refresh(){check.checked=enabled();launch.hidden=!enabled()}
  refresh();
  check.addEventListener('change',()=>{localStorage.setItem(STORAGE,String(check.checked));refresh()});
  opener.addEventListener('click',()=>{const open=panel.dataset.open!=='true';panel.dataset.open=String(open);opener.setAttribute('aria-expanded',String(open))});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){panel.dataset.open='false';opener.setAttribute('aria-expanded','false')}});
})();

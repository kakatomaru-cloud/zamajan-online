from pathlib import Path
p=Path("zamajan-online/public/minigames/zamazone/index.html")
s=p.read_text(encoding="utf-8")
tag="ZAMAZONE_MANA3_MERGE_TEST_ENTRY_20261116"
if tag in s:
    print("Mana3 test entry already installed")
    raise SystemExit(0)
assert "</body>" in s, "body close not found"
addition=r'''
<!-- ZAMAZONE_MANA3_MERGE_TEST_ENTRY_20261116 -->
<style>
#zama-merge-test-open{position:fixed;right:14px;bottom:14px;z-index:2147483000;background:#2c1854;color:#fff;border:2px solid #f8dc82;border-radius:12px;padding:11px 15px;font:bold 14px system-ui;cursor:pointer;box-shadow:0 4px 18px #000b}
#zama-merge-test-overlay{display:none;position:fixed;inset:0;z-index:2147483001;background:#060718ed;flex-direction:column;padding:8px;box-sizing:border-box}
#zama-merge-test-overlay[aria-hidden="false"]{display:flex}
#zama-merge-test-bar{display:flex;justify-content:space-between;align-items:center;color:#fff;font:700 15px system-ui;padding:5px 12px}
#zama-merge-test-close{border:1px solid #fff7;color:#fff;background:#583978;border-radius:8px;padding:8px 17px;cursor:pointer}
#zama-merge-test-frame{width:100%;flex:1;min-height:0;border:2px solid #f8dc82;border-radius:9px;background:#070719}
</style>
<button type="button" id="zama-merge-test-open" title="MANA3 合体岩攻撃の検証版">MANA3 合体岩 テスト</button>
<div id="zama-merge-test-overlay" aria-hidden="true" role="dialog" aria-label="MANA3合体岩テスト">
<div id="zama-merge-test-bar"><span>MANA3 合体岩攻撃 — merge → bigrock 検証版</span><button type="button" id="zama-merge-test-close">ゲームに戻る ×</button></div>
<iframe id="zama-merge-test-frame" title="MANA3 合体岩攻撃テスト" loading="lazy"></iframe>
</div>
<script>
(()=>{'use strict';
const open=document.getElementById('zama-merge-test-open'),panel=document.getElementById('zama-merge-test-overlay'),close=document.getElementById('zama-merge-test-close'),frame=document.getElementById('zama-merge-test-frame');
open.addEventListener('click',()=>{frame.src='mana3_merge_bigrock_test.html';panel.setAttribute('aria-hidden','false');});
close.addEventListener('click',()=>{panel.setAttribute('aria-hidden','true');frame.src='about:blank';});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&panel.getAttribute('aria-hidden')==='false')close.click();});
})();
</script>
'''
s=s.replace("</body>",addition+"\n</body>",1)
p.write_text(s,encoding="utf-8")
print("Inserted Mana3 testing panel:",len(s))

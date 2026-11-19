#!/usr/bin/env python3
"""Insert the battle-tested mana4 live boss after Stage 2 and board integrations."""
from pathlib import Path
p=Path('zamajan-online/public/minigames/zamazone')
index=p/'index.html'
source=Path('scripts/zamazone_mana4_stage3_live.js')
text=index.read_text(encoding='utf-8')
js=source.read_text(encoding='utf-8')
marker='ZAMAZONE_MANA4_STAGE3_LIVE_V1_20261119'
anchor='if(!riichiMode)showDebugTitle();\n})();</script><script id="zj-minigame-ready-v2">'
assert marker in js and anchor in text
if marker in text:
    start=text.index('/* '+marker)
    text=text[:start]+js+'\n'+text[text.index(anchor,start):]
else:
    text=text.replace(anchor,js+'\n'+anchor,1)
assert text.count(marker)==1
index.write_text(text,encoding='utf-8')
print('MANA4_STAGE3_PLAYABLE_INTEGRATED',index.stat().st_size)

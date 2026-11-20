#!/usr/bin/env python3
"""Integrate the mobile dock after the stage-specific boss and board hooks."""
from pathlib import Path
p=Path('zamajan-online/public/minigames/zamazone')
index=p/'index.html'
source=Path('scripts/zamazone_mobile_fixed_controls_v1.js')
text=index.read_text('utf-8')
js=source.read_text('utf-8')
marker='ZAMAZONE_MOBILE_FIXED_CONTROLLER_V1_20261120'
anchor='if(!riichiMode)showDebugTitle();\n})();</script><script id="zj-minigame-ready-v2">'
assert marker in js and anchor in text
if marker in text:
    start=text.index('/* '+marker)
    text=text[:start]+js+'\n'+text[text.index(anchor,start):]
else:
    text=text.replace(anchor,js+'\n'+anchor,1)
assert text.count(marker)==1
index.write_text(text,'utf-8')
print('MOBILE_FIXED_CONTROL_DOCK_INTEGRATED')

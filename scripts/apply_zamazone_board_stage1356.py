#!/usr/bin/env python3
"""Integrate the supplied 1/3/4/5/6 artwork AFTER the stage-2 desert runtime.

The supplied design board has five rows. Each row is a losslessly decoded
transparent 7x1 PNG atlas (five enemies, flying base, grounded base).
The B64 PNG files were extracted and transparently masked from the source JPEG,
then stored as ASCII for exact GitHub connector upload.
"""
from pathlib import Path
import base64, struct, zlib

root=Path('zamajan-online/public/minigames/zamazone')
source=root/'board_stage1356.js'
index=root/'index.html'
asset_dir=root/'assets/board_stage1356'
assert source.is_file()
for name in ('grass','ocean','snow','neon','digital'):
    input=asset_dir/f'{name}.png.b64'
    assert input.exists(),f'Missing atlas {input}'
    raw=base64.b64decode(input.read_text(encoding='utf8').strip(),validate=True)
    assert raw.startswith(b'\x89PNG\r\n\x1a\n'),name
    w,h=struct.unpack('>II',raw[16:24])
    assert (w,h)==(336,48),(name,w,h)
    assert raw.endswith(b'IEND\xaeB\x60\x82'),f'Corrupted atlas: {name}'
    out=asset_dir/f'{name}.png'
    out.write_bytes(raw)
    print('BOARD_ATLAS',name,out.stat().st_size)
s=index.read_text('utf8')
js=source.read_text('utf8')
marker='ZAMAZONE_BOARD_STAGE1356_V1_20261118'
anchor='if(!riichiMode)showDebugTitle();\n})();</script><script id="zj-minigame-ready-v2">'
assert anchor in s
assert marker in js
# During each rebuild, Pyramid replaces its own trailing script section,
# then desert is reintegrated, then the new board runtime is added last.
if marker in s:
    start=s.index('/* '+marker)
    end=s.index(anchor,start)
    s=s[:start]+js+'\n'+s[end:]
else:
    s=s.replace(anchor,js+'\n'+anchor,1)
assert s.count(marker)==1
index.write_text(s,'utf8')
print('BOARD_STAGE1356_INTEGRATED 25 source-approved mobs + 10 bases + animated hit/death states')

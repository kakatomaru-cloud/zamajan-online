from pathlib import Path
import json,re,base64
p=Path('zamajan-online/public/minigames/zamazone')
html=p/'index.html'
s=html.read_text(encoding='utf8')
tag='ZAMAZONE_PYRAMID_EYE_STAGE2_V1_20261116'
source=Path('scripts/zamazone_pyramid_eye_stage2_v1.js').read_text(encoding='utf8')
assert 'ZAMAZONE_PYRAMID_EYE_STAGE2_V1_20261116' in source
anchor='if(!riichiMode)showDebugTitle();\n})();</script><script id="zj-minigame-ready-v2">'
assert anchor in s, 'Main game insertion point moved'
if tag not in s:
    s=s.replace(anchor,source+'\n'+anchor,1)
    html.write_text(s,encoding='utf8')
demo=(p/'mana3_merge_bigrock_test.html').read_text(encoding='utf8')
m=re.search(r'const ASSETS=(\{.*?\});\s*const imgs=',demo,re.S)
assert m, 'Cannot extract approved demo sprite data'
d=json.loads(m.group(1))
assert len(d['body'])==16 and len(d['orb'])==8
output=p/'assets/pyramid_eye'
output.mkdir(parents=True,exist_ok=True)
def emit(name,data):
    prefix='data:image/webp;base64,'
    assert data.startswith(prefix),name
    raw=base64.b64decode(data[len(prefix):],validate=True)
    assert raw[:4]==b'RIFF' and raw[8:12]==b'WEBP',name
    (output/name).write_bytes(raw)
for i,img in enumerate(d['body']):emit('body_%02d.webp'%i,img)
for i,img in enumerate(d['orb']):emit('orb_%02d.webp'%i,img)
emit('rock.webp',d['rock'])
print('Stage2 Pyramid Eye installed with 25 original transparent sprites',html.stat().st_size)

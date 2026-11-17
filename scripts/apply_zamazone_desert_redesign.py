#!/usr/bin/env python3
"""Integrate approved Stage 2 desert sprites after the Pyramid Eye rebuild.
Stages 1 and 3-6 and boss combat code are intentionally left unchanged.
"""
from pathlib import Path
root=Path("zamajan-online/public/minigames/zamazone")
index=root/"index.html"
script=root/"desert_redesign_stage2.js"
assert index.exists() and script.exists(), "Desert runtime/index missing"
assets=root/"assets/desert_redesign"
for stem,count in (("ground_idle",4),("air_idle",4),("ground_death",6),("air_death",6),("enemy",8)):
    for i in range(count):
        p=assets/f"{stem}_{i}.webp"
        assert p.is_file() and p.stat().st_size>1000, f"Missing sprite: {p}"
        assert p.read_bytes()[:4]==b"RIFF", f"Invalid WebP header: {p}"
text=index.read_text(encoding="utf-8")
source=script.read_text(encoding="utf-8")
marker="ZAMAZONE_STAGE2_DESERT_BASE_ENEMY_REDESIGN_V1_20261117"
anchor='if(!riichiMode)showDebugTitle();\n})();</script><script id="zj-minigame-ready-v2">'
# The main game is one closure. External <script src> cannot access its private
# drawBase/drawEnemy/hitBase symbols. Inject BEFORE the closure closes.
assert anchor in text, "Stage 2 insertion anchor missing"
text=text.replace('<script src="desert_redesign_stage2.js"></script>','')
if marker in text:
    start=text.index('/* '+marker)
    end=text.index(anchor,start)
    text=text[:start]+source+'\n'+text[end:]
else:
    text=text.replace(anchor,source+'\n'+anchor,1)
index.write_text(text,encoding="utf-8")
assert text.count(marker)==1, "Duplicate desert runtime"
print("DESERT_REDESIGN_INTEGRATED_INLINE: 28 sprite frames, ground/air bases and enemies")

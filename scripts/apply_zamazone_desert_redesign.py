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
tag='<script src="desert_redesign_stage2.js"></script>'
assert "</body>" in text, "HTML body closing tag missing"
if tag not in text:
    text=text.replace("</body>",tag+"\n</body>",1)
index.write_text(text,encoding="utf-8")
assert text.count(tag)==1, "Duplicate desert runtime"
print("DESERT_REDESIGN_INTEGRATED: 28 sprite frames, ground/air bases and enemies")

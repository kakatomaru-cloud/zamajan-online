from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance
import math

root=Path("zamajan-online/public/minigames/zamazone")
assets=root/"assets"; out=assets/"stage2_concept";out.mkdir(exist_ok=True)
RGBA=lambda p:Image.open(p).convert("RGBA")
base=RGBA(assets/"boss_rig/mana3_armL.png")
w,h=base.size
def save(img,name,width=None,quality=82):
 if width and img.width>width:img=img.resize((width,max(1,int(img.height*width/img.width))),Image.Resampling.LANCZOS)
 img.save(out/(name+".webp"),"WEBP",quality=quality,method=5)
def polygon_piece(img,box,pts):
 canvas=Image.new("RGBA",img.size)
 mask=Image.new("L",img.size,0);d=ImageDraw.Draw(mask);d.polygon(pts,fill=255)
 mask=mask.filter(ImageFilter.GaussianBlur(.65))
 canvas.paste(img,(0,0),mask)
 return canvas.crop(box)
def tint(im, factor):
 rgb=ImageEnhance.Color(im.convert('RGB')).enhance(factor)
 rgb.putalpha(im.getchannel("A"))
 return rgb
def variant(im,angle=0,shift=0):
 ret=im.rotate(angle,resample=Image.Resampling.BICUBIC,expand=False)
 if shift:ret=tint(ret,shift)
 return ret

# The currently committed original game art serves as the source.
# Every boss piece is explicitly masked to a transparent independent component.
parts={
 "boss_body":((81,15,263,265),[(96,23),(172,12),(254,23),(235,120),(211,199),(173,251),(132,205),(109,125)]),
 "boss_eye":((103,148,244,244),[(115,163),(170,140),(233,166),(243,199),(220,228),(165,238),(111,216)]),
 "boss_wing_L":((0,65,144,215),[(0,105),(28,88),(78,95),(138,144),(123,189),(67,205),(0,173)]),
 "boss_wing_R":((200,65,344,215),[(344,105),(317,88),(265,95),(207,144),(221,189),(280,205),(344,173)]),
 "boss_claw_L":((69,174,163,265),[(71,191),(97,179),(143,188),(162,222),(134,259),(84,245)]),
 "boss_claw_R":((181,174,275,265),[(273,191),(247,179),(201,188),(182,222),(210,259),(260,245)]),
 "boss_tail":((128,222,219,310),[(143,227),(173,218),(205,228),(217,268),(171,305),(132,267)]),
}
for key,(box,points) in parts.items():
 part=polygon_piece(base,box,points)
 part=part.resize((int(part.width*.92),int(part.height*.92)),Image.Resampling.LANCZOS)
 if key=="boss_body":save(part,key,200)
 elif key=="boss_eye":
  for i in range(3):save(variant(part,0,1+i*.25),key+str(i),115)
  save(tint(part,.2),key+"_hurt",115)
 else:
  for i in range(3):
   transformed=variant(part,[-8,0,8][i],1.0+i*.08)
   save(transformed,key+str(i),140)

# Parallex layers with transparent foreground / middle sections, preserving composition.
bg=RGBA(assets/"area2_background.webp")
bg=bg.resize((1280,420),Image.Resampling.LANCZOS)
def bgcrop(name,top,bottom,alpha):
 im=Image.new("RGBA",(1280,420),(0,0,0,0))
 cr=bg.crop((0,top,1280,bottom))
 cr.putalpha(Image.new("L",cr.size,alpha))
 im.alpha_composite(cr,(0,top));save(im,name,width=1280,quality=77)
bgcrop("bg_sky",0,170,240)
bgcrop("bg_far",90,280,205)
bgcrop("bg_mid",175,362,215)
bgcrop("bg_near",286,420,255)

# Real game characters remain transparent and are frame animated.
enemy_src=assets.parent/"assets_new"
source_map={"beetle":"zaz_jelly.png","ray":"zaz_wasp.png","balloon":"zaz_airbase.png"}
for key,name in source_map.items():
 f=enemy_src/name
 if not f.exists():f=assets/"mana_3.png"
 im=RGBA(f);bb=im.getbbox()
 if bb:im=im.crop(bb)
 for i in range(3):save(variant(im,[-6,0,6][i],1+(i%2)*.1),"enemy_"+key+str(i),110)
ground=RGBA(assets/"mana3_frame00.png")
g=ground.crop((0,0,344,260))
# Build transparent versions of temple facade and floating fort from existing originals.
for i in range(2):
 im=RGBA(assets/"mana_3.png")
 bb=im.getbbox()
 if bb:im=im.crop(bb)
 im=im.resize((210,175),Image.Resampling.LANCZOS)
 save(variant(im,[-2,2][i]),"base_ground"+str(i),220)
 f=RGBA(enemy_src/"zaz_airbase.png")
 bb=f.getbbox()
 if bb:f=f.crop(bb)
 save(variant(f,[-3,3][i]),"base_air"+str(i),220)
save(tint(im,.24),"base_ground_hurt",220)
save(tint(f,.24),"base_air_hurt",220)
print("generated",len(list(out.glob("*.webp"))),"concept-derived stage 2 assets")

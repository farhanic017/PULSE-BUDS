from PIL import Image, ImageDraw, ImageFont
import os
names = [
 'airpods-pngall.png','airpods-pngarts.png','airpods-pngmartfile.png',
 'buds3-ais.png','sony-capes.png','anker-cloud.png','anker-sinja.png',
 'bose-brother.png','bose-muo.png','bose-newpan.png','jbl-global.png','jbl-store.png',
 'google-case.png','google-anpo.png','nothing-white.png','nothing-black.png','nothing-yellow.png',
 'hoco-prime.png','hoco-ocean.png','hoco-official.webp','baseus-official1.jpg','baseus-official.jpg','baseus-gizmo.jpg',
 'sennheiser-graphite.jpg','sennheiser-silver.jpg','sennheiser-prezly.jpg'
]
base='assets/official2'
alt='assets/official'
thumb=250
cols=5
rows=(len(names)+cols-1)//cols
sheet=Image.new('RGB',(cols*thumb, rows*(thumb+24)),(232,232,235))
d=ImageDraw.Draw(sheet)
font=ImageFont.load_default()
for i,name in enumerate(names):
    p=os.path.join(base,name)
    if not os.path.exists(p): p=os.path.join(alt,name)
    im=Image.open(p).convert('RGBA')
    im.thumbnail((thumb-18,thumb-18))
    x=(i%cols)*thumb; y=(i//cols)*(thumb+24)
    for yy in range(y,y+thumb,20):
        for xx in range(x,x+thumb,20):
            if ((xx-x)//20+(yy-y)//20)%2==0:
                d.rectangle([xx,yy,xx+19,yy+19],fill=(210,210,214))
    sheet.paste(im,(x+(thumb-im.width)//2,y+(thumb-im.height)//2),im)
    d.rectangle([x,y,x+thumb-1,y+thumb-1],outline=(120,120,124))
    d.text((x+5,y+thumb+4),name,fill=(20,20,20),font=font)
sheet.save('assets/official2/_selected.png')
print(sheet.size)
for name in names:
    p=os.path.join(base,name)
    if not os.path.exists(p): p=os.path.join(alt,name)
    im=Image.open(p)
    print(f"{name:28} {im.size[0]:5}x{im.size[1]:<5} {im.mode:5} bbox={im.getbbox()}")

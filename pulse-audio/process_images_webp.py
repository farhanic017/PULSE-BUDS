from PIL import Image, ImageDraw, ImageFont, ImageFilter
from collections import deque
import os

OUT = 'assets/devices'
os.makedirs(OUT, exist_ok=True)

def trim(im, pad_ratio=0.04, max_side=700):
    bbox = im.getbbox()
    if bbox:
        im = im.crop(bbox)
    w, h = im.size
    pad = int(max(w, h) * pad_ratio)
    canvas = Image.new('RGBA', (w + pad*2, h + pad*2), (0,0,0,0))
    canvas.alpha_composite(im, (pad, pad))
    w, h = canvas.size
    if max(w, h) > max_side:
        scale = max_side / max(w, h)
        canvas = canvas.resize((max(1,int(w*scale)), max(1,int(h*scale))), Image.LANCZOS)
    return canvas

def is_white(p, threshold=238, sat=10):
    r,g,b,a = p
    return a > 0 and min(r,g,b) >= threshold and (max(r,g,b)-min(r,g,b)) <= sat

def remove_white_bg(im, threshold=242, sat=12, feather=1.1):
    im = im.convert('RGBA')
    w,h = im.size
    px = im.load()
    bg = bytearray(w*h)
    q = deque()
    def push(x,y):
        idx = y*w+x
        if not bg[idx] and is_white(px[x,y], threshold, sat):
            bg[idx] = 1
            q.append((x,y))
    for x in range(w):
        push(x,0); push(x,h-1)
    for y in range(h):
        push(0,y); push(w-1,y)
    while q:
        x,y = q.popleft()
        if x>0: push(x-1,y)
        if x<w-1: push(x+1,y)
        if y>0: push(x,y-1)
        if y<h-1: push(x,y+1)
    mask = Image.new('L', (w,h), 255)
    mp = mask.load()
    for y in range(h):
        row = y*w
        for x in range(w):
            if bg[row+x]:
                mp[x,y] = 0
    if feather:
        mask = mask.filter(ImageFilter.GaussianBlur(feather))
    r,g,b,a = im.split()
    a = Image.composite(a, Image.new('L',(w,h),0), mask)
    out = Image.merge('RGBA',(r,g,b,a))
    bbox = out.getbbox()
    return out.crop(bbox) if bbox else out

def save(name, src, bg=False, threshold=242, feather=1.1, max_side=700, crop=0):
    im = Image.open(src)
    im.load()
    if crop:
        w,h = im.size
        im = im.crop((crop,crop,w-crop,h-crop))
    if bg:
        im = remove_white_bg(im, threshold=threshold, feather=feather)
    else:
        im = im.convert('RGBA')
    im = trim(im, max_side=max_side)
    path = os.path.join(OUT, name)
    im.save(path, 'WEBP', quality=91, method=6)
    print(f'{name:32} {im.size[0]}x{im.size[1]}  {os.path.getsize(path)//1024} KB')
    return im

assets = [
    ('pulse-explore.webp', 'assets/earbuds-black.png', False, 242, 1.1, 700, 0),
    ('airpods-pro.webp', 'assets/official2/airpods-pngall.png', False, 242, 1.1, 700, 0),
    ('galaxy-buds3-pro.webp', 'assets/official/buds3-ais.png', False, 242, 1.1, 700, 0),
    ('sony-wh1000xm5.webp', 'assets/official2/sony-capes.png', False, 242, 1.1, 700, 0),
    ('anker-liberty4nc.webp', 'assets/official2/anker-cloud.png', False, 242, 1.1, 700, 0),
    ('jbl-tune770nc.webp', 'assets/official/jbl-global.png', False, 242, 1.1, 700, 0),
    ('bose-qc-ultra.webp', 'assets/official2/bose-muo.png', False, 242, 1.1, 700, 0),
    ('sennheiser-momentum4.webp', 'assets/official/sennheiser-prezly.jpg', True, 244, 1.0, 700, 2),
    ('nothing-ear-a.webp', 'assets/official2/nothing-white.png', False, 242, 1.1, 700, 0),
    ('google-pixel-buds-pro2.webp', 'assets/official/google-case.png', False, 242, 1.1, 700, 0),
    ('hoco-ew75.webp', 'assets/official2/hoco-prime.png', False, 242, 1.1, 700, 0),
    ('baseus-bowie-ma10.webp', 'assets/official2/baseus-official1.jpg', True, 244, 1.1, 700, 0),
]
imgs = []
for spec in assets:
    imgs.append((spec[0], save(*spec)))

# Contact sheet with light and dark tiles
thumb = 250
cols = 4
rows = (len(imgs)+cols-1)//cols
sheet = Image.new('RGB', (cols*thumb, rows*(thumb+24)), (235,235,238))
d = ImageDraw.Draw(sheet)
font = ImageFont.load_default()
for i,(name,im) in enumerate(imgs):
    x=(i%cols)*thumb; y=(i//cols)*(thumb+24)
    # half light / half dark tile
    d.rectangle([x,y,x+thumb//2,y+thumb-1], fill=(248,248,250))
    d.rectangle([x+thumb//2,y,x+thumb-1,y+thumb-1], fill=(28,28,31))
    im2 = im.copy(); im2.thumbnail((thumb-28,thumb-28))
    sheet.paste(im2,(x+(thumb-im2.width)//2,y+(thumb-im2.height)//2),im2)
    d.rectangle([x,y,x+thumb-1,y+thumb-1],outline=(120,120,124))
    d.text((x+5,y+thumb+4),name.replace('.webp',''),fill=(20,20,20),font=font)
sheet.save('assets/devices/_contact2.png')
print('contact', sheet.size)

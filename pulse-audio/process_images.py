from PIL import Image, ImageDraw, ImageFont, ImageFilter
from collections import deque
import os, math

OUT = 'assets/devices'
os.makedirs(OUT, exist_ok=True)

def trim(im, pad_ratio=0.035, max_side=900):
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

def remove_white_bg(im, threshold=238, sat=10, feather=1.2):
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
    # trim transparent margins
    bbox = out.getbbox()
    return out.crop(bbox) if bbox else out

def save(name, src, bg=False, threshold=238, feather=1.2, max_side=900):
    im = Image.open(src)
    im.load()
    if bg:
        im = remove_white_bg(im, threshold=threshold, feather=feather)
    else:
        im = im.convert('RGBA')
    im = trim(im, max_side=max_side)
    path = os.path.join(OUT, name)
    im.save(path, 'PNG', optimize=True)
    print(f'{name:30} {im.size[0]}x{im.size[1]}  {os.path.getsize(path)//1024} KB')
    return im

assets = [
    ('pulse-explore.png', 'assets/earbuds-black.png', False, 238, 1.2, 900),
    ('airpods-pro.png', 'assets/official2/airpods-pngall.png', False, 238, 1.2, 900),
    ('galaxy-buds3-pro.png', 'assets/official/buds3-ais.png', False, 238, 1.2, 900),
    ('sony-wh1000xm5.png', 'assets/official2/sony-capes.png', False, 238, 1.2, 900),
    ('anker-liberty4nc.png', 'assets/official2/anker-cloud.png', False, 238, 1.2, 900),
    ('jbl-tune770nc.png', 'assets/official/jbl-global.png', False, 238, 1.2, 900),
    ('bose-qc-ultra.png', 'assets/official2/bose-brother.png', False, 238, 1.2, 900),
    ('sennheiser-momentum4.png', 'assets/official/sennheiser-prezly.jpg', True, 242, 1.2, 900),
    ('nothing-ear-a.png', 'assets/official2/nothing-white.png', False, 238, 1.2, 900),
    ('google-pixel-buds-pro2.png', 'assets/official/google-case.png', False, 238, 1.2, 900),
    ('hoco-ew75.png', 'assets/official2/hoco-prime.png', True, 246, 1.0, 900),
    ('baseus-bowie-ma10.png', 'assets/official2/baseus-official1.jpg', True, 242, 1.2, 900),
]
imgs = []
for spec in assets:
    imgs.append((spec[0], save(*spec)))

# Contact sheet on light and dark halves
thumb = 260
cols = 4
rows = (len(imgs)+cols-1)//cols
sheet = Image.new('RGB', (cols*thumb, rows*(thumb+24)), (245,245,247))
d = ImageDraw.Draw(sheet)
font = ImageFont.load_default()
for i,(name,im) in enumerate(imgs):
    tile = Image.new('RGBA',(thumb,thumb),(246,246,248,255))
    # checkerboard
    for yy in range(0,thumb,20):
        for xx in range(0,thumb,20):
            if (xx//20+yy//20)%2==0:
                d.rectangle([(i%cols)*thumb+xx,(i//cols)*(thumb+24)+yy,(i%cols)*thumb+xx+19,(i//cols)*(thumb+24)+yy+19], fill=(226,226,230))
    im2 = im.copy(); im2.thumbnail((thumb-24,thumb-24))
    x=(i%cols)*thumb; y=(i//cols)*(thumb+24)
    sheet.paste(im2,(x+(thumb-im2.width)//2,y+(thumb-im2.height)//2),im2)
    d.rectangle([x,y,x+thumb-1,y+thumb-1],outline=(150,150,154))
    d.text((x+5,y+thumb+4),name,fill=(20,20,20),font=font)
sheet.save('assets/devices/_contact.png')
print('contact', sheet.size)


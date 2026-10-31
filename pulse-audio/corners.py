from PIL import Image
for p in ['assets/official2/hoco-prime.png','assets/official2/hoco-ocean.png','assets/official/official1.jpg','assets/official2/baseus-official1.jpg','assets/official2/sennheiser-prezly.jpg']:
    try:
        im=Image.open(p).convert('RGBA')
        w,h=im.size
        pts=[(0,0),(w-1,0),(0,h-1),(w-1,h-1),(w//2,5)]
        print(p, im.size, [im.getpixel(pt) for pt in pts])
    except Exception as e:
        print(p,e)

from PIL import Image
for p in ['assets/earbuds-black.png','assets/earbuds-silver.png','assets/headphones-black.png','assets/earbuds-silver-right.png']:
    im=Image.open(p)
    print(p, im.size, im.mode, im.getbbox())

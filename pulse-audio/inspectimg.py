from PIL import Image
import os
for name in sorted(os.listdir('assets/official')):
    path = os.path.join('assets/official', name)
    try:
        im = Image.open(path)
        im.load()
        alpha = im.mode in ('RGBA','LA') or (im.mode=='P' and 'transparency' in im.info)
        bbox = im.getbbox()
        corner = im.convert('RGBA').getpixel((0,0)) if im.width and im.height else None
        print(f"{name:24} {im.size[0]:5}x{im.size[1]:<5} mode={im.mode:5} alpha={alpha} bbox={bbox} corner={corner}")
    except Exception as e:
        print(name, 'ERR', e)

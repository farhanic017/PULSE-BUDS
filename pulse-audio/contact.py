from PIL import Image, ImageDraw, ImageFont
import os
names = sorted(os.listdir('assets/official'))
thumb = 220
cols = 5
rows = (len(names)+cols-1)//cols
sheet = Image.new('RGB',(cols*thumb, rows*(thumb+24)), (232,232,235))
d = ImageDraw.Draw(sheet)
font = ImageFont.load_default()
for i,name in enumerate(names):
    im = Image.open(os.path.join('assets/official',name)).convert('RGBA')
    im.thumbnail((thumb-16,thumb-16))
    x=(i%cols)*thumb; y=(i//cols)*(thumb+24)
    # checkerboard
    for yy in range(y, y+thumb, 20):
        for xx in range(x, x+thumb, 20):
            if ((xx-x)//20 + (yy-y)//20)%2==0:
                d.rectangle([xx,yy,xx+19,yy+19], fill=(210,210,214))
    sheet.paste(im, (x+(thumb-im.width)//2, y+(thumb-im.height)//2), im)
    d.rectangle([x,y,x+thumb-1,y+thumb-1], outline=(120,120,124))
    d.text((x+5,y+thumb+4), name, fill=(20,20,20), font=font)
sheet.save('assets/official/_contact.png')
print(sheet.size)

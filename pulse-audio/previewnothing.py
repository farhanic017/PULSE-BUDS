from PIL import Image
im=Image.open('assets/official2/nothing-white.png')
print(im.size, im.mode, im.getbbox())
im.thumbnail((600,600))
im.convert('RGBA').save('assets/official2/_nothing-preview.png')

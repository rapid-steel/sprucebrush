from PIL import Image
import os

prefix = ["filter"]
folder = "../src/assets/img/"

size = 256, 256

for imgname in os.listdir(folder):
    for pref in prefix:
        if imgname.startswith(pref):
            imgpath = folder + imgname
            img = Image.open(imgpath)
            w, h = img.size
            if w > size[0]:
                print("Resizing image %s of size %d, %d" % (imgname, w, h))
                img.thumbnail(size, Image.ANTIALIAS)
                img.save(imgpath)


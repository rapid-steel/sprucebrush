from PIL import Image
import sys


imgname = sys.argv[1]
img = Image.open(imgname).convert('LA')
imgl = img.convert('L')

img.putalpha(imgl)
img.save("la_" + imgname.split(".")[0] + ".png")
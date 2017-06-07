from PIL import Image#, ImageDraw, ImageFont
from itertools import permutations
import os

files = ['0', '1', '2', '3', '4']
t = []
for i in range(5):
	tmp = list(set(sorted([''.join(sorted(list(item))) for item in list(permutations(files, i+1))])))
	#print tmp
	t.extend(sorted(tmp))

print t

x = '/Users/abidhasan/Desktop/tmp/'
y = '/Users/abidhasan/Desktop/'
for item in t:
    print "Looking at ", item
    #raw_input()
    for count, img in enumerate(item[::-1]):
        print "Looking at ", img, " count is ", count
        if count == 0:
            #make bg
            bg = Image.open(y + img + ".png", 'r')
            final_img = Image.new('RGBA', (200,200), (0, 0, 0, 0))
            final_img.paste(bg, (0,0))
            print "Pasted background"
        else:
            #overlay image
            other = Image.open(y + img + ".png", 'r')
            final_img.paste(other, (0,0), mask=other)
            print "pasted other"
    final_img.save(x + item + '.png', format="png")
    print "Saved to ", x + item + '.png', "\n"
    

            
            
import sys
from PIL import Image
img = Image.open("12121.png").resize((60, 30)).convert("L")
chars = " .:-=+*#%@"
pixels = img.load()
width, height = img.size
res = ""
for y in range(height):
    for x in range(width):
        res += chars[pixels[x, y] * len(chars) // 256]
    res += "\n"
print(res)

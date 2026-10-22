from PIL import Image, ImageDraw, ImageFont


WIDTH, HEIGHT = 1200, 630
image = Image.new("RGB", (WIDTH, HEIGHT), "#103f36")
pixels = image.load()
for y in range(HEIGHT):
    blend = y / HEIGHT
    color = tuple(
        round(a * (1 - blend) + b * blend)
        for a, b in zip((23, 107, 89), (13, 55, 48))
    )
    for x in range(WIDTH):
        pixels[x, y] = color

draw = ImageDraw.Draw(image)
draw.rounded_rectangle((770, 105, 1110, 525), radius=32, fill="#f5f7f6")
draw.rounded_rectangle(
    (805, 145, 1075, 485), radius=22, fill="white", outline="#dce5e0", width=2
)
# Simple cash-flow chart motif.
draw.line((840, 395, 900, 335, 950, 365, 1025, 250), fill="#176b59", width=9, joint="curve")
draw.ellipse((830, 385, 850, 405), fill="#176b59")
draw.ellipse((890, 325, 910, 345), fill="#176b59")
draw.ellipse((940, 355, 960, 375), fill="#176b59")
draw.ellipse((1015, 240, 1035, 260), fill="#176b59")
draw.line((950, 430, 1025, 430), fill="#c47d2b", width=7)
draw.line((950, 450, 1005, 450), fill="#c47d2b", width=7)

font_bold = "C:/Windows/Fonts/arialbd.ttf"
font_regular = "C:/Windows/Fonts/arial.ttf"
brand_font = ImageFont.truetype(font_bold, 28)
headline_font = ImageFont.truetype(font_bold, 58)
body_font = ImageFont.truetype(font_regular, 27)
small_font = ImageFont.truetype(font_bold, 20)
# Logo tile matching the site's favicon.
draw.rounded_rectangle((82, 74, 138, 130), radius=15, fill="#ffffff")
draw.line((94, 111, 104, 100, 113, 108, 126, 91), fill="#176b59", width=4, joint="curve")
draw.line((118, 91, 126, 91, 126, 100), fill="#176b59", width=4)
draw.text((154, 85), "Cashflow-Planner", font=brand_font, fill="#e6f3ee")
draw.text((82, 205), "Cashflow planen,", font=headline_font, fill="#ffffff")
draw.text((82, 276), "Ziele im Blick behalten", font=headline_font, fill="#ffffff")
draw.text((85, 380), "Geplante Ausgaben und Monatsbudget", font=body_font, fill="#d9ebe4")
draw.text((85, 419), "einfach gemeinsam vorausplanen.", font=body_font, fill="#d9ebe4")

badge_text = "KOSTENLOS  ·  OHNE KONTO  ·  LOKAL"
badge_text_x, badge_text_y = 106, 505
badge_bbox = draw.textbbox((badge_text_x, badge_text_y), badge_text, font=small_font)
badge_padding = 22
badge_right = badge_bbox[2] + badge_padding
draw.rounded_rectangle((84, 493, badge_right, 541), radius=24, fill="#e5f2ec")
draw.text((badge_text_x, badge_text_y), badge_text, font=small_font, fill="#176b59")

image.save("web/social-preview.png", optimize=True)

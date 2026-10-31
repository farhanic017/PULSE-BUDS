#!/usr/bin/env python3
"""Generate professional transparent WebP placeholders for missing device images."""
from PIL import Image, ImageDraw, ImageFont
import os

ASSETS = "assets/devices"
os.makedirs(ASSETS, exist_ok=True)

def make_placeholder(device_id, brand, model, color="#18181b", text_color="#ffffff"):
    # 400×400 transparent canvas
    img = Image.new("RGBA", (400, 400), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    # Background circle
    cx, cy, r = 200, 200, 170
    draw.ellipse((cx-r, cy-r, cx+r, cy+r), fill=color, outline=(255,255,255,30), width=2)
    # Brand letter (large, centered)
    try:
        font_large = ImageFont.truetype("arialbd.ttf", 72)
        font_small = ImageFont.truetype("arial.ttf", 26)
    except:
        font_large = ImageFont.load_default()
        font_small = ImageFont.load_default()
    brand_letter = brand[0].upper() if brand else "P"
    bbox = draw.textbbox((0,0), brand_letter, font=font_large)
    w, h = bbox[2]-bbox[0], bbox[3]-bbox[1]
    draw.text((200 - w/2, 190 - h/2), brand_letter, fill=text_color, font=font_large)
    # Model name below
    line1 = brand.upper()
    line2 = model[:14]
    bbox2 = draw.textbbox((0,0), line1, font=font_small)
    w2 = bbox2[2]-bbox2[0]
    draw.text((200 - w2/2, 280), line1, fill=(200,200,200), font=font_small)
    bbox3 = draw.textbbox((0,0), line2, font=font_small)
    w3 = bbox3[2]-bbox3[0]
    draw.text((200 - w3/2, 310), line2, fill=(160,160,160), font=font_small)
    # Small ring accent
    draw.arc((120, 120, 280, 280), start=30, end=330, fill=(255,255,255,60), width=2)
    # Save transparent webp
    out_path = os.path.join(ASSETS, f"{device_id}.webp")
    img.save(out_path, "WEBP", quality=92, method=6)
    return out_path

# All missing device IDs from DEVICE_CATALOG additions + originals that need replacements
missing = [
    ("galaxy-buds3","Samsung","Galaxy Buds3"),
    ("galaxy-buds2-pro","Samsung","Galaxy Buds2 Pro"),
    ("galaxy-buds-fe","Samsung","Galaxy Buds FE"),
    ("sony-wh1000xm4","Sony","WH-1000XM4"),
    ("sony-wf1000xm5","Sony","WF-1000XM5"),
    ("sony-wf1000xm4","Sony","WF-1000XM4"),
    ("anker-liberty4-pro","Anker","Liberty 4 Pro"),
    ("anker-life-p3","Anker","Life P3"),
    ("anker-space-q45","Anker","Space Q45"),
    ("hoco-ew52","HOCO","EW52"),
    ("hoco-hm1","HOCO","HM1"),
    ("baseus-bowie-wm01","Baseus","Bowie WM01"),
    ("baseus-bowie-ma18-pro","Baseus","Bowie MA18 Pro"),
    ("jbl-tune-flex","JBL","Tune Flex"),
    ("jbl-tune-230nc-tws","JBL","Tune 230NC"),
    ("jbl-live-pro-2","JBL","Live Pro 2"),
    ("bose-qc45","Bose","QC45"),
    ("bose-qc-ultra-earbuds","Bose","QC Ultra Earbuds"),
    ("bose-sport-earbuds","Bose","Sport Earbuds"),
    ("sennheiser-mtw3","Sennheiser","MTW3"),
    ("sennheiser-accentum","Sennheiser","Accentum"),
    ("nothing-ear-2","Nothing","Ear (2)"),
    ("nothing-ear-stick","Nothing","Ear Stick"),
    ("google-pixel-buds-pro","Google","Pixel Buds Pro"),
    ("google-pixel-buds-a","Google","Pixel Buds A"),
    ("airpods-4","Apple","AirPods 4"),
    ("pulse-horizon","PULSE","Horizon Pro"),
]

for did, brand, model in missing:
    make_placeholder(did, brand, model)
    print("created", did)

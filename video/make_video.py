import math, random, subprocess, sys, wave
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageEnhance

IMG = sys.argv[1]; FONT = sys.argv[2]; OUT = sys.argv[3]
W, H, FPS = 1080, 1920, 30
SCENE = 6.0; XF = 0.7; N = 3
TOTAL = SCENE * N - XF * (N - 1) + 1.5
NF = int(TOTAL * FPS)
random.seed(7)
# person centre (normalized, in cover-cropped frame)
FOCUS = [(0.50, 0.70), (0.53, 0.58), (0.60, 0.62)]
CAPS = ["2025학년도 후기 학위수여식", "그런데 하늘에서… 눈송이가?!", "석사 졸업, 변신 완료!"]

def cover(im):
    im = im.convert("RGB"); s = max(W * 1.15 / im.width, H * 1.15 / im.height)
    return im.resize((int(im.width * s), int(im.height * s)), Image.LANCZOS)
photos = [cover(Image.open(f"{IMG}/{i}.webp")) for i in (1, 2, 3)]
def dreamy(im):
    a = ImageEnhance.Color(im).enhance(1.25)
    a = ImageEnhance.Brightness(a).enhance(1.08)
    glow = a.filter(ImageFilter.GaussianBlur(18))
    a = Image.blend(a, glow, 0.35)
    tint = Image.new("RGB", a.size, (255, 200, 235))
    return Image.blend(a, tint, 0.12)
dreams = [dreamy(p) for p in photos]

# ---- snowflake mascot sprite (original cute design) ----
def mascot(sz=220):
    S = sz * 2; im = Image.new("RGBA", (S, S), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    c = S / 2; navy = (28, 52, 140, 255); blue = (120, 170, 245, 255)
    for k in range(6):  # snowflake crown arms
        a = math.radians(k * 60 - 90); r1, r2 = S * 0.30, S * 0.47
        x1, y1 = c + r1 * math.cos(a), c + r1 * math.sin(a); x2, y2 = c + r2 * math.cos(a), c + r2 * math.sin(a)
        d.line([(x1, y1), (x2, y2)], fill=navy, width=int(S * 0.07))
        d.line([(x1, y1), (x2, y2)], fill=blue, width=int(S * 0.04))
        for sgn in (-1, 1):
            b = a + sgn * 0.6; mx, my = c + S * 0.40 * math.cos(a), c + S * 0.40 * math.sin(a)
            d.line([(mx, my), (mx + S * .07 * math.cos(b), my + S * .07 * math.sin(b))], fill=navy, width=int(S * 0.035))
    R = S * 0.31
    d.ellipse([c - R, c - R, c + R, c + R], fill=navy)
    R2 = R * 0.9; d.ellipse([c - R2, c - R2, c + R2, c + R2], fill=(255, 255, 255, 255))
    for sx in (-1, 1):
        ex, ey = c + sx * R * 0.38, c - R * 0.02
        d.ellipse([ex - S*.045, ey - S*.06, ex + S*.045, ey + S*.06], fill=navy)
        d.ellipse([ex - S*.015, ey - S*.045, ex + S*.02, ey - S*.01], fill=(255, 255, 255, 255))
        bx = c + sx * R * 0.6; d.ellipse([bx - S*.05, ey + S*.07, bx + S*.05, ey + S*.11], fill=(255, 160, 190, 200))
    d.arc([c - S*.06, c + S*.04, c + S*.06, c + S*.13], 20, 160, fill=navy, width=int(S * .018))
    return im.resize((sz, sz), Image.LANCZOS)
BASE = mascot()
def flake(sz=90):
    S = sz * 2; im = Image.new("RGBA", (S, S)); d = ImageDraw.Draw(im); c = S / 2
    for k in range(6):
        a = math.radians(k * 60); d.line([(c, c), (c + c * .9 * math.cos(a), c + c * .9 * math.sin(a))], fill=(255, 255, 255, 230), width=int(S * .06))
    return im.resize((sz, sz), Image.LANCZOS)
FLAKE = flake()
cache = {}
def sprite(kind, size, ang):
    key = (kind, size, int(ang) // 10 * 10)
    if key not in cache:
        src = BASE if kind == 0 else FLAKE
        cache[key] = src.resize((size, size), Image.LANCZOS).rotate(key[2], resample=Image.BICUBIC)
    return cache[key]

parts = []
for i in range(110):
    kind = 0 if i % 3 == 0 else 1
    parts.append(dict(kind=kind, x=random.uniform(-.05, 1.05), t0=random.uniform(1.2, TOTAL - 2) if i > 6 else random.uniform(1.0, 2.0),
                      sp=random.uniform(260, 520), size=random.randint(90, 200) if kind == 0 else random.randint(30, 70),
                      wob=random.uniform(30, 90), ph=random.uniform(0, 6.28), rot=random.uniform(-60, 60)))
sparkles = [dict(a=random.uniform(0, 6.28), r=random.uniform(80, 520), s=random.uniform(.6, 1.6), sz=random.randint(8, 22)) for _ in range(90)]
font_big = ImageFont.truetype(f"{FONT}/NanumGothicExtraBold.ttf", 66)
font_sm = ImageFont.truetype(f"{FONT}/NanumGothicBold.ttf", 44)

def star(d, x, y, r, col):
    pts = []
    for k in range(8):
        rr = r if k % 2 == 0 else r * 0.28; a = k * math.pi / 4 - math.pi / 2
        pts.append((x + rr * math.cos(a), y + rr * math.sin(a)))
    d.polygon(pts, fill=col)

def scene_frame(i, ts):
    p, dr = photos[i], dreams[i]
    z = 1.0 + 0.10 * ts / SCENE
    fx, fy = FOCUS[i]
    cw, ch = W * 1.15 / z, H * 1.15 / z
    sc = 1.0
    cx, cy = fx * p.width, fy * p.height
    l = min(max(cx - cw * sc / 2, 0), p.width - cw * sc); t = min(max(cy - ch * sc / 2, 0), p.height - ch * sc)
    box = (l, t, l + cw * sc, t + ch * sc)
    m = min(max((ts - 3.0) / 0.8, 0), 1)  # transformation mix
    base = p.crop(box).resize((W, H), Image.BILINEAR)
    if m > 0:
        base = Image.blend(base, dr.crop(box).resize((W, H), Image.BILINEAR), m)
    px, py = (cx - l) / (cw * sc) * W, (cy - t) / (ch * sc) * H
    return base.convert("RGBA"), (px, py), m

def magic(img, ts, pos, m):
    if ts < 2.0: return img
    ov = Image.new("RGBA", (W, H)); d = ImageDraw.Draw(ov); px, py = pos
    k = min((ts - 2.0) / 1.0, 1)
    # rotating magic circle at feet
    fy = py + 380; rot = ts * 1.4
    for rr, al in ((300, 200), (250, 150)):
        d.ellipse([px - rr * k, fy - rr * k * .28, px + rr * k, fy + rr * k * .28], outline=(255, 230, 255, int(al * k)), width=5)
    for j in range(6):
        a = rot + j * math.pi / 3
        star(d, px + 280 * k * math.cos(a), fy + 78 * k * math.sin(a), 22, (255, 240, 170, int(230 * k)))
    # rising light column
    col = Image.new("RGBA", (W, H)); cd = ImageDraw.Draw(col)
    burst = math.exp(-((ts - 3.0) / 0.55) ** 2)
    cd.ellipse([px - 260, py - 700, px + 260, fy + 60], fill=(255, 220, 250, int(150 * burst + 40 * k)))
    col = col.filter(ImageFilter.GaussianBlur(60))
    img = Image.alpha_composite(img, col)
    # spiral sparkles
    for s in sparkles:
        a = s['a'] + ts * s['s'] * 2; r = s['r'] * (0.4 + 0.6 * abs(math.sin(ts * .7 + s['a'])))
        yy = py + 300 - ((ts * 160 * s['s'] + s['r']) % 900)
        tw = 0.5 + 0.5 * math.sin(ts * 9 + s['a'] * 5)
        star(d, px + r * math.cos(a) * .7, yy, s['sz'] * (0.5 + tw) * k, (255, 255, 255, int(255 * tw * k)))
    # ribbon hearts after transform
    if m > 0:
        for j in range(5):
            a = ts * 2 + j * 1.26; hx, hy = px + 230 * math.cos(a), py - 120 + 90 * math.sin(a)
            star(d, hx, hy, 30, (255, 150, 200, int(240 * m)))
    img = Image.alpha_composite(img, ov)
    # white flash
    fl = math.exp(-((ts - 3.0) / 0.22) ** 2)
    if fl > 0.02:
        img = Image.alpha_composite(img, Image.new("RGBA", (W, H), (255, 250, 255, int(235 * fl))))
    return img

def snow(img, t):
    for q in parts:
        dt = t - q['t0']
        if dt < 0: continue
        y = -220 + dt * q['sp']
        if y > H + 100: continue
        x = q['x'] * W + q['wob'] * math.sin(dt * 2 + q['ph'])
        sp = sprite(q['kind'], q['size'], q['rot'] * math.sin(dt * 1.5 + q['ph']) + 360)
        img.alpha_composite(sp, (int(x - q['size'] / 2), int(y)) if 0 <= int(x - q['size']/2) else (0, int(y))) if False else img.paste(sp, (int(x - q['size'] / 2), int(y)), sp)
    return img

def caption(img, text, a, big=True, y=230):
    if a <= 0: return img
    ov = Image.new("RGBA", (W, H)); d = ImageDraw.Draw(ov); f = font_big if big else font_sm
    w = d.textlength(text, font=f); x = (W - w) / 2
    for dx in range(-4, 5, 2):
        for dy in range(-4, 5, 2):
            d.text((x + dx, y + dy), text, font=f, fill=(30, 50, 140, int(220 * a)))
    d.text((x, y), text, font=f, fill=(255, 255, 255, int(255 * a)))
    return Image.alpha_composite(img, ov)

def frame(fi):
    t = fi / FPS
    starts = [i * (SCENE - XF) for i in range(N)]
    def render(i):
        ts = t - starts[i]; img, pos, m = scene_frame(i, min(ts, SCENE + 1.5)); img = magic(img, ts, pos, m)
        a = min(max((ts - 0.4) / 0.5, 0), 1) * min(max((SCENE - 0.5 - ts) / 0.5, 0), 1) if i < N - 1 else min(max((ts - 0.4) / 0.5, 0), 1)
        return caption(img, CAPS[i], a)
    cur = max(i for i in range(N) if t >= starts[i])
    img = render(cur)
    if cur > 0 and t - starts[cur] < XF:
        img = Image.blend(render(cur - 1), img, (t - starts[cur]) / XF)
    img = snow(img, t)
    end = starts[-1] + 3.6
    if t > end:
        a = min((t - end) / 0.6, 1)
        img = caption(img, "Master's Degree · 2026. 8.", a, big=False, y=1640)
        img = caption(img, "졸업을 축하해요!", a, y=1720)
    fade = min(t / 0.5, 1, (TOTAL - t) / 0.6)
    if fade < 1:
        img = Image.blend(Image.new("RGBA", (W, H), (0, 0, 0, 255)), img, max(fade, 0))
    return img.convert("RGB")

# ---- simple synthesized music box track ----
sr = 44100; n = int(TOTAL * sr); audio = np.zeros(n)
notes = [72, 76, 79, 84, 79, 76, 74, 77, 81, 86, 81, 77, 71, 74, 79, 83, 79, 74, 72, 76, 79, 84, 88, 84]
for j in range(int(TOTAL / 0.375)):
    st = int(j * 0.375 * sr); fq = 440 * 2 ** ((notes[j % len(notes)] - 69) / 12)
    L = min(int(1.2 * sr), n - st); tt = np.arange(L) / sr
    audio[st:st + L] += 0.18 * np.exp(-tt * 3.5) * (np.sin(2 * np.pi * fq * tt) + 0.3 * np.sin(4 * np.pi * fq * tt))
for i in range(N):  # magic shimmer at each transform
    t0 = i * (SCENE - XF) + 2.4
    for k in range(24):
        st = int((t0 + k * 0.04) * sr); fq = 1200 + k * 90; L = int(0.5 * sr); tt = np.arange(L) / sr
        if st + L < n: audio[st:st + L] += 0.07 * np.exp(-tt * 8) * np.sin(2 * np.pi * fq * tt)
env = np.minimum(1, np.minimum(np.arange(n) / sr / 0.5, (n - np.arange(n)) / sr / 1.0))
audio = (audio * env / max(1e-6, np.abs(audio).max()) * 0.8 * 32767).astype(np.int16)
with wave.open(OUT + ".wav", "wb") as wf:
    wf.setnchannels(1); wf.setsampwidth(2); wf.setframerate(sr); wf.writeframes(audio.tobytes())

ff = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
                       "-i", OUT + ".wav", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20", "-preset", "medium", "-c:a", "aac", "-shortest",
                       "-movflags", "+faststart", OUT], stdin=subprocess.PIPE)
for fi in range(NF):
    ff.stdin.write(frame(fi).tobytes())
    if fi in (90, 150, 300, 460): frame(fi).save(f"{OUT}_{fi}.jpg", quality=80)
ff.stdin.close(); ff.wait()
print("done", NF)
